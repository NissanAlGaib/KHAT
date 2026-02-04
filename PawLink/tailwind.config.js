/** @type {import('tailwindcss').Config} */

/**
 * PawLink Tailwind Configuration
 * VERSION 1.1 - Unified Design System
 * 
 * Colors are mapped from constants/colors.ts to ensure consistency
 * between NativeWind classes and StyleSheet styles.
 */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // ============================================
      // COLORS - Mapped from constants/colors.ts
      // ============================================
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: "#FF6B4A",
          light: "#FF9A8B",
          dark: "#E4492E",
        },
        // Coral theme (matches, breeding)
        coral: {
          DEFAULT: "#FF6B6B",
          light: "#F9DCDC",
          border: "#FECACA",
          bg: "#FFF5F5",
        },
        // Semantic colors
        success: {
          DEFAULT: "#22C55E",
          light: "#DCFCE7",
          bg: "#f0fdf4",
        },
        error: {
          DEFAULT: "#EF4444",
          light: "#fef2f2",
          dark: "#DC2626",
        },
        warning: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
          bg: "#fffbeb",
        },
        info: {
          DEFAULT: "#3B82F6",
          light: "#eff6ff",
        },
        // Text colors
        text: {
          primary: "#111111",
          secondary: "#4B5563",
          muted: "#6B7280",
          disabled: "#9CA3AF",
        },
        // Border colors
        border: {
          light: "#E5E7EB",
          medium: "#D1D5DB",
          dark: "#9CA3AF",
        },
        // Background colors
        bg: {
          primary: "#FFFFFF",
          secondary: "#F9FAFB",
          tertiary: "#F3F4F6",
          muted: "#E5E7EB",
        },
      },
      // ============================================
      // FONT FAMILIES
      // ============================================
      fontFamily: {
        baloo: ["Baloo-Regular"],
        mulish: ["Mulish-Regular"],
        "mulish-bold": ["Mulish-Bold"],
        roboto: ["Roboto-Regular"],
        "roboto-condensed": ["RobotoCondensed-Regular"],
        "roboto-condensed-extralight": ["Roboto_Condensed-ExtraLight"],
      },
      // ============================================
      // SPACING SCALE (matches theme.ts)
      // ============================================
      spacing: {
        "4.5": "18px",
        "5.5": "22px",
        "18": "72px",
        "22": "88px",
      },
      // ============================================
      // BORDER RADIUS (matches theme.ts)
      // ============================================
      borderRadius: {
        "2.5xl": "20px",
        "4xl": "32px",
      },
    },
  },
  plugins: [],
};
