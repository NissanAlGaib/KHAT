import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function PetProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = params.id as string;

  // TODO: Fetch pet data from backend using petId
  // For now, using placeholder data
  const petData = {
    id: petId || "1",
    name: "Luna",
    breed: "Pomeranian",
    age: "3 Years old",
    image: require("@/assets/images/icon.png"),
    preference: {
      size: ["SMALL", "PLAYFUL"],
      playful: true,
    },
    behavior: ["LOYAL", "SOCIAL"],
    attributes: ["BROWN"],
    weight: "32kg",
    healthStatus: "Microchip",
    vaccinations: [
      {
        id: "1",
        name: "Rabies",
        status: "Full History",
        expires: "Expires: 8/15/2025",
        statusColor: "#FF6B4A",
      },
      {
        id: "2",
        name: "DHPP",
        status: "Full History",
        expires: "Expires: 6/20/2025",
        statusColor: "#FF6B4A",
      },
      {
        id: "3",
        name: "Bordetella",
        status: "Update",
        expires: "Expires: 9/15/2025",
        statusColor: "#FFB74D",
      },
    ],
    healthRecords: [
      {
        id: "1",
        type: "Annual Checkup",
        status: "Update",
        date: "5/1/2024",
        statusColor: "#FF6B4A",
      },
    ],
    description:
      "Lorem ipsum is simply dummy text of the printing and typesetting industry. Lorem ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a",
    photos: [
      require("@/assets/images/icon.png"),
      // TODO: Add more photos from backend
    ],
  };

  const handleEditInfo = () => {
    // TODO: Navigate to edit pet profile screen
    console.log("Navigate to edit pet info");
  };

  const handleAddPhoto = () => {
    // TODO: Open image picker and upload photo
    console.log("Add photo");
  };

  const handleVaccinationPress = (vaccinationName: string) => {
    // Navigate to vaccination history screen
    router.push(`/(pet)/(history)/vaccination-history?vaccine=${vaccinationName}`);
  };

  const handleHealthRecordPress = (recordType: string) => {
    // Navigate to health history screen
    router.push(`/(pet)/(history)/health-history?type=${recordType}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-gray-200">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-black">PET PROFILE</Text>
        </View>
        <TouchableOpacity>
          <Feather name="toggle-right" size={28} color="gray" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Pet Image and Basic Info */}
        <View className="items-center py-6 border-b border-gray-200">
          <View className="w-32 h-32 rounded-full bg-gray-300 mb-4 items-center justify-center overflow-hidden">
            <Image source={petData.image} className="w-full h-full" />
          </View>

          <TouchableOpacity
            className="bg-[#FF6B4A] rounded-full px-6 py-2 mb-4"
            onPress={handleEditInfo}
          >
            <Text className="text-white font-semibold text-sm">EDIT INFO</Text>
          </TouchableOpacity>

          {/* Name and Breed */}
          <View className="bg-gray-100 rounded-2xl px-6 py-3 mb-3">
            <View className="flex-row items-center mb-2">
              <Text className="text-base text-gray-700 mr-2">Name:</Text>
              <Text className="text-base font-bold text-black">
                {petData.name}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-base text-gray-700 mr-2">Breed:</Text>
              <Text className="text-base font-bold text-black">
                {petData.breed}
              </Text>
            </View>
          </View>

          {/* Age Badge */}
          <View className="bg-[#FFE0B2] rounded-full px-4 py-2">
            <Text className="text-orange-800 font-semibold text-sm">
              {petData.age}
            </Text>
          </View>
        </View>

        {/* Preference Section */}
        <View className="px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center mb-3">
            <Text className="text-base font-semibold text-black">
              Preference:
            </Text>
            <Feather name="edit-2" size={16} color="gray" className="ml-2" />
          </View>

          <View className="flex-row items-center">
            {petData.preference.size.map((tag, index) => (
              <View
                key={index}
                className="bg-gray-200 rounded-full px-3 py-1 mr-2"
              >
                <Text className="text-gray-700 text-xs">{tag}</Text>
              </View>
            ))}
            <View className="bg-[#C8E6C9] rounded-full px-3 py-1">
              <Text className="text-green-800 text-xs">Yes</Text>
            </View>
          </View>
        </View>

        {/* Behavior and Attributes */}
        <View className="px-6 py-4 border-b border-gray-200">
          <View className="flex-row mb-4">
            {/* Behavior */}
            <View className="flex-1 mr-2">
              <View className="bg-gray-100 rounded-2xl p-4 h-32">
                <Text className="text-sm font-bold text-black mb-2">
                  Behavior
                </Text>
                <View className="flex-row flex-wrap">
                  {petData.behavior.map((behavior, index) => (
                    <View
                      key={index}
                      className="bg-white rounded-full px-3 py-1 mr-1 mb-1"
                    >
                      <Text className="text-gray-700 text-xs">{behavior}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Attributes */}
            <View className="flex-1 ml-2">
              <View className="bg-gray-100 rounded-2xl p-4 h-32">
                <Text className="text-sm font-bold text-black mb-2">
                  Attributes
                </Text>
                <View className="flex-row flex-wrap">
                  {petData.attributes.map((attribute, index) => (
                    <View
                      key={index}
                      className="bg-white rounded-full px-3 py-1 mr-1 mb-1"
                    >
                      <Text className="text-gray-700 text-xs">{attribute}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* Weight Cards */}
          <View className="flex-row flex-wrap gap-2">
            <View className="bg-[#FFD4CC] rounded-2xl p-4 flex-1 min-w-[45%]">
              <Text className="text-sm font-semibold text-black mb-1">
                Weight
              </Text>
              <Text className="text-2xl font-bold text-black">
                {petData.weight}
              </Text>
            </View>
            <View className="bg-gray-200 rounded-2xl p-4 flex-1 min-w-[45%]">
              <Text className="text-sm font-semibold text-black mb-1">
                Weight
              </Text>
              <Text className="text-2xl font-bold text-black">
                {petData.weight}
              </Text>
            </View>
            <View className="bg-gray-300 rounded-2xl p-4 flex-1 min-w-[45%]">
              <Text className="text-sm font-semibold text-black mb-1">
                Weight
              </Text>
              <Text className="text-2xl font-bold text-black">
                {petData.weight}
              </Text>
            </View>
            <View className="bg-[#FFF9C4] rounded-2xl p-4 flex-1 min-w-[45%]">
              <Text className="text-sm font-semibold text-black mb-1">
                Weight
              </Text>
              <Text className="text-2xl font-bold text-black">
                {petData.weight}
              </Text>
            </View>
          </View>
        </View>

        {/* Health Status */}
        <View className="px-6 py-4 border-b border-gray-200">
          <Text className="text-base font-bold text-black mb-3">
            Health Status
          </Text>
          <View className="bg-[#C8E6C9] rounded-full px-4 py-2 self-start">
            <Text className="text-green-800 font-semibold text-sm">
              {petData.healthStatus}
            </Text>
          </View>
        </View>

        {/* Current Vaccinations */}
        <View className="px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-bold text-black">
              Current Vaccinations
            </Text>
            <View className="bg-[#FF6B4A] rounded-full px-3 py-1">
              <Text className="text-white font-semibold text-xs">
                Full History
              </Text>
            </View>
          </View>

          {petData.vaccinations.map((vaccination) => (
            <TouchableOpacity
              key={vaccination.id}
              className="flex-row items-center justify-between py-3 border-b border-gray-100"
              onPress={() => handleVaccinationPress(vaccination.name)}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-3" />
                <Text className="text-base text-black">{vaccination.name}</Text>
              </View>
              <Text className="text-sm text-gray-600">
                {vaccination.expires}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Health Records */}
        <View className="px-6 py-4 border-b border-gray-200">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-base font-bold text-black">
              Recent Health Records
            </Text>
            <View className="bg-[#FF6B4A] rounded-full px-3 py-1">
              <Text className="text-white font-semibold text-xs">
                Full History
              </Text>
            </View>
          </View>

          {petData.healthRecords.map((record) => (
            <TouchableOpacity
              key={record.id}
              className="flex-row items-center justify-between py-3"
              onPress={() => handleHealthRecordPress(record.type)}
            >
              <View className="flex-row items-center flex-1">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-3" />
                <Text className="text-base text-black">{record.type}</Text>
              </View>
              <View className="flex-row items-center">
                <View className="bg-[#FF6B4A] rounded-full px-3 py-1 mr-2">
                  <Text className="text-white font-semibold text-xs">
                    {record.status}
                  </Text>
                </View>
                <Text className="text-sm text-gray-600">{record.date}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <View className="px-6 py-4 border-b border-gray-200">
          <Text className="text-base font-bold text-black mb-3">
            Description:
          </Text>
          <Text className="text-sm text-gray-700 leading-5">
            {petData.description}
          </Text>
        </View>

        {/* Photos */}
        <View className="px-6 py-4 mb-8">
          <View className="flex-row flex-wrap gap-3">
            {/* Add Photo Button */}
            <TouchableOpacity
              className="w-24 h-24 bg-gray-300 rounded-xl items-center justify-center"
              onPress={handleAddPhoto}
            >
              <Feather name="plus" size={32} color="white" />
            </TouchableOpacity>

            {/* Existing Photos */}
            {petData.photos.map((photo, index) => (
              <View
                key={index}
                className="w-24 h-24 bg-gray-200 rounded-xl overflow-hidden"
              >
                <Image source={photo} className="w-full h-full" />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
