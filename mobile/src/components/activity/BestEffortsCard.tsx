import { View, Text } from "react-native";
import type { BestEffort } from "../../types";
import { styles } from "./BestEffortsCard.styles";

interface BestEffortsCardProps {
  efforts: BestEffort[];
}

function formatTime(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatPace(secPerKm: number): string {
  if (!secPerKm || secPerKm === 0) return "--:--";
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.floor(secPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}/km`;
}

export function BestEffortsCard({ efforts }: BestEffortsCardProps) {
  if (efforts.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.distanceCol]}>Distance</Text>
        <Text style={[styles.headerCell, styles.timeCol]}>Time</Text>
        <Text style={[styles.headerCell, styles.paceCol]}>Pace</Text>
      </View>

      {/* Data rows */}
      {efforts.map((effort, index) => (
        <View
          key={effort.name}
          style={[styles.dataRow, index < efforts.length - 1 && styles.dataRowBorder]}
        >
          <Text style={[styles.distanceName, styles.distanceCol]}>{effort.name}</Text>
          <Text style={[styles.timeValue, styles.timeCol]}>{formatTime(effort.elapsedTimeSec)}</Text>
          <Text style={[styles.paceValue, styles.paceCol]}>{formatPace(effort.avgPaceSecKm)}</Text>
        </View>
      ))}
    </View>
  );
}
