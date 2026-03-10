/**
 * PawLink Color Constants
 * Centralized color palette for the application
 *
 * VERSION 2.0 - Clean Neutral Design System
 * All components MUST use these colors instead of hardcoded hex values.
 */

export const Colors = {
  // ============================================
  // PRIMARY BRAND COLORS
  // ============================================
  primary: "#FF6B4A",
  primaryLight: "#FF9A8B",
  primaryDark: "#E4492E",

  // ============================================
  // SEMANTIC COLORS
  // ============================================
  success: "#22C55E",
  successLight: "#DCFCE7",
  successBg: "#f0fdf4",

  error: "#EF4444",
  errorLight: "#fef2f2",
  errorDark: "#DC2626",

  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  warningBg: "#fffbeb",

  info: "#3B82F6",
  infoLight: "#eff6ff",

  // ============================================
  // GRAY SCALE (Unified)
  // ============================================
  textPrimary: "#111111",
  textSecondary: "#4B5563",
  textMuted: "#6B7280",
  textDisabled: "#9CA3AF",

  borderLight: "#E5E7EB",
  borderMedium: "#D1D5DB",
  borderDark: "#9CA3AF",

  bgPrimary: "#FFFFFF",
  bgSecondary: "#F9FAFB",
  bgTertiary: "#F3F4F6",
  bgMuted: "#E5E7EB",
  bgWarm: "#FFF8F6",
  bgWarmSecondary: "#FFF5F3",
  coralSubtle: "#FFF1EF",

  // ============================================
  // APP BACKGROUND (v2 neutral base)
  // ============================================
  bgApp: "#FAFAFA",
  cardBg: "#FFFFFF",
  cardBorder: "#F0F0F0",

  // ============================================
  // SEX BADGE COLORS (unified across all components)
  // ============================================
  femaleBg: "#FFE4E6",
  femaleTxt: "#BE123C",
  maleBg: "#E0F2FE",
  maleTxt: "#0284C7",

  // ============================================
  // LEGACY CORAL BACKGROUNDS (deprecated — use bgApp/cardBg)
  // ============================================
  /** @deprecated Use bgApp instead */
  bgCoral: "#FFE0D8",
  /** @deprecated Use bgWarmSecondary instead */
  bgCoralLight: "#FFF5F3",
  /** @deprecated Use cardBg instead */
  matchCardBg: "#F9DCDC",
  /** @deprecated Use cardBorder instead */
  matchCardBorder: "#FECACA",

  coralVibrant: "#FF6B4A",
  coralDark: "#DC2626",

  // Legacy gray mappings (for backwards compatibility)
  grayDark: "#333333",
  gray700: "#4B5563",
  gray600: "#6B7280",
  gray500: "#777777",
  gray400: "#9CA3AF",
  gray300: "#D1D5DB",
  gray200: "#E5E7EB",
  gray100: "#F3F4F6",
  gray50: "#F9FAFB",

  // ============================================
  // SPECIAL PURPOSE COLORS
  // ============================================
  // Coral theme (matches, breeding)
  coral: "#FF6B6B",
  coralLight: "#F9DCDC",
  coralBorder: "#FECACA",
  coralBg: "#FFF5F5",

  // UI Colors
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",

  // Overlay colors
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayLight: "rgba(0, 0, 0, 0.3)",
  overlayDark: "rgba(0, 0, 0, 0.7)",

  // Shadow colors (for StyleSheet)
  shadow: "#000000",
  shadowRed: "#EF4444",

  // ============================================
  // TAB BAR COLORS (v2 white bar)
  // ============================================
  tabBarBg: "#FFFFFF",
  tabBarActive: "#FF6B4A",
  tabBarInactive: "#9CA3AF",
  tabBarBadgeBg: "#FF6B4A",
  tabBarBadgeText: "#FFFFFF",
} as const;

// ============================================
// GRADIENT PRESETS
// ============================================
export const Gradients = {
  primary: ["#FF9A8B", "#FF6B4A"] as const,
  header: ["#FF6B4A", "#FF9A8B"] as const,
  sunset: ["#FF9A8B", "#FF6B6B", "#FF6B4A"] as const,
  coral: ["#FF6B6B", "#FF6B4A"] as const,
} as const;

// ============================================
// DATE FORMATS
// ============================================
export const DateFormats = {
  API: "YYYY-MM-DD",
  DISPLAY: "MMM DD, YYYY",
  DISPLAY_LONG: "MMMM DD, YYYY",
  DISPLAY_SHORT: "MM/DD/YYYY",
  TIMESTAMP: "YYYY-MM-DD HH:mm:ss",
  TIME: "HH:mm",
  TIME_12H: "h:mm A",
} as const;

// Type exports
export type ColorKey = keyof typeof Colors;
export type GradientKey = keyof typeof Gradients;
export type DateFormatKey = keyof typeof DateFormats;
