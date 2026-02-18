import React from "react";
import { TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { Colors } from "../../constants/colors";

interface SettingsButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost" | "destructive";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export const SettingsButton = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  className,
}: SettingsButtonProps) => {
  const getStyles = () => {
    switch (variant) {
      case "primary":
        return {
          container: "bg-primary border-transparent",
          text: "text-white font-semibold",
        };
      case "outline":
        return {
          container: "bg-white border-gray-300",
          text: "text-gray-700 font-medium",
        };
      case "ghost":
        return {
          container: "bg-transparent border-transparent shadow-none",
          text: "text-gray-600 font-medium",
        };
      case "destructive":
        return {
          container: "bg-white border-red-200",
          text: "text-red-500 font-medium",
        };
      default:
        return {
          container: "bg-primary border-transparent",
          text: "text-white",
        };
    }
  };

  const styles = getStyles();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      className={`
        flex-row justify-center items-center py-3.5 px-4 rounded-xl border mb-3 shadow-sm mx-4
        ${styles.container}
        ${disabled ? "opacity-50" : "opacity-100"}
        ${className || ""}
      `}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "white" : Colors.primary}
        />
      ) : (
        <Text className={`text-center text-base ${styles.text}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
