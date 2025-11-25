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
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import { API_BASE_URL } from "@/config/env";
import {
  getShooterOfferDetails,
  acceptShooterOffer,
  ShooterOffer,
} from "@/services/shooterService";

export default function ShooterOfferDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const offerId = params.id as string;
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [offer, setOffer] = useState<ShooterOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const fetchOfferDetails = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getShooterOfferDetails(parseInt(offerId));
      setOffer(data);
    } catch (error: any) {
      console.error("Error fetching offer details:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load offer details";
      showAlert({
        title: "Error",
        message: errorMessage,
        type: "error",
        buttons: [{ text: "Go Back", onPress: () => router.back() }],
      });
    } finally {
      setLoading(false);
    }
  }, [offerId, showAlert, router]);

  useEffect(() => {
    if (offerId) {
      fetchOfferDetails();
    }
  }, [offerId, fetchOfferDetails]);

  const handleAcceptOffer = async () => {
    setAccepting(true);
    try {
      const result = await acceptShooterOffer(parseInt(offerId));
      showAlert({
        title: "Success",
        message: result.message || "Offer accepted successfully. Waiting for owners to confirm.",
        type: "success",
        buttons: [{ text: "OK", onPress: () => router.back() }],
      });
    } catch (error: any) {
      console.error("Error accepting offer:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to accept offer";
      showAlert({
        title: "Error",
        message: errorMessage,
        type: "error",
        buttons: [{ text: "OK" }],
      });
    } finally {
      setAccepting(false);
    }
  };

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    const finalPath = cleanPath.startsWith("storage/")
      ? cleanPath
      : `storage/${cleanPath}`;
    return `${API_BASE_URL}/${finalPath}`;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FFF5F5] items-center justify-center">
        <ActivityIndicator size="large" color="#ea5b3a" />
      </SafeAreaView>
    );
  }

  if (!offer) {
    return (
      <SafeAreaView className="flex-1 bg-[#FFF5F5] items-center justify-center">
        <Text className="text-gray-500">Offer not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FFF5F5]" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 bg-white flex-row items-center justify-between shadow-sm">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <Feather name="arrow-left" size={20} color="#111111" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Offer Details</Text>
        <View className="w-10" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Pet Images */}
        <View className="flex-row h-48">
          <View className="flex-1 bg-gray-200">
            {offer.pet1.photo_url ? (
              <Image
                source={{ uri: getImageUrl(offer.pet1.photo_url) || undefined }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center bg-[#FFE0D8]">
                <Feather name="image" size={40} color="#ea5b3a" />
              </View>
            )}
            <View className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded-full">
              <Text className="text-white text-sm font-semibold">{offer.pet1.name}</Text>
            </View>
          </View>
          <View className="flex-1 bg-gray-200">
            {offer.pet2.photo_url ? (
              <Image
                source={{ uri: getImageUrl(offer.pet2.photo_url) || undefined }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center bg-[#FFE0D8]">
                <Feather name="image" size={40} color="#ea5b3a" />
              </View>
            )}
            <View className="absolute bottom-2 right-2 bg-black/50 px-3 py-1 rounded-full">
              <Text className="text-white text-sm font-semibold">{offer.pet2.name}</Text>
            </View>
          </View>
        </View>

        {/* Payment Banner */}
        <View className="mx-4 mt-4 bg-[#ea5b3a] rounded-2xl p-5">
          <Text className="text-white text-sm mb-1">Payment Offer</Text>
          <Text className="text-white text-3xl font-bold">
            ₱{offer.payment?.toLocaleString() || 0}
          </Text>
        </View>

        {/* Pet Details */}
        <View className="mx-4 mt-4 bg-white rounded-2xl p-5">
          <Text className="text-lg font-bold text-gray-900 mb-4">Breeding Pair</Text>
          
          <View className="flex-row justify-between mb-4">
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">Pet 1</Text>
              <Text className="text-base font-semibold text-gray-900">{offer.pet1.name}</Text>
              <Text className="text-sm text-gray-600">{offer.pet1.breed}</Text>
              <Text className="text-xs text-gray-500">{offer.pet1.species} • {offer.pet1.sex}</Text>
            </View>
            <View className="flex-1 items-end">
              <Text className="text-xs text-gray-500 mb-1">Pet 2</Text>
              <Text className="text-base font-semibold text-gray-900">{offer.pet2.name}</Text>
              <Text className="text-sm text-gray-600">{offer.pet2.breed}</Text>
              <Text className="text-xs text-gray-500">{offer.pet2.species} • {offer.pet2.sex}</Text>
            </View>
          </View>
        </View>

        {/* Owners */}
        <View className="mx-4 mt-4 bg-white rounded-2xl p-5">
          <Text className="text-lg font-bold text-gray-900 mb-4">Pet Owners</Text>
          
          <View className="flex-row items-center mb-4">
            <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3 overflow-hidden">
              {offer.owner1.profile_image ? (
                <Image
                  source={{ uri: getImageUrl(offer.owner1.profile_image) || undefined }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Feather name="user" size={24} color="#9CA3AF" />
              )}
            </View>
            <View>
              <Text className="text-base font-semibold text-gray-900">{offer.owner1.name}</Text>
              <Text className="text-sm text-gray-500">Owner of {offer.pet1.name}</Text>
            </View>
          </View>

          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3 overflow-hidden">
              {offer.owner2.profile_image ? (
                <Image
                  source={{ uri: getImageUrl(offer.owner2.profile_image) || undefined }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Feather name="user" size={24} color="#9CA3AF" />
              )}
            </View>
            <View>
              <Text className="text-base font-semibold text-gray-900">{offer.owner2.name}</Text>
              <Text className="text-sm text-gray-500">Owner of {offer.pet2.name}</Text>
            </View>
          </View>
        </View>

        {/* Location */}
        {offer.location && (
          <View className="mx-4 mt-4 bg-white rounded-2xl p-5">
            <Text className="text-lg font-bold text-gray-900 mb-2">Location</Text>
            <View className="flex-row items-center">
              <Feather name="map-pin" size={18} color="#ea5b3a" />
              <Text className="ml-2 text-base text-gray-700">{offer.location}</Text>
            </View>
          </View>
        )}

        {/* Conditions */}
        {offer.conditions && (
          <View className="mx-4 mt-4 bg-white rounded-2xl p-5">
            <Text className="text-lg font-bold text-gray-900 mb-2">Conditions</Text>
            <Text className="text-base text-gray-700 leading-6">{offer.conditions}</Text>
          </View>
        )}

        {/* Contract Date */}
        {offer.end_contract_date && (
          <View className="mx-4 mt-4 bg-white rounded-2xl p-5">
            <Text className="text-lg font-bold text-gray-900 mb-2">Contract End Date</Text>
            <View className="flex-row items-center">
              <Feather name="calendar" size={18} color="#ea5b3a" />
              <Text className="ml-2 text-base text-gray-700">{offer.end_contract_date}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Accept Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4">
        <TouchableOpacity
          onPress={handleAcceptOffer}
          disabled={accepting}
          className={`py-4 rounded-full items-center ${accepting ? 'bg-gray-400' : 'bg-[#ea5b3a]'}`}
        >
          {accepting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">Accept This Offer</Text>
          )}
        </TouchableOpacity>
      </View>

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
