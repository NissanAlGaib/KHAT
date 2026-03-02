import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Shadows } from "@/constants";
import * as Haptics from "expo-haptics";

interface ActionBarProps {
  onPass: () => void;
  onLike: () => void;
  disabled?: boolean;
}

/**
 * ActionBar v4 — Half-circle buttons that overlap the card edges.
 * Absolutely positioned by the parent; Pass on left edge, Like on right edge.
 * Each button is a semicircle (flat side facing outward, rounded side on the card).
 */
export function SidePassButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.halfButton,
        styles.passButton,
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Feather name="x" size={22} color={Colors.error} />
    </TouchableOpacity>
  );
}

export function SideLikeButton({
  onPress,
  disabled,
}: {
  onPress: () => void;
  disabled?: boolean;
}) {
  const handlePress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.halfButton,
        styles.likeButton,
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Feather name="heart" size={20} color={Colors.white} />
    </TouchableOpacity>
  );
}

/**
 * @deprecated Use SidePassButton and SideLikeButton directly.
 */
export default function ActionBar({
  onPass,
  onLike,
  disabled,
}: ActionBarProps) {
  return (
    <View style={styles.overlayWrapper} pointerEvents="box-none">
      <SidePassButton onPress={onPass} disabled={disabled} />
      <SideLikeButton onPress={onLike} disabled={disabled} />
    </View>
  );
}

const BUTTON_HEIGHT = 56;
const BUTTON_WIDTH = 32; // half-circle: only this much peeks onto the card

const styles = StyleSheet.create({
  overlayWrapper: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    pointerEvents: "box-none",
  },
  halfButton: {
    position: "absolute",
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    ...Shadows.md,
    elevation: 10,
  },
  passButton: {
    left: 0,
    top: "45%",
    backgroundColor: Colors.white,
    borderTopRightRadius: BUTTON_HEIGHT / 2,
    borderBottomRightRadius: BUTTON_HEIGHT / 2,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderWidth: 1.5,
    borderLeftWidth: 0,
    borderColor: Colors.borderLight,
  },
  likeButton: {
    right: 0,
    top: "45%",
    backgroundColor: Colors.primary,
    borderTopLeftRadius: BUTTON_HEIGHT / 2,
    borderBottomLeftRadius: BUTTON_HEIGHT / 2,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  disabled: {
    opacity: 0.4,
  },
});
