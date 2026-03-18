import { API_BASE_URL, API_ENDPOINTS } from "./apiConfig";
import {
  getAuthHeader,
  updateTokensIfRefreshed,
} from "./authService";
import type { ActivitySummary, ActivityDetails, HealthCheck, HRZonesResponse, SyncResponse, SyncResult, MFARequiredResponse } from "../types";

/**
 * API Client for Running Coach Backend
 *
 * Automatically includes Garmin tokens in requests and handles token refresh.
 */

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface FetchOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: object;
  includeAuth?: boolean;
}

async function retryOn429<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.status === 429 &&
        attempt < maxRetries
      ) {
        const retryAfter = (error as any).retryAfter;
        const delayMs = retryAfter
          ? retryAfter * 1000
          : Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
  throw new ApiError(429, "Rate limited after max retries");
}

async function fetchJson<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { method = "GET", body, includeAuth = true } = options;
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    return retryOn429(async () => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Include auth token if available and requested
      if (includeAuth) {
        const authHeader = await getAuthHeader();
        if (authHeader) {
          headers["Authorization"] = authHeader;
        }
      }

      const fetchOptions: RequestInit = {
        method,
        headers,
      };

      if (body) {
        fetchOptions.body = JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);

      // Check for refreshed tokens and save them
      await updateTokensIfRefreshed(response);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new ApiError(
          response.status,
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`
        );
        if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          if (retryAfter) (err as any).retryAfter = parseInt(retryAfter, 10);
        }
        throw err;
      }

      return response.json();
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network error or other fetch failure
    throw new ApiError(0, `Network error: ${(error as Error).message}`);
  }
}

/**
 * Check backend health status
 */
export async function checkHealth(): Promise<HealthCheck> {
  return fetchJson<HealthCheck>(API_ENDPOINTS.health, { includeAuth: false });
}

/**
 * Fetch list of all activities
 */
export async function fetchActivities(): Promise<ActivitySummary[]> {
  return fetchJson<ActivitySummary[]>(API_ENDPOINTS.activities);
}

/**
 * Fetch detailed analysis for a specific activity
 */
export async function fetchActivityDetail(
  id: string
): Promise<ActivityDetails> {
  return fetchJson<ActivityDetails>(API_ENDPOINTS.activityDetail(id));
}

/**
 * Sync activities from Garmin Connect
 */
export async function syncActivities(count: number = 10): Promise<SyncResult> {
  return fetchJson<SyncResult>(`${API_ENDPOINTS.activities}/sync?count=${count}`, {
    method: "POST",
  });
}

/**
 * Check if sync response requires MFA
 */
export function isMFARequired(response: SyncResult): response is MFARequiredResponse {
  return "mfa_required" in response && response.mfa_required === true;
}

/**
 * Fetch user's heart rate zones from Garmin
 */
export async function fetchHRZones(): Promise<HRZonesResponse | null> {
  try {
    return await fetchJson<HRZonesResponse>(API_ENDPOINTS.hrZones);
  } catch (error) {
    // Return null if zones not available (not an error condition)
    console.log("HR zones not available:", (error as Error).message);
    return null;
  }
}

export { ApiError, fetchJson };
