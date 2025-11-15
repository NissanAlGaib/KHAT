import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsPage() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 py-3">
        <TouchableOpacity onPress={() => router.back()} className="px-2 py-1">
          <Text className="text-[#ea5b3a]">Back</Text>
        </TouchableOpacity>

        <Text className="text-xl font-bold text-[#ea5b3a]">Settings</Text>

        <View style={{ width: 48 }} /> {/* spacer to keep title centered */}
      </View>

      <View className="p-4">
        <Text className="text-gray-600 mb-4">Account</Text>
        {/* Add your settings rows/components here */}
        <View className="bg-gray-50 rounded-lg p-4 mb-3">
          <Text>Notifications</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}