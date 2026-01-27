import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Shadows, Spacing, BorderRadius } from "@/constants";
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
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 400;
const SWIPE_THRESHOLD = 100;

interface MatchCardStackProps {
  matches: TopMatch[];
  selectedPetId?: number;
  onPass: (match: TopMatch) => void;
  onLike: (match: TopMatch) => void;
  onMessage: (match: TopMatch) => void;
  onCardPress: (match: TopMatch) => void;
}

export default function MatchCardStack({
  matches,
  selectedPetId,
  onPass,
  onLike,
  onMessage,
  onCardPress,
}: MatchCardStackProps) {
  // If no matches, show empty state
  if (!matches || matches.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Text style={styles.emptyEmoji}>🐕💔🐕</Text>
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptySubtitle}>
            Check back later or update your preferences
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
        translateX.value = withTiming(direction * 500, { duration: 200 }, () => {
          runOnJS(handleSwipeComplete)(direction);
        });
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        translateX.value = withSpring(0);
      }
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { rotate: `${interpolate(translateX.value, [-200, 0, 200], [-15, 0, 15])}deg` },
    ],
  }));

  const handlePassPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    translateX.value = withTiming(-500, { duration: 200 }, () => {
      runOnJS(handleSwipeComplete)(-1);
    });
  };

  const handleLikePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    translateX.value = withTiming(500, { duration: 200 }, () => {
      runOnJS(handleSwipeComplete)(1);
    });
  };

  const handleMessagePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onMessage(topMatch);
  };

  return (
    <View style={styles.container}>
      {/* Warm Gradient Background Area */}
      <LinearGradient
        colors={[Colors.bgCoral, Colors.bgCoralLight]}
        style={styles.gradientBackground}
      />

      {/* Card Stack */}
      <View style={styles.stackContainer}>
        {/* Background Card 2 (Smallest) */}
        <View style={[styles.cardBack, styles.cardBack2]} />
        
        {/* Background Card 1 (Middle) */}
        <View style={[styles.cardBack, styles.cardBack1]} />
        
        {/* Top Card (Active) */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.cardFront, cardAnimatedStyle]}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => onCardPress(topMatch)}
              style={{ flex: 1 }}
            >
              <MatchCard match={topMatch} selectedPetId={selectedPetId} />
            </TouchableOpacity>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        {/* Pass Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={handlePassPress}
        >
          <Feather name="x" size={32} color={Colors.textSecondary} />
        </TouchableOpacity>

        {/* Message Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={handleMessagePress}
        >
          <Feather name="message-circle" size={24} color={Colors.white} />
        </TouchableOpacity>

        {/* Like Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={handleLikePress}
        >
          <Feather name="check" size={32} color={Colors.success} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: Spacing.xl,
    position: "relative",
  },
  gradientBackground: {
    position: "absolute",
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 40,
    opacity: 0.5,
    zIndex: -1,
  },
  emptyContainer: {
    height: 400,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bgSecondary,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderStyle: "dashed",
  },
  emptyContent: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  stackContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: "relative",
    marginBottom: Spacing.xl,
  },
  cardBack: {
    position: "absolute",
    backgroundColor: Colors.matchCardBg, // Warm tint
    borderRadius: BorderRadius["2xl"],
    borderWidth: 1,
    borderColor: Colors.matchCardBorder,
    ...Shadows.sm,
  },
  cardBack2: {
    top: 16,
    left: 24,
    right: 24,
    bottom: -16,
    opacity: 0.5,
    transform: [{ scale: 0.9 }],
    zIndex: 1,
  },
  cardBack1: {
    top: 8,
    left: 12,
    right: 12,
    bottom: -8,
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
    zIndex: 2,
  },
  cardFront: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    marginTop: Spacing.md,
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    ...Shadows.lg,
  },
  passButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.coralBorder, // Subtle coral border
  },
  messageButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    // Removed translateY
  },
  likeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: Colors.successLight,
    backgroundColor: Colors.successBg,
  },
});
