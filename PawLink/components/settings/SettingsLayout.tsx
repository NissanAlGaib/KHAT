import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

interface SettingsLayoutProps {
  children: React.ReactNode;
  headerTitle: string;
  onBackPress?: () => void;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  scrollable?: boolean;
}

export const SettingsLayout: React.FC<SettingsLayoutProps> = ({
  children,
  headerTitle,
  onBackPress,
  style,
  contentContainerStyle,
  scrollable = true,
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const Content = scrollable ? (
    <ScrollView
      className="flex-1"
      contentContainerStyle={[{ paddingBottom: 40 }, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1" style={contentContainerStyle}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F2F4F8]" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#FF6B4A" />

      {/* Branded gradient header */}
      <LinearGradient
        colors={["#FF6B4A", "#FF9A8B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingBottom: 16, paddingTop: 4 }}
      >
        <View className="flex-row items-center px-4 py-2">
          <TouchableOpacity
            onPress={handleBack}
            className="p-2 rounded-full active:bg-white/20"
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={22} color="white" />
          </TouchableOpacity>

          <Text
            className="text-white text-lg font-bold flex-1 text-center"
            numberOfLines={1}
          >
            {headerTitle}
          </Text>

          {/* Balance placeholder */}
          <View className="w-9" />
        </View>
      </LinearGradient>

      {/* Content */}
      {Content}
    </SafeAreaView>
  );
};
