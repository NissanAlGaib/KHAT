import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { Colors, BorderRadius, Spacing } from "@/constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;

interface SkeletonLoaderProps {
  type: "matchCard" | "petCard" | "shooterCard";
}

export default function SkeletonLoader({ type }: SkeletonLoaderProps) {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (type === "matchCard") {
    return (
      <View style={styles.matchCardContainer}>
        <Animated.View style={[styles.matchCardImage, { opacity }]} />
        <View style={styles.matchCardContent}>
          <Animated.View style={[styles.textLine, { width: "60%", height: 24, marginBottom: 8, opacity }]} />
          <Animated.View style={[styles.textLine, { width: "40%", height: 16, marginBottom: 16, opacity }]} />
          <View style={styles.tagsRow}>
            <Animated.View style={[styles.tag, { opacity }]} />
            <Animated.View style={[styles.tag, { opacity }]} />
            <Animated.View style={[styles.tag, { opacity }]} />
          </View>
        </View>
      </View>
    );
  }

  if (type === "petCard") {
    return (
      <View style={styles.petCardContainer}>
        <Animated.View style={[styles.petCardImage, { opacity }]} />
        <View style={styles.petCardContent}>
          <Animated.View style={[styles.textLine, { width: "80%", height: 14, marginBottom: 4, opacity }]} />
          <Animated.View style={[styles.textLine, { width: "50%", height: 10, opacity }]} />
        </View>
      </View>
    );
  }

  if (type === "shooterCard") {
    return (
      <View style={styles.shooterCardContainer}>
        <Animated.View style={[styles.shooterAvatar, { opacity }]} />
        <View style={styles.shooterContent}>
          <Animated.View style={[styles.textLine, { width: "70%", height: 14, marginBottom: 4, opacity }]} />
          <Animated.View style={[styles.textLine, { width: "40%", height: 10, opacity }]} />
        </View>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // Match Card Styles
  matchCardContainer: {
    width: CARD_WIDTH,
    height: 320,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius["2xl"],
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  matchCardImage: {
    width: "100%",
    height: 200,
    backgroundColor: Colors.bgMuted,
  },
  matchCardContent: {
    padding: Spacing.lg,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 8,
  },
  tag: {
    width: 60,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.bgMuted,
  },

  // Pet Card Styles
  petCardContainer: {
    width: 120,
    height: 160,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginRight: 12,
  },
  petCardImage: {
    width: "100%",
    height: 100,
    backgroundColor: Colors.bgMuted,
  },
  petCardContent: {
    padding: 8,
  },

  // Shooter Card Styles
  shooterCardContainer: {
    width: 120,
    height: 160,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginRight: 12,
  },
  shooterAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bgMuted,
    marginBottom: Spacing.sm,
  },
  shooterContent: {
    width: "100%",
    alignItems: "center",
  },

  // Common
  textLine: {
    backgroundColor: Colors.bgMuted,
    borderRadius: 4,
  },
});
