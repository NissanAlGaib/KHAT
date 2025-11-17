import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRole } from "@/context/RoleContext";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
  const { role, setRole } = useRole();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#FFF5F5]" edges={["top"]}>
      {/* Fixed Header with Shadow and Rounded Bottom */}
      <View className="bg-white rounded-b-[35] shadow-lg pb-6">
        <View className="px-6 pt-4">
          {/* Profile Section */}
          <View className="flex-row items-start justify-between">
            <View className="flex-row items-start gap-4">
              {/* Profile Image */}
              <Image
                source={require("@/assets/images/icon.png")}
                className="w-20 h-20 rounded-full"
              />

              {/* Name and Verification */}
              <View className="">
                <Text className="text-2xl font-bold text-black">
                  Precious Marie
                </Text>
                <Text className="text-sm text-gray-600 mt-1">NOT VERIFIED</Text>
                <TouchableOpacity
                  className="mt-2 border border-black rounded-full px-6 py-2 self-start"
                  onPress={() => router.push("/(verification)/verify")}
                >
                  <Text className="text-black font-medium">Verify Now</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Role dropdown (Shooter / Pet Owner) */}
            <View className="relative">
              <TouchableOpacity
                className="bg-[#FF6B4A] rounded-lg px-4 py-2"
                onPress={() => setMenuOpen((v) => !v)}
              >
                <Text className="text-white font-semibold">{role} ▼</Text>
              </TouchableOpacity>

              {menuOpen && (
                <View className="absolute right-0 mt-9 bg-white rounded-lg shadow-md p-2 px-5 z-50">
                  {/* Show the opposite role as selectable item */}
                  <TouchableOpacity
                    className="px-2 py-2"
                    onPress={() => {
                      const next =
                        role === "Pet Owner" ? "Shooter" : "Pet Owner";
                      setRole(next);
                      setMenuOpen(false);
                    }}
                  >
                    <Text className="text-xs text-[#FF6B4A] font-semibold">
                      {role === "Pet Owner" ? "Shooter" : "Pet Owner"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView className="flex-1 px-6 pt-6">
        {/* Pets Section */}
        <Text className="text-3xl font-bold text-black mb-4">PETS</Text>

        {/* Pets List */}
        <View className="flex-row items-center mb-6">
          {/* Registered Pet - Luna */}
          <TouchableOpacity
            className="items-center mr-4"
            onPress={() => router.push("/(pet)/pet-profile?id=1")}
          >
            <View className="w-24 h-24 rounded-full bg-gray-300 mb-2 items-center justify-center overflow-hidden">
              <Image
                source={require("@/assets/images/icon.png")}
                className="w-full h-full"
              />
            </View>
            <Text className="text-base font-semibold text-black mb-1">
              Luna
            </Text>
            <View className="bg-[#C8E6C9] px-4 py-1 rounded-full">
              <Text className="text-xs font-medium text-green-800">
                Available
              </Text>
            </View>
          </TouchableOpacity>

          {/* Add Pet Button */}
          <TouchableOpacity
            className="w-24 h-24 bg-gray-400 rounded-full items-center justify-center"
            onPress={() => router.push("/(verification)/add-pet")}
          >
            <Feather name="plus" size={32} color="white" />
          </TouchableOpacity>
        </View>

        {/* Breeding Overview Section */}
        <Text className="text-3xl font-bold text-black mb-4">
          Breeding Overview
        </Text>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap px-5 gap-10 mb-6">
          {/* Current Breeding */}
          <View className="bg-[#FFB5A7] rounded-3xl p-6 flex-1 min-w-[30%] border-4 border-[#FF6B4A] shadow-md">
            <Text className="text-4xl font-bold text-black text-center">0</Text>
            <Text className="text-sm font-semibold text-black text-center mt-1">
              Current breeding
            </Text>
            <Text className="text-xs text-black text-center">Active pairs</Text>
            <View className="items-center mt-2">
              <Feather name="heart" size={32} color="#FF6B4A" />
            </View>
          </View>

          {/* Total Matches */}
          <View className="bg-[#FFB5A7] rounded-3xl p-6 flex-1 min-w-[30%] border-4 border-[#FF6B4A] shadow-md">
            <Text className="text-4xl font-bold text-black text-center">0</Text>
            <Text className="text-sm font-semibold text-black text-center mt-1">
              Total Matches
            </Text>
            <Text className="text-xs text-black text-center">All time</Text>
            <View className="items-center mt-2">
              <Feather name="users" size={32} color="#FF6B4A" />
            </View>
          </View>

          {/* Success Rate */}
          <View className="bg-[#FFB5A7] rounded-3xl p-6 flex-1 min-w-[30%] border-4 border-[#FF6B4A] shadow-md">
            <Text className="text-4xl font-bold text-black text-center">0</Text>
            <Text className="text-sm font-semibold text-black text-center mt-1">
              Success Rate
            </Text>
            <Text className="text-xs text-black text-center">Average</Text>
            <View className="items-center mt-2">
              <Feather name="trending-up" size={32} color="#FF6B4A" />
            </View>
          </View>

          {/* Income */}
          <View className="bg-[#FFB5A7] rounded-3xl p-6 flex-1 min-w-[30%] border-4 border-[#FF6B4A] shadow-md">
            <Text className="text-4xl font-bold text-black text-center">
              ₱0.00
            </Text>
            <Text className="text-sm font-semibold text-black text-center mt-1">
              Income
            </Text>
            <Text className="text-xs text-black text-center">Total</Text>
            <View className="items-center mt-2">
              <Feather name="dollar-sign" size={32} color="#FF6B4A" />
            </View>
          </View>
        </View>

        {/* Account Settings Section */}
        <View className="bg-white rounded-3xl p-6 mb-20 shadow-md">
          <View className="flex-row items-center mb-6">
            <Feather name="settings" size={28} color="#FF6B4A" />
            <Text className="text-2xl font-bold text-black ml-3">
              Account Settings
            </Text>
          </View>

          {/* Settings Options */}
          <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-200">
            <View className="flex-row items-center">
              <Feather name="user" size={24} color="#4A90E2" />
              <View className="ml-4">
                <Text className="text-base font-semibold text-black">
                  Account
                </Text>
                <Text className="text-sm text-gray-600">
                  Update your personal information
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color="gray" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-200">
            <View className="flex-row items-center">
              <Feather name="bell" size={24} color="#FFD700" />
              <View className="ml-4">
                <Text className="text-base font-semibold text-black">
                  Notification
                </Text>
                <Text className="text-sm text-gray-600">
                  Notification settings
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color="gray" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-200">
            <View className="flex-row items-center">
              <Feather name="shield" size={24} color="#FF6B4A" />
              <View className="ml-4">
                <Text className="text-base font-semibold text-black">
                  Privacy & Security
                </Text>
                <Text className="text-sm text-gray-600">
                  Control your privacy setting
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color="gray" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between py-4">
            <View className="flex-row items-center">
              <Feather name="log-out" size={24} color="#FF4444" />
              <View className="ml-4">
                <Text className="text-base font-semibold text-[#FF4444]">
                  Sign out
                </Text>
                <Text className="text-sm text-gray-600">
                  Log out your account
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color="gray" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
