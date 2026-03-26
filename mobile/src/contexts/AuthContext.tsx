/**
 * Authentication Context
 *
 * Provides auth state and methods across the app. Manages the full
 * Garmin login lifecycle: initial auth → MFA challenge → token storage.
 *
 * Two ways auth state resets:
 * 1. User calls logout() explicitly
 * 2. API returns 401 → fetchJson calls notifyAuthExpired() → the
 *    onAuthExpired listener below resets isLoggedIn, which triggers
 *    the app to show the login screen automatically
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  isAuthenticated,
  clearTokens,
  loginToGarmin,
  submitMFA,
  onAuthExpired,
  LoginResponse,
  MFAResponse,
} from "../services/authService";

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  pendingMFA: { email: string } | null;
  login: (email: string, password: string) => Promise<LoginResponse>;
  completeMFA: (code: string) => Promise<MFAResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMFA, setPendingMFA] = useState<{ email: string } | null>(null);

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const authenticated = await isAuthenticated();
      setIsLoggedIn(authenticated);
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsLoggedIn(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Auto-logout when a 401 is received from the API
  useEffect(() => {
    return onAuthExpired(() => {
      setIsLoggedIn(false);
      setPendingMFA(null);
    });
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    const response = await loginToGarmin(email, password);

    if (response.status === "success") {
      setIsLoggedIn(true);
      setPendingMFA(null);
    } else if (response.status === "mfa_required") {
      setPendingMFA({ email });
    }

    return response;
  };

  const completeMFA = async (code: string): Promise<MFAResponse> => {
    if (!pendingMFA) {
      return { status: "error", message: "No pending MFA session" };
    }

    const response = await submitMFA(pendingMFA.email, code);

    if (response.status === "success") {
      setIsLoggedIn(true);
      setPendingMFA(null);
    }

    return response;
  };

  const logout = async () => {
    await clearTokens();
    setIsLoggedIn(false);
    setPendingMFA(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        pendingMFA,
        login,
        completeMFA,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
