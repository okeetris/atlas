/**
 * Heart Rate Zones Card
 *
 * Displays time spent in each HR zone as a stacked bar with breakdown.
 */

import { View, Text } from "react-native";
import type { HRZone } from "../../utils/hrZones";
import { formatZoneTime } from "../../utils/hrZones";
import { styles } from "./HRZonesCard.styles";

interface HRZonesCardProps {
  zones: HRZone[];
  avgHR?: number;
}

export function HRZonesCard({ zones, avgHR }: HRZonesCardProps) {
  // Filter out zones with 0 time for the bar
  const activeZones = zones.filter((z) => z.percentage > 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Heart Rate Zones</Text>
        {avgHR && <Text style={styles.avgHR}>Avg {Math.round(avgHR)} bpm</Text>}
      </View>

      {/* Stacked bar */}
      <View style={styles.barContainer}>
        {activeZones.map((zone) => (
          <View
            key={zone.zone}
            style={[
              styles.barSegment,
              {
                backgroundColor: zone.color,
                flex: zone.percentage,
              },
            ]}
          >
            {zone.percentage >= 10 && (
              <Text style={styles.barLabel}>Z{zone.zone}</Text>
            )}
          </View>
        ))}
      </View>

      {/* Zone breakdown */}
      <View style={styles.breakdown}>
        {zones.map((zone) => (
          <View key={zone.zone} style={styles.zoneRow}>
            <View style={styles.zoneInfo}>
              <View style={[styles.zoneDot, { backgroundColor: zone.color }]} />
              <View>
                <Text style={styles.zoneName}>
                  Z{zone.zone} {zone.name}
                </Text>
                <Text style={styles.zoneRange}>
                  {zone.maxHR ? `${zone.minHR}-${zone.maxHR}` : `>${zone.minHR}`} bpm
                </Text>
              </View>
            </View>
            <View style={styles.zoneStats}>
              <Text style={styles.zoneTime}>{formatZoneTime(zone.seconds)}</Text>
              <Text style={styles.zonePct}>{zone.percentage}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
