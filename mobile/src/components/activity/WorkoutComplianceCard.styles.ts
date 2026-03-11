import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  workoutDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  complianceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  compliancePercent: {
    fontSize: 16,
    fontWeight: "bold",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textHint,
    marginTop: 2,
  },
  expandButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    gap: 6,
  },
  expandButtonText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
  },
  expandChevron: {
    fontSize: 10,
    color: colors.primary,
  },
  stepsContainer: {
    gap: 12,
  },
  stepCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.borderDark,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepStatusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  stepStatusIcon: {
    fontSize: 14,
    fontWeight: "bold",
  },
  stepTitleContainer: {
    flex: 1,
  },
  stepType: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  stepLapsLabel: {
    fontSize: 11,
    color: colors.textHint,
    marginTop: 1,
  },
  stepPaceContainer: {
    alignItems: "flex-end",
  },
  stepActualPace: {
    fontSize: 15,
    fontWeight: "bold",
  },
  paceBarContainer: {
    marginTop: 10,
    marginBottom: 6,
  },
  paceBarTrack: {
    height: 8,
    backgroundColor: colors.borderDark,
    borderRadius: 4,
    position: "relative",
    overflow: "hidden",
  },
  paceBarTarget: {
    position: "absolute",
    top: 0,
    bottom: 0,
    backgroundColor: "#C8E6C9",
    borderRadius: 4,
  },
  paceBarMarker: {
    position: "absolute",
    top: -2,
    width: 4,
    height: 12,
    borderRadius: 2,
    marginLeft: -2,
  },
  paceBarLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  paceBarLabel: {
    fontSize: 10,
    color: colors.textHint,
  },
  stepDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
  },
  stepDetailItem: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  stepDetailLabel: {
    fontSize: 11,
    color: colors.textHint,
  },
  stepDetailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  stepDetailTarget: {
    fontSize: 11,
    color: "#BDBDBD",
  },
  stepDetailElapsed: {
    fontSize: 10,
    color: colors.textHint,
    fontStyle: "italic",
    marginLeft: 4,
  },
});
