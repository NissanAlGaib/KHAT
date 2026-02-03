import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Animated,
  TextInputProps,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface AutoFilledInputProps extends Omit<TextInputProps, "value" | "onChangeText"> {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  isAutoFilled?: boolean;
  error?: string;
  required?: boolean;
  leftIcon?: keyof typeof Feather.glyphMap;
}

export default function AutoFilledInput({
  label,
  value,
  onChangeText,
  isAutoFilled = false,
  error,
  required = false,
  leftIcon,
  placeholder,
  ...textInputProps
}: AutoFilledInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const highlightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAutoFilled) {
      Animated.sequence([
        Animated.timing(highlightAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.delay(2000),
        Animated.timing(highlightAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isAutoFilled, highlightAnim]);

  const backgroundColor = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#FFFFFF", "#FFF7ED"],
  });

  const borderColor = error
    ? "#EF4444"
    : isFocused
    ? "#FF6B4A"
    : isAutoFilled
    ? "#FF6B4A"
    : "#E5E7EB";

  return (
    <View className="mb-4">
      {/* Label above input */}
      <Text className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>

      <Animated.View
        style={{ 
          backgroundColor, 
          borderColor, 
          borderWidth: 2, 
          borderRadius: 16 
        }}
      >
        <View className="flex-row items-center">
          {/* Left Icon */}
          {leftIcon && (
            <View className="pl-4">
              <Feather
                name={leftIcon}
                size={18}
                color={isFocused ? "#FF6B4A" : "#9CA3AF"}
              />
            </View>
          )}

          {/* Input Container */}
          <View className="flex-1 px-4 py-3">
            <TextInput
              value={value}
              onChangeText={onChangeText}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="text-base text-gray-900"
              placeholder={placeholder}
              placeholderTextColor="#9CA3AF"
              {...textInputProps}
            />
          </View>

          {/* Auto-filled Badge */}
          {isAutoFilled && value && (
            <View className="pr-4">
              <View className="flex-row items-center bg-[#FF6B4A]/10 px-2 py-1 rounded-full">
                <Feather name="zap" size={12} color="#FF6B4A" />
                <Text className="text-xs font-medium text-[#FF6B4A] ml-1">
                  AI
                </Text>
              </View>
            </View>
          )}

          {/* Valid Checkmark */}
          {!isAutoFilled && value && !error && (
            <View className="pr-4">
              <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center">
                <Feather name="check" size={14} color="#22C55E" />
              </View>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Error Message */}
      {error && (
        <View className="flex-row items-center mt-2 px-2">
          <Feather name="alert-circle" size={14} color="#EF4444" />
          <Text className="text-sm text-red-500 ml-1">{error}</Text>
        </View>
      )}
    </View>
  );
}
