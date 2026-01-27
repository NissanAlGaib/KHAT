/**
 * PawLink Color Constants
 * Centralized color palette for the application
 */

export const Colors = {
  // Primary Brand Colors
  primary: "#FF6B4A",
  primaryLight: "#FF9A8B",
  primaryDark: "#E4492E",

  // Coral/Red Theme (used in matches, alerts)
  coral: "#FF6B6B",
  coralLight: "#F9DCDC",
  coralBorder: "#FECACA",

  // Semantic Colors
  success: "#22C55E",
  successLight: "#DCFCE7",
  error: "#EF4444",
  errorDark: "#DC2626",
  errorDarker: "#B91C1C",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",

  // Gray Scale
  grayDark: "#333333",
  gray700: "#4B5563",
  gray600: "#6B7280",
  gray500: "#777777",
  gray400: "#888888",
  gray300: "#F3F4F6",
  grayLight: "#F3E5E5",

  // UI Colors
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0,0,0,0.5)",
  overlayLight: "rgba(0,0,0,0.2)",

  // Shadows (for StyleSheet)
  shadowPrimary: "#000000",
  shadowRed: "#EF4444",

  // Button Colors
  buttonOrange: "#ea5b3a",
} as const;

// Gradient presets
export const Gradients = {
  primary: ["#FF9A8B", "#FF6B4A"] as const,
  header: ["#FF6B4A", "#FF9A8B"] as const,
  sunset: ["#FF9A8B", "#FF6B6B", "#FF6B4A"] as const,
} as const;

// Date format constants
export const DateFormats = {
  API: "YYYY-MM-DD",
  DISPLAY: "MMM DD, YYYY",
  DISPLAY_LONG: "MMMM DD, YYYY",
  DISPLAY_SHORT: "MM/DD/YYYY",
  TIMESTAMP: "YYYY-MM-DD HH:mm:ss",
} as const;

export type ColorKey = keyof typeof Colors;
export type GradientKey = keyof typeof Gradients;
