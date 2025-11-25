import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRole } from "@/context/RoleContext";
import { useRouter } from "expo-router";
import { useSession } from "@/context/AuthContext";
import { getPets } from "@/services/petService";
import {
  getUserProfile,
  getUserStatistics,
  type UserProfile,
  type UserStatistics,
} from "@/services/userService";
import {
  getVerificationStatus,
  type VerificationStatus,
} from "@/services/verificationService";
import { API_BASE_URL } from "@/config/env";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";

export default function ProfileScreen() {
  const { role, setRole } = useRole();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<
    VerificationStatus[]
  >([]);
  const [statistics, setStatistics] = useState<UserStatistics>({
    current_breeding: 0,
    total_matches: 0,
    success_rate: 0,
    income: 0,
  });
  const router = useRouter();
  const { signOut, user } = useSession();

  const fetchUserProfile = useCallback(async () => {
    try {
      const profile = await getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, []);

  const fetchPets = useCallback(async () => {
    try {
      const data = await getPets();
      setPets(data);
    } catch (error) {
      console.error("Error fetching pets:", error);
    }
  }, []);

  const fetchVerificationStatus = useCallback(async () => {
    try {
      if (user?.id) {
        const status = await getVerificationStatus(Number(user.id));
        setVerificationStatus(status);
      }
    } catch (error) {
      console.error("Error fetching verification status:", error);
    }
  }, [user?.id]);

  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await getUserStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchUserProfile(),
        fetchPets(),
        fetchVerificationStatus(),
        fetchStatistics(),
      ]);
    } catch (error) {
      console.error("Error fetching profile data:", error);
      showAlert({
        title: "Error",
        message: "Failed to load profile data",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile, fetchPets, fetchVerificationStatus, fetchStatistics, showAlert]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const getVerificationDisplay = () => {
    if (!verificationStatus || verificationStatus.length === 0) {
      return {
        text: "NOT VERIFIED",
        color: "text-gray-600",
        showButton: true,
      };
    }

    const idVerification = verificationStatus.find((v) => v.auth_type === "id");

    if (!idVerification) {
      return {
        text: "NOT VERIFIED",
        color: "text-gray-600",
        showButton: true,
      };
    }

    switch (idVerification.status) {
      case "approved":
        return {
          text: "VERIFIED ✓",
          color: "text-green-600",
          showButton: false,
        };
      case "pending":
        return {
          text: "PENDING VERIFICATION",
          color: "text-orange-500",
          showButton: false,
        };
      case "rejected":
        return {
          text: "VERIFICATION REJECTED",
          color: "text-red-600",
          showButton: true,
        };
      default:
        return {
          text: "NOT VERIFIED",
          color: "text-gray-600",
          showButton: true,
        };
    }
  };

  const handleLogout = async () => {
    try {
      await signOut?.();
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFF5F5]" edges={["top"]}>
      {/* Fixed Header with Shadow and Rounded Bottom */}
      <View className="bg-white rounded-b-[35] shadow-lg pb-6">
        <View className="px-6 pt-4">
          {/* Profile Section */}
          <View className="flex-row items-start justify-between">
            <View className="flex-row items-start gap-4">
              {/* Profile Image */}
              <View className="w-20 h-20 rounded-full bg-gray-300 overflow-hidden">
                {userProfile?.profile_image ? (
                  <Image
                    source={{
                      uri: `${API_BASE_URL}/storage/${userProfile.profile_image}`,
                    }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={require("@/assets/images/icon.png")}
                    className="w-20 h-20 rounded-full"
                  />
                )}
              </View>

              {/* Name and Verification */}
              <View className="">
                <Text className="text-2xl font-bold text-black">
                  {userProfile?.name || user?.name || "User"}
                </Text>
                <Text
                  className={`text-sm mt-1 font-semibold ${getVerificationDisplay().color}`}
                >
                  {getVerificationDisplay().text}
                </Text>
                {getVerificationDisplay().showButton && (
                  <TouchableOpacity
                    className="mt-2 border border-black rounded-full px-6 py-2 self-start"
                    onPress={() => router.push("/(verification)/verify")}
                  >
                    <Text className="text-black font-medium">
                      {getVerificationDisplay().text === "VERIFICATION REJECTED"
                        ? "Verify Again"
                        : "Verify Now"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Role dropdown (Shooter / Pet Owner) */}
            <View className="relative">
              <TouchableOpacity
                className="bg-[#FF6B4A] rounded-lg px-4 py-2"
                onPress={() => setMenuOpen((v) => !v)}
              >
                <Text className="text-white font-semibold">{role} ▼</Text>
              </TouchableOpacity>

              {menuOpen && (
                <View className="absolute right-0 mt-9 bg-white rounded-lg shadow-md p-2 px-5 z-50">
                  {/* Show the opposite role as selectable item */}
                  <TouchableOpacity
                    className="px-2 py-2"
                    onPress={() => {
                      const next =
                        role === "Pet Owner" ? "Shooter" : "Pet Owner";
                      setRole(next);
                      setMenuOpen(false);
                    }}
                  >
                    <Text className="text-xs text-[#FF6B4A] font-semibold">
                      {role === "Pet Owner" ? "Shooter" : "Pet Owner"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView className="flex-1 px-6 pt-6">
        {/* Pets Section */}
        <Text className="text-3xl font-bold text-black mb-4">PETS</Text>

        {/* Pets List */}
        {loading ? (
          <View className="flex-row items-center justify-center mb-6 py-10">
            <ActivityIndicator size="large" color="#FF6B4A" />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            <View className="flex-row items-center">
              {pets.map((pet) => {
                const statusColors: Record<string, string> = {
                  active: "bg-[#C8E6C9] text-green-800",
                  pending_verification: "bg-[#FFF9C4] text-orange-800",
                  disabled: "bg-gray-300 text-gray-600",
                  archived: "bg-red-100 text-red-800",
                };
                const statusLabels: Record<string, string> = {
                  active: "Available",
                  pending_verification: "Pending",
                  disabled: "Disabled",
                  archived: "Archived",
                };
                const colorClass =
                  statusColors[pet.status] || "bg-gray-200 text-gray-600";
                const [bgColorClass, textColorClass] = colorClass.split(" ");

                return (
                  <TouchableOpacity
                    key={pet.pet_id}
                    className="items-center mr-4"
                    onPress={() =>
                      router.push(`/(pet)/pet-profile?id=${pet.pet_id}`)
                    }
                  >
                    <View className="w-24 h-24 rounded-full bg-gray-300 mb-2 items-center justify-center overflow-hidden">
                      {pet.photos && pet.photos.length > 0 ? (
                        <Image
                          source={{
                            uri: `${API_BASE_URL}/storage/${pet.photos.find((p: any) => p.is_primary)?.photo_url || pet.photos[0].photo_url}`,
                          }}
                          className="w-full h-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <Image
                          source={require("@/assets/images/icon.png")}
                          className="w-full h-full"
                        />
                      )}
                    </View>
                    <Text className="text-base font-semibold text-black mb-1">
                      {pet.name}
                    </Text>
                    <View
                      className={bgColorClass + " px-4 py-1 rounded-full"}
                    >
                      <Text
                        className={"text-xs font-medium " + textColorClass}
                      >
                        {statusLabels[pet.status] || pet.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Add Pet Button */}
              <TouchableOpacity
                className="w-24 h-24 bg-gray-400 rounded-full items-center justify-center"
                onPress={() => router.push("/(verification)/add-pet")}
              >
                <Feather name="plus" size={32} color="white" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* Breeding Overview Section */}
        <Text className="text-3xl font-bold text-black mb-4">
          Breeding Overview
        </Text>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap px-5 gap-10 mb-6">
          {/* Current Breeding */}
          <View className="bg-[#FFB5A7] rounded-3xl p-6 flex-1 min-w-[30%] border-4 border-[#FF6B4A] shadow-md">
            <Text className="text-4xl font-bold text-black text-center">
              {statistics.current_breeding}
            </Text>
            <Text className="text-sm font-semibold text-black text-center mt-1">
              Current breeding
            </Text>
            <Text className="text-xs text-black text-center">Active pairs</Text>
            <View className="items-center mt-2">
              <Feather name="heart" size={32} color="#FF6B4A" />
            </View>
          </View>

          {/* Total Matches */}
          <View className="bg-[#FFB5A7] rounded-3xl p-6 flex-1 min-w-[30%] border-4 border-[#FF6B4A] shadow-md">
            <Text className="text-4xl font-bold text-black text-center">
              {statistics.total_matches}
            </Text>
            <Text className="text-sm font-semibold text-black text-center mt-1">
              Total Matches
            </Text>
            <Text className="text-xs text-black text-center">All time</Text>
            <View className="items-center mt-2">
              <Feather name="users" size={32} color="#FF6B4A" />
            </View>
          </View>

          {/* Success Rate */}
          <View className="bg-[#FFB5A7] rounded-3xl p-6 flex-1 min-w-[30%] border-4 border-[#FF6B4A] shadow-md">
            <Text className="text-4xl font-bold text-black text-center">
              {statistics.success_rate}
            </Text>
            <Text className="text-sm font-semibold text-black text-center mt-1">
              Success Rate
            </Text>
            <Text className="text-xs text-black text-center">Average</Text>
            <View className="items-center mt-2">
              <Feather name="trending-up" size={32} color="#FF6B4A" />
            </View>
          </View>

          {/* Income */}
          <View className="bg-[#FFB5A7] rounded-3xl p-6 flex-1 min-w-[30%] border-4 border-[#FF6B4A] shadow-md">
            <Text className="text-4xl font-bold text-black text-center">
              ₱{statistics.income.toFixed(2)}
            </Text>
            <Text className="text-sm font-semibold text-black text-center mt-1">
              Income
            </Text>
            <Text className="text-xs text-black text-center">Total</Text>
            <View className="items-center mt-2">
              <Feather name="dollar-sign" size={32} color="#FF6B4A" />
            </View>
          </View>
        </View>

        {/* Account Settings Section */}
        <View className="bg-white rounded-3xl p-6 mb-40 shadow-md">
          <View className="flex-row items-center mb-6">
            <Feather name="settings" size={28} color="#FF6B4A" />
            <Text className="text-2xl font-bold text-black ml-3">
              Account Settings
            </Text>
          </View>

          {/* Settings Options */}
          <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-200">
            <View className="flex-row items-center">
              <Feather name="user" size={24} color="#4A90E2" />
              <View className="ml-4">
                <Text className="text-base font-semibold text-black">
                  Account
                </Text>
                <Text className="text-sm text-gray-600">
                  Update your personal information
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color="gray" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-200">
            <View className="flex-row items-center">
              <Feather name="bell" size={24} color="#FFD700" />
              <View className="ml-4">
                <Text className="text-base font-semibold text-black">
                  Notification
                </Text>
                <Text className="text-sm text-gray-600">
                  Notification settings
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color="gray" />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-200">
            <View className="flex-row items-center">
              <Feather name="shield" size={24} color="#FF6B4A" />
              <View className="ml-4">
                <Text className="text-base font-semibold text-black">
                  Privacy & Security
                </Text>
                <Text className="text-sm text-gray-600">
                  Control your privacy setting
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color="gray" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between py-4"
            onPress={handleLogout}
          >
            <View className="flex-row items-center">
              <Feather name="log-out" size={24} color="#FF4444" />
              <View className="ml-4">
                <Text className="text-base font-semibold text-[#FF4444]">
                  Sign out
                </Text>
                <Text className="text-sm text-gray-600">
                  Log out your account
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={24} color="gray" />
          </TouchableOpacity>
        </View>
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
