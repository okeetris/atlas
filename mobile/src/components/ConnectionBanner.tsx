/**
 * Connection status banner.
 *
 * Shows animated banner at top of screen:
 * - Amber pulsing dot + "Connecting..." while backend warms up
 * - Green "Connected" that auto-dismisses after 2s
 * - Red "Connection lost" if backend goes down after being connected
 */

import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBackendStatus, type BackendStatus } from "../hooks/useBackendStatus";

const CONNECTED_DISMISS_MS = 2000;
const SLIDE_DURATION_MS = 300;

const BANNER_CONFIG: Record<
  BackendStatus,
  { backgroundColor: string; dotColor: string; label: string }
> = {
  connecting: {
    backgroundColor: "#FFF3E0",
    dotColor: "#F57C00",
    label: "Connecting to coach...",
  },
  connected: {
    backgroundColor: "#E8F5E9",
    dotColor: "#4CAF50",
    label: "Connected",
  },
  disconnected: {
    backgroundColor: "#FFEBEE",
    dotColor: "#F44336",
    label: "Connection lost",
  },
};

export function ConnectionBanner() {
  const { status } = useBackendStatus();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [visible, setVisible] = useState(false);
  const [displayStatus, setDisplayStatus] = useState<BackendStatus>(status);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstCheckDone = useRef(false);
  const connectedFast = useRef(false);

  // Pulse animation for connecting state
  useEffect(() => {
    if (displayStatus === "connecting") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [displayStatus, pulseAnim]);

  const slideIn = () => {
    setVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: SLIDE_DURATION_MS,
      useNativeDriver: true,
    }).start();
  };

  const slideOut = () => {
    Animated.timing(slideAnim, {
      toValue: -80,
      duration: SLIDE_DURATION_MS,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  };

  useEffect(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }

    if (status === "connecting") {
      if (!firstCheckDone.current) {
        // Delay showing connecting banner slightly — if backend responds
        // instantly we skip it entirely
        const delayTimer = setTimeout(() => {
          if (!connectedFast.current) {
            setDisplayStatus("connecting");
            slideIn();
          }
        }, 500);
        firstCheckDone.current = true;
        return () => clearTimeout(delayTimer);
      }
      setDisplayStatus("connecting");
      slideIn();
    } else if (status === "connected") {
      connectedFast.current = true;
      setDisplayStatus("connected");
      slideIn();
      dismissTimer.current = setTimeout(slideOut, CONNECTED_DISMISS_MS);
    } else if (status === "disconnected") {
      setDisplayStatus("disconnected");
      slideIn();
    }

    return () => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
      }
    };
  }, [status]);

  if (!visible && status === "connected") return null;

  const config = BANNER_CONFIG[displayStatus];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          paddingTop: insets.top + 4,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.dot,
            {
              backgroundColor: config.dotColor,
              opacity: displayStatus === "connecting" ? pulseAnim : 1,
            },
          ]}
        />
        <Text style={[styles.label, { color: config.dotColor }]}>
          {config.label}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});
