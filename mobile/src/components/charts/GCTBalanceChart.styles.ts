import { StyleSheet } from "react-native";
import { colors } from "../../theme/colors";

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
    marginTop: 40,
  },
  yAxis: {
    position: "absolute",
    left: 4,
    top: 20,
    bottom: 30,
    justifyContent: "space-between",
    width: 30,
  },
  yLabel: {
    fontSize: 9,
    color: colors.textHint,
    textAlign: "right",
  },
  yLabelIdeal: {
    color: "#BDBDBD",
  },
  yLabelCenter: {
    color: colors.success,
    fontWeight: "600",
  },
  sideIndicator: {
    position: "absolute",
    right: 8,
    top: 20,
    bottom: 30,
    justifyContent: "space-between",
  },
  sideText: {
    fontSize: 8,
    color: "#BDBDBD",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 8,
    padding: 8,
    minWidth: 80,
  },
  tooltipTime: {
    fontSize: 11,
    color: colors.white,
    fontWeight: "600",
  },
  tooltipValue: {
    fontSize: 14,
    color: colors.white,
    fontWeight: "bold",
    marginTop: 2,
  },
  tooltipSide: {
    fontSize: 10,
    color: colors.primaryLightBorder,
    marginTop: 2,
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 16,
  },
  axisLabel: {
    fontSize: 10,
    color: colors.textHint,
  },
});
