import { StyleSheet } from "react-native";
import { colors } from "../../../theme/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textTertiary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  coachingItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.success,
    marginRight: 12,
    width: 20,
  },
  attentionIcon: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF9800",
    marginRight: 12,
    width: 20,
    textAlign: "center",
  },
  coachingText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  focusCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryLightBorder,
  },
  focusIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  focusCue: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: colors.primaryDark,
    lineHeight: 24,
  },
  fatigueCard: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  fatigueMetric: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  fatigueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fatigueValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  fatigueArrow: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  fatigueChange: {
    marginLeft: "auto",
    fontSize: 14,
    fontWeight: "600",
  },
});
