/**
 * Workout Compliance Card
 *
 * Shows workout compliance with expandable step-by-step breakdown.
 * Includes visual pace compliance bars and distance/duration details.
 */

import { useState } from "react";
import { View, Text, Pressable, LayoutAnimation } from "react-native";
import type { WorkoutCompliance, StepCompliance } from "../../types";
import { styles } from "./WorkoutComplianceCard.styles";
import { colors } from "../../theme/colors";
import { formatDistance, formatDurationClock } from "../../utils/formatters";

interface Props {
  compliance: WorkoutCompliance;
  defaultExpanded?: boolean;
}

const statusConfig: Record<string, { icon: string; color: string; label: string }> = {
  hit: { icon: "✓", color: colors.gradeA, label: "Hit" },
  partial: { icon: "~", color: colors.gradeC, label: "Close" },
  fast: { icon: "↑", color: "#2196F3", label: "Fast" },
  missed: { icon: "✗", color: colors.gradeD, label: "Missed" },
  skipped: { icon: "⏭", color: "#9C27B0", label: "Skipped" },
  no_target: { icon: "-", color: colors.textHint, label: "No Target" },
};

function PaceComplianceBar({ step }: { step: StepCompliance }) {
  if (!step.targetPaceRange || !step.actualPaceSecKm) {
    return null;
  }

  // Parse target paces (format "M:SS")
  const parsePace = (paceStr: string): number => {
    const [mins, secs] = paceStr.split(":").map(Number);
    return mins * 60 + secs;
  };

  const fastTarget = parsePace(step.targetPaceRange.fast);
  const slowTarget = parsePace(step.targetPaceRange.slow);
  const actual = step.actualPaceSecKm;

  // Calculate range for visualization
  // Add 30 sec buffer on each side for visual context
  const rangeStart = fastTarget - 30;
  const rangeEnd = slowTarget + 30;
  const totalRange = rangeEnd - rangeStart;

  // Calculate positions as percentages
  const targetStartPct = ((fastTarget - rangeStart) / totalRange) * 100;
  const targetWidthPct = ((slowTarget - fastTarget) / totalRange) * 100;
  const actualPct = Math.max(0, Math.min(100, ((actual - rangeStart) / totalRange) * 100));

  const isInRange = actual >= fastTarget && actual <= slowTarget;
  const isFast = actual < fastTarget;
  const markerColor = isInRange ? colors.gradeA : isFast ? "#2196F3" : colors.gradeD;

  return (
    <View style={styles.paceBarContainer}>
      <View style={styles.paceBarTrack}>
        {/* Target zone */}
        <View
          style={[
            styles.paceBarTarget,
            {
              left: `${targetStartPct}%`,
              width: `${targetWidthPct}%`,
            },
          ]}
        />
        {/* Actual pace marker */}
        <View
          style={[
            styles.paceBarMarker,
            {
              left: `${actualPct}%`,
              backgroundColor: markerColor,
            },
          ]}
        />
      </View>
      <View style={styles.paceBarLabels}>
        <Text style={styles.paceBarLabel}>{step.targetPaceRange.fast}</Text>
        <Text style={styles.paceBarLabel}>{step.targetPaceRange.slow}</Text>
      </View>
    </View>
  );
}

function StepCard({ step, index }: { step: StepCompliance; index: number }) {
  const config = statusConfig[step.status] || statusConfig.no_target;
  const isSkipped = step.status === "skipped";

  return (
    <View style={[styles.stepCard, isSkipped && { opacity: 0.7, borderLeftColor: config.color }]}>
      {/* Step header */}
      <View style={styles.stepHeader}>
        <View style={[styles.stepStatusBadge, { backgroundColor: config.color + "20" }]}>
          <Text style={[styles.stepStatusIcon, { color: config.color }]}>{config.icon}</Text>
        </View>
        <View style={styles.stepTitleContainer}>
          <Text style={[styles.stepType, isSkipped && { textDecorationLine: "line-through", color: colors.textHint }]}>
            {step.stepType}
          </Text>
          {isSkipped && step.actualDurationSec != null && step.targetDurationSec ? (
            <Text style={[styles.stepLapsLabel, { color: config.color }]}>
              Skipped — {formatDurationClock(step.actualDurationSec)} of {formatDurationClock(step.targetDurationSec)} target
            </Text>
          ) : isSkipped && step.actualDistanceM != null && step.targetDistanceM ? (
            <Text style={[styles.stepLapsLabel, { color: config.color }]}>
              Skipped — {formatDistance(step.actualDistanceM)} of {formatDistance(step.targetDistanceM)} target
            </Text>
          ) : step.lapsUsed && step.lapsUsed.length > 0 ? (
            <Text style={styles.stepLapsLabel}>
              {step.lapsUsed.length === 1 ? `Lap ${step.lapsUsed[0]}` : `Laps ${step.lapsUsed.join("-")}`}
            </Text>
          ) : null}
        </View>
        <View style={styles.stepPaceContainer}>
          {!isSkipped && step.actualPace && (
            <Text style={[styles.stepActualPace, { color: config.color }]}>
              {step.actualPace}/km
            </Text>
          )}
          {isSkipped && (
            <Text style={[styles.stepActualPace, { color: config.color, fontSize: 12 }]}>
              SKIPPED
            </Text>
          )}
        </View>
      </View>

      {/* Pace compliance bar */}
      <PaceComplianceBar step={step} />

      {/* Step details */}
      <View style={styles.stepDetails}>
        {step.actualDistanceM && step.actualDistanceM > 0 && (
          <View style={styles.stepDetailItem}>
            <Text style={styles.stepDetailLabel}>Distance</Text>
            <Text style={styles.stepDetailValue}>{formatDistance(step.actualDistanceM)}</Text>
            {step.targetDistanceM && (
              <Text style={styles.stepDetailTarget}>/ {formatDistance(step.targetDistanceM)}</Text>
            )}
          </View>
        )}
        {step.actualDurationSec && step.actualDurationSec > 0 && (
          <View style={styles.stepDetailItem}>
            <Text style={styles.stepDetailLabel}>Duration</Text>
            <Text style={styles.stepDetailValue}>{formatDurationClock(step.actualDurationSec)}</Text>
            {step.targetDurationSec && (
              <Text style={styles.stepDetailTarget}>/ {formatDurationClock(step.targetDurationSec)}</Text>
            )}
            {step.actualElapsedSec && (
              <Text style={styles.stepDetailElapsed}>
                ({formatDurationClock(step.actualElapsedSec)} elapsed)
              </Text>
            )}
          </View>
        )}
        {step.targetPaceRange && (
          <View style={styles.stepDetailItem}>
            <Text style={styles.stepDetailLabel}>Target</Text>
            <Text style={styles.stepDetailValue}>
              {step.targetPaceRange.fast}-{step.targetPaceRange.slow}/km
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function WorkoutComplianceCard({ compliance, defaultExpanded }: Props) {
  // Default: expanded for single-step, collapsed for multi-step
  const [isExpanded, setIsExpanded] = useState(
    defaultExpanded ?? compliance.totalSteps <= 1
  );

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  // Compliance percent color based on value
  const complianceColor =
    compliance.compliancePercent >= 80
      ? colors.gradeA
      : compliance.compliancePercent >= 50
        ? colors.gradeC
        : colors.gradeD;

  // Distance status
  const distanceStatusText = compliance.distanceStatus === "short"
    ? "Short"
    : compliance.distanceStatus === "long"
      ? "Long"
      : compliance.distanceStatus === "hit"
        ? "On target"
        : null;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.workoutName}>{compliance.workoutName}</Text>
          {compliance.workoutDescription && (
            <Text style={styles.workoutDescription} numberOfLines={2}>
              {compliance.workoutDescription}
            </Text>
          )}
        </View>
        <View style={[styles.complianceBadge, { backgroundColor: complianceColor + "20" }]}>
          <Text style={[styles.compliancePercent, { color: complianceColor }]}>
            {compliance.compliancePercent}%
          </Text>
        </View>
      </View>

      {/* Summary stats */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.gradeA }]}>{compliance.stepsHit}</Text>
          <Text style={styles.summaryLabel}>Hit</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.gradeC }]}>{compliance.stepsPartial}</Text>
          <Text style={styles.summaryLabel}>Partial</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.gradeD }]}>{compliance.stepsMissed}</Text>
          <Text style={styles.summaryLabel}>Missed</Text>
        </View>
        {(compliance.stepsSkipped ?? 0) > 0 && (
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: "#9C27B0" }]}>{compliance.stepsSkipped}</Text>
            <Text style={styles.summaryLabel}>Skipped</Text>
          </View>
        )}
        {distanceStatusText && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{distanceStatusText}</Text>
            <Text style={styles.summaryLabel}>Distance</Text>
          </View>
        )}
      </View>

      {/* Expandable step breakdown */}
      {compliance.stepBreakdown.length > 0 && (
        <>
          <Pressable onPress={toggleExpand} style={styles.expandButton}>
            <Text style={styles.expandButtonText}>
              {isExpanded ? "Hide" : "Show"} Step Details
            </Text>
            <Text style={styles.expandChevron}>{isExpanded ? "▲" : "▼"}</Text>
          </Pressable>

          {isExpanded && (
            <View style={styles.stepsContainer}>
              {compliance.stepBreakdown.map((step, index) => (
                <StepCard key={index} step={step} index={index} />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}
