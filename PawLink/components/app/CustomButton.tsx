import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import React from "react";
import cn from "clsx";
import { Colors } from "@/constants/colors";

interface CustomButtonProps {
  onPress: () => void;
  title?: string;
  btnstyle?: string | object;
  textStyle?: string | object;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
}

/**
 * CustomButton - Unified button component
 * VERSION 1.1 - Uses theme colors from constants/colors.ts
 */
const CustomButton = ({
  onPress,
  title = "Button",
  btnstyle,
  textStyle,
  leftIcon,
  rightIcon,
  isLoading = false,
  disabled = false,
  variant = "primary",
}: CustomButtonProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "secondary":
        return "bg-bg-tertiary";
      case "outline":
        return "bg-transparent border border-primary";
      case "ghost":
        return "bg-transparent";
      case "danger":
        return "bg-error";
      case "success":
        return "bg-success";
      case "primary":
      default:
        return "bg-primary";
    }
  };

  const getTextColorClasses = () => {
    switch (variant) {
      case "secondary":
        return "text-text-secondary";
      case "outline":
      case "ghost":
        return "text-primary";
      case "danger":
      case "success":
      case "primary":
      default:
        return "text-white";
    }
  };

  return (
    <TouchableOpacity
      className={cn(
        "rounded-full py-3.5 px-6 flex flex-row items-center justify-center mt-6",
        getVariantClasses(),
        disabled && "opacity-50",
        btnstyle
      )}
      onPress={onPress}
      disabled={isLoading || disabled}
      activeOpacity={0.8}
    >
      {leftIcon && <View className="mr-2">{leftIcon}</View>}
      <View className="flex-row items-center">
        {isLoading ? (
          <ActivityIndicator 
            size="small" 
            color={variant === "secondary" || variant === "outline" || variant === "ghost" 
              ? Colors.primary 
              : Colors.white
            } 
          />
        ) : (
          <Text className={cn("text-base font-mulish-bold", getTextColorClasses(), textStyle)}>
            {title}
          </Text>
        )}
      </View>
      {rightIcon && <View className="ml-2">{rightIcon}</View>}
    </TouchableOpacity>
  );
};

export default CustomButton;
