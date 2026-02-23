import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerRow: {
    flexDirection: "row",
    paddingBottom: 8,
    marginBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
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
    borderBottomColor: "#F0F0F0",
  },
  distanceName: {
    fontSize: 14,
    color: "#1C1B1F",
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
  },
  paceValue: {
    fontSize: 13,
    color: "#49454F",
  },
});
