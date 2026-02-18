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
    <View className={`mb-5 ${className || ""}`}>
      {title && (
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1 px-4">
          {title}
        </Text>
      )}
      <View className="bg-white rounded-2xl overflow-hidden mx-4" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 }}>
        {children}
      </View>
    </View>
  );
};
