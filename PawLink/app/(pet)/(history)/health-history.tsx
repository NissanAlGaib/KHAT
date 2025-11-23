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

export default function HealthHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = params.petId as string;
  const recordType = (params.type as string) || "Health Certificate";

  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (petId) {
      fetchHealthRecords();
    }
  }, [petId]);

  const fetchHealthRecords = async () => {
    try {
      setLoading(true);
      const petData = await getPet(parseInt(petId));
      setHealthRecords(petData.health_records || []);
    } catch (error) {
      console.error("Error fetching health records:", error);
      Alert.alert("Error", "Failed to load health records");
    } finally {
      setLoading(false);
    }
  };

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
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#FF6B4A" />
            <Text className="text-gray-600 mt-4">
              Loading health records...
            </Text>
          </View>
        ) : (
          <>
            {/* Record Type Title Card */}
            <View className="bg-[#FF6B4A] rounded-2xl p-6 mb-6 flex-row items-center justify-between">
              <Text className="text-white text-xl font-bold uppercase">
                {recordType}
              </Text>
              {healthRecords.length > 0 && (
                <TouchableOpacity
                  className="border-2 border-white rounded-lg px-4 py-2"
                  onPress={() =>
                    handleViewCertificate(healthRecords[0].health_certificate)
                  }
                >
                  <Text className="text-white font-semibold text-sm">
                    View Latest
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Health Records */}
            {healthRecords.length === 0 ? (
              <View className="bg-gray-50 rounded-2xl p-8 items-center">
                <Feather name="file-text" size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-4 text-center">
                  No health records found
                </Text>
              </View>
            ) : (
              healthRecords.map((record) => (
                <View
                  key={record.health_record_id}
                  className="bg-gray-50 rounded-2xl p-5 mb-4 border border-gray-200"
                >
                  {/* Record Details */}
                  <View className="space-y-2">
                    <View className="mb-2">
                      <Text className="text-base text-black">
                        <Text className="font-bold">Record Type: </Text>
                        {record.record_type}
                      </Text>
                    </View>

                    <View className="mb-2">
                      <Text className="text-base text-black">
                        <Text className="font-bold">Date Issued: </Text>
                        {dayjs(record.given_date).format("MMMM DD, YYYY")}
                      </Text>
                    </View>

                    <View className="mb-2">
                      <Text className="text-base text-black">
                        <Text className="font-bold">Expires: </Text>
                        {dayjs(record.expiration_date).format("MMMM DD, YYYY")}
                      </Text>
                    </View>

                    <View className="mb-2">
                      <Text className="text-base text-black">
                        <Text className="font-bold">Clinic: </Text>
                        {record.clinic_name}
                      </Text>
                    </View>

                    <View className="mb-2">
                      <Text className="text-base text-black">
                        <Text className="font-bold">Veterinarian: </Text>
                        {record.veterinarian_name}
                      </Text>
                    </View>

                    {record.notes && (
                      <View className="mb-3">
                        <Text className="text-base text-black">
                          <Text className="font-bold">Notes: </Text>
                          {record.notes}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      className="bg-[#FF6B4A] rounded-lg py-3 items-center mt-2"
                      onPress={() =>
                        handleViewCertificate(record.health_certificate)
                      }
                    >
                      <Text className="text-white font-semibold">
                        View Certificate
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
