/**
 * Activity Detail Screen
 *
 * Shows full biomechanics analysis with grades for a single activity.
 * Includes interactive Skia charts with touch scrubbing.
 */

import { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useActivityDetails } from "../hooks/useActivities";
import { styles } from "./ActivityDetailScreen.styles";
import { InteractiveRunChart } from "../components/charts/InteractiveRunChart";
import { GCTBalanceChart } from "../components/charts/GCTBalanceChart";
import { CadenceGCTScatter } from "../components/charts/CadenceGCTScatter";
import { WorkoutComplianceCard } from "../components/activity/WorkoutComplianceCard";
import type { Grade, GradeValue, FatigueComparison, TimeSeriesDataPoint } from "../types";

interface Props {
  activityId: string;
  onBack: () => void;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatPace(secPerKm: number): string {
  if (!secPerKm || secPerKm === 0) return "--:--";
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.floor(secPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}/km`;
}

function formatDate(dateString: string): string {
  if (!dateString) return "Unknown date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const gradeColors: Record<Grade, string> = {
  A: "#4CAF50",
  B: "#8BC34A",
  C: "#FFC107",
  D: "#F44336",
};

function GradeBadge({ grade }: { grade: Grade }) {
  return (
    <View style={[styles.gradeBadge, { backgroundColor: gradeColors[grade] }]}>
      <Text style={styles.gradeText}>{grade}</Text>
    </View>
  );
}

function MetricCard({
  label,
  value,
  unit,
  gradeValue,
}: {
  label: string;
  value: string;
  unit: string;
  gradeValue?: GradeValue;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricRow}>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricUnit}>{unit}</Text>
        {gradeValue && <GradeBadge grade={gradeValue.grade} />}
      </View>
    </View>
  );
}

function FatigueCard({ item }: { item: FatigueComparison }) {
  const isGood = item.changeDirection === "improved" || item.changeDirection === "stable";
  const changeColor = isGood ? "#4CAF50" : "#F44336";
  const arrow = item.change > 0 ? "↑" : item.change < 0 ? "↓" : "→";

  return (
    <View style={styles.fatigueCard}>
      <Text style={styles.fatigueMetric}>{item.metric}</Text>
      <View style={styles.fatigueRow}>
        <Text style={styles.fatigueValue}>{item.firstHalf.toFixed(1)}</Text>
        <Text style={styles.fatigueArrow}>→</Text>
        <Text style={styles.fatigueValue}>{item.secondHalf.toFixed(1)}</Text>
        <Text style={[styles.fatigueChange, { color: changeColor }]}>
          {arrow} {Math.abs(item.change).toFixed(1)}%
        </Text>
      </View>
    </View>
  );
}

export function ActivityDetailScreen({ activityId, onBack }: Props) {
  const { data: activity, isLoading, error } = useActivityDetails(activityId);

  // Extract timeSeries safely for hooks (must be called before early returns)
  const timeSeries = activity?.timeSeries;

  // Transform time series data for charts - must be before early returns
  const chartConfigs = useMemo(() => {
    if (!timeSeries || timeSeries.length === 0) return [];

    const configs = [];

    // Cadence chart data
    const cadenceData = timeSeries
      .filter((p: TimeSeriesDataPoint) => p.cadence != null)
      .map((p: TimeSeriesDataPoint) => ({ timestamp: p.timestamp, value: p.cadence! }));
    if (cadenceData.length > 0) {
      configs.push({
        key: "cadence",
        label: "Cadence",
        color: "#1976D2",
        unit: "spm",
        data: cadenceData,
        minValue: 150,
        maxValue: 200,
      });
    }

    // GCT chart data
    const gctData = timeSeries
      .filter((p: TimeSeriesDataPoint) => p.gct != null)
      .map((p: TimeSeriesDataPoint) => ({ timestamp: p.timestamp, value: p.gct! }));
    if (gctData.length > 0) {
      configs.push({
        key: "gct",
        label: "GCT",
        color: "#F57C00",
        unit: "ms",
        data: gctData,
        minValue: 180,
        maxValue: 320,
      });
    }

    return configs;
  }, [timeSeries]);

  // Heart rate chart (separate for clarity)
  const hrChartConfigs = useMemo(() => {
    if (!timeSeries || timeSeries.length === 0) return [];

    const hrData = timeSeries
      .filter((p: TimeSeriesDataPoint) => p.heartRate != null)
      .map((p: TimeSeriesDataPoint) => ({ timestamp: p.timestamp, value: p.heartRate! }));

    if (hrData.length === 0) return [];

    return [
      {
        key: "hr",
        label: "Heart Rate",
        color: "#E53935",
        unit: "bpm",
        data: hrData,
      },
    ];
  }, [timeSeries]);

  // GCT Balance data for dedicated chart
  const gctBalanceData = useMemo(() => {
    if (!timeSeries || timeSeries.length === 0) return [];
    return timeSeries
      .filter((p: TimeSeriesDataPoint) => p.gctBalance != null)
      .map((p: TimeSeriesDataPoint) => ({ timestamp: p.timestamp, value: p.gctBalance! }));
  }, [timeSeries]);

  // Cadence-GCT correlation data
  const cadenceGctData = useMemo(() => {
    if (!timeSeries || timeSeries.length === 0) return [];
    return timeSeries
      .filter((p: TimeSeriesDataPoint) => p.cadence != null && p.gct != null)
      .map((p: TimeSeriesDataPoint) => ({ cadence: p.cadence!, gct: p.gct! }));
  }, [timeSeries]);

  // Early returns after all hooks
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading analysis...</Text>
      </View>
    );
  }

  if (error || !activity) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load activity</Text>
        <Pressable style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const { summaryMetrics, coaching, fatigueComparison, workoutCompliance } = activity;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.backPressable}>
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{activity.activityName}</Text>
            {activity.hasRunningDynamics && (
              <View style={styles.rdBadge}>
                <Text style={styles.rdBadgeText}>RD</Text>
              </View>
            )}
          </View>
          <Text style={styles.date}>{formatDate(activity.startTime)}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Summary Stats */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>{activity.distanceKm.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>km</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>
              {formatDuration(activity.durationSeconds)}
            </Text>
            <Text style={styles.summaryLabel}>time</Text>
          </View>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryValue}>
              {formatPace(summaryMetrics.avgPace)}
            </Text>
            <Text style={styles.summaryLabel}>pace</Text>
          </View>
        </View>

        {/* Workout Compliance - at top if available */}
        {workoutCompliance && (
          <>
            <Text style={styles.sectionTitle}>Workout Compliance</Text>
            <WorkoutComplianceCard compliance={workoutCompliance} />
          </>
        )}

        {/* Coaching At-a-Glance */}
        <View style={styles.coachingCard}>
          <Text style={styles.coachingGlance}>{coaching.atAGlance}</Text>
          <View style={styles.focusCueContainer}>
            <Text style={styles.focusCueLabel}>Focus Cue:</Text>
            <Text style={styles.focusCue}>{coaching.focusCue}</Text>
          </View>
        </View>

        {/* Biomechanics Metrics */}
        <Text style={styles.sectionTitle}>Running Dynamics</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            label="Cadence"
            value={summaryMetrics.avgCadence.value.toFixed(0)}
            unit="spm"
            gradeValue={summaryMetrics.avgCadence}
          />
          <MetricCard
            label="Ground Contact"
            value={summaryMetrics.avgGct.value.toFixed(0)}
            unit="ms"
            gradeValue={summaryMetrics.avgGct}
          />
          <MetricCard
            label="GCT Balance"
            value={summaryMetrics.avgGctBalance.value.toFixed(1)}
            unit="%"
            gradeValue={summaryMetrics.avgGctBalance}
          />
          <MetricCard
            label="Vertical Ratio"
            value={summaryMetrics.avgVerticalRatio.value.toFixed(1)}
            unit="%"
            gradeValue={summaryMetrics.avgVerticalRatio}
          />
        </View>

        {/* Time Series Charts */}
        {chartConfigs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Cadence & Ground Contact</Text>
            <Text style={styles.chartHint}>Touch and drag to see values</Text>
            <InteractiveRunChart configs={chartConfigs} height={220} />
          </>
        )}

        {hrChartConfigs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Heart Rate</Text>
            <InteractiveRunChart configs={hrChartConfigs} height={180} />
          </>
        )}

        {/* GCT Balance Chart */}
        {gctBalanceData.length > 10 && (
          <>
            <Text style={styles.sectionTitle}>GCT Balance</Text>
            <Text style={styles.chartHint}>49-51% is ideal (balanced stride)</Text>
            <GCTBalanceChart data={gctBalanceData} />
          </>
        )}

        {/* Cadence-GCT Correlation */}
        {cadenceGctData.length > 10 && (
          <>
            <Text style={styles.sectionTitle}>Cadence vs GCT</Text>
            <Text style={styles.chartHint}>Higher cadence typically means lower ground contact time</Text>
            <CadenceGCTScatter data={cadenceGctData} />
          </>
        )}

        {/* What Went Well */}
        <Text style={styles.sectionTitle}>What Went Well</Text>
        <View style={styles.insightsCard}>
          {coaching.whatWentWell.map((item, index) => (
            <View key={index} style={styles.insightRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.insightText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Areas to Address */}
        {coaching.areasToAddress.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Areas to Address</Text>
            <View style={styles.insightsCard}>
              {coaching.areasToAddress.map((item, index) => (
                <View key={index} style={styles.insightRow}>
                  <Text style={styles.attention}>!</Text>
                  <Text style={styles.insightText}>{item}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Fatigue Comparison */}
        {fatigueComparison && fatigueComparison.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>First Half vs Second Half</Text>
            <View style={styles.fatigueContainer}>
              {fatigueComparison.map((item, index) => (
                <FatigueCard key={index} item={item} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

