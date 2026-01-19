import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: {
    backgroundColor: "#F5F5F5",
  },
  header: {
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  date: {
    fontSize: 12,
    color: "#49454F",
  },
  activityTypeBadge: {
    backgroundColor: "#E8E8E8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activityTypeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#616161",
  },
  complianceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  complianceText: {
    fontSize: 12,
    fontWeight: "600",
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1B1F",
  },
  workoutName: {
    fontSize: 13,
    color: "#1976D2",
    marginTop: 2,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1976D2",
  },
  statLabel: {
    fontSize: 12,
    color: "#49454F",
    marginTop: 2,
  },
  gradesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  gradeItem: {
    alignItems: "center",
    gap: 4,
  },
  gradeLabel: {
    fontSize: 10,
    color: "#9E9E9E",
    fontWeight: "500",
  },
  gradeBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  gradeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
