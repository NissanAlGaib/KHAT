import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function VaccinationHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const vaccineName = (params.vaccine as string) || "Rabies";

  const [selectedVaccine, setSelectedVaccine] = useState(vaccineName);

  // TODO: Fetch vaccination history from backend
  const vaccinationHistory = [
    {
      id: "1",
      status: "Valid",
      statusColor: "#C8E6C9",
      statusTextColor: "#2E7D32",
      date: "August 15, 2024",
      administered: "August 15, 2024",
      expires: "August 15, 2024",
      clinic: "Dr. Smith",
      veterinarian: "Dr. Smith",
      certificate: null, // TODO: Add certificate URL
    },
    {
      id: "2",
      status: "Expired",
      statusColor: "#E0E0E0",
      statusTextColor: "#424242",
      date: "August 15, 2024",
      administered: "August 15, 2024",
      expires: "August 15, 2024",
      clinic: "Dr. Smith",
      veterinarian: "Dr. Smith",
      certificate: null,
    },
    {
      id: "3",
      status: "Expired",
      statusColor: "#E0E0E0",
      statusTextColor: "#424242",
      date: "August 15, 2024",
      administered: "August 15, 2024",
      expires: "August 15, 2024",
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
      <View className="px-6 py-4 flex-row items-center justify-between bg-white">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-black">
            VACCINATION HISTORY
          </Text>
        </View>

        {/* Vaccine Dropdown */}
        <TouchableOpacity className="border border-gray-300 rounded-lg px-4 py-2 flex-row items-center">
          <Text className="text-gray-600 text-sm mr-2">{selectedVaccine}</Text>
          <Feather name="chevron-down" size={16} color="gray" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Vaccine Title Card */}
        <View className="bg-[#FF6B4A] rounded-2xl p-6 mb-6 flex-row items-center justify-between">
          <Text className="text-white text-2xl font-bold">
            {selectedVaccine}
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

        {/* Vaccination Records */}
        {vaccinationHistory.map((record) => (
          <View
            key={record.id}
            className="bg-gray-50 rounded-2xl p-5 mb-4 border border-gray-200"
          >
            {/* Status Badge and Date */}
            <View className="flex-row items-center justify-between mb-4">
              <View
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: record.statusColor }}
              >
                <Text
                  className="font-semibold text-sm"
                  style={{ color: record.statusTextColor }}
                >
                  {record.status}
                </Text>
              </View>
              <Text className="text-base text-black font-medium">
                {record.date}
              </Text>
            </View>

            {/* Record Details */}
            <View className="space-y-2">
              <View className="mb-2">
                <Text className="text-base text-black">
                  <Text className="font-bold">Administered: </Text>
                  {record.administered}
                </Text>
              </View>

              <View className="mb-2">
                <Text className="text-base text-black">
                  <Text className="font-bold">Expires: </Text>
                  {record.expires}
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
