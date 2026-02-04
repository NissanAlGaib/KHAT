import React, { useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";

interface Step {
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

interface StepperProgressProps {
  currentStep: number;
  steps?: Step[];
}

const DEFAULT_STEPS: Step[] = [
  { label: "ID Verification", icon: "credit-card" },
  { label: "Breeder License", icon: "award" },
  { label: "Shooter Certificate", icon: "file-text" },
];

export default function StepperProgress({
  currentStep,
  steps = DEFAULT_STEPS,
}: StepperProgressProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for current step
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep, scaleAnim]);

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex + 1 < currentStep) return "completed";
    if (stepIndex + 1 === currentStep) return "current";
    return "pending";
  };

  const renderStep = (step: Step, index: number) => {
    const status = getStepStatus(index);
    const isLast = index === steps.length - 1;

    return (
      <View key={index} className="flex-1 items-center">
        <View className="flex-row items-center w-full">
          {/* Left Line */}
          {index > 0 && (
            <View
              className={`flex-1 h-[2px] ${
                status === "pending" ? "bg-gray-300" : "bg-[#FF6B4A]"
              }`}
            />
          )}
          {index === 0 && <View className="flex-1" />}

          {/* Step Circle */}
          <Animated.View
            style={status === "current" ? { transform: [{ scale: scaleAnim }] } : undefined}
            className={`w-12 h-12 rounded-full items-center justify-center ${
              status === "completed"
                ? "bg-[#FF6B4A]"
                : status === "current"
                ? "bg-white border-2 border-[#FF6B4A] shadow-lg"
                : "bg-white border-2 border-gray-300"
            }`}
          >
            {status === "completed" ? (
              <Feather name="check" size={20} color="white" />
            ) : (
              <Feather
                name={step.icon}
                size={18}
                color={status === "current" ? "#FF6B4A" : "#9CA3AF"}
              />
            )}
          </Animated.View>

          {/* Right Line */}
          {!isLast && (
            <View
              className={`flex-1 h-[2px] ${
                getStepStatus(index + 1) === "pending" && status !== "completed"
                  ? "bg-gray-300"
                  : status === "completed"
                  ? "bg-[#FF6B4A]"
                  : "bg-gray-300"
              }`}
            />
          )}
          {isLast && <View className="flex-1" />}
        </View>

        {/* Label */}
        <Text
          className={`text-xs mt-2 text-center font-medium ${
            status === "completed" || status === "current"
              ? "text-[#FF6B4A]"
              : "text-gray-400"
          }`}
          numberOfLines={2}
        >
          {step.label}
        </Text>
      </View>
    );
  };

  return (
    <View className="px-4 py-2">
      <View className="flex-row items-start">
        {steps.map((step, index) => renderStep(step, index))}
      </View>
    </View>
  );
}
