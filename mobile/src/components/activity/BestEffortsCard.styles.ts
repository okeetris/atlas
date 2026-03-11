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
  headerRow: {
    flexDirection: "row",
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderDark,
  },
  headerCell: {
    fontSize: 12,
    fontWeight: "600",
    color: "#79747E",
    textTransform: "uppercase",
  },
  distanceCol: {
    flex: 1.2,
  },
  timeCol: {
    flex: 1,
    textAlign: "right",
  },
  paceCol: {
    flex: 1,
    textAlign: "right",
  },
  dataRow: {
    flexDirection: "row",
    paddingVertical: 10,
    alignItems: "center",
  },
  dataRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  distanceName: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  paceValue: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
