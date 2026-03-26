/**
 * Home Screen
 *
 * Dashboard with welcome message, analyze CTA, and latest analysis.
 */

import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useActivities } from "../../src/hooks/useActivities";
import type { ActivitySummary, Grade } from "../../src/types";
import { styles } from "../../src/styles/app/tabs/index.styles";
import { colors } from "../../src/theme/colors";
import { formatRelativeDate, formatDurationCompact, gradeColors } from "../../src/utils/formatters";

function GradeBadge({ grade }: { grade: Grade }) {
  return (
    <View style={[styles.gradeBadge, { backgroundColor: gradeColors[grade] }]}>
      <Text style={styles.gradeText}>{grade}</Text>
    </View>
  );
}

function LatestAnalysisCard({ activity }: { activity: ActivitySummary }) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/activity/${activity.id}`);
  };

  return (
    <Pressable style={styles.latestCard} onPress={handlePress}>
      <View style={styles.latestHeader}>
        <Text style={styles.latestDate}>{formatRelativeDate(activity.startTime)}</Text>
        {activity.compliancePercent !== undefined && (
          <View style={styles.complianceBadge}>
            <Text style={styles.complianceText}>{activity.compliancePercent}%</Text>
          </View>
        )}
      </View>
      <Text style={styles.latestTitle}>
        {activity.workoutName || activity.activityName}
      </Text>
      <Text style={styles.latestStats}>
        {activity.distanceKm.toFixed(1)} km • {formatDurationCompact(activity.durationSeconds)}
      </Text>

      {/* Placeholder grades - will be populated when we add grades to summary */}
      {activity.grades && (
        <View style={styles.gradesRow}>
          <View style={styles.gradeItem}>
            <Text style={styles.gradeLabel}>CAD</Text>
            <GradeBadge grade={activity.grades.cadence} />
          </View>
          <View style={styles.gradeItem}>
            <Text style={styles.gradeLabel}>GCT</Text>
            <GradeBadge grade={activity.grades.gct} />
          </View>
          <View style={styles.gradeItem}>
            <Text style={styles.gradeLabel}>BAL</Text>
            <GradeBadge grade={activity.grades.gctBalance} />
          </View>
          <View style={styles.gradeItem}>
            <Text style={styles.gradeLabel}>V.R</Text>
            <GradeBadge grade={activity.grades.verticalRatio} />
          </View>
        </View>
      )}

      <View style={styles.viewDetailsRow}>
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { data: activities } = useActivities();

  const hasActivities = activities && activities.length > 0;
  const latestActivity = activities?.[0];

  const handleAnalyzePress = () => {
    router.push("/analyze");
  };

  const handleActivitiesPress = () => {
    router.push("/activities");
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const handleSettingsPress = () => {
    router.push("/settings");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.title}>Atlas</Text>
        </View>
        <Pressable style={styles.settingsButton} onPress={handleSettingsPress}>
          <Ionicons name="settings-outline" size={24} color={colors.textTertiary} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {hasActivities ? (
          <>
            {/* Analyze CTA */}
            <Pressable style={styles.analyzeCta} onPress={handleAnalyzePress}>
              <View style={styles.analyzeCtaContent}>
                <Ionicons name="analytics" size={32} color={colors.white} />
                <View style={styles.analyzeCtaText}>
                  <Text style={styles.analyzeCtaTitle}>Analyze New Run</Text>
                  <Text style={styles.analyzeCtaSubtitle}>Get biomechanics insights</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.white} />
            </Pressable>

            {/* Latest Analysis */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Latest Analysis</Text>
              {latestActivity && <LatestAnalysisCard activity={latestActivity} />}
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsRow}>
                <Pressable style={styles.quickAction} onPress={handleActivitiesPress}>
                  <Ionicons name="fitness-outline" size={24} color={colors.primary} />
                  <Text style={styles.quickActionLabel}>All Runs</Text>
                </Pressable>
                <Pressable style={styles.quickAction} onPress={handleAnalyzePress}>
                  <Ionicons name="cloud-download-outline" size={24} color={colors.primary} />
                  <Text style={styles.quickActionLabel}>Fetch New</Text>
                </Pressable>
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Empty State: Onboarding CTA */}
            <Pressable style={styles.onboardingCta} onPress={handleAnalyzePress}>
              <Ionicons name="analytics" size={48} color={colors.white} />
              <Text style={styles.onboardingCtaTitle}>
                Connect your Garmin to analyze your running biomechanics
              </Text>
              <View style={styles.onboardingCtaButton}>
                <Text style={styles.onboardingCtaButtonLabel}>Get Started</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </View>
            </Pressable>

            {/* Value Proposition */}
            <View style={styles.valuePropCard}>
              <Text style={styles.valuePropText}>
                Atlas analyzes your running dynamics — cadence, ground contact, and more — to help you run better.
              </Text>
            </View>

            {/* Quick Actions (only All Runs in empty state) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickActionsRow}>
                <Pressable style={styles.quickAction} onPress={handleActivitiesPress}>
                  <Ionicons name="fitness-outline" size={24} color={colors.primary} />
                  <Text style={styles.quickActionLabel}>All Runs</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}

        {/* Your Tools */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Tools</Text>
          <View style={styles.toolsRow}>
            <Pressable
              style={styles.toolCard}
              onPress={() => router.push("/tools/glucose")}
            >
              <Ionicons name="water-outline" size={32} color={colors.primary} />
              <Text style={styles.toolTitle}>Glucose</Text>
              <Text style={styles.toolSubtitle}>mmol/L ↔ mg/dL</Text>
            </Pressable>
            <Pressable
              style={styles.toolCard}
              onPress={() => router.push("/tools/pace")}
            >
              <Ionicons name="speedometer-outline" size={32} color={colors.primary} />
              <Text style={styles.toolTitle}>Pace</Text>
              <Text style={styles.toolSubtitle}>Speed & Race Times</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
