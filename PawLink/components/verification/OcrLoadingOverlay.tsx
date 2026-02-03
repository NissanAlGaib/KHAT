import React, { useEffect, useRef } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { Feather } from "@expo/vector-icons";

interface OcrLoadingOverlayProps {
  visible: boolean;
  progress?: number;
  message?: string;
}

export default function OcrLoadingOverlay({
  visible,
  progress = 0,
  message = "Scanning document...",
}: OcrLoadingOverlayProps) {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // Scan line animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, scanLineAnim, pulseAnim, fadeAnim]);

  if (!visible) return null;

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 180],
  });

  return (
    <Animated.View
      className="absolute inset-0 bg-black/70 items-center justify-center z-50"
      style={{ opacity: fadeAnim }}
    >
      {/* Main Card */}
      <View className="bg-white rounded-3xl p-8 mx-6 items-center shadow-2xl max-w-sm w-full">
        {/* AI Icon with Pulse */}
        <Animated.View
          style={{ transform: [{ scale: pulseAnim }] }}
          className="w-20 h-20 rounded-full bg-[#FF6B4A]/10 items-center justify-center mb-6"
        >
          <View className="w-14 h-14 rounded-full bg-[#FF6B4A]/20 items-center justify-center">
            <Feather name="cpu" size={28} color="#FF6B4A" />
          </View>
        </Animated.View>

        {/* Title */}
        <Text className="text-xl font-bold text-gray-900 text-center">
          AI Processing
        </Text>

        {/* Message */}
        <Text className="text-base text-gray-500 text-center mt-2 mb-6">
          {message}
        </Text>

        {/* Progress Bar */}
        <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
          <View
            className="h-full bg-[#FF6B4A] rounded-full"
            style={{ width: `${Math.max(progress, 10)}%` }}
          />
        </View>

        {/* Progress Percentage */}
        <Text className="text-sm font-medium text-gray-600">
          {Math.round(progress)}% Complete
        </Text>

        {/* Scan Animation Visual */}
        <View className="mt-6 w-full h-[180px] bg-gray-100 rounded-2xl overflow-hidden relative">
          {/* Placeholder ID shape */}
          <View className="absolute inset-4 border-2 border-dashed border-gray-300 rounded-xl" />
          <View className="absolute top-8 left-8 right-8 h-3 bg-gray-200 rounded" />
          <View className="absolute top-14 left-8 w-1/2 h-3 bg-gray-200 rounded" />
          <View className="absolute top-20 left-8 w-2/3 h-3 bg-gray-200 rounded" />
          <View className="absolute bottom-8 right-8 w-16 h-16 bg-gray-200 rounded-lg" />

          {/* Scan Line */}
          <Animated.View
            className="absolute left-0 right-0 h-1 bg-[#FF6B4A]"
            style={{
              transform: [{ translateY: scanLineTranslate }],
              shadowColor: "#FF6B4A",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 10,
            }}
          />
        </View>

        {/* Tips */}
        <View className="flex-row items-center mt-6 px-4">
          <Feather name="info" size={14} color="#9CA3AF" />
          <Text className="text-xs text-gray-400 ml-2 flex-1">
            Make sure your ID is clearly visible and well-lit
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}
