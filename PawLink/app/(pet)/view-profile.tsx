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
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  getPetPublicProfile,
  getPetLitters,
  type PetPublicProfile,
  type Litter,
} from "@/services/petService";
import { API_BASE_URL } from "@/config/env";
import dayjs from "dayjs";

export default function ViewPetProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = params.id as string;
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [petData, setPetData] = useState<PetPublicProfile | null>(null);
  const [litters, setLitters] = useState<Litter[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPhotoIndex] = useState(0);

  const fetchPetData = useCallback(async () => {
    try {
      setLoading(true);
      const [profile, litterData] = await Promise.all([
        getPetPublicProfile(parseInt(petId)),
        getPetLitters(parseInt(petId)),
      ]);
      setPetData(profile);
      setLitters(litterData);
    } catch (error) {
      console.error("Error fetching pet data:", error);
      showAlert({
        title: "Error",
        message: "Failed to load pet profile",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [petId, showAlert]);

  useEffect(() => {
    if (petId) {
      fetchPetData();
    }
  }, [petId, fetchPetData]);

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return `${API_BASE_URL}/storage/${path}`;
  };

  const getVaccinationStatus = (status: string) => {
    switch (status) {
      case "valid":
        return { color: "bg-green-500", icon: "●" };
      case "expiring_soon":
        return { color: "bg-yellow-500", icon: "●" };
      case "expired":
        return { color: "bg-red-500", icon: "●" };
      default:
        return { color: "bg-gray-500", icon: "●" };
    }
  };

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return "";
    const birth = dayjs(birthdate);
    const now = dayjs();
    const years = now.diff(birth, "year");
    const months = now.diff(birth, "month") % 12;

    if (years > 0) {
      return `${years} Year${years > 1 ? "s" : ""} old`;
    } else {
      return `${months} Month${months > 1 ? "s" : ""} old`;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#E8F4F8] items-center justify-center">
        <ActivityIndicator size="large" color="#ea5b3a" />
      </SafeAreaView>
    );
  }

  if (!petData) {
    return (
      <SafeAreaView className="flex-1 bg-[#E8F4F8] items-center justify-center">
        <Text className="text-gray-500">Pet not found</Text>
      </SafeAreaView>
    );
  }

  const currentPhoto = petData.photos[currentPhotoIndex];

  return (
    <SafeAreaView className="flex-1 bg-[#E8F4F8]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between bg-white">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-black uppercase">
            {petData.name}
          </Text>
        </View>
        <TouchableOpacity>
          <Feather name="more-vertical" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Pet Card */}
        <View className="mx-4 mt-6 bg-[#FF6B6B] rounded-3xl overflow-hidden shadow-lg">
          {/* Main Photo */}
          <View className="relative">
            {currentPhoto && (
              <Image
                source={{
                  uri: getImageUrl(currentPhoto.photo_url) || undefined,
                }}
                className="w-full h-96"
                resizeMode="cover"
              />
            )}

            {/* Action Buttons */}
            <View className="absolute bottom-6 left-0 right-0 flex-row justify-center gap-4">
              <TouchableOpacity className="w-14 h-14 bg-pink-200 rounded-full items-center justify-center">
                <Feather name="star" size={24} color="#FF6B6B" />
              </TouchableOpacity>
              <TouchableOpacity className="w-16 h-16 bg-[#FF6B6B] rounded-full items-center justify-center">
                <Feather name="heart" size={28} color="white" />
              </TouchableOpacity>
              <TouchableOpacity className="w-14 h-14 bg-gray-600 rounded-full items-center justify-center">
                <Feather name="message-circle" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Pet Info Card */}
          <View className="bg-white rounded-t-3xl -mt-6 px-6 py-4">
            <View className="flex-row items-start justify-between">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-black">
                  {petData.name}
                </Text>
                <Text className="text-gray-500 text-base mt-1">
                  {petData.breed}
                </Text>

                <View className="flex-row gap-2 mt-3">
                  <View className="bg-[#FFF4E6] px-4 py-2 rounded-full">
                    <Text className="text-[#F59E0B] font-semibold">
                      {calculateAge(petData.birthdate)}
                    </Text>
                  </View>
                  <View className="bg-[#FFE4E6] px-4 py-2 rounded-full">
                    <Text className="text-[#F43F5E] font-semibold capitalize">
                      {petData.sex}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Thumbnail */}
              {currentPhoto && (
                <Image
                  source={{
                    uri: getImageUrl(currentPhoto.photo_url) || undefined,
                  }}
                  className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg"
                  resizeMode="cover"
                />
              )}
            </View>
          </View>
        </View>

        {/* Common Breeding Partners */}
        {petData.breeding_partners.length > 0 && (
          <View className="mx-4 mt-6 bg-white rounded-2xl p-6 shadow-sm">
            <Text className="text-xl font-bold mb-4">
              Common Breeding Partners
            </Text>

            {petData.breeding_partners.slice(0, 3).map((partner, index) => (
              <TouchableOpacity
                key={partner.pet_id}
                className={`flex-row items-center ${index > 0 ? "mt-4" : ""}`}
                onPress={() =>
                  router.push(`/(pet)/view-profile?id=${partner.pet_id}`)
                }
              >
                <Image
                  source={{ uri: getImageUrl(partner.photo) || undefined }}
                  className="w-16 h-16 rounded-full"
                  resizeMode="cover"
                />
                <View className="flex-1 ml-3">
                  <Text className="font-bold text-base">{partner.name}</Text>
                  <Text className="text-gray-600 text-sm">{partner.breed}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Owner Info */}
        <View className="mx-4 mt-6 bg-white rounded-2xl p-6 shadow-sm">
          <View className="flex-row items-center">
            {petData.owner.profile_image ? (
              <Image
                source={{
                  uri: getImageUrl(petData.owner.profile_image) || undefined,
                }}
                className="w-20 h-20 rounded-2xl"
                resizeMode="cover"
              />
            ) : (
              <View className="w-20 h-20 rounded-2xl bg-gray-200 items-center justify-center">
                <Feather name="user" size={32} color="#9CA3AF" />
              </View>
            )}
            <View className="flex-1 ml-4">
              <Text className="text-xl font-bold">{petData.owner.name}</Text>
              <Text className="text-gray-500">{petData.name}&apos;s Owner</Text>
            </View>
          </View>

          {/* Preferences */}
          {petData.preferences.length > 0 && (
            <View className="mt-6">
              <Text className="text-base font-semibold mb-3">Preference:</Text>
              <View className="flex-row flex-wrap gap-2">
                {petData.preferences.map((pref, index) => (
                  <View
                    key={index}
                    className="border border-gray-300 rounded-full px-4 py-2"
                  >
                    <Text className="text-gray-600 text-sm uppercase">
                      {pref}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Behavior & Attributes */}
        <View className="mx-4 mt-6 flex-row gap-3">
          {/* Behavior */}
          <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-lg font-bold mb-3">Behavior</Text>
            <View className="flex-wrap flex-row gap-2">
              {petData.behaviors.map((behavior, index) => (
                <View
                  key={index}
                  className="bg-blue-100 rounded-full px-3 py-1 border border-blue-200"
                >
                  <Text className="text-blue-800 text-xs font-medium">
                    {behavior}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Attributes */}
          <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
            <Text className="text-lg font-bold mb-3">Attributes</Text>
            <View className="flex-wrap flex-row gap-2">
              {petData.attributes.map((attribute, index) => (
                <View
                  key={index}
                  className="bg-red-100 rounded-full px-3 py-1 border border-red-200"
                >
                  <Text className="text-red-800 text-xs font-medium">
                    {attribute}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Physical Stats Cards */}
        <View className="mx-4 mt-6">
          <View className="flex-row flex-wrap gap-2">
            <View className="bg-[#FFD4CC] rounded-2xl p-4 flex-1 min-w-[45%] border-2 border-[#FFB5A7]">
              <Text className="text-sm font-semibold text-black mb-1">
                Weight
              </Text>
              <Text className="text-2xl font-bold text-black">
                {petData.weight}kg
              </Text>
            </View>
            <View className="bg-[#B2EBF2] rounded-2xl p-4 flex-1 min-w-[45%] border-2 border-[#80DEEA]">
              <Text className="text-sm font-semibold text-black mb-1">
                Height
              </Text>
              <Text className="text-2xl font-bold text-black">
                {petData.height}cm
              </Text>
            </View>
            <View className="bg-gray-200 rounded-2xl p-4 flex-1 min-w-[45%] border-2 border-gray-300">
              <Text className="text-sm font-semibold text-black mb-1">
                Species
              </Text>
              <Text className="text-xl font-bold text-black">
                {petData.species}
              </Text>
            </View>
            {petData.microchip_id && (
              <View className="bg-[#FFF9C4] rounded-2xl p-4 flex-1 min-w-[45%] border-2 border-[#FFF59D]">
                <Text className="text-sm font-semibold text-black mb-1">
                  Microchip
                </Text>
                <Text className="text-sm font-bold text-black">
                  {petData.microchip_id}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Health Status */}
        <View className="mx-4 mt-6 bg-white rounded-2xl p-6 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-bold">Health Status</Text>
            {petData.microchip_id && (
              <View className="bg-green-100 px-4 py-2 rounded-full">
                <Text className="text-green-600 font-semibold">Microchip</Text>
              </View>
            )}
          </View>

          {/* Current Vaccinations */}
          <View className="border border-gray-200 rounded-2xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold">
                Current Vaccinations
              </Text>
              <TouchableOpacity className="bg-[#FF6B6B] px-4 py-2 rounded-full flex-row items-center gap-2">
                <Feather name="file-text" size={16} color="white" />
                <Text className="text-white font-semibold">Full History</Text>
              </TouchableOpacity>
            </View>

            {petData.vaccinations.map((vaccination, index) => {
              const status = getVaccinationStatus(vaccination.status);
              return (
                <View
                  key={index}
                  className={`bg-gray-50 rounded-xl p-4 flex-row items-center justify-between ${
                    index > 0 ? "mt-3" : ""
                  }`}
                >
                  <View className="flex-row items-center flex-1">
                    <View
                      className={`w-2 h-2 rounded-full ${status.color} mr-3`}
                    />
                    <Text className="font-semibold">
                      {vaccination.vaccine_name}
                    </Text>
                  </View>
                  <Text className="text-gray-500 text-sm">
                    Expires: {vaccination.expiration_date}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Recent Health Records */}
          <View className="border border-gray-200 rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold">
                Recent Health Records
              </Text>
              <TouchableOpacity className="bg-[#FF6B6B] px-4 py-2 rounded-full flex-row items-center gap-2">
                <Feather name="file-text" size={16} color="white" />
                <Text className="text-white font-semibold">Full History</Text>
              </TouchableOpacity>
            </View>

            {petData.health_records.map((record, index) => (
              <View
                key={index}
                className={`bg-gray-50 rounded-xl p-4 flex-row items-center justify-between ${
                  index > 0 ? "mt-3" : ""
                }`}
              >
                <View className="flex-row items-center flex-1">
                  <View className="w-2 h-2 rounded-full bg-green-500 mr-3" />
                  <Text className="font-semibold">{record.record_type}</Text>
                </View>
                <Text className="text-gray-500 text-sm">
                  {record.given_date}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Description */}
        <View className="mx-4 mt-6 bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-xl font-bold mb-3">Description:</Text>
          <View className="border border-pink-200 rounded-2xl p-4">
            <Text className="text-gray-600 leading-6">
              {petData.description}
            </Text>
          </View>
        </View>

        {/* Litters */}
        {litters.length > 0 && (
          <View className="mx-4 mt-6 mb-6 bg-white rounded-2xl p-6 shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold">Litters</Text>
              <TouchableOpacity
                className="bg-[#FF6B6B] px-6 py-2 rounded-full"
                onPress={() => router.push(`/(pet)/litters?petId=${petId}`)}
              >
                <Text className="text-white font-semibold">VIEW ALL</Text>
              </TouchableOpacity>
            </View>

            {litters.slice(0, 2).map((litter) => (
              <View
                key={litter.litter_id}
                className="border border-gray-200 rounded-2xl p-4 mt-3"
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
                          uri:
                            getImageUrl(litter.parents.dam.photo) || undefined,
                        }}
                        className="w-12 h-12 rounded-full border-2 border-white"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold">{litter.title}</Text>
                      <Text className="text-gray-500 text-sm">
                        {litter.parents.sire.owner.name}&apos;s Owner:{" "}
                        {litter.parents.sire.owner.name}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {litter.birth_date}
                      </Text>
                    </View>
                  </View>
                  <View className="bg-green-100 px-3 py-1 rounded-full">
                    <Text className="text-green-600 font-semibold text-xs">
                      {litter.status}
                    </Text>
                  </View>
                </View>

                <View className="bg-gray-50 rounded-xl p-3">
                  <Text className="text-sm mb-2">
                    <Text className="font-semibold">Offspring: </Text>
                    <Text className="text-green-600">
                      {litter.offspring.alive} alive
                    </Text>
                    {litter.offspring.died > 0 && (
                      <Text className="text-red-600">
                        {" "}
                        {litter.offspring.died} died
                      </Text>
                    )}
                  </Text>
                  <Text className="text-sm">
                    <Text className="font-semibold">Female:</Text>{" "}
                    {litter.offspring.female}
                  </Text>
                  <Text className="text-sm">
                    <Text className="font-semibold">Male:</Text>{" "}
                    {litter.offspring.male}
                  </Text>
                  <Text className="text-sm">
                    <Text className="font-semibold">Color:</Text> brown, black
                  </Text>
                </View>

                {/* Offspring Placeholders */}
                <View className="flex-row gap-2 mt-3 justify-between">
                  {litter.offspring_details
                    .slice(0, 4)
                    .map((offspring, index) => (
                      <View
                        key={offspring.offspring_id}
                        className="w-16 h-16 bg-gray-200 rounded-full"
                      >
                        {offspring.photo_url && (
                          <Image
                            source={{
                              uri:
                                getImageUrl(offspring.photo_url) || undefined,
                            }}
                            className="w-16 h-16 rounded-full"
                          />
                        )}
                      </View>
                    ))}
                  {/* Fill remaining slots with gray circles */}
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
                  className="bg-[#FF6B6B] rounded-full py-3 mt-3"
                  onPress={() =>
                    router.push(`/(pet)/litter-detail?id=${litter.litter_id}`)
                  }
                >
                  <Text className="text-white text-center font-semibold">
                    VIEW ALL
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}
