import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { AnimatedSearchBar } from "@/components/app/AnimatedSearchBar";
import SettingsDropdown from "@/components/app/SettingsDropdown";
import { API_BASE_URL } from "@/config/env";

// Type definitions - ready for backend integration
interface BreedingPair {
  id: number;
  pet1: {
    pet_id: number;
    name: string;
    photo_url?: string;
  };
  pet2: {
    pet_id: number;
    name: string;
    photo_url?: string;
  };
  owner1_name: string;
  owner2_name: string;
  location: string;
  fee: number;
  status: "active" | "pending" | "completed";
  booking_id?: number;
}

// Mock data for now - replace with actual API call
const MOCK_BREEDING_PAIRS: BreedingPair[] = [
  {
    id: 1,
    pet1: { pet_id: 1, name: "May23", photo_url: "" },
    pet2: { pet_id: 2, name: "Marie 23", photo_url: "" },
    owner1_name: "Copper",
    owner2_name: "Luna",
    location: "Zamboanga City",
    fee: 2000,
    status: "active",
  },
  {
    id: 2,
    pet1: { pet_id: 3, name: "hns33", photo_url: "" },
    pet2: { pet_id: 4, name: "jokee3", photo_url: "" },
    owner1_name: "Puppy",
    owner2_name: "Cloud",
    location: "Zamboanga City",
    fee: 3000,
    status: "active",
  },
  {
    id: 3,
    pet1: { pet_id: 5, name: "May23", photo_url: "" },
    pet2: { pet_id: 6, name: "Marie 23", photo_url: "" },
    owner1_name: "Copper",
    owner2_name: "Ling",
    location: "Zamboanga City",
    fee: 2000,
    status: "active",
  },
  {
    id: 4,
    pet1: { pet_id: 7, name: "May23", photo_url: "" },
    pet2: { pet_id: 8, name: "Marie 23", photo_url: "" },
    owner1_name: "Copper",
    owner2_name: "Ling",
    location: "Zamboanga City",
    fee: 2000,
    status: "active",
  },
];

export default function ShooterHomepage() {
  const [loading, setLoading] = useState(true);
  const [breedingPairs, setBreedingPairs] = useState<BreedingPair[]>([]);
  const [currentHandling, setCurrentHandling] = useState<number>(0);

  // TODO: Replace with actual API call
  const fetchBreedingPairs = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setBreedingPairs(MOCK_BREEDING_PAIRS);
      setCurrentHandling(MOCK_BREEDING_PAIRS.length);
    } catch (error) {
      console.error("Error fetching breeding pairs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBreedingPairs();
  }, [fetchBreedingPairs]);

  const handleBreedingPairPress = (_pair: BreedingPair) => {
    // TODO: Navigate to breeding pair details when implemented
  };

  const BreedingCard = ({ pair }: { pair: BreedingPair }) => {
    return (
      <TouchableOpacity
        key={pair.id}
        className="w-[48%] mb-4 bg-white rounded-2xl overflow-hidden shadow-md"
        style={{ elevation: 4 }}
        onPress={() => handleBreedingPairPress(pair)}
        activeOpacity={0.85}
      >
        {/* Pet Images */}
        <View className="relative">
          <View className="flex-row">
            {/* Pet 1 */}
            <View className="w-1/2 h-24 bg-gray-200">
              {pair.pet1.photo_url ? (
                <Image
                  source={{
                    uri: `${API_BASE_URL}/storage/${pair.pet1.photo_url}`,
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center bg-[#FFE0D8]">
                  <Image
                    source={require("@/assets/images/icon.png")}
                    className="w-12 h-12 rounded-full"
                    resizeMode="cover"
                  />
                </View>
              )}
            </View>
            {/* Pet 2 */}
            <View className="w-1/2 h-24 bg-gray-200">
              {pair.pet2.photo_url ? (
                <Image
                  source={{
                    uri: `${API_BASE_URL}/storage/${pair.pet2.photo_url}`,
                  }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full items-center justify-center bg-[#FFE0D8]">
                  <Image
                    source={require("@/assets/images/icon.png")}
                    className="w-12 h-12 rounded-full"
                    resizeMode="cover"
                  />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Card Content */}
        <View className="p-3">
          {/* Pet Names with icon */}
          <View className="flex-row items-center mb-2">
            <Text className="text-[#ea5b3a] mr-1">🐾</Text>
            <Text className="font-baloo text-sm text-[#111]" numberOfLines={1}>
              {pair.pet1.name} & {pair.pet2.name}
            </Text>
          </View>

          {/* Owner Names with icon */}
          <View className="flex-row items-center mb-2">
            <Image
              source={require("@/assets/images/Heart_Icon.png")}
              className="w-4 h-4 mr-2"
              resizeMode="contain"
            />
            <Text className="text-xs text-gray-600" numberOfLines={1}>
              {pair.owner1_name} & {pair.owner2_name}
            </Text>
          </View>

          {/* Fee */}
          <View className="flex-row items-center mb-2">
            <Text className="text-[#ea5b3a] mr-1">💰</Text>
            <Text className="text-xs font-semibold text-[#ea5b3a]">
              ₱{pair.fee.toLocaleString()}
            </Text>
          </View>

          {/* Location */}
          <View className="flex-row items-center">
            <Text className="text-gray-500 mr-1">📍</Text>
            <Text className="text-xs text-gray-500" numberOfLines={1}>
              {pair.location}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 items-center bg-[#FFE0D8] relative">
      {/* Header */}
      <View className="bg-white w-full h-48 shadow-black shadow-2xl rounded-b-[40px] p-8 pt-16 flex-col gap-4 relative">
        <View className="flex-row items-center justify-between">
          <Text className="text-[#ea5b3a] opacity-60 text-4xl font-baloo shadow-lg drop-shadow-2xl drop-shadow-black/70">
            PAWLINK
          </Text>
          <View className="flex-row gap-6">
            <TouchableOpacity>
              <Image
                className=""
                source={require("../../assets/images/Subscription_Icon.png")}
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Image
                className=""
                source={require("../../assets/images/Notif_Icon.png")}
              />
            </TouchableOpacity>
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <AnimatedSearchBar />
          <View className="relative z-50">
            <SettingsDropdown />
          </View>
        </View>
      </View>

      <ScrollView
        className="w-full mt-4 px-2"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Currently Breeding Handling Banner */}
        <View className="w-[90%] self-center mb-4 bg-[#F9DCDC] rounded-2xl p-4 border-2 border-white">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full items-center justify-center mr-3 bg-white">
              <Text className="text-3xl">🐾</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-baloo text-[#ea5b3a]">
                Currently breeding handling
              </Text>
              <Text className="text-gray-500 text-sm">
                You have {currentHandling} active breeding pair
                {currentHandling !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Breeding Pairs Grid */}
        <View className="px-4">
          <Text className="text-2xl font-baloo text-[#ea5b3a] mb-4">
            Active Breeding Pairs
          </Text>

          {loading ? (
            <View className="flex-row justify-center py-10">
              <ActivityIndicator size="large" color="#ea5b3a" />
            </View>
          ) : breedingPairs.length === 0 ? (
            <View className="py-10 bg-white rounded-2xl">
              <Text className="text-center text-gray-500 mb-2">
                No active breeding pairs at the moment
              </Text>
              <Text className="text-center text-gray-400 text-sm">
                Breeding assignments will appear here
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {breedingPairs.map((pair) => (
                <BreedingCard key={pair.id} pair={pair} />
              ))}
            </View>
          )}
        </View>

        {/* Bottom spacing */}
        <View className="h-20" />
      </ScrollView>
    </View>
  );
}
