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
  clearBtn: {
    padding: 8,
  },
  clearBtnText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textTertiary,
    textAlign: "left",
    marginBottom: 12,
  },
  speedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  speedInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  smallInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    width: "100%",
    height: 50,
    fontSize: 18,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
  paceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  paceInput: {
    flex: 1,
  },
  paceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textTertiary,
    marginBottom: 8,
  },
  paceFields: {
    flexDirection: "row",
    gap: 8,
  },
  paceFieldGroup: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    color: colors.textHint,
    marginBottom: 4,
  },
  distanceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  timeInput: {
    width: "48%",
    marginBottom: 16,
  },
  distanceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textTertiary,
    marginBottom: 8,
  },
  timeFields: {
    flexDirection: "row",
    gap: 6,
  },
  timeFieldGroup: {
    flex: 1,
  },
  timeFieldInput: {
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.borderDark,
    width: "100%",
    height: 50,
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
  },
});
