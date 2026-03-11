import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 8,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#DBD9D6",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    color: "#736F6C",
    fontWeight: "500",
  },
  tabLabelFocused: {
    color: "#1976D2",
    fontWeight: "600",
  },
});
