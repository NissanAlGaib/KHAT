import React, { useState, useEffect, useCallback, useMemo } from "react";
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

type DocumentStatus = "valid" | "expiring_soon" | "expired";

// Helper function to calculate document expiration status
const getDocumentStatus = (expirationDate: string): DocumentStatus => {
  const expDate = dayjs(expirationDate);
  const now = dayjs();
  const daysUntilExpiration = expDate.diff(now, "day");

  if (daysUntilExpiration < 0) {
    return "expired";
  } else if (daysUntilExpiration <= 30) {
    return "expiring_soon";
  }
  return "valid";
};

// Helper to get status indicator color
const getStatusColor = (status: DocumentStatus): string => {
  switch (status) {
    case "expired":
      return "bg-red-500";
    case "expiring_soon":
      return "bg-yellow-500";
    case "valid":
    default:
      return "bg-green-500";
  }
};

// Helper to get status badge styles
const getStatusBadge = (status: DocumentStatus): { bg: string; text: string; label: string } => {
  switch (status) {
    case "expired":
      return { bg: "bg-red-100", text: "text-red-600", label: "Expired" };
    case "expiring_soon":
      return { bg: "bg-yellow-100", text: "text-yellow-700", label: "Expiring Soon" };
    case "valid":
    default:
      return { bg: "bg-green-100", text: "text-green-600", label: "Valid" };
  }
};

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

  const handleResubmitVaccination = (vaccination: any) => {
    router.push(
      `/(verification)/resubmit-document?type=vaccination&petId=${petId}&petName=${petData.name}&vaccinationId=${vaccination.vaccination_id}&vaccineName=${vaccination.vaccine_name}`
    );
  };

  const handleResubmitHealthRecord = (record: any) => {
    router.push(
      `/(verification)/resubmit-document?type=health_record&petId=${petId}&petName=${petData.name}&healthRecordId=${record.health_record_id}&recordType=${record.record_type}`
    );
  };

  // Calculate document stats
  const documentStats = useMemo(() => {
    if (!petData) return { expiredCount: 0, expiringSoonCount: 0 };

    let expiredCount = 0;
    let expiringSoonCount = 0;

    // Check vaccinations
    if (petData.vaccinations) {
      petData.vaccinations.forEach((v: any) => {
        const status = getDocumentStatus(v.expiration_date);
        if (status === "expired") expiredCount++;
        else if (status === "expiring_soon") expiringSoonCount++;
      });
    }

    // Check health records
    if (petData.health_records) {
      petData.health_records.forEach((r: any) => {
        if (r.expiration_date) {
          const status = getDocumentStatus(r.expiration_date);
          if (status === "expired") expiredCount++;
          else if (status === "expiring_soon") expiringSoonCount++;
        }
      });
    }

    return { expiredCount, expiringSoonCount };
  }, [petData]);

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
              <View className="flex-row flex-wrap gap-2">
                <View className="bg-[#C8E6C9] rounded-full px-4 py-2">
                  <Text className="text-green-800 font-semibold text-sm">
                    {petData.microchip_id ? "Microchipped" : "Not Microchipped"}
                  </Text>
                </View>
                {documentStats.expiredCount > 0 && (
                  <View className="bg-red-100 rounded-full px-4 py-2">
                    <Text className="text-red-600 font-semibold text-sm">
                      {documentStats.expiredCount} Expired Document{documentStats.expiredCount > 1 ? "s" : ""}
                    </Text>
                  </View>
                )}
                {documentStats.expiringSoonCount > 0 && (
                  <View className="bg-yellow-100 rounded-full px-4 py-2">
                    <Text className="text-yellow-700 font-semibold text-sm">
                      {documentStats.expiringSoonCount} Expiring Soon
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Document Status Alert */}
            {(documentStats.expiredCount > 0 || documentStats.expiringSoonCount > 0) && (
              <View className="mx-4 mb-2">
                {documentStats.expiredCount > 0 && (
                  <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-2">
                    <View className="flex-row items-center">
                      <Feather name="alert-circle" size={20} color="#DC2626" />
                      <Text className="text-red-700 font-semibold ml-2 flex-1">
                        Action Required
                      </Text>
                    </View>
                    <Text className="text-red-600 text-sm mt-2">
                      You have {documentStats.expiredCount} expired document{documentStats.expiredCount > 1 ? "s" : ""} that need{documentStats.expiredCount === 1 ? "s" : ""} to be resubmitted.
                    </Text>
                  </View>
                )}
                {documentStats.expiringSoonCount > 0 && (
                  <View className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <View className="flex-row items-center">
                      <Feather name="clock" size={20} color="#B45309" />
                      <Text className="text-yellow-700 font-semibold ml-2 flex-1">
                        Expiring Soon
                      </Text>
                    </View>
                    <Text className="text-yellow-600 text-sm mt-2">
                      You have {documentStats.expiringSoonCount} document{documentStats.expiringSoonCount > 1 ? "s" : ""} expiring within 30 days.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Current Vaccinations */}
            {petData.vaccinations && petData.vaccinations.length > 0 && (
              <View className="px-6 py-4 bg-white mt-2 rounded-2xl mx-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-base font-bold text-black">
                    Vaccinations
                  </Text>
                  <View className="bg-[#FF6B4A] rounded-full px-3 py-1">
                    <Text className="text-white font-semibold text-xs">
                      {petData.vaccinations.length} Records
                    </Text>
                  </View>
                </View>

                {petData.vaccinations.map((vaccination: any, index: number) => {
                  const status = getDocumentStatus(vaccination.expiration_date);
                  const statusBadge = getStatusBadge(status);
                  const isExpired = status === "expired";
                  const isExpiringSoon = status === "expiring_soon";

                  return (
                    <View
                      key={vaccination.vaccination_id || index}
                      className={`py-3 ${index < petData.vaccinations.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <TouchableOpacity
                        className="flex-row items-center justify-between"
                        onPress={() =>
                          handleVaccinationPress(vaccination.vaccine_name)
                        }
                      >
                        <View className="flex-row items-center flex-1">
                          <View className={`w-2 h-2 rounded-full ${getStatusColor(status)} mr-3`} />
                          <View className="flex-1">
                            <Text className="text-base text-black">
                              {vaccination.vaccine_name}
                            </Text>
                            <Text className="text-sm text-gray-500">
                              Expires: {dayjs(vaccination.expiration_date).format("MM/DD/YYYY")}
                            </Text>
                          </View>
                        </View>
                        <View className={`${statusBadge.bg} rounded-full px-3 py-1`}>
                          <Text className={`${statusBadge.text} font-semibold text-xs`}>
                            {statusBadge.label}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Resubmit button for expired documents */}
                      {isExpired && (
                        <TouchableOpacity
                          className="mt-3 bg-red-500 rounded-lg py-2 px-4 flex-row items-center justify-center"
                          onPress={() => handleResubmitVaccination(vaccination)}
                        >
                          <Feather name="upload" size={16} color="white" />
                          <Text className="text-white font-semibold text-sm ml-2">
                            Resubmit Document
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Warning for expiring soon */}
                      {isExpiringSoon && (
                        <View className="mt-2 bg-yellow-50 rounded-lg py-2 px-3 flex-row items-center">
                          <Feather name="alert-triangle" size={14} color="#B45309" />
                          <Text className="text-yellow-700 text-xs ml-2">
                            This document will expire soon. Consider renewing it.
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Health Records */}
            {petData.health_records && petData.health_records.length > 0 && (
              <View className="px-6 py-4 bg-white mt-4 rounded-2xl mx-4 shadow-sm">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-base font-bold text-black">
                    Health Records
                  </Text>
                  <View className="bg-[#FF6B4A] rounded-full px-3 py-1">
                    <Text className="text-white font-semibold text-xs">
                      {petData.health_records.length} Records
                    </Text>
                  </View>
                </View>

                {petData.health_records.map((record: any, index: number) => {
                  const status = record.expiration_date 
                    ? getDocumentStatus(record.expiration_date)
                    : "valid";
                  const statusBadge = getStatusBadge(status);
                  const isExpired = status === "expired";
                  const isExpiringSoon = status === "expiring_soon";

                  return (
                    <View
                      key={record.health_record_id || index}
                      className={`py-3 ${index < petData.health_records.length - 1 ? "border-b border-gray-100" : ""}`}
                    >
                      <TouchableOpacity
                        className="flex-row items-center justify-between"
                        onPress={() => handleHealthRecordPress(record.record_type)}
                      >
                        <View className="flex-row items-center flex-1">
                          <View className={`w-2 h-2 rounded-full ${getStatusColor(status)} mr-3`} />
                          <View className="flex-1">
                            <Text className="text-base text-black">
                              {record.record_type}
                            </Text>
                            {record.expiration_date && (
                              <Text className="text-sm text-gray-500">
                                Expires: {dayjs(record.expiration_date).format("MM/DD/YYYY")}
                              </Text>
                            )}
                            {!record.expiration_date && record.given_date && (
                              <Text className="text-sm text-gray-500">
                                Given: {dayjs(record.given_date).format("MM/DD/YYYY")}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View className={`${statusBadge.bg} rounded-full px-3 py-1`}>
                          <Text className={`${statusBadge.text} font-semibold text-xs`}>
                            {record.expiration_date ? statusBadge.label : record.status}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Resubmit button for expired documents */}
                      {isExpired && record.expiration_date && (
                        <TouchableOpacity
                          className="mt-3 bg-red-500 rounded-lg py-2 px-4 flex-row items-center justify-center"
                          onPress={() => handleResubmitHealthRecord(record)}
                        >
                          <Feather name="upload" size={16} color="white" />
                          <Text className="text-white font-semibold text-sm ml-2">
                            Resubmit Document
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Warning for expiring soon */}
                      {isExpiringSoon && record.expiration_date && (
                        <View className="mt-2 bg-yellow-50 rounded-lg py-2 px-3 flex-row items-center">
                          <Feather name="alert-triangle" size={14} color="#B45309" />
                          <Text className="text-yellow-700 text-xs ml-2">
                            This document will expire soon. Consider renewing it.
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
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
