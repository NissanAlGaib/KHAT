import React, { useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { X } from "lucide-react-native";
import { usePet } from "@/context/PetContext";
import { API_BASE_URL } from "@/config/env";
import dayjs from "dayjs";

interface PetSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

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

export default function PetSelectionModal({
  visible,
  onClose,
}: PetSelectionModalProps) {
  const { selectedPet, userPets, setSelectedPet, isLoading, loadUserPets } = usePet();

  // Refresh pets list whenever modal becomes visible
  useEffect(() => {
    if (visible) {
      loadUserPets();
    }
  }, [visible]);

  const handleSelectPet = async (pet: any) => {
    // Only allow selecting active pets that are NOT on cooldown
    if (pet.status !== "active" || pet.is_on_cooldown) {
      return;
    }
    await setSelectedPet(pet);
    onClose();
  };

  // Sort pets: active (not on cooldown) first, then cooldown, then pending/others
  const sortedPets = [...userPets].sort((a, b) => {
    // Available pets (active and not on cooldown) come first
    const aAvailable = a.status === "active" && !a.is_on_cooldown;
    const bAvailable = b.status === "active" && !b.is_on_cooldown;
    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;
    
    // Then cooldown pets
    const aCooldown = a.status === "active" && a.is_on_cooldown;
    const bCooldown = b.status === "active" && b.is_on_cooldown;
    if (aCooldown && !bCooldown) return -1;
    if (!aCooldown && bCooldown) return 1;
    
    return 0;
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-5">
        <View className="bg-white rounded-3xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <View className="px-6 pt-6 pb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-2xl font-baloo text-[#111111]">
                Choose Your Pet
              </Text>
              <TouchableOpacity
                onPress={onClose}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <X size={24} color="#111111" />
              </TouchableOpacity>
            </View>
            <Text className="text-gray-500 text-sm">
              Select a pet to find their perfect match
            </Text>
          </View>

          {/* Divider */}
          <View className="h-[1px] bg-gray-200 mx-6" />

          {/* Pet List */}
          <ScrollView className="max-h-96 px-6 py-4">
            {isLoading ? (
              <View className="py-10">
                <ActivityIndicator size="large" color="#ea5b3a" />
              </View>
            ) : sortedPets.length === 0 ? (
              <View className="py-10">
                <Text className="text-center text-gray-500">
                  No pets found. Add your first pet to get started!
                </Text>
              </View>
            ) : (
              <>
                {/* None option to deselect pet */}
                <TouchableOpacity
                  onPress={async () => {
                    await setSelectedPet(null);
                    onClose();
                  }}
                  className={`flex-row items-center p-4 rounded-2xl mb-3 ${
                    selectedPet === null
                      ? "bg-[#FFF5F3] border-2 border-[#ea5b3a]"
                      : "bg-gray-50"
                  }`}
                >
                  <View className="mr-3">
                    <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center">
                      <Text className="text-2xl">🔍</Text>
                    </View>
                  </View>
                  <View className="flex-1">
                    <Text className="font-baloo text-lg text-[#111111]">
                      None
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Browse all available pets
                    </Text>
                  </View>
                  {selectedPet === null ? (
                    <View className="w-12 h-12 rounded-full bg-[#ea5b3a] items-center justify-center">
                      <Text className="text-white text-xl font-bold">✓</Text>
                    </View>
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-[#ea5b3a] items-center justify-center">
                      <Text className="text-white text-sm font-semibold">
                        SELECT
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {sortedPets.map((pet) => {
                const isSelected = selectedPet?.pet_id === pet.pet_id;
                const primaryPhoto = pet.photos?.find((p) => p.is_primary);
                const photoUrl = primaryPhoto?.photo_url;
                const isActive = pet.status === "active";
                const isPending = pet.status === "pending_verification";
                const isOnCooldown = pet.is_on_cooldown;
                const isSelectable = isActive && !isOnCooldown;

                return (
                  <TouchableOpacity
                    key={pet.pet_id}
                    onPress={() => handleSelectPet(pet)}
                    disabled={!isSelectable}
                    className={`flex-row items-center p-4 rounded-2xl mb-3 ${
                      isSelected
                        ? "bg-[#FFF5F3] border-2 border-[#ea5b3a]"
                        : !isSelectable
                        ? "bg-gray-100 opacity-60"
                        : "bg-gray-50"
                    }`}
                  >
                    {/* Pet Photo */}
                    <View className="mr-3">
                      {photoUrl ? (
                        <Image
                          source={{
                            uri: `${API_BASE_URL}/storage/${photoUrl}`,
                          }}
                          className="w-16 h-16 rounded-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center">
                          <Text className="text-2xl">🐾</Text>
                        </View>
                      )}
                    </View>

                    {/* Pet Info */}
                    <View className="flex-1">
                      <Text className="font-baloo text-lg text-[#111111]">
                        {pet.name}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {pet.breed} - {calculateAge(pet.birthdate)}
                      </Text>
                    </View>

                    {/* Status Badge */}
                    {isOnCooldown ? (
                      <View className="bg-amber-100 px-3 py-1 rounded-full mr-3">
                        <Text className="text-xs text-amber-800 font-semibold">
                          ⏸ {pet.cooldown_days_remaining}d left
                        </Text>
                      </View>
                    ) : isActive ? (
                      <View className="bg-green-100 px-3 py-1 rounded-full mr-3">
                        <Text className="text-xs text-green-800 font-semibold">
                          Available
                        </Text>
                      </View>
                    ) : isPending ? (
                      <View className="bg-yellow-100 px-3 py-1 rounded-full mr-3">
                        <Text className="text-xs text-yellow-800 font-semibold">
                          Pending
                        </Text>
                      </View>
                    ) : null}

                    {/* Select Button */}
                    {isSelected ? (
                      <View className="w-12 h-12 rounded-full bg-[#ea5b3a] items-center justify-center">
                        <Text className="text-white text-xl font-bold">✓</Text>
                      </View>
                    ) : isSelectable ? (
                      <View className="w-12 h-12 rounded-full bg-[#ea5b3a] items-center justify-center">
                        <Text className="text-white text-sm font-semibold">
                          SELECT
                        </Text>
                      </View>
                    ) : (
                      <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center">
                        <Text className="text-gray-500 text-xs font-semibold">
                          N/A
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
