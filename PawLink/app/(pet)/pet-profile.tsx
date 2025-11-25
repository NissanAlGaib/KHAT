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
import { getPet } from "@/services/petService";
import { API_BASE_URL } from "@/config/env";
import dayjs from "dayjs";

export default function PetProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = params.id as string;
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const [isEnabled, setIsEnabled] = useState(true);
  const [showDisabledModal, setShowDisabledModal] = useState(false);
  const [petData, setPetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPetData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPet(parseInt(petId));
      setPetData(data);
      setIsEnabled(data.status === "active");
      setShowDisabledModal(data.status === "disabled");
    } catch (error) {
      console.error("Error fetching pet data:", error);
      showAlert({
        title: "Error",
        message: "Failed to load pet data",
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

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    setShowDisabledModal(!newState);
    // TODO: Update pet status in backend
  };

  const handleEditInfo = () => {
    console.log("Navigate to edit pet info");
  };

  const handleAddPhoto = () => {
    console.log("Add photo");
  };

  const handleVaccinationPress = (vaccinationName: string) => {
    router.push(
      `/(pet)/(history)/vaccination-history?vaccine=${vaccinationName}&petId=${petId}`
    );
  };

  const handleHealthRecordPress = (recordType: string) => {
    router.push(
      `/(pet)/(history)/health-history?type=${recordType}&petId=${petId}`
    );
  };

  const calculateAge = (birthdate: string) => {
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

  return (
    <SafeAreaView className="flex-1 bg-[#FFF5F5]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 flex-row items-center justify-between bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-black">PET PROFILE</Text>
        </View>
        <TouchableOpacity
          onPress={handleToggle}
          className={`w-14 h-8 rounded-full flex-row items-center px-1 ${
            isEnabled ? "bg-green-500 justify-end" : "bg-gray-400 justify-start"
          }`}
        >
          <View className="w-6 h-6 rounded-full bg-white items-center justify-center">
            {isEnabled && <Feather name="check" size={16} color="green" />}
            {!isEnabled && <Feather name="x" size={16} color="gray" />}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#FF6B4A" />
            <Text className="text-gray-600 mt-4">Loading pet data...</Text>
          </View>
        ) : !petData ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-gray-600">Pet not found</Text>
          </View>
        ) : (
          <>
            {showDisabledModal && (
              <View className="px-6">
                <View className="bg-white rounded-3xl px-8 py-6 mx-2 mt-4 shadow-md items-center">
                  <Text className="text-[#FF6B4A] text-xl font-bold text-center">
                    THIS PET PROFILE IS DISABLED
                  </Text>
                </View>
              </View>
            )}

            {/* Pet Image and Basic Info */}
            <View className="items-center py-6 bg-[#FFF5F5]">
              <View className="relative w-32 h-32 rounded-full bg-gray-300 mb-4 items-center justify-center overflow-hidden">
                {petData.profile_image ? (
                  <Image
                    source={{
                      uri: `${API_BASE_URL}/storage/${petData.profile_image}`,
                    }}
                    className="w-full h-full"
                  />
                ) : (
                  <Image
                    source={require("@/assets/images/icon.png")}
                    className="w-full h-full"
                  />
                )}
                <View className="absolute bottom-2 right-2 bg-white rounded-full p-1.5">
                  <Feather name="camera" size={20} color="black" />
                </View>
              </View>

              <TouchableOpacity
                className="bg-[#FF6B4A] rounded-full px-8 py-3 mb-6"
                onPress={handleEditInfo}
              >
                <Text className="text-white font-semibold text-sm">
                  EDIT INFO
                </Text>
              </TouchableOpacity>
            </View>

            {/* Name, Breed and Age in Cards */}
            <View className="w-full px-6">
              <View className="flex-row justify-between mb-4">
                {/* Name and Breed Card */}
                <View className="bg-white rounded-2xl px-6 py-4 flex-1 mr-2 shadow-sm border border-gray-100">
                  <View className="mb-2">
                    <Text className="text-sm text-gray-600">
                      Name:{" "}
                      <Text className="font-bold text-black">
                        {petData.name}
                      </Text>
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-600">
                    Breed:{" "}
                    <Text className="font-bold text-black">
                      {petData.breed}
                    </Text>
                  </Text>

                  {/* Preference */}
                  {petData.partner_preferences &&
                    petData.partner_preferences.length > 0 && (
                      <View className="mt-3">
                        <View className="flex-row items-center mb-2">
                          <Text className="text-sm font-semibold text-black">
                            Preference:
                          </Text>
                          <Feather
                            name="edit-2"
                            size={14}
                            color="gray"
                            className="ml-2"
                          />
                        </View>

                        <View className="flex-row flex-wrap gap-2">
                          {/* Preferred Breed (string) */}
                          {petData.partner_preferences[0].preferred_breed && (
                            <View className="bg-gray-100 rounded-full px-3 py-1 border border-gray-300">
                              <Text className="text-gray-700 text-xs font-medium">
                                {petData.partner_preferences[0].preferred_breed}
                              </Text>
                            </View>
                          )}

                          {/* Preferred Attributes */}
                          {petData.partner_preferences[0]
                            .preferred_attributes &&
                            (Array.isArray(
                              petData.partner_preferences[0]
                                .preferred_attributes
                            ) ? (
                              petData.partner_preferences[0].preferred_attributes.map(
                                (attr: string, i: number) => (
                                  <View
                                    key={`pref-attr-${i}`}
                                    className="bg-gray-100 rounded-full px-3 py-1 border border-gray-300"
                                  >
                                    <Text className="text-gray-700 text-xs font-medium">
                                      {attr}
                                    </Text>
                                  </View>
                                )
                              )
                            ) : (
                              <View className="bg-gray-100 rounded-full px-3 py-1 border border-gray-300">
                                <Text className="text-gray-700 text-xs font-medium">
                                  {
                                    petData.partner_preferences[0]
                                      .preferred_attributes
                                  }
                                </Text>
                              </View>
                            ))}

                          {/* Preferred Behaviors (string or array) */}
                          {petData.partner_preferences[0].preferred_behaviors &&
                            (Array.isArray(
                              petData.partner_preferences[0].preferred_behaviors
                            ) ? (
                              petData.partner_preferences[0].preferred_behaviors.map(
                                (beh: string, i: number) => (
                                  <View
                                    key={`pref-beh-${i}`}
                                    className="bg-gray-100 rounded-full px-3 py-1 border border-gray-300"
                                  >
                                    <Text className="text-gray-700 text-xs font-medium">
                                      {beh}
                                    </Text>
                                  </View>
                                )
                              )
                            ) : (
                              <View className="bg-gray-100 rounded-full px-3 py-1 border border-gray-300">
                                <Text className="text-gray-700 text-xs font-medium">
                                  {
                                    petData.partner_preferences[0]
                                      .preferred_behaviors
                                  }
                                </Text>
                              </View>
                            ))}
                        </View>
                      </View>
                    )}
                </View>

                {/* Age and Sex Cards */}
                <View className="flex-1 ml-2">
                  {/* Age Card */}
                  <View className="bg-white rounded-2xl px-4 py-3 mb-3 shadow-sm border border-gray-100">
                    <Text className="text-xs text-gray-600 mb-1">Age</Text>
                    <View className="bg-[#FFF9C4] rounded-full px-3 py-1.5 self-start">
                      <Text className="text-orange-800 font-semibold text-xs">
                        {calculateAge(petData.birthdate)}
                      </Text>
                    </View>
                  </View>

                  {/* Sex Card */}
                  <View className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                    <Text className="text-xs text-gray-600 mb-1">Sex</Text>
                    <View className="bg-[#B2EBF2] rounded-full px-3 py-1.5 self-start">
                      <Text className="text-cyan-800 font-semibold text-xs">
                        {petData.sex.charAt(0).toUpperCase() +
                          petData.sex.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Behavior and Attributes */}
            <View className="px-6 py-4 mt-2">
              <View className="flex-row mb-4">
                {/* Behavior */}
                <View className="flex-1 mr-2">
                  <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <Text className="text-sm font-bold text-black mb-2">
                      Behavior
                    </Text>
                    <View className="flex-row flex-wrap gap-1">
                      {petData.behaviors &&
                        petData.behaviors.map(
                          (behavior: string, index: number) => (
                            <View
                              key={index}
                              className="bg-blue-100 rounded-full px-3 py-1 border border-blue-200"
                            >
                              <Text className="text-blue-800 text-xs font-medium">
                                {behavior}
                              </Text>
                            </View>
                          )
                        )}
                    </View>
                  </View>
                </View>

                {/* Attributes */}
                <View className="flex-1 ml-2">
                  <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <Text className="text-sm font-bold text-black mb-2">
                      Attributes
                    </Text>
                    <View className="flex-row flex-wrap gap-1">
                      {petData.attributes &&
                        petData.attributes.map(
                          (attribute: string, index: number) => (
                            <View
                              key={index}
                              className="bg-red-100 rounded-full px-3 py-1 border border-red-200"
                            >
                              <Text className="text-red-800 text-xs font-medium">
                                {attribute}
                              </Text>
                            </View>
                          )
                        )}
                    </View>
                  </View>
                </View>
              </View>

              {/* Physical Stats Cards */}
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
            <View className="px-6 py-4">
              <Text className="text-base font-bold text-black mb-3">
                Health Status
              </Text>
              <View className="bg-[#C8E6C9] rounded-full px-4 py-2 self-start">
                <Text className="text-green-800 font-semibold text-sm">
                  {petData.microchip_id ? "Microchipped" : "Not Microchipped"}
                </Text>
              </View>
            </View>

            {/* Current Vaccinations */}
            {petData.vaccinations && petData.vaccinations.length > 0 && (
              <View className="px-6 py-4 bg-white mt-2 rounded-2xl mx-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-base font-bold text-black">
                    Current Vaccinations
                  </Text>
                  <View className="bg-[#FF6B4A] rounded-full px-3 py-1">
                    <Text className="text-white font-semibold text-xs">
                      {petData.vaccinations.length} Records
                    </Text>
                  </View>
                </View>

                {petData.vaccinations.map((vaccination: any, index: number) => (
                  <TouchableOpacity
                    key={vaccination.vaccination_id || index}
                    className="flex-row items-center justify-between py-3 border-b border-gray-100"
                    onPress={() =>
                      handleVaccinationPress(vaccination.vaccine_name)
                    }
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-2 h-2 rounded-full bg-green-500 mr-3" />
                      <Text className="text-base text-black">
                        {vaccination.vaccine_name}
                      </Text>
                    </View>
                    <Text className="text-sm text-gray-600">
                      Expires:{" "}
                      {dayjs(vaccination.expiration_date).format("MM/DD/YYYY")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Recent Health Records */}
            {petData.health_records && petData.health_records.length > 0 && (
              <View className="px-6 py-4 bg-white mt-4 rounded-2xl mx-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-base font-bold text-black">
                    Recent Health Records
                  </Text>
                  <View className="bg-[#FF6B4A] rounded-full px-3 py-1">
                    <Text className="text-white font-semibold text-xs">
                      {petData.health_records.length} Records
                    </Text>
                  </View>
                </View>

                {petData.health_records.map((record: any, index: number) => (
                  <TouchableOpacity
                    key={record.health_record_id || index}
                    className="flex-row items-center justify-between py-3"
                    onPress={() => handleHealthRecordPress(record.record_type)}
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-2 h-2 rounded-full bg-green-500 mr-3" />
                      <Text className="text-base text-black">
                        {record.record_type}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <View className="bg-[#FF6B4A] rounded-full px-3 py-1 mr-2">
                        <Text className="text-white font-semibold text-xs">
                          {record.status}
                        </Text>
                      </View>
                      <Text className="text-sm text-gray-600">
                        {dayjs(record.given_date).format("MM/DD/YYYY")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Description */}
            {petData.description && (
              <View className="px-6 py-4 bg-white mt-4 rounded-2xl mx-4 shadow-sm">
                <Text className="text-base font-bold text-black mb-3">
                  Description:
                </Text>
                <Text className="text-sm text-gray-700 leading-5">
                  {petData.description}
                </Text>
              </View>
            )}

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
                {petData.photos &&
                  petData.photos.map((photo: any, index: number) => (
                    <View
                      key={index}
                      className="w-24 h-24 bg-gray-200 rounded-xl overflow-hidden"
                    >
                      <Image
                        source={{
                          uri: `${API_BASE_URL}/storage/${photo.photo_url}`,
                        }}
                        className="w-full h-full"
                      />
                    </View>
                  ))}
              </View>
            </View>
          </>
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
