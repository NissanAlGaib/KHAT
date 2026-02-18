import React from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";

interface SettingsInputProps extends TextInputProps {
  label: string;
  error?: string;
  icon?: keyof typeof Feather.glyphMap;
}

export const SettingsInput = ({
  label,
  error,
  icon,
  className,
  ...props
}: SettingsInputProps) => {
  return (
    <View className={`mb-4 mx-4 ${className || ""}`}>
      <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">
        {label}
      </Text>
      <View
        className={`
        flex-row items-center bg-white border rounded-xl px-3 h-12
        ${error ? "border-red-500" : "border-gray-200"}
        focus:border-[${Colors.primary}]
      `}
      >
        {icon && (
          <Feather
            name={icon}
            size={20}
            color="#9ca3af"
            style={{ marginRight: 10 }}
          />
        )}
        <TextInput
          className="flex-1 text-gray-900 text-base h-full"
          placeholderTextColor="#9ca3af"
          selectionColor={Colors.primary}
          {...props}
        />
      </View>
      {error && <Text className="text-red-500 text-xs mt-1 ml-1">{error}</Text>}
    </View>
  );
};
