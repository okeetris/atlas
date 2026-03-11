import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7F4",
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
    color: "#736F6C",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1B1F",
    marginBottom: 12,
    marginTop: 8,
  },
  chartHint: {
    fontSize: 12,
    color: "#9A9693",
    marginBottom: 8,
    marginTop: -8,
  },
  zoneLabel: {
    fontSize: 11,
    color: "#9A9693",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 12,
  },
});
