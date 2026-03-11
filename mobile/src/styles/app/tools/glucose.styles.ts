import { StyleSheet } from "react-native";
import { colors } from "../../../theme/colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDark,
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: colors.primary,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  infoCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryLightBorder,
  },
  infoText: {
    fontSize: 14,
    color: colors.primaryDark,
    textAlign: "center",
  },
  converterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderDark,
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: "600",
    color: colors.primary,
    textAlign: "center",
  },
  equalsSign: {
    fontSize: 28,
    color: colors.textHint,
    fontWeight: "300",
    marginTop: 20,
  },
  clearButton: {
    backgroundColor: "#F3F2EF",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 32,
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },
});
