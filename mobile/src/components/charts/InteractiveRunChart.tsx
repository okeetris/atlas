/**
 * Interactive Run Chart
 *
 * GPU-accelerated Skia chart with touch scrubbing for running dynamics.
 * Renders at 60fps even with thousands of data points.
 * Uses simple touch handling (no Reanimated worklets).
 */

import { useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Dimensions, PanResponder } from "react-native";
import { Canvas, Path, Skia, Line, vec, Circle } from "@shopify/react-native-skia";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface DataPoint {
  timestamp: number;
  value: number;
}

interface ChartConfig {
  key: string;
  label: string;
  color: string;
  unit: string;
  data: DataPoint[];
  minValue?: number;
  maxValue?: number;
}

interface InteractiveRunChartProps {
  configs: ChartConfig[];
  height?: number;
  padding?: { top: number; right: number; bottom: number; left: number };
}

const DEFAULT_PADDING = { top: 20, right: 16, bottom: 30, left: 16 };

// Filter out artifact data points (stops, pauses)
function filterArtifacts(data: DataPoint[], key: string): DataPoint[] {
  return data.filter((p) => {
    if (key === "cadence") return p.value >= 120; // Filter low cadence (stops)
    if (key === "gct") return p.value <= 350; // Filter high GCT (stops)
    return true;
  });
}

// Apply rolling average to smooth data
function smoothData(data: DataPoint[], windowSize: number = 15): DataPoint[] {
  if (data.length < windowSize) return data;

  const result: DataPoint[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
    const window = data.slice(start, end);
    const avg = window.reduce((sum, p) => sum + p.value, 0) / window.length;
    result.push({ timestamp: data[i].timestamp, value: avg });
  }
  return result;
}

export function InteractiveRunChart({
  configs,
  height = 200,
  padding = DEFAULT_PADDING,
}: InteractiveRunChartProps) {
  const width = SCREEN_WIDTH - 32;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const [tooltipData, setTooltipData] = useState<{
    x: number;
    timestamp: number;
    values: { label: string; value: number; color: string; unit: string }[];
  } | null>(null);

  // Calculate global time range across all configs
  const timeRange = useMemo(() => {
    let minTime = Infinity;
    let maxTime = -Infinity;
    configs.forEach((config) => {
      config.data.forEach((point) => {
        minTime = Math.min(minTime, point.timestamp);
        maxTime = Math.max(maxTime, point.timestamp);
      });
    });
    return { min: minTime, max: maxTime };
  }, [configs]);

  // Build Skia paths for each config
  const paths = useMemo(() => {
    return configs.map((config) => {
      const { minValue, maxValue, key } = config;
      const filtered = filterArtifacts(config.data, key); // Remove stop artifacts
      const data = smoothData(filtered, 15); // Apply 15-point rolling average
      if (data.length === 0) return null;

      let min = minValue ?? Infinity;
      let max = maxValue ?? -Infinity;
      if (minValue === undefined || maxValue === undefined) {
        data.forEach((point) => {
          if (minValue === undefined) min = Math.min(min, point.value);
          if (maxValue === undefined) max = Math.max(max, point.value);
        });
      }
      const range = max - min || 1;
      min = min - range * 0.1;
      max = max + range * 0.1;

      const path = Skia.Path.Make();
      let started = false;

      data.forEach((point) => {
        const x =
          padding.left +
          ((point.timestamp - timeRange.min) / (timeRange.max - timeRange.min)) *
            chartWidth;
        const y =
          padding.top + chartHeight - ((point.value - min) / (max - min)) * chartHeight;

        if (!started) {
          path.moveTo(x, y);
          started = true;
        } else {
          path.lineTo(x, y);
        }
      });

      return { path, color: config.color, min, max };
    });
  }, [configs, timeRange, chartWidth, chartHeight, padding]);

  // Find values at a given x position
  const getValuesAtX = useCallback(
    (x: number) => {
      const timestamp =
        timeRange.min +
        ((x - padding.left) / chartWidth) * (timeRange.max - timeRange.min);

      const values = configs.map((config) => {
        let closest = config.data[0];
        let minDist = Infinity;
        config.data.forEach((point) => {
          const dist = Math.abs(point.timestamp - timestamp);
          if (dist < minDist) {
            minDist = dist;
            closest = point;
          }
        });
        return {
          label: config.label,
          value: closest?.value ?? 0,
          color: config.color,
          unit: config.unit,
        };
      });

      return { timestamp, values };
    },
    [configs, timeRange, chartWidth, padding.left]
  );

  // Simple pan responder for touch handling
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const x = evt.nativeEvent.locationX;
          if (x >= padding.left && x <= padding.left + chartWidth) {
            const { timestamp, values } = getValuesAtX(x);
            setTooltipData({ x, timestamp, values });
          }
        },
        onPanResponderMove: (evt) => {
          const x = evt.nativeEvent.locationX;
          if (x >= padding.left && x <= padding.left + chartWidth) {
            const { timestamp, values } = getValuesAtX(x);
            setTooltipData({ x, timestamp, values });
          }
        },
        onPanResponderRelease: () => {
          setTooltipData(null);
        },
        onPanResponderTerminate: () => {
          setTooltipData(null);
        },
      }),
    [getValuesAtX, padding.left, chartWidth]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View style={[styles.container, { height }]}>
      {/* Legend */}
      <View style={styles.legend}>
        {configs.map((config) => (
          <View key={config.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: config.color }]} />
            <Text style={styles.legendText}>{config.label}</Text>
          </View>
        ))}
      </View>

      <View style={{ width, height: height - 24 }} {...panResponder.panHandlers}>
        <Canvas style={{ flex: 1 }}>
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <Line
              key={ratio}
              p1={vec(padding.left, padding.top + chartHeight * ratio)}
              p2={vec(padding.left + chartWidth, padding.top + chartHeight * ratio)}
              color="#E0E0E0"
              strokeWidth={1}
            />
          ))}

          {/* Paths */}
          {paths.map(
            (pathData, index) =>
              pathData && (
                <Path
                  key={configs[index].key}
                  path={pathData.path}
                  color={pathData.color}
                  style="stroke"
                  strokeWidth={2}
                />
              )
          )}

          {/* Touch indicator line */}
          {tooltipData && (
            <>
              <Line
                p1={vec(tooltipData.x, padding.top)}
                p2={vec(tooltipData.x, padding.top + chartHeight)}
                color="#1976D2"
                strokeWidth={1}
              />
              {tooltipData.values.map((v, i) => {
                const pathData = paths[i];
                if (!pathData) return null;
                const y =
                  padding.top +
                  chartHeight -
                  ((v.value - pathData.min) / (pathData.max - pathData.min)) *
                    chartHeight;
                return (
                  <Circle
                    key={configs[i].key}
                    cx={tooltipData.x}
                    cy={y}
                    r={5}
                    color={configs[i].color}
                  />
                );
              })}
            </>
          )}
        </Canvas>

        {/* Tooltip overlay */}
        {tooltipData && (
          <View
            style={[
              styles.tooltip,
              {
                left: Math.min(tooltipData.x + 10, width - 120),
                top: padding.top,
              },
            ]}
          >
            <Text style={styles.tooltipTime}>{formatTime(tooltipData.timestamp)}</Text>
            {tooltipData.values.map((v) => (
              <View key={v.label} style={styles.tooltipRow}>
                <View style={[styles.tooltipDot, { backgroundColor: v.color }]} />
                <Text style={styles.tooltipValue}>
                  {v.value.toFixed(0)} {v.unit}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* X-axis labels */}
      <View style={[styles.xAxis, { paddingLeft: padding.left }]}>
        <Text style={styles.axisLabel}>{formatTime(timeRange.min)}</Text>
        <Text style={styles.axisLabel}>
          {formatTime((timeRange.min + timeRange.max) / 2)}
        </Text>
        <Text style={styles.axisLabel}>{formatTime(timeRange.max)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#49454F",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 8,
    padding: 8,
    minWidth: 100,
  },
  tooltipTime: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 4,
  },
  tooltipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tooltipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tooltipValue: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 16,
  },
  axisLabel: {
    fontSize: 10,
    color: "#9E9E9E",
  },
});
