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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  avgHR: {
    fontSize: 13,
    color: "#E57373",
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
    color: "#000000",
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
    color: "#49454F",
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
    color: "#1C1B1F",
    fontWeight: "500",
    minWidth: 50,
    textAlign: "right",
  },
  zonePct: {
    fontSize: 13,
    color: "#49454F",
    minWidth: 35,
    textAlign: "right",
  },
});
