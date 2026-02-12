import { Platform } from "react-native";

/**
 * API Configuration
 *
 * Auto-detects environment:
 * - Dev (expo start) → local Docker backend
 * - Production (eas build / APK) → Render cloud backend
 */

const PRODUCTION_URL = "https://running-coach-mobile.onrender.com";
const API_PORT = 8000;

function getBaseUrl(): string {
  if (!__DEV__) {
    return PRODUCTION_URL;
  }

  // Dev mode: simulator/emulator → localhost
  const localhost =
    Platform.OS === "android" ? "10.0.2.2" : "localhost";
  return `http://${localhost}:${API_PORT}`;
}

export const API_BASE_URL = getBaseUrl();

export const API_ENDPOINTS = {
  health: "/health",
  activities: "/activities",
  activityDetail: (id: string) => `/activities/${id}`,
  hrZones: "/user/hr-zones",
} as const;
