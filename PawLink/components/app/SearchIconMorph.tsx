import React from "react";
import { Pressable } from "react-native";
import Animated, {
  interpolate,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface SearchIconMorphProps {
  size?: number;
  color?: string;
  onToggle?: (isOpening: boolean) => void;
}

export function SearchIconMorph({
  size = 20,
  color = "#333",
  onToggle,
}: SearchIconMorphProps) {
  const progress = useSharedValue(0);

  const handlePress = () => {
    const isOpening = progress.value === 0;

    progress.value = withTiming(isOpening ? 1 : 0, { duration: 350 });

    if (onToggle) onToggle(isOpening);
  };

  // Path morphing (magnifying glass → X)
  const animatedProps = useAnimatedProps(() => {
    const t = progress.value;

    // Interpolated path for both states:
    // Search shape
    const search = "M20 10a10 10 0 1 1-5 18l-6 6-2-2 6-6A10 10 0 0 1 20 10z";
    // X shape
    const close = "M12 12 L28 28 M28 12 L12 28";

    return {
      d: t < 0.5 ? search : close,
      strokeWidth: 3,
    };
  });

  return (
    <Pressable onPress={handlePress}>
      <Svg width={size} height={size} viewBox="0 0 40 40">
        <AnimatedPath
          animatedProps={animatedProps}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}
