import { StyleSheet } from "react-native";
import { colors } from "../../../theme/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.textTertiary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  chartHint: {
    fontSize: 12,
    color: colors.textHint,
    marginBottom: 8,
    marginTop: -8,
  },
  zoneLabel: {
    fontSize: 11,
    color: colors.textHint,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 12,
  },
});
