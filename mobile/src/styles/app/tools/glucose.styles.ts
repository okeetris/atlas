import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#DBD9D6",
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: "#1976D2",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1B1F",
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
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 3,
    borderLeftColor: "#90CAF9",
  },
  infoText: {
    fontSize: 14,
    color: "#1565C0",
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
    color: "#1C1B1F",
    marginBottom: 8,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#FEFEFE",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#DBD9D6",
    paddingHorizontal: 12,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: "600",
    color: "#1976D2",
    textAlign: "center",
  },
  equalsSign: {
    fontSize: 28,
    color: "#9A9693",
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
    color: "#49454F",
    textAlign: "center",
  },
});
