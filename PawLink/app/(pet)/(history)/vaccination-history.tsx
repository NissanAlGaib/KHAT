import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getPet } from "@/services/petService";
import { API_BASE_URL } from "@/config/env";
import dayjs from "dayjs";

export default function VaccinationHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = params.petId as string;
  const vaccineName = (params.vaccine as string) || "All";

  const [selectedVaccine, setSelectedVaccine] = useState(vaccineName);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (petId) {
      fetchVaccinations();
    }
  }, [petId]);

  const fetchVaccinations = async () => {
    try {
      setLoading(true);
      const petData = await getPet(parseInt(petId));
      setVaccinations(petData.vaccinations || []);
    } catch (error) {
      console.error("Error fetching vaccinations:", error);
      Alert.alert("Error", "Failed to load vaccination records");
    } finally {
      setLoading(false);
    }
  };

  const filteredVaccinations =
    selectedVaccine === "All"
      ? vaccinations
      : vaccinations.filter((v) => v.vaccine_name === selectedVaccine);

  const handleViewCertificate = (certificateUrl: string | null) => {
    if (certificateUrl) {
      const fullUrl = `${API_BASE_URL}/storage/${certificateUrl}`;
      Linking.openURL(fullUrl).catch(() => {
        Alert.alert("Error", "Unable to open certificate");
      });
    } else {
      Alert.alert("No Certificate", "No certificate available for this record");
    }
  };

  const getStatusInfo = (expirationDate: string) => {
    const now = dayjs();
    const expiry = dayjs(expirationDate);

    if (expiry.isAfter(now)) {
      return {
        status: "Valid",
        statusColor: "#C8E6C9",
        statusTextColor: "#2E7D32",
      };
    } else {
      return {
        status: "Expired",
        statusColor: "#E0E0E0",
        statusTextColor: "#424242",
      };
    }
  };

  const uniqueVaccineNames = [
    "All",
    ...new Set(vaccinations.map((v) => v.vaccine_name)),
  ];

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
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#FF6B4A" />
            <Text className="text-gray-600 mt-4">
              Loading vaccination records...
            </Text>
          </View>
        ) : (
          <>
            {/* Vaccine Title Card */}
            <View className="bg-[#FF6B4A] rounded-2xl p-6 mb-6 flex-row items-center justify-between">
              <Text className="text-white text-2xl font-bold">
                {selectedVaccine}
              </Text>
              {filteredVaccinations.length > 0 && (
                <TouchableOpacity
                  className="border-2 border-white rounded-lg px-4 py-2"
                  onPress={() =>
                    handleViewCertificate(
                      filteredVaccinations[0].vaccination_record
                    )
                  }
                >
                  <Text className="text-white font-semibold text-sm">
                    View Latest
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Vaccination Records */}
            {filteredVaccinations.length === 0 ? (
              <View className="bg-gray-50 rounded-2xl p-8 items-center">
                <Feather name="clipboard" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-4 text-center">
                  No vaccination records found
                </Text>
              </View>
            ) : (
              filteredVaccinations.map((record) => {
                const statusInfo = getStatusInfo(record.expiration_date);
                return (
                  <View
                    key={record.vaccination_id}
                    className="bg-gray-50 rounded-2xl p-5 mb-4 border border-gray-200"
                  >
                    {/* Status Badge and Date */}
                    <View className="flex-row items-center justify-between mb-4">
                      <View
                        className="rounded-full px-4 py-2"
                        style={{ backgroundColor: statusInfo.statusColor }}
                      >
                        <Text
                          className="font-semibold text-sm"
                          style={{ color: statusInfo.statusTextColor }}
                        >
                          {statusInfo.status}
                        </Text>
                      </View>
                      <Text className="text-base text-black font-medium">
                        {dayjs(record.given_date).format("MMMM DD, YYYY")}
                      </Text>
                    </View>

                    {/* Record Details */}
                    <View className="space-y-2">
                      <View className="mb-2">
                        <Text className="text-base text-black">
                          <Text className="font-bold">Vaccine: </Text>
                          {record.vaccine_name}
                        </Text>
                      </View>

                      <View className="mb-2">
                        <Text className="text-base text-black">
                          <Text className="font-bold">Administered: </Text>
                          {dayjs(record.given_date).format("MMMM DD, YYYY")}
                        </Text>
                      </View>

                      <View className="mb-2">
                        <Text className="text-base text-black">
                          <Text className="font-bold">Expires: </Text>
                          {dayjs(record.expiration_date).format(
                            "MMMM DD, YYYY"
                          )}
                        </Text>
                      </View>

                      <View className="mb-2">
                        <Text className="text-base text-black">
                          <Text className="font-bold">Clinic: </Text>
                          {record.clinic_name}
                        </Text>
                      </View>

                      <View className="mb-3">
                        <Text className="text-base text-black">
                          <Text className="font-bold">Veterinarian: </Text>
                          {record.veterinarian_name}
                        </Text>
                      </View>

                      <TouchableOpacity
                        className="bg-[#FF6B4A] rounded-lg py-3 items-center"
                        onPress={() =>
                          handleViewCertificate(record.vaccination_record)
                        }
                      >
                        <Text className="text-white font-semibold">
                          View Certificate
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
