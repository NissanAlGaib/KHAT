import React, { ReactNode } from "react";
import { View, Text } from "react-native";

interface SettingsSectionProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export const SettingsSection = ({
  children,
  title,
  className,
}: SettingsSectionProps) => {
  return (
    <View className={`mb-6 ${className || ""}`}>
      {title && (
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2.5 ml-1 px-5">
          {title}
        </Text>
      )}
      <View
        className="bg-white rounded-2xl overflow-hidden mx-4"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 2,
        }}
      >
        {children}
      </View>
    </View>
  );
};
