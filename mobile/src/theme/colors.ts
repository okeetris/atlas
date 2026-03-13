export const colors = {
  // Primary
  primary: "#1976D2",
  primaryDark: "#1565C0",
  primaryLight: "#E3F2FD",
  primaryLightBorder: "#90CAF9",

  // Text
  textPrimary: "#1C1B1F",
  textSecondary: "#49454F",
  textTertiary: "#736F6C",
  textHint: "#9A9693",

  // Surfaces
  background: "#F8F7F4",
  card: "#FEFEFE",
  white: "#FFFFFF",

  // Borders & Dividers
  border: "#EDECE9",
  borderDark: "#DBD9D6",

  // Grades
  gradeA: "#4CAF50",
  gradeB: "#8BC34A",
  gradeC: "#FFC107",
  gradeD: "#F44336",

  // Status
  success: "#4CAF50",
  successDark: "#388E3C",
  successLight: "#E8F5E9",
  warning: "#FFC107",
  warningDark: "#FFB300",
  warningLight: "#FFF3E0",
  error: "#D32F2F",
  errorLight: "#F44336",

  // HR Zones
  zone1: "#90CAF9",
  zone2: "#81C784",
  zone3: "#FFF176",
  zone4: "#FFB74D",
  zone5: "#E57373",

  // Chart
  cadence: "#1976D2",
  gct: "#F57C00",
  heartRate: "#E53935",
  glucose: "#AB47BC",

  // Placeholder
  placeholder: "#BDBDBD",
  placeholderDark: "#666666",

  // Pace Zones
  threshold: "#FF9800",
  sprint: "#9C27B0",

  // Shadows
  shadow: "#000000",
} as const;

export type ColorToken = keyof typeof colors;
