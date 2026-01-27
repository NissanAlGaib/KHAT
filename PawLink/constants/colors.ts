/**
 * PawLink Color Constants
 * Centralized color palette for the application
 * 
 * VERSION 1.1 - Unified Design System
 * All components MUST use these colors instead of hardcoded hex values.
 */

export const Colors = {
  // ============================================
  // PRIMARY BRAND COLORS
  // ============================================
  // Use `primary` for all main action buttons, links, and brand elements
  primary: "#FF6B4A",
  primaryLight: "#FF9A8B",
  primaryDark: "#E4492E",
  
  // ============================================
  // SEMANTIC COLORS
  // ============================================
  // Use these for status indicators, alerts, and feedback
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
  // Text colors
  textPrimary: "#111111",      // Main headings, important text
  textSecondary: "#4B5563",    // Subheadings, secondary text (gray-700)
  textMuted: "#6B7280",        // Muted text, placeholders (gray-600)
  textDisabled: "#9CA3AF",     // Disabled text (gray-400)
  
  // Border colors
  borderLight: "#E5E7EB",      // Light borders (gray-200)
  borderMedium: "#D1D5DB",     // Medium borders (gray-300)
  borderDark: "#9CA3AF",       // Dark borders (gray-400)
  
  // Background colors
  bgPrimary: "#FFFFFF",        // Main background
  bgSecondary: "#F9FAFB",      // Secondary background (gray-50)
  bgTertiary: "#F3F4F6",       // Tertiary background (gray-100)
  bgMuted: "#E5E7EB",          // Muted background (gray-200)
  
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
