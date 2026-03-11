import { StyleSheet } from "react-native";
import { colors } from "./src/theme/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  syncButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    minWidth: 60,
    alignItems: "center",
  },
  syncButtonText: {
    color: colors.primary,
    fontWeight: "600",
  },
  syncStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: colors.primaryLight,
    gap: 8,
  },
  syncStatusText: {
    color: colors.primary,
    fontSize: 14,
  },
  syncError: {
    backgroundColor: "#FFEBEE",
  },
  syncSuccess: {
    backgroundColor: colors.successLight,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
  },
  successText: {
    color: colors.successDark,
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorDetail: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 24,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
  listContent: {
    paddingVertical: 8,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  emptyHint: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textTertiary,
  },
});
