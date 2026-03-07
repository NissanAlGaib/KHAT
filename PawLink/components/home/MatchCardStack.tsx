import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Shadows } from "@/constants";
import MatchCard from "./MatchCard";
import { TopMatch } from "@/services/matchService";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const SWIPE_THRESHOLD = 120;

interface MatchCardStackProps {
  matches: TopMatch[];
  selectedPetId?: number;
  onPass: (match: TopMatch) => void;
  onLike: (match: TopMatch) => void;
  onCardPress: (match: TopMatch) => void;
}

export default function MatchCardStack({
  matches,
  selectedPetId,
  onPass,
  onLike,
  onCardPress,
}: MatchCardStackProps) {
  // Empty state
  if (!matches || matches.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <View style={styles.emptyIconCircle}>
            <Feather name="search" size={40} color={Colors.textDisabled} />
          </View>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptySubtitle}>
            Check back later or update your pet's profile to find more matches
          </Text>
        </View>
      </View>
    );
  }

  const topMatch = matches[0];
  const translateX = useSharedValue(0);

  const handleSwipeComplete = (direction: number) => {
    if (direction > 0) {
      onLike(topMatch);
    } else {
      onPass(topMatch);
    }
    translateX.value = 0;
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(
          direction * 500,
          { duration: 250 },
          () => {
            runOnJS(handleSwipeComplete)(direction);
          },
        );
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        translateX.value = withSpring(0, { damping: 15 });
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      {
        rotate: `${interpolate(
          translateX.value,
          [-250, 0, 250],
          [-12, 0, 12],
        )}deg`,
      },
    ],
  }));

  // Swipe overlay indicators
  const likeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]),
  }));

  const passOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -SWIPE_THRESHOLD], [0, 1]),
  }));

  return (
    <View style={styles.container}>
      {/* Background cards for stack depth */}
      {matches.length > 2 && (
        <View style={[styles.stackCard, styles.stackCard3]} />
      )}
      {matches.length > 1 && (
        <View style={[styles.stackCard, styles.stackCard2]} />
      )}

      {/* Top card */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.topCard, cardAnimatedStyle]}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => onCardPress(topMatch)}
            style={{ flex: 1 }}
          >
            <MatchCard match={topMatch} selectedPetId={selectedPetId} />

            {/* LIKE overlay indicator */}
            <Animated.View
              style={[
                styles.swipeIndicator,
                styles.likeIndicator,
                likeOverlayStyle,
              ]}
            >
              <Text
                style={[styles.swipeIndicatorText, { color: Colors.success }]}
              >
                LIKE
              </Text>
            </Animated.View>

            {/* PASS overlay indicator */}
            <Animated.View
              style={[
                styles.swipeIndicator,
                styles.passIndicator,
                passOverlayStyle,
              ]}
            >
              <Text
                style={[styles.swipeIndicatorText, { color: Colors.error }]}
              >
                PASS
              </Text>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bgSecondary,
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderStyle: "dashed",
  },
  emptyContent: {
    alignItems: "center",
    padding: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  stackCard: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  stackCard3: {
    top: 12,
    left: 20,
    right: 20,
    opacity: 0.4,
    transform: [{ scale: 0.92 }],
  },
  stackCard2: {
    top: 6,
    left: 10,
    right: 10,
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  topCard: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  swipeIndicator: {
    position: "absolute",
    top: 60,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 3,
  },
  likeIndicator: {
    right: 24,
    borderColor: Colors.success,
    transform: [{ rotate: "-15deg" }],
  },
  passIndicator: {
    left: 24,
    borderColor: Colors.error,
    transform: [{ rotate: "15deg" }],
  },
  swipeIndicatorText: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
