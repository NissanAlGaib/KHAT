import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function HealthHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const recordType = (params.type as string) || "Annual Check Up";

  // TODO: Fetch health records from backend
  const healthRecords = [
    {
      id: "1",
      visited: "August 15, 2024",
      clinic: "Dr. Smith",
      veterinarian: "Dr. Smith",
      certificate: null, // TODO: Add certificate URL
    },
    {
      id: "2",
      visited: "August 15, 2024",
      clinic: "Dr. Smith",
      veterinarian: "Dr. Smith",
      certificate: null,
    },
  ];

  const handleViewCertificate = (certificateUrl: string | null) => {
    // TODO: Open certificate viewer or download
    console.log("View certificate:", certificateUrl);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-gray-200">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-black">HEALTH HISTORY</Text>
        </View>

        {/* Calendar Icon */}
        <TouchableOpacity>
          <Feather name="calendar" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Record Type Title Card */}
        <View className="bg-[#FF6B4A] rounded-2xl p-6 mb-6 flex-row items-center justify-between">
          <Text className="text-white text-xl font-bold uppercase">
            {recordType}
          </Text>
          <TouchableOpacity
            className="border-2 border-white rounded-lg px-4 py-2"
            onPress={() => handleViewCertificate(null)}
          >
            <Text className="text-white font-semibold text-sm">
              View Certificate
            </Text>
          </TouchableOpacity>
        </View>

        {/* Health Records */}
        {healthRecords.map((record) => (
          <View
            key={record.id}
            className="bg-gray-50 rounded-2xl p-5 mb-4 border border-gray-200"
          >
            {/* Record Details */}
            <View className="space-y-2">
              <View className="mb-2">
                <Text className="text-base text-black">
                  <Text className="font-bold">Visited: </Text>
                  {record.visited}
                </Text>
              </View>

              <View className="mb-2">
                <Text className="text-base text-black">
                  <Text className="font-bold">Clinic: </Text>
                  {record.clinic}
                </Text>
              </View>

              <View>
                <Text className="text-base text-black">
                  <Text className="font-bold">Veterinarian: </Text>
                  {record.veterinarian}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
