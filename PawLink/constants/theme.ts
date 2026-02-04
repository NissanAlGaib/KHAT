/**
 * PawLink Theme Constants
 * Unified design system for spacing, border radius, typography, and shadows
 * 
 * VERSION 1.1 - Design System Foundation
 */

import { Colors } from "./colors";

// ============================================
// SPACING SCALE (8px base)
// ============================================
export const Spacing = {
  /** 0px */
  none: 0,
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  "2xl": 24,
  /** 32px */
  "3xl": 32,
  /** 40px */
  "4xl": 40,
  /** 48px */
  "5xl": 48,
  /** 64px */
  "6xl": 64,
} as const;

// ============================================
// BORDER RADIUS SCALE
// ============================================
export const BorderRadius = {
  /** 0px */
  none: 0,
  /** 4px - Subtle rounding */
  sm: 4,
  /** 8px - Default for small elements */
  md: 8,
  /** 12px - Cards, inputs */
  lg: 12,
  /** 16px - Larger cards */
  xl: 16,
  /** 20px - Modals */
  "2xl": 20,
  /** 24px - Large modals */
  "3xl": 24,
  /** 9999px - Pills, full round */
  full: 9999,
} as const;

// ============================================
// FONT SIZES
// ============================================
export const FontSize = {
  /** 10px */
  xs: 10,
  /** 12px */
  sm: 12,
  /** 14px */
  base: 14,
  /** 16px */
  md: 16,
  /** 18px */
  lg: 18,
  /** 20px */
  xl: 20,
  /** 24px */
  "2xl": 24,
  /** 30px */
  "3xl": 30,
  /** 36px */
  "4xl": 36,
} as const;

// ============================================
// FONT FAMILIES (matching Tailwind config)
// ============================================
export const FontFamily = {
  baloo: "Baloo-Regular",
  mulish: "Mulish-Regular",
  mulishBold: "Mulish-Bold",
  roboto: "Roboto-Regular",
  robotoCondensed: "RobotoCondensed-Regular",
  robotoCondensedLight: "Roboto_Condensed-ExtraLight",
} as const;

// ============================================
// SHADOWS (React Native StyleSheet format)
// ============================================
export const Shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  xl: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
} as const;

// ============================================
// BUTTON VARIANTS
// ============================================
export const ButtonVariants = {
  primary: {
    backgroundColor: Colors.primary,
    textColor: Colors.white,
  },
  secondary: {
    backgroundColor: Colors.bgTertiary,
    textColor: Colors.textSecondary,
  },
  success: {
    backgroundColor: Colors.success,
    textColor: Colors.white,
  },
  danger: {
    backgroundColor: Colors.error,
    textColor: Colors.white,
  },
  outline: {
    backgroundColor: Colors.transparent,
    textColor: Colors.primary,
    borderColor: Colors.primary,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: Colors.transparent,
    textColor: Colors.primary,
  },
} as const;

// ============================================
// ALERT STYLE VARIANTS
// ============================================
export const AlertStyles = {
  success: {
    iconColor: Colors.success,
    bgColor: Colors.successBg,
    borderColor: Colors.success,
  },
  error: {
    iconColor: Colors.error,
    bgColor: Colors.errorLight,
    borderColor: Colors.error,
  },
  warning: {
    iconColor: Colors.warning,
    bgColor: Colors.warningBg,
    borderColor: Colors.warning,
  },
  info: {
    iconColor: Colors.info,
    bgColor: Colors.infoLight,
    borderColor: Colors.info,
  },
} as const;

// ============================================
// INPUT VARIANTS
// ============================================
export const InputVariants = {
  contained: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.lg,
    borderWidth: 0,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  outlined: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderMedium,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  underline: {
    backgroundColor: Colors.transparent,
    borderRadius: 0,
    borderBottomWidth: 1,
    borderColor: Colors.borderMedium,
    paddingHorizontal: 0,
    paddingVertical: Spacing.md,
  },
} as const;

// ============================================
// MODAL PRESETS
// ============================================
export const ModalPresets = {
  overlay: Colors.overlay,
  borderRadius: BorderRadius["2xl"],
  containerBg: Colors.bgPrimary,
  maxWidth: "90%",
  maxHeight: "80%",
} as const;

// ============================================
// SCREEN PRESETS
// ============================================
export const ScreenPresets = {
  paddingHorizontal: Spacing.xl,
  paddingVertical: Spacing.lg,
} as const;

// Type exports
export type SpacingKey = keyof typeof Spacing;
export type BorderRadiusKey = keyof typeof BorderRadius;
export type FontSizeKey = keyof typeof FontSize;
export type ShadowKey = keyof typeof Shadows;
export type ButtonVariantKey = keyof typeof ButtonVariants;
export type AlertStyleKey = keyof typeof AlertStyles;
