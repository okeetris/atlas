/**
 * Shared chart utilities for data processing and interaction.
 */

export interface ChartDataPoint {
  timestamp: number;
  value: number;
}

/** Apply rolling average to smooth time series data. */
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

/** Binary search for nearest data point by timestamp. Assumes sorted data. */
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
