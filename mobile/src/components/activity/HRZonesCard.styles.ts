import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  avgHR: {
    fontSize: 13,
    color: colors.zone5,
    fontWeight: "500",
  },
  barContainer: {
    flexDirection: "row",
    height: 32,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  barSegment: {
    justifyContent: "center",
    alignItems: "center",
    minWidth: 2,
  },
  barLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.shadow,
    opacity: 0.7,
  },
  breakdown: {
    gap: 8,
  },
  zoneRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  zoneInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  zoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  zoneName: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  zoneRange: {
    fontSize: 11,
    color: "#79747E",
    marginTop: 1,
  },
  zoneStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  zoneTime: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "500",
    minWidth: 50,
    textAlign: "right",
  },
  zonePct: {
    fontSize: 13,
    color: colors.textSecondary,
    minWidth: 35,
    textAlign: "right",
  },
});
