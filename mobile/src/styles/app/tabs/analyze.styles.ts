import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#DBD9D6",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1C1B1F",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  fetchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: "#1976D2",
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#1976D2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fetchButtonDisabled: {
    opacity: 0.7,
  },
  fetchButtonIcon: {
    fontSize: 24,
  },
  fetchButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  errorBanner: {
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    textAlign: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#DBD9D6",
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 12,
    color: "#9A9693",
    fontWeight: "500",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1B1F",
    marginBottom: 12,
  },
  recentList: {
    backgroundColor: "#FEFEFE",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EDECE9",
  },
  recentInfo: {
    flex: 1,
  },
  recentDate: {
    fontSize: 12,
    color: "#9A9693",
    marginBottom: 2,
  },
  recentName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1C1B1F",
  },
  recentStats: {
    fontSize: 13,
    color: "#49454F",
    marginTop: 2,
  },
  recentArrow: {
    fontSize: 18,
    color: "#1976D2",
    marginLeft: 12,
  },
  emptyState: {
    backgroundColor: "#FEFEFE",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#49454F",
  },
  emptyHint: {
    fontSize: 14,
    color: "#9A9693",
    marginTop: 4,
    textAlign: "center",
  },
});
