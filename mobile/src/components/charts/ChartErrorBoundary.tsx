/**
 * Error boundary for chart components.
 *
 * Catches Skia rendering errors and displays a fallback instead of crashing.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
}

export class ChartErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("[ChartErrorBoundary]", error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.text}>
            {this.props.fallbackMessage || "Chart could not be rendered"}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    marginVertical: 8,
  },
  text: {
    color: colors.textHint,
    fontSize: 14,
  },
});
