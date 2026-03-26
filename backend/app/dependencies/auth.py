"""
Authentication dependencies for Garmin token handling.

Uses garth's native dump/load mechanism to preserve all token fields.
Tokens are stored client-side and passed with each request as base64-encoded tar.gz.
"""

import base64
import os
import shutil
import tarfile
import tempfile
from io import BytesIO
from fastapi import HTTPException


def decode_tokens_to_dir(authorization: str) -> str:
    """Decode client-provided Garmin tokens into a temp directory.

    The mobile app stores tokens as a base64-encoded tar.gz archive
    containing garth's oauth1_token.json and oauth2_token.json files.
    This function extracts them so the Garmin client can be initialized
    for a single stateless request. The caller must clean up the temp
    directory when done (typically in a finally block).

    This is the server-side counterpart to getAuthHeader() in authService.ts.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header format. Expected: Bearer <token>",
        )

    token_b64 = authorization[7:]  # Remove "Bearer " prefix

    try:
        # Decode base64 to tar.gz bytes
        tar_data = base64.b64decode(token_b64)

        # Extract to temp directory
        tmpdir = tempfile.mkdtemp()
        with tarfile.open(fileobj=BytesIO(tar_data), mode="r:gz") as tar:
            tar.extractall(tmpdir)

        # Verify token files exist
        if not os.path.exists(f"{tmpdir}/oauth1_token.json"):
            shutil.rmtree(tmpdir, ignore_errors=True)
            raise ValueError("Missing oauth1_token.json")
        if not os.path.exists(f"{tmpdir}/oauth2_token.json"):
            shutil.rmtree(tmpdir, ignore_errors=True)
            raise ValueError("Missing oauth2_token.json")

        return tmpdir
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token format: {str(e)}",
        )


def encode_tokens_from_garth(garth_client) -> str:
    """Serialize garth tokens for transport back to the mobile client.

    Uses garth's native dump (preserving all OAuth fields) then packages
    as base64 tar.gz. This is used both for initial login responses and
    for the X-Refreshed-Tokens header when silent token refresh occurs.
    """
    tmpdir = tempfile.mkdtemp()
    try:
        # Dump tokens using garth's native format
        garth_client.dump(tmpdir)

        # Create tar.gz in memory
        tar_buffer = BytesIO()
        with tarfile.open(fileobj=tar_buffer, mode="w:gz") as tar:
            for filename in ["oauth1_token.json", "oauth2_token.json"]:
                filepath = os.path.join(tmpdir, filename)
                if os.path.exists(filepath):
                    tar.add(filepath, arcname=filename)

        # Base64 encode
        tar_buffer.seek(0)
        return base64.b64encode(tar_buffer.read()).decode("utf-8")
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


