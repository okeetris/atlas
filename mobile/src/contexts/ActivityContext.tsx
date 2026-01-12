/**
 * Activity Context
 *
 * Shares activity data across detail screen tabs.
 */

import { createContext, useContext, type ReactNode } from "react";
import type { ActivityDetails } from "../types";

interface ActivityContextType {
  activity: ActivityDetails | null;
  isLoading: boolean;
  error: Error | null;
}

const ActivityContext = createContext<ActivityContextType | null>(null);

export function ActivityProvider({
  children,
  activity,
  isLoading,
  error,
}: {
  children: ReactNode;
  activity: ActivityDetails | null;
  isLoading: boolean;
  error: Error | null;
}) {
  return (
    <ActivityContext.Provider value={{ activity, isLoading, error }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error("useActivity must be used within ActivityProvider");
  }
  return context;
}
