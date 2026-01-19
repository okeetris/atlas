/**
 * Activity card component for list view.
 */

import { View, Text, Pressable } from "react-native";
import type { ActivitySummary, Grade } from "../../types";
import { styles } from "./ActivityCard.styles";

interface ActivityCardProps {
  activity: ActivitySummary;
  onPress?: () => void;
}

const gradeColors: Record<Grade, string> = {
  A: "#4CAF50",
  B: "#8BC34A",
  C: "#FFC107",
  D: "#F44336",
};

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

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatPace(distanceKm: number, durationSeconds: number): string {
  if (distanceKm === 0) return "--:--";
  const paceSeconds = durationSeconds / distanceKm;
  const mins = Math.floor(paceSeconds / 60);
  const secs = Math.floor(paceSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}/km`;
}

function formatDate(dateString: string): string {
  if (!dateString) return "Unknown date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getComplianceColor(percent: number): string {
  if (percent >= 80) return "#4CAF50";
  if (percent >= 50) return "#FFC107";
  return "#F44336";
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
  const pace = formatPace(activity.distanceKm, activity.durationSeconds);
  const hasCompliance = activity.compliancePercent != null;
  const activityTypeLabel = getActivityTypeLabel(activity.activityType);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
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
            {formatDuration(activity.durationSeconds)}
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
