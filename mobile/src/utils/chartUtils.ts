/**
 * Shared chart utilities for data processing and interaction.
 */

export interface ChartDataPoint {
  timestamp: number;
  value: number;
}

/**
 * Apply rolling average to smooth time series data.
 *
 * Reduces noise in raw sensor readings (cadence, GCT, HR) while
 * preserving macro trends. Default 15-point window balances
 * responsiveness vs. smoothness for typical 1-second recording intervals.
 */
export function smoothData(
  data: ChartDataPoint[],
  windowSize: number = 15
): ChartDataPoint[] {
  if (data.length < windowSize) return data;

  const result: ChartDataPoint[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
    const window = data.slice(start, end);
    const avg = window.reduce((sum, p) => sum + p.value, 0) / window.length;
    result.push({ timestamp: data[i].timestamp, value: avg });
  }
  return result;
}

/**
 * Binary search for the nearest data point by timestamp (O(log n)).
 *
 * Used by chart touch handlers to find the closest value during
 * scrubbing. Replaces the original O(n) linear scan which caused
 * visible jank when dragging across datasets with thousands of points.
 * Assumes data is sorted by timestamp ascending (natural FIT order).
 */
export function findNearestByTimestamp<T extends { timestamp: number }>(
  data: T[],
  targetTimestamp: number
): T {
  let low = 0;
  let high = data.length - 1;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (data[mid].timestamp < targetTimestamp) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  if (
    low > 0 &&
    Math.abs(data[low - 1].timestamp - targetTimestamp) <
      Math.abs(data[low].timestamp - targetTimestamp)
  ) {
    return data[low - 1];
  }
  return data[low];
}
