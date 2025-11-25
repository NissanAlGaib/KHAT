import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getLitterDetail, type LitterDetail } from "@/services/petService";
import { API_BASE_URL } from "@/config/env";

export default function LitterDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const litterId = params.id as string;

  const [litter, setLitter] = useState<LitterDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLitterDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLitterDetail(parseInt(litterId));
      setLitter(data);
    } catch (error) {
      console.error("Error fetching litter detail:", error);
    } finally {
      setLoading(false);
    }
  }, [litterId]);

  useEffect(() => {
    if (litterId) {
      fetchLitterDetail();
    }
  }, [litterId, fetchLitterDetail]);

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

  if (!litter) {
    return (
      <SafeAreaView className="flex-1 bg-[#E8F4F8] items-center justify-center">
        <Text className="text-gray-500">Litter not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#E8F4F8]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between bg-white">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text
            className="text-xl font-bold text-black uppercase"
            numberOfLines={1}
          >
            {litter.title}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Litter Info */}
        <View className="mx-4 mt-6 bg-white rounded-2xl p-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold mb-1">{litter.title}</Text>
              <Text className="text-gray-500 text-base">
                {litter.birth_date}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                {litter.age_in_months} months old
              </Text>
            </View>
            <View className="bg-green-100 px-4 py-2 rounded-full">
              <Text className="text-green-600 font-semibold capitalize">
                {litter.status}
              </Text>
            </View>
          </View>

          {/* Parents */}
          <View className="border-t border-gray-200 pt-4">
            <Text className="text-lg font-bold mb-3">Parents</Text>
            <View className="flex-row gap-3">
              {/* Sire */}
              <TouchableOpacity
                className="flex-1 bg-blue-50 rounded-xl p-3"
                onPress={() =>
                  router.push(
                    `/(pet)/view-profile?id=${litter.parents.sire.pet_id}`
                  )
                }
              >
                <Image
                  source={{
                    uri: getImageUrl(litter.parents.sire.photo) || undefined,
                  }}
                  className="w-full h-24 rounded-lg mb-2"
                  resizeMode="cover"
                />
                <Text className="font-bold">{litter.parents.sire.name}</Text>
                <Text className="text-gray-600 text-xs">
                  {litter.parents.sire.breed}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">Sire (♂)</Text>
              </TouchableOpacity>

              {/* Dam */}
              <TouchableOpacity
                className="flex-1 bg-pink-50 rounded-xl p-3"
                onPress={() =>
                  router.push(
                    `/(pet)/view-profile?id=${litter.parents.dam.pet_id}`
                  )
                }
              >
                <Image
                  source={{
                    uri: getImageUrl(litter.parents.dam.photo) || undefined,
                  }}
                  className="w-full h-24 rounded-lg mb-2"
                  resizeMode="cover"
                />
                <Text className="font-bold">{litter.parents.dam.name}</Text>
                <Text className="text-gray-600 text-xs">
                  {litter.parents.dam.breed}
                </Text>
                <Text className="text-gray-500 text-xs mt-1">Dam (♀)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Statistics */}
        <View className="mx-4 mt-6 bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-bold mb-4">Statistics</Text>
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 min-w-[45%] bg-gray-50 rounded-xl p-4">
              <Text className="text-gray-600 text-sm">Total Offspring</Text>
              <Text className="text-3xl font-bold mt-1">
                {litter.statistics.total_offspring}
              </Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-green-50 rounded-xl p-4">
              <Text className="text-gray-600 text-sm">Alive</Text>
              <Text className="text-3xl font-bold mt-1 text-green-600">
                {litter.statistics.alive_offspring}
              </Text>
            </View>
            {litter.statistics.died_offspring > 0 && (
              <View className="flex-1 min-w-[45%] bg-red-50 rounded-xl p-4">
                <Text className="text-gray-600 text-sm">Died</Text>
                <Text className="text-3xl font-bold mt-1 text-red-600">
                  {litter.statistics.died_offspring}
                </Text>
              </View>
            )}
            <View className="flex-1 min-w-[45%] bg-blue-50 rounded-xl p-4">
              <Text className="text-gray-600 text-sm">Male</Text>
              <Text className="text-3xl font-bold mt-1 text-blue-600">
                {litter.statistics.male_count}
              </Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-pink-50 rounded-xl p-4">
              <Text className="text-gray-600 text-sm">Female</Text>
              <Text className="text-3xl font-bold mt-1 text-pink-600">
                {litter.statistics.female_count}
              </Text>
            </View>
          </View>
        </View>

        {/* Offspring */}
        <View className="mx-4 mt-6 mb-6 bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-lg font-bold mb-4">Offspring</Text>
          <View className="flex-row flex-wrap gap-3">
            {litter.offspring.map((offspring) => (
              <View
                key={offspring.offspring_id}
                className="w-[30%] items-center"
              >
                <View className="w-full aspect-square bg-gray-200 rounded-2xl overflow-hidden">
                  {offspring.photo_url ? (
                    <Image
                      source={{
                        uri: getImageUrl(offspring.photo_url) || undefined,
                      }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full items-center justify-center">
                      <Feather name="image" size={24} color="#9CA3AF" />
                    </View>
                  )}
                </View>
                {offspring.name && (
                  <Text className="text-xs font-semibold mt-1 text-center">
                    {offspring.name}
                  </Text>
                )}
                <View className="flex-row items-center gap-1 mt-1">
                  <Text className="text-xs text-gray-500">
                    {offspring.sex === "male" ? "♂" : "♀"}
                  </Text>
                  {offspring.color && (
                    <Text className="text-xs text-gray-500">
                      {offspring.color}
                    </Text>
                  )}
                </View>
                {offspring.status !== "alive" && (
                  <View
                    className={`mt-1 px-2 py-0.5 rounded-full ${
                      offspring.status === "died" ? "bg-red-100" : "bg-gray-100"
                    }`}
                  >
                    <Text
                      className={`text-xs ${
                        offspring.status === "died"
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {offspring.status}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Notes */}
        {litter.notes && (
          <View className="mx-4 mb-6 bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-lg font-bold mb-3">Notes</Text>
            <Text className="text-gray-600 leading-6">{litter.notes}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
