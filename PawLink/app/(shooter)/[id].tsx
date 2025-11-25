import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  getShooterProfile,
  type ShooterProfile,
  type ShooterPet,
} from "@/services/matchService";
import { API_BASE_URL } from "@/config/env";
import dayjs from "dayjs";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ShooterProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const shooterId = params.id as string;
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [shooterData, setShooterData] = useState<ShooterProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shooterId) {
      fetchShooterData();
    }
  }, [shooterId]);

  const fetchShooterData = async () => {
    try {
      setLoading(true);
      const profile = await getShooterProfile(parseInt(shooterId));
      console.log("Shooter profile data:", profile);
      console.log("Verification flags:", {
        id_verified: profile.id_verified,
        breeder_verified: profile.breeder_verified,
        shooter_verified: profile.shooter_verified,
      });
      setShooterData(profile);
    } catch (error: any) {
      console.error("Error fetching shooter data:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load shooter profile";
      showAlert({
        title: "Error",
        message: errorMessage,
        type: "error",
        buttons: [{ text: "Go Back", onPress: () => router.back() }],
      });
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    // If path already contains full URL, return as is
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;
    // Remove 'storage/' if already included in path
    const finalPath = cleanPath.startsWith("storage/")
      ? cleanPath
      : `storage/${cleanPath}`;
    const fullUrl = `${API_BASE_URL}/${finalPath}`;
    console.log("Image URL:", fullUrl);
    return fullUrl;
  };

  const calculateAge = (birthdate: string | undefined) => {
    if (!birthdate) return "";
    const birth = dayjs(birthdate);
    const now = dayjs();
    const years = now.diff(birth, "year");

    if (years > 0) {
      return `${years} Year${years > 1 ? "s" : ""} old`;
    }
    return "";
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#E8F4F8] items-center justify-center">
        <ActivityIndicator size="large" color="#ea5b3a" />
      </SafeAreaView>
    );
  }

  if (!shooterData) {
    return (
      <SafeAreaView className="flex-1 bg-[#E8F4F8] items-center justify-center">
        <Text className="text-gray-500">Shooter profile not found</Text>
      </SafeAreaView>
    );
  }

  const experienceYears = Math.ceil(shooterData.experience_years || 0);
  const age = Math.ceil(shooterData.age || 0);
  const stats = shooterData.statistics || {
    total_pets: 0,
    matched: 0,
    dog_count: 0,
    cat_count: 0,
    breeders_handled: 0,
    successful_shoots: 0,
  };
  const displayedBreeds = shooterData.breeds_handled || [];
  const heroThumbnail =
    shooterData.pets?.[0]?.profile_image || shooterData.profile_image;
  const ageText = shooterData.age ? `${shooterData.age} years old` : null;
  const genderText = shooterData.sex ? shooterData.sex : null;

  return (
    <SafeAreaView className="flex-1 bg-[#FFFDF7]" edges={["top"]}>
      {/* Header */}
      <View className="px-5 py-3 flex-row items-center justify-between bg-white shadow-sm">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#F5F5F5] items-center justify-center"
        >
          <Feather name="arrow-left" size={20} color="#111111" />
        </TouchableOpacity>
        <Text className="text-base font-extrabold tracking-wide uppercase text-black">
          {shooterData.name}
        </Text>
        <TouchableOpacity className="w-10 h-10 rounded-full bg-[#F5F5F5] items-center justify-center">
          <Feather name="more-horizontal" size={20} color="#111111" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section */}

        <View className="relative rounded-b-[36px] px-5 pt-5 pb-8">
          {/* Photo card */}
          <View className="rounded-[32px] overflow-hidden shadow-xl">
            {shooterData.profile_image ? (
              <Image
                source={{
                  uri: getImageUrl(shooterData.profile_image) || undefined,
                }}
                className="w-full h-[420px]"
                resizeMode="cover"
                onError={(e) =>
                  console.log("Image load error:", e.nativeEvent.error)
                }
              />
            ) : (
              <View className="w-full h-[420px] bg-[#F2F2F2] items-center justify-center">
                <Feather name="user" size={72} color="#D1D1D1" />
              </View>
            )}
          </View>
          {/* Info card overlay */}
          <View className=" -mt-12 bg-white rounded-[28px] px-6 py-5 flex-row items-start justify-between shadow-xl">
            <View className="flex-1 pr-3">
              <Text className="text-3xl font-extrabold text-[#111111] mb-1">
                {shooterData.name}
              </Text>
              {/* <Text className="text-base text-[#6B6B6B] font-medium mb-3">
                {shooterData.location || "Baliwasan"}
              </Text> */}
              <View className="flex-row gap-2 flex-wrap">
                {ageText && (
                  <View className="bg-[#FFF0D6] px-4 py-2 rounded-full">
                    <Text className="text-[#D9932B] text-xs font-semibold">
                      {ageText}
                    </Text>
                  </View>
                )}
                {genderText && (
                  <View className="bg-[#D5F0F5] px-4 py-2 rounded-full">
                    <Text className="text-[#2F7FD3] text-xs font-semibold capitalize">
                      {genderText}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View className="w-24 h-24 rounded-[20px] bg-[#FFD54F] items-center justify-center overflow-hidden shadow-md">
              {heroThumbnail ? (
                <Image
                  source={{ uri: getImageUrl(heroThumbnail) || undefined }}
                  className="w-full h-full"
                  resizeMode="cover"
                  onError={(e) =>
                    console.log("Thumbnail load error:", e.nativeEvent.error)
                  }
                />
              ) : (
                <Feather name="image" size={32} color="#B58200" />
              )}
            </View>
          </View>
          {/* Notch */}
          <View className="absolute bottom-0 left-0 right-0 items-center -z-10">
            <Image source={require("../../assets/images/notch.png")}></Image>
          </View>
        </View>

        {/* Common Breeds */}
        {displayedBreeds.length > 0 && (
          <View className="px-5 mt-6">
            <Text className="text-lg font-extrabold text-[#111111] mb-3">
              Common Breeds Handled
            </Text>
            <View className="bg-white rounded-[26px] px-4 py-4 shadow-md border border-[#F0F0F0]">
              <View className="flex-row justify-between">
                {displayedBreeds.slice(0, 3).map((breed, index) => (
                  <View key={breed + index} className="items-center w-1/3">
                    <View className="w-16 h-16 rounded-full bg-[#F6F6F6] border-2 border-white shadow items-center justify-center mb-2">
                      <Feather name="camera" size={20} color="#B5B5B5" />
                    </View>
                    <Text className="text-xs font-semibold text-[#333333]">
                      {breed}
                    </Text>
                    <Text className="text-[10px] text-[#9A9A9A]">Handled</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Shooter pets */}
        {shooterData.is_pet_owner &&
          shooterData.pets &&
          shooterData.pets.length > 0 && (
            <View className="px-5 mt-6">
              <Text className="text-lg font-extrabold text-[#111111] mb-3">
                {shooterData.name}'s Pets
              </Text>
              <View className="bg-white rounded-[26px] px-4 py-4 shadow-md border border-[#F0F0F0]">
                <View className="flex-row justify-between">
                  {shooterData.pets.slice(0, 3).map((pet) => (
                    <View key={pet.pet_id} className="items-center w-1/3">
                      <View className="relative w-16 h-16 rounded-full border-2 border-white shadow overflow-hidden mb-2">
                        {pet.profile_image ? (
                          <Image
                            source={{
                              uri: getImageUrl(pet.profile_image) || undefined,
                            }}
                            className="w-full h-full"
                            resizeMode="cover"
                            onError={(e) =>
                              console.log(
                                "Pet image load error:",
                                e.nativeEvent.error
                              )
                            }
                          />
                        ) : (
                          <View className="flex-1 bg-[#F6F6F6] items-center justify-center">
                            <Feather name="image" size={20} color="#B5B5B5" />
                          </View>
                        )}
                        <View
                          className={`absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center border border-white ${
                            pet.status === "Breeding"
                              ? "bg-[#F2654B]"
                              : "bg-[#4CAF50]"
                          }`}
                        >
                          <Feather
                            name={pet.status === "Breeding" ? "x" : "check"}
                            size={12}
                            color="white"
                          />
                        </View>
                      </View>
                      <Text className="text-xs font-semibold text-[#333333]">
                        {pet.name}
                      </Text>
                      <View
                        className={`px-3 py-0.5 rounded-full mt-1 ${
                          pet.status === "Breeding"
                            ? "bg-[#FFE3DF]"
                            : "bg-[#DEF5E7]"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-semibold ${
                            pet.status === "Breeding"
                              ? "text-[#E0553A]"
                              : "text-[#2E8B57]"
                          }`}
                        >
                          {pet.status}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

        {/* Stats cards */}
        <View className="px-5 mt-6">
          <View className="flex-row gap-4">
            <View className="flex-1 rounded-3xl bg-[#DCD3FF] px-4 py-5 items-center shadow">
              <Text className="text-3xl font-extrabold text-[#4F3FB6]">
                {stats.breeders_handled}
              </Text>
              <Text className="text-sm text-[#4F3FB6] mt-2">
                Breeding Handled
              </Text>
            </View>
            <View className="flex-1 rounded-3xl bg-[#FFD7D9] px-4 py-5 items-center shadow">
              <Text className="text-3xl font-extrabold text-[#C74B4B]">
                {stats.successful_shoots}
              </Text>
              <Text className="text-sm text-[#C74B4B] mt-2">Successful</Text>
            </View>
          </View>

          <View className="flex-row gap-4 mt-4">
            <View className="flex-1 rounded-3xl bg-[#FFE0DB] px-4 py-5 items-center shadow">
              <Text className="text-3xl font-extrabold text-[#C85945]">
                {stats.total_pets}
              </Text>
              <Text className="text-sm text-[#C85945] mt-2">Total pets</Text>
            </View>
            <View className="flex-1 rounded-3xl bg-[#DDF4EC] px-4 py-5 items-center shadow">
              <Text className="text-3xl font-extrabold text-[#3B8B6C]">
                {stats.matched}
              </Text>
              <Text className="text-sm text-[#3B8B6C] mt-2">Matched</Text>
            </View>
          </View>

          <View className="flex-row gap-4 mt-4">
            <View className="flex-1 rounded-3xl bg-[#FFF1E6] px-4 py-5 items-center shadow">
              <Text className="text-3xl font-extrabold text-[#D07A00]">
                {stats.dog_count}
              </Text>
              <Text className="text-sm text-[#D07A00] mt-2">Dog</Text>
            </View>
            <View className="flex-1 rounded-3xl bg-[#FFF9D7] px-4 py-5 items-center shadow">
              <Text className="text-3xl font-extrabold text-[#C4A300]">
                {stats.cat_count}
              </Text>
              <Text className="text-sm text-[#C4A300] mt-2">Cat</Text>
            </View>
          </View>
        </View>

        {/* Verification details */}
        {(shooterData.id_verified ||
          shooterData.breeder_verified ||
          shooterData.shooter_verified) && (
          <View className="px-5 mt-6">
            <View className="bg-white rounded-[28px] border border-[#E6E6E6] px-5 py-4 shadow-sm">
              <Text className="text-base font-extrabold text-[#111111] mb-3">
                Verification Status:
              </Text>
              <View className="gap-2">
                {shooterData.id_verified && (
                  <View className="flex-row items-center">
                    <Feather name="check-circle" size={18} color="#2D9E62" />
                    <Text className="ml-2 text-[#2D2D2D] font-medium">
                      Verified User
                    </Text>
                  </View>
                )}
                {shooterData.breeder_verified && (
                  <View className="flex-row items-center">
                    <Feather name="check-circle" size={18} color="#2D9E62" />
                    <Text className="ml-2 text-[#2D2D2D] font-medium">
                      Licensed Breeder
                    </Text>
                  </View>
                )}
                {shooterData.shooter_verified && (
                  <View className="flex-row items-center">
                    <Feather name="check-circle" size={18} color="#2D9E62" />
                    <Text className="ml-2 text-[#2D2D2D] font-medium">
                      Licensed Shooter
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Description */}
        <View className="px-5 mt-6 mb-10">
          <View className="bg-white rounded-[28px] border border-[#F1F1F1] px-5 py-5 shadow-sm">
            <Text className="text-base font-extrabold text-[#111111] mb-2">
              Description:
            </Text>
            <Text className="text-[#6B6B6B] leading-6 text-sm">
              Professional pet photographer with {experienceYears} year
              {experienceYears !== 1 ? "s" : ""} of experience. Specializing in
              capturing the unique personality and charm of your beloved pets.
              {shooterData.is_pet_owner &&
                " As a fellow pet owner, I understand the importance of preserving precious moments with your furry friends."}
            </Text>
          </View>
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
