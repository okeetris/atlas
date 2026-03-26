/**
 * Backend connection status hook.
 *
 * Polls /health on mount and retries every 5s until connected.
 * Re-checks when app returns to foreground.
 * Provides status to ConnectionBanner and any component that needs
 * to gate online-only features.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { AppState, type AppStateStatus } from "react-native";
import { API_BASE_URL, API_ENDPOINTS } from "../services/apiConfig";

export type BackendStatus = "connecting" | "connected" | "disconnected";

interface BackendStatusContextValue {
  status: BackendStatus;
  isOnline: boolean;
}

const BackendStatusContext = createContext<BackendStatusContextValue>({
  status: "connecting",
  isOnline: false,
});

const POLL_INTERVAL_MS = 5000;
const HEALTH_TIMEOUT_MS = 10000;

/** Returns true=healthy, false=unhealthy, null=aborted/cancelled (ignore) */
async function pingHealth(): Promise<boolean | null> {
  const url = `${API_BASE_URL}${API_ENDPOINTS.health}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      console.log(`[BackendStatus] Health check failed: HTTP ${response.status}`);
      return false;
    }
    const data = await response.json();
    const ok = data.status === "ok";
    console.log(`[BackendStatus] Health check: ${ok ? "OK" : "NOT OK"}`);
    return ok;
  } catch (error) {
    const message = (error as Error).message || "";
    // Abort = request was cancelled (stale/duplicate), not a real failure
    if (message.includes("Aborted") || message.includes("AbortError")) {
      console.log("[BackendStatus] Health check aborted (stale request, ignoring)");
      return null;
    }
    console.log(`[BackendStatus] Health check error: ${message}`);
    return false;
  }
}

export function BackendStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<BackendStatus>("connecting");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wasConnectedRef = useRef(false);
  const checkInProgressRef = useRef(false);

  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const doHealthCheck = useCallback(async () => {
    if (checkInProgressRef.current) return;
    checkInProgressRef.current = true;

    try {
      const result = await pingHealth();
      if (result === null) return;

      if (result) {
        wasConnectedRef.current = true;
        setStatus("connected");
        clearPolling();
      } else if (wasConnectedRef.current) {
        setStatus("disconnected");
      }
    } finally {
      checkInProgressRef.current = false;
    }
  }, [clearPolling]);

  const ensurePolling = useCallback(() => {
    if (intervalRef.current) return;
    console.log(`[BackendStatus] Starting health poll (every ${POLL_INTERVAL_MS / 1000}s)`);
    intervalRef.current = setInterval(doHealthCheck, POLL_INTERVAL_MS);
  }, [doHealthCheck]);

  // Initial check + polling on mount
  useEffect(() => {
    console.log(`[BackendStatus] Mounting — polling ${API_BASE_URL}${API_ENDPOINTS.health}`);
    doHealthCheck();
    ensurePolling();

    return () => {
      console.log("[BackendStatus] Unmounting — clearing poll");
      clearPolling();
    };
  }, [doHealthCheck, ensurePolling, clearPolling]);

  // Re-check when app comes to foreground
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === "active") {
        console.log("[BackendStatus] App foregrounded — re-checking");
        doHealthCheck();
        if (!wasConnectedRef.current) {
          ensurePolling();
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, [doHealthCheck, ensurePolling]);

  // Restart polling when we lose connection
  useEffect(() => {
    if (status === "disconnected") {
      ensurePolling();
    }
  }, [status, ensurePolling]);

  const value: BackendStatusContextValue = {
    status,
    isOnline: status === "connected",
  };

  return (
    <BackendStatusContext.Provider value={value}>
      {children}
    </BackendStatusContext.Provider>
  );
}

export function useBackendStatus() {
  return useContext(BackendStatusContext);
}
