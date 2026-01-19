import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#49454F",
  },
  tooltip: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 8,
    padding: 8,
    minWidth: 100,
  },
  tooltipTime: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 4,
  },
  tooltipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tooltipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tooltipValue: {
    fontSize: 12,
    color: "#FFFFFF",
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 16,
  },
  axisLabel: {
    fontSize: 10,
    color: "#9E9E9E",
  },
});
