/* eslint-disable react-hooks/rules-of-hooks */
// components/app/BubbleBackground.reanimated.tsx
import React, { useMemo } from "react";
import { Dimensions, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from "react-native-reanimated";

const { width: W, height: H } = Dimensions.get("window");
const minSide = Math.min(W, H);

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Bubble = {
  r: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  dur: number;
  delay: number;
};

interface Props {
  backgroundColor?: string;
  bubbleColor?: string;
  bigCount?: number;
  smallCount?: number;
  seed?: number;
  children?: React.ReactNode;
}

export default function BubbleBackgroundRe({
  backgroundColor = "#E85234",
  bubbleColor = "rgba(229,139,120,0.45)",
  bigCount = 5,
  smallCount = 12,
  seed = 12345,
  children,
}: Props) {
  const bubbles: Bubble[] = useMemo(() => {
    const rand = mulberry32(seed);
    const makeBubbles = (count: number, sizeMin: number, sizeMax: number) =>
      Array.from({ length: count }, () => {
        const r = minSide * (sizeMin + rand() * (sizeMax - sizeMin));
        return {
          r,
          x: rand() * W,
          y: rand() * H,
          dx: r * 0.25,
          dy: r * 0.25,
          dur: 3000 + rand() * 2000,
          delay: rand() * 1200,
        };
      });
    return [...makeBubbles(bigCount, 0.12, 0.18), ...makeBubbles(smallCount, 0.04, 0.07)];
  }, [seed, bigCount, smallCount]);

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {bubbles.map((b, i) => {
        const progress = useSharedValue(0);

        // start native loop
        progress.value = withDelay(
          b.delay,
          withRepeat(withTiming(1, { duration: b.dur, easing: Easing.inOut(Easing.quad) }), -1, true)
        );

        const animatedStyle = useAnimatedStyle(() => {
          // simple drifting effect
          const tx = (progress.value - 0.5) * 2 * b.dx;
          const ty = (0.5 - progress.value) * 2 * b.dy;
          return {
            transform: [{ translateX: tx }, { translateY: ty }],
          };
        });

        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                width: b.r * 2,
                height: b.r * 2,
                borderRadius: b.r,
                backgroundColor: bubbleColor,
                left: b.x - b.r,
                top: b.y - b.r,
              },
              animatedStyle,
            ]}
          />
        );
      })}

      {/* Foreground content */}
      {children}
    </View>
  );
}
