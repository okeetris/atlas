"""
Authentication router for Garmin Connect.

Handles login flow including MFA, returns tokens for client-side storage.
"""

from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from garminconnect import Garmin
import garth.sso

from dependencies.auth import encode_tokens_from_garth
from utils.retry import retry_garmin_call


router = APIRouter(prefix="/auth", tags=["auth"])


# Store pending MFA sessions (in-memory, keyed by email)
# In production with multiple instances, use Redis
# Stores tuple of (Garmin client, client_state from login)
_pending_mfa: dict[str, tuple] = {}


class LoginRequest(BaseModel):
    """Garmin login credentials."""

    email: str
    password: str


class LoginResponse(BaseModel):
    """Response from login attempt."""

    status: str  # "success", "mfa_required", "error"
    message: str
    tokens: Optional[str] = None  # Base64-encoded tar.gz of token files


class MFARequest(BaseModel):
    """MFA code submission."""

    email: str
    code: str


class MFAResponse(BaseModel):
    """Response from MFA submission."""

    status: str  # "success", "error"
    message: str
    tokens: Optional[str] = None  # Base64-encoded tar.gz of token files


@router.post("/garmin/login", response_model=LoginResponse)
async def garmin_login(request: LoginRequest):
    """
    Initiate Garmin login.

    If MFA is required, returns status="mfa_required" and client should
    call /auth/garmin/mfa with the code from email/SMS.

    If successful, returns base64-encoded tokens for client storage.
    """
    try:
        # Create Garmin client with MFA handling
        garmin = Garmin(request.email, request.password, return_on_mfa=True)

        result = retry_garmin_call(garmin.login)

        # Check if MFA is required
        # When MFA is needed with return_on_mfa=True, login() returns a tuple:
        # ('needs_mfa', {client_state_dict with 'client' key})
        if isinstance(result, tuple) and len(result) == 2:
            mfa_indicator, client_state = result
            if mfa_indicator == "needs_mfa" and isinstance(client_state, dict):
                # Extract CSRF token now while last_resp is still alive
                # (it gets GC'd or lost if the service restarts before MFA)
                csrf_token = None
                client = client_state.get("client")
                if client and client.last_resp:
                    csrf_token = garth.sso.get_csrf_token(
                        client.last_resp.text
                    )

                # Store client, state, and extracted CSRF for MFA completion
                _pending_mfa[request.email] = (
                    garmin,
                    client_state,
                    csrf_token,
                )

                return LoginResponse(
                    status="mfa_required",
                    message="MFA code required. Check your email or SMS for the verification code.",
                )

        # Login successful - use garth's native dump to serialize tokens
        tokens_b64 = encode_tokens_from_garth(garmin.garth)

        return LoginResponse(
            status="success",
            message="Login successful",
            tokens=tokens_b64,
        )

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)

        if "429" in error_msg:
            raise HTTPException(status_code=429, detail="Garmin is rate limiting login requests. Please wait a few minutes and try again.")

        if any(keyword in error_msg.lower() for keyword in ["invalid", "credentials", "unauthorized", "401"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        raise HTTPException(status_code=500, detail=f"Login failed: {error_msg}")


@router.post("/garmin/mfa", response_model=MFAResponse)
async def garmin_mfa(request: MFARequest):
    """
    Complete MFA verification.

    Submit the code received via email/SMS after /garmin/login returned mfa_required.
    Returns base64-encoded tokens for client storage.
    """
    pending = _pending_mfa.get(request.email)

    if not pending:
        raise HTTPException(
            status_code=400,
            detail="No pending MFA session. Please login again.",
        )

    # Extract garmin client, client_state, and pre-captured CSRF token
    if len(pending) != 3:
        raise HTTPException(
            status_code=400,
            detail="Invalid pending MFA session state. Please login again.",
        )
    garmin, client_state, csrf_token = pending

    if not csrf_token:
        raise HTTPException(
            status_code=500,
            detail="MFA failed: CSRF token was not captured during login. Please login again.",
        )

    # Monkey-patch garth's CSRF lookup to use our pre-captured token,
    # since client.last_resp may have been GC'd between requests
    original_get_csrf = garth.sso.get_csrf_token
    garth.sso.get_csrf_token = lambda _: csrf_token

    try:
        # Resume login with MFA code using the stored client state
        retry_garmin_call(lambda: garmin.resume_login(client_state, request.code))

        # Use garth's native dump to serialize tokens
        tokens_b64 = encode_tokens_from_garth(garmin.garth)

        # Clean up pending session
        del _pending_mfa[request.email]

        return MFAResponse(
            status="success",
            message="MFA verification successful",
            tokens=tokens_b64,
        )

    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)

        if "429" in error_msg:
            raise HTTPException(status_code=429, detail="Garmin is rate limiting requests. Please wait a few minutes and try again.")

        if "invalid" in error_msg.lower() or "code" in error_msg.lower():
            raise HTTPException(status_code=401, detail="Invalid MFA code")

        raise HTTPException(status_code=500, detail=f"MFA failed: {error_msg}")
    finally:
        garth.sso.get_csrf_token = original_get_csrf
