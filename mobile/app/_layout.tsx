/**
 * Root Layout — the app entry point.
 *
 * Provider hierarchy (outermost → innermost):
 * 1. SafeAreaProvider — safe area insets for notches/status bars
 * 2. QueryClientProvider — TanStack Query for server state (caching, sync)
 * 3. AuthProvider — Garmin auth state + 401 auto-logout listener
 * 4. BackendStatusProvider — health polling, connection status for banner
 * 5. GestureHandlerRootView — required for Skia chart touch interaction
 *
 * The ConnectionBanner sits above the Stack navigator so it overlays
 * all screens (connecting/connected/disconnected states).
 */

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/contexts/AuthContext";
import { BackendStatusProvider } from "../src/hooks/useBackendStatus";
import { ConnectionBanner } from "../src/components/ConnectionBanner";
import { styles } from "../src/styles/app/layout.styles";

// TanStack Query config: 5-minute stale time serves cached data instantly
// while background refetch happens. 2 retries for transient failures.
// refetchOnWindowFocus and refetchInterval are disabled at the hook level
// to prevent Garmin API rate limiting.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BackendStatusProvider>
            <GestureHandlerRootView style={styles.container}>
              <ConnectionBanner />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="login"
                  options={{
                    presentation: "modal",
                    animation: "slide_from_bottom",
                  }}
                />
                <Stack.Screen
                  name="activity/[id]"
                  options={{
                    presentation: "card",
                    animation: "slide_from_right",
                  }}
                />
                <Stack.Screen
                  name="tools"
                  options={{
                    presentation: "card",
                    animation: "slide_from_right",
                  }}
                />
              </Stack>
              <StatusBar style="auto" />
            </GestureHandlerRootView>
          </BackendStatusProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

