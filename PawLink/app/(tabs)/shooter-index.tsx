import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { AnimatedSearchBar } from "@/components/app/AnimatedSearchBar";
import SettingsDropdown from "@/components/app/SettingsDropdown";
import { API_BASE_URL } from "@/config/env";
import {
  getShooterOffers,
  getMyShooterOffers,
  ShooterOffer,
} from "@/services/shooterService";
import { Feather } from "@expo/vector-icons";

export default function ShooterHomepage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [availableOffers, setAvailableOffers] = useState<ShooterOffer[]>([]);
  const [myOffers, setMyOffers] = useState<ShooterOffer[]>([]);
  const [currentHandling, setCurrentHandling] = useState<number>(0);

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const [available, my] = await Promise.all([
        getShooterOffers(),
        getMyShooterOffers(),
      ]);

      setAvailableOffers(available);
      setMyOffers(my);
      setCurrentHandling(
        my.filter((o) => o.shooter_status === "accepted_by_owners").length
      );
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleOfferPress = (offer: ShooterOffer) => {
    // If both owners have accepted, navigate to the conversation
    if (
      offer.shooter_status === "accepted_by_owners" &&
      offer.conversation_id
    ) {
      router.push(`/(chat)/conversation?id=${offer.conversation_id}`);
    } else {
      // Otherwise, show offer details
      router.push(`/(shooter)/offer-details?id=${offer.id}`);
    }
  };

  const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}/storage/${path}`;
  };

  const OfferCard = ({
    offer,
    showStatus = false,
  }: {
    offer: ShooterOffer;
    showStatus?: boolean;
  }) => {
    const isConfirmed = offer.shooter_status === "accepted_by_owners";

    return (
      <TouchableOpacity
        key={offer.id}
        className="w-[48%] mb-4 bg-white rounded-2xl overflow-hidden shadow-md"
        style={{ elevation: 4 }}
        onPress={() => handleOfferPress(offer)}
        activeOpacity={0.85}
      >
        {/* Pet Images */}
        <View className="relative">
          <View className="flex-row">
            {/* Pet 1 */}
            <View className="w-1/2 h-24 bg-gray-200">
              {offer.pet1.photo_url ? (
                <Image
                  source={{
                    uri: getImageUrl(offer.pet1.photo_url) || undefined,
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
              {offer.pet2.photo_url ? (
                <Image
                  source={{
                    uri: getImageUrl(offer.pet2.photo_url) || undefined,
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
          {/* Status Badge */}
          {showStatus && offer.shooter_status && (
            <View
              className={`absolute top-2 right-2 px-2 py-1 rounded-full ${
                isConfirmed ? "bg-green-500" : "bg-yellow-500"
              }`}
            >
              <Text className="text-white text-xs font-semibold">
                {isConfirmed ? "Confirmed" : "Pending"}
              </Text>
            </View>
          )}
          {/* Chat indicator for confirmed offers */}
          {showStatus && isConfirmed && (
            <View className="absolute bottom-2 left-2 bg-[#FF6B6B] px-2 py-1 rounded-full flex-row items-center">
              <Feather name="message-circle" size={12} color="white" />
              <Text className="text-white text-xs font-semibold ml-1">
                Chat Open
              </Text>
            </View>
          )}
        </View>

        {/* Card Content */}
        <View className="p-3">
          {/* Pet Names with icon */}
          <View className="flex-row items-center mb-2">
            <Text className="text-[#ea5b3a] mr-1">🐾</Text>
            <Text className="font-baloo text-sm text-[#111]" numberOfLines={1}>
              {offer.pet1.name} & {offer.pet2.name}
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
              {offer.owner1.name} & {offer.owner2.name}
            </Text>
          </View>

          {/* Fee */}
          <View className="flex-row items-center mb-2">
            <Text className="text-[#ea5b3a] mr-1">💰</Text>
            <Text className="text-xs font-semibold text-[#ea5b3a]">
              ₱{offer.payment?.toLocaleString() || 0}
            </Text>
          </View>

          {/* Location */}
          {offer.location && (
            <View className="flex-row items-center">
              <Text className="text-gray-500 mr-1">📍</Text>
              <Text className="text-xs text-gray-500" numberOfLines={1}>
                {offer.location}
              </Text>
            </View>
          )}
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

        {/* My Accepted Offers (pending owner confirmation or confirmed) */}
        {myOffers.length > 0 && (
          <View className="px-4 mb-4">
            <Text className="text-2xl font-baloo text-[#ea5b3a] mb-2">
              My Breeding Assignments
            </Text>
            <Text className="text-gray-600 text-sm mb-4">
              Tap confirmed assignments to open chat with both owners
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {myOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} showStatus={true} />
              ))}
            </View>
          </View>
        )}

        {/* Available Offers */}
        <View className="px-4">
          <Text className="text-2xl font-baloo text-[#ea5b3a] mb-4">
            Available Offers
          </Text>

          {loading ? (
            <View className="flex-row justify-center py-10">
              <ActivityIndicator size="large" color="#ea5b3a" />
            </View>
          ) : availableOffers.length === 0 ? (
            <View className="py-10 bg-white rounded-2xl">
              <Text className="text-center text-gray-500 mb-2">
                No available offers at the moment
              </Text>
              <Text className="text-center text-gray-400 text-sm">
                New breeding offers will appear here
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap justify-between">
              {availableOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} />
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
