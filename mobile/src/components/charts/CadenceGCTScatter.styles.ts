import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

export const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: "center",
    color: colors.textHint,
    marginTop: 60,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  r2Badge: {
    backgroundColor: "#F3F2EF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  r2Text: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  yAxisLabel: {
    position: "absolute",
    left: 2,
    top: "50%",
    transform: [{ rotate: "-90deg" }, { translateX: -20 }],
  },
  axisLabelRotated: {
    fontSize: 10,
    color: colors.textHint,
  },
  yAxis: {
    position: "absolute",
    left: 8,
    top: PADDING.top,
    bottom: 0,
    justifyContent: "space-between",
    alignItems: "flex-end",
    width: 35,
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: PADDING.right,
  },
  axisValue: {
    fontSize: 10,
    color: colors.textHint,
  },
  xAxisLabel: {
    textAlign: "center",
    fontSize: 10,
    color: colors.textHint,
    marginTop: 4,
  },
});
