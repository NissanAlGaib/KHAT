import { View, Text, TextInput, TextInputProps } from "react-native";
import React from "react";
import cn from "clsx";

interface CustomInputProps extends Omit<TextInputProps, "onChangeText"> {
  placeholder?: string;
  value: string;
  error?: string;
  onChangeText: (text: string) => void;
  label?: string;
  variant?: "contained" | "outlined" | "underline";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * CustomInput - Unified input component
 * VERSION 1.1 - Default to contained style for better touch targets
 */
const CustomInput = ({
  placeholder = "Enter Text",
  value,
  error,
  onChangeText,
  label,
  secureTextEntry,
  keyboardType = "default",
  variant = "contained",
  leftIcon,
  rightIcon,
  ...props
}: CustomInputProps) => {
  const [isFocused, setIsFocused] = React.useState(false);

  const getVariantClasses = () => {
    switch (variant) {
      case "outlined":
        return cn(
          "bg-white border rounded-xl px-4 py-3",
          isFocused ? "border-primary" : "border-border-medium"
        );
      case "underline":
        return cn(
          "bg-transparent border-b px-0 py-3",
          isFocused ? "border-primary" : "border-border-medium"
        );
      case "contained":
      default:
        return cn(
          "bg-bg-tertiary rounded-xl px-4 py-3.5",
          isFocused && "ring-2 ring-primary"
        );
    }
  };

  return (
    <View className="w-full">
      {label && (
        <Text className="text-text-secondary font-mulish text-sm mb-2">
          {label}
        </Text>
      )}
      <View className="relative">
        {leftIcon && (
          <View className="absolute left-4 top-0 bottom-0 justify-center z-10">
            {leftIcon}
          </View>
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor="#9CA3AF"
          className={cn(
            "text-base text-text-primary leading-5",
            getVariantClasses(),
            leftIcon && "pl-12",
            rightIcon && "pr-12"
          )}
          {...props}
        />
        {rightIcon && (
          <View className="absolute right-4 top-0 bottom-0 justify-center z-10">
            {rightIcon}
          </View>
        )}
      </View>
      {error && (
        <Text className="text-error text-sm mt-1 font-roboto-condensed-extralight">
          {error}
        </Text>
      )}
    </View>
  );
};

export default React.memo(CustomInput);
