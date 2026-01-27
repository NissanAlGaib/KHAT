/**
 * useModalAnimation Hook
 * Reusable modal animation logic with spring physics
 */

import { useRef, useEffect, useCallback } from "react";
import { Animated } from "react-native";

interface UseModalAnimationOptions {
  /** Whether the modal is visible */
  visible: boolean;
  /** Spring tension (default: 50) */
  tension?: number;
  /** Spring friction (default: 7) */
  friction?: number;
  /** Use native driver (default: true) */
  useNativeDriver?: boolean;
  /** Initial scale value (default: 0) */
  initialScale?: number;
  /** Target scale value when visible (default: 1) */
  targetScale?: number;
  /** Callback when animation completes */
  onAnimationComplete?: () => void;
}

interface UseModalAnimationReturn {
  /** Animated scale value for transform */
  scaleAnim: Animated.Value;
  /** Animated opacity value */
  opacityAnim: Animated.Value;
  /** Combined transform style */
  animatedStyle: {
    transform: { scale: Animated.Value }[];
    opacity: Animated.Value;
  };
  /** Manually trigger open animation */
  animateIn: () => void;
  /** Manually trigger close animation */
  animateOut: (callback?: () => void) => void;
}

export function useModalAnimation(
  options: UseModalAnimationOptions
): UseModalAnimationReturn {
  const {
    visible,
    tension = 50,
    friction = 7,
    useNativeDriver = true,
    initialScale = 0,
    targetScale = 1,
    onAnimationComplete,
  } = options;

  const scaleAnim = useRef(new Animated.Value(initialScale)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: targetScale,
        useNativeDriver,
        tension,
        friction,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver,
      }),
    ]).start(({ finished }) => {
      if (finished && onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, [scaleAnim, opacityAnim, targetScale, tension, friction, useNativeDriver, onAnimationComplete]);

  const animateOut = useCallback(
    (callback?: () => void) => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: initialScale,
          duration: 150,
          useNativeDriver,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver,
        }),
      ]).start(({ finished }) => {
        if (finished && callback) {
          callback();
        }
      });
    },
    [scaleAnim, opacityAnim, initialScale, useNativeDriver]
  );

  useEffect(() => {
    if (visible) {
      animateIn();
    } else {
      // Reset values when modal closes
      scaleAnim.setValue(initialScale);
      opacityAnim.setValue(0);
    }
  }, [visible, animateIn, scaleAnim, opacityAnim, initialScale]);

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  return {
    scaleAnim,
    opacityAnim,
    animatedStyle,
    animateIn,
    animateOut,
  };
}

/**
 * Simpler hook that just returns the scale animation
 * For backwards compatibility with existing modals
 */
export function useSimpleModalAnimation(visible: boolean): Animated.Value {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  return scaleAnim;
}

export default useModalAnimation;
