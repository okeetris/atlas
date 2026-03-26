/**
 * Shared formatting utilities for dates, durations, pace, and distance.
 */

import type { Grade } from "../types";
import { colors } from "../theme/colors";

export const gradeColors: Record<Grade, string> = {
  A: colors.gradeA,
  B: colors.gradeB,
  C: colors.gradeC,
  D: colors.gradeD,
};

/** Relative date: "Today", "Yesterday", "3 days ago", "Mar 5" */
export function formatRelativeDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const dateLocal = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (nowLocal.getTime() - dateLocal.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Absolute date: "Mar 5, 2026" */
export function formatDate(dateString: string): string {
  if (!dateString) return "Unknown date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Pace from sec/km: "M:SS/km" */
export function formatPace(secPerKm: number): string {
  if (!secPerKm || secPerKm === 0) return "--:--";
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.floor(secPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}/km`;
}

/** Pace from distance and time: "M:SS/km" */
export function formatPaceFromDistance(
  distanceKm: number,
  durationSeconds: number
): string {
  if (distanceKm === 0) return "--:--";
  return formatPace(durationSeconds / distanceKm);
}

/** Compact duration for cards: "1h 23m" or "45 min" */
export function formatDurationCompact(seconds: number): string {
  if (!seconds || seconds === 0) return "";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins} min`;
}

/** Clock duration: "1:23:45" or "23:45" */
export function formatDurationClock(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/** Distance in meters to human-readable: "1.50 km" or "800 m" */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
}

/** Compliance percent color based on value */
export function getComplianceColor(percent: number): string {
  if (percent >= 80) return colors.gradeA;
  if (percent >= 50) return colors.gradeC;
  return colors.gradeD;
}
