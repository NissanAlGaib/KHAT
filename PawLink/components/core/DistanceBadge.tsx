import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/colors";

interface DistanceBadgeProps {
  distanceLabel: string | null | undefined;
  /** "overlay" renders on images (semi-transparent bg), "inline" for text rows */
  variant?: "overlay" | "inline";
  size?: "sm" | "md";
}

export default function DistanceBadge({
  distanceLabel,
  variant = "inline",
  size = "sm",
}: DistanceBadgeProps) {
  if (!distanceLabel) return null;

  const iconSize = size === "sm" ? 10 : 12;
  const fontSize = size === "sm" ? 10 : 12;

  if (variant === "overlay") {
    return (
      <View style={styles.overlayBadge}>
        <Feather name="map-pin" size={iconSize} color={Colors.white} />
        <Text style={[styles.overlayText, { fontSize }]}>{distanceLabel}</Text>
      </View>
    );
  }

  return (
    <View style={styles.inlineBadge}>
      <Feather name="map-pin" size={iconSize} color={Colors.textMuted} />
      <Text style={[styles.inlineText, { fontSize }]}>{distanceLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  overlayText: {
    color: Colors.white,
    fontWeight: "500",
  },
  inlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  inlineText: {
    color: Colors.textMuted,
  },
});
