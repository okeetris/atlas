/**
 * Activity card component for list view.
 */

import { View, Text, Pressable } from "react-native";
import type { ActivitySummary, Grade } from "../../types";
import { styles } from "./ActivityCard.styles";
import {
  formatDurationClock,
  formatPaceFromDistance,
  formatDate,
  gradeColors,
  getComplianceColor,
} from "../../utils/formatters";

interface ActivityCardProps {
  activity: ActivitySummary;
  onPress?: () => void;
}

function GradeBadge({ grade, label }: { grade: Grade; label: string }) {
  return (
    <View style={styles.gradeItem}>
      <Text style={styles.gradeLabel}>{label}</Text>
      <View style={[styles.gradeBadge, { backgroundColor: gradeColors[grade] }]}>
        <Text style={styles.gradeText}>{grade}</Text>
      </View>
    </View>
  );
}

const gradeRank: Record<Grade, number> = { A: 0, B: 1, C: 2, D: 3 };

function getOverallGradeColor(grades: { cadence: Grade; gct: Grade; gctBalance: Grade; verticalRatio: Grade }): string {
  const all = [grades.cadence, grades.gct, grades.gctBalance, grades.verticalRatio];
  // Use the median grade (second worst of 4) for a balanced signal
  const sorted = [...all].sort((a, b) => gradeRank[a] - gradeRank[b]);
  const median = sorted[1]; // second best = representative grade
  return gradeColors[median];
}

function getActivityTypeLabel(activityType: string): string | null {
  switch (activityType) {
    case "treadmill_running":
      return "Treadmill";
    case "trail_running":
      return "Trail";
    case "track_running":
      return "Track";
    default:
      return null;
  }
}

export function ActivityCard({ activity, onPress }: ActivityCardProps) {
  const pace = formatPaceFromDistance(activity.distanceKm, activity.durationSeconds);
  const hasCompliance = activity.compliancePercent != null;
  const activityTypeLabel = getActivityTypeLabel(activity.activityType);

  const borderColor = activity.grades ? getOverallGradeColor(activity.grades) : undefined;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        borderColor ? { borderLeftWidth: 4, borderLeftColor: borderColor } : undefined,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.dateRow}>
            <Text style={styles.date}>{formatDate(activity.startTime)}</Text>
            {activityTypeLabel && (
              <View style={styles.activityTypeBadge}>
                <Text style={styles.activityTypeText}>{activityTypeLabel}</Text>
              </View>
            )}
          </View>
          {hasCompliance && (
            <View style={[
              styles.complianceBadge,
              { backgroundColor: getComplianceColor(activity.compliancePercent!) + "20" }
            ]}>
              <Text style={[
                styles.complianceText,
                { color: getComplianceColor(activity.compliancePercent!) }
              ]}>
                {activity.compliancePercent}%
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{activity.activityName}</Text>
        {activity.workoutName && (
          <Text style={styles.workoutName}>{activity.workoutName}</Text>
        )}
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{activity.distanceKm.toFixed(1)}</Text>
          <Text style={styles.statLabel}>km</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {formatDurationClock(activity.durationSeconds)}
          </Text>
          <Text style={styles.statLabel}>time</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{pace}</Text>
          <Text style={styles.statLabel}>pace</Text>
        </View>
      </View>

      {/* Grade badges */}
      {activity.grades && (
        <View style={styles.gradesRow}>
          <GradeBadge grade={activity.grades.cadence} label="CAD" />
          <GradeBadge grade={activity.grades.gct} label="GCT" />
          <GradeBadge grade={activity.grades.gctBalance} label="BAL" />
          <GradeBadge grade={activity.grades.verticalRatio} label="V.R" />
        </View>
      )}
    </Pressable>
  );
}
