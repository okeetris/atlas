/**
 * Coaching Tab
 *
 * Shows what went well, areas to address, and focus cue.
 */

import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useActivity } from "../../../src/contexts/ActivityContext";

function WentWellItem({ text }: { text: string }) {
  return (
    <View style={styles.coachingItem}>
      <Text style={styles.checkIcon}>✓</Text>
      <Text style={styles.coachingText}>{text}</Text>
    </View>
  );
}

function AreaToAddressItem({ text }: { text: string }) {
  return (
    <View style={styles.coachingItem}>
      <Text style={styles.attentionIcon}>!</Text>
      <Text style={styles.coachingText}>{text}</Text>
    </View>
  );
}

export default function CoachingTab() {
  const { activity } = useActivity();

  if (!activity) return null;

  const { coaching } = activity;
  const hasContent =
    coaching.whatWentWell.length > 0 ||
    coaching.areasToAddress.length > 0 ||
    coaching.focusCue;

  if (!hasContent) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No coaching insights available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* What Went Well */}
      {coaching.whatWentWell.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>What Went Well</Text>
          <View style={styles.card}>
            {coaching.whatWentWell.map((item, index) => (
              <WentWellItem key={index} text={item} />
            ))}
          </View>
        </>
      )}

      {/* Areas to Address */}
      {coaching.areasToAddress.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Areas to Address</Text>
          <View style={styles.card}>
            {coaching.areasToAddress.map((item, index) => (
              <AreaToAddressItem key={index} text={item} />
            ))}
          </View>
        </>
      )}

      {/* Focus Cue */}
      {coaching.focusCue && (
        <>
          <Text style={styles.sectionTitle}>Focus Cue</Text>
          <View style={styles.focusCard}>
            <Text style={styles.focusIcon}>🎯</Text>
            <Text style={styles.focusCue}>{coaching.focusCue}</Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
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
    color: "#757575",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1B1F",
    marginBottom: 12,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  coachingItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  checkIcon: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
    marginRight: 12,
    width: 20,
  },
  attentionIcon: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF9800",
    marginRight: 12,
    width: 20,
    textAlign: "center",
  },
  coachingText: {
    flex: 1,
    fontSize: 14,
    color: "#49454F",
    lineHeight: 20,
  },
  focusCard: {
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  focusIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  focusCue: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#1565C0",
    lineHeight: 24,
  },
});
