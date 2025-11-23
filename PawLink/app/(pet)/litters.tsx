import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getPetLitters, type Litter } from "@/services/petService";
import { API_BASE_URL } from "@/config/env";

export default function PetLittersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = params.petId as string;

  const [litters, setLitters] = useState<Litter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (petId) {
      fetchLitters();
    }
  }, [petId]);

  const fetchLitters = async () => {
    try {
      setLoading(true);
      const data = await getPetLitters(parseInt(petId));
      setLitters(data);
    } catch (error) {
      console.error("Error fetching litters:", error);
      Alert.alert("Error", "Failed to load litters");
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return `${API_BASE_URL}/storage/${path}`;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#E8F4F8] items-center justify-center">
        <ActivityIndicator size="large" color="#ea5b3a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#E8F4F8]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-black">ALL LITTERS</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {litters.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-500 text-center">
              No litters found for this pet
            </Text>
          </View>
        ) : (
          litters.map((litter) => (
            <View
              key={litter.litter_id}
              className="bg-white rounded-2xl p-6 mt-4 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center flex-1">
                  <View className="flex-row -space-x-3 mr-3">
                    <Image
                      source={{
                        uri:
                          getImageUrl(litter.parents.sire.photo) || undefined,
                      }}
                      className="w-12 h-12 rounded-full border-2 border-white"
                    />
                    <Image
                      source={{
                        uri: getImageUrl(litter.parents.dam.photo) || undefined,
                      }}
                      className="w-12 h-12 rounded-full border-2 border-white"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-lg">{litter.title}</Text>
                    <Text className="text-gray-500 text-sm">
                      {litter.birth_date}
                    </Text>
                  </View>
                </View>
                <View className="bg-green-100 px-3 py-1 rounded-full">
                  <Text className="text-green-600 font-semibold text-xs capitalize">
                    {litter.status}
                  </Text>
                </View>
              </View>

              <View className="bg-gray-50 rounded-xl p-4 mb-3">
                <Text className="text-sm mb-2">
                  <Text className="font-semibold">Total Offspring: </Text>
                  {litter.offspring.total}
                </Text>
                <Text className="text-sm mb-2">
                  <Text className="font-semibold">Alive: </Text>
                  <Text className="text-green-600">
                    {litter.offspring.alive}
                  </Text>
                  {litter.offspring.died > 0 && (
                    <Text className="text-red-600">
                      {" "}
                      | Died: {litter.offspring.died}
                    </Text>
                  )}
                </Text>
                <Text className="text-sm mb-1">
                  <Text className="font-semibold">Female:</Text>{" "}
                  {litter.offspring.female}
                </Text>
                <Text className="text-sm">
                  <Text className="font-semibold">Male:</Text>{" "}
                  {litter.offspring.male}
                </Text>
              </View>

              {/* Offspring Placeholders */}
              <View className="flex-row gap-2 mb-3 justify-between">
                {litter.offspring_details.slice(0, 4).map((offspring) => (
                  <View
                    key={offspring.offspring_id}
                    className="w-16 h-16 bg-gray-200 rounded-full"
                  >
                    {offspring.photo_url && (
                      <Image
                        source={{
                          uri: getImageUrl(offspring.photo_url) || undefined,
                        }}
                        className="w-16 h-16 rounded-full"
                      />
                    )}
                  </View>
                ))}
                {/* Fill remaining slots */}
                {Array.from({
                  length: Math.max(0, 4 - litter.offspring_details.length),
                }).map((_, i) => (
                  <View
                    key={`empty-${i}`}
                    className="w-16 h-16 bg-gray-200 rounded-full"
                  />
                ))}
              </View>

              <TouchableOpacity
                className="bg-[#FF6B6B] rounded-full py-3"
                onPress={() =>
                  router.push(`/(pet)/litter-detail?id=${litter.litter_id}`)
                }
              >
                <Text className="text-white text-center font-semibold">
                  VIEW DETAILS
                </Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
