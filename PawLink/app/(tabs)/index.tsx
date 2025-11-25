import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useSession } from "@/context/AuthContext";
import { usePet } from "@/context/PetContext";
import { useRole } from "@/context/RoleContext";
import { useNotifications } from "@/context/NotificationContext";
import { AnimatedSearchBar } from "@/components/app/AnimatedSearchBar";
import SettingsDropdown from "@/components/app/SettingsDropdown";
import {
  getTopMatches,
  getShooters,
  getAllAvailablePets,
  type PetMatch,
  type TopMatch,
  type ShooterProfile,
} from "@/services/matchService";
import { API_BASE_URL } from "@/config/env";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import ShooterHomepage from "./shooter-index";

const { width: SCREEN_W } = Dimensions.get("window");

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

function BannerCarousel({ images }: { images: any[] }) {
  const scrollRef = useRef<ScrollView | null>(null);
  const [index, setIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState<number>(SCREEN_W);

  const onMomentum = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const pageWidth = e.nativeEvent.layoutMeasurement?.width ?? containerWidth;
    const newIndex = Math.round(x / pageWidth);
    setIndex(newIndex);
  };

  return (
    <View
      className="w-full items-center"
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w && w !== containerWidth) setContainerWidth(w);
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentum}
        className="w-full"
      >
        {images.map((src, i) => (
          <View key={i} style={{ width: containerWidth, alignItems: "center" }}>
            <Image
              source={src}
              style={{
                width: Math.round(containerWidth * 0.9),
                height: 192,
                borderRadius: 16,
              }}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>

      <View className="flex-row items-center justify-center mt-2 space-x-2 gap-2">
        {images.map((_, i) => (
          <View
            key={i}
            className={`rounded-full ${i === index ? "bg-[#ea5b3a]" : "bg-gray-300"}`}
            style={{
              width: i === index ? 8 : 6,
              height: i === index ? 8 : 6,
            }}
          />
        ))}
      </View>
    </View>
  );
}

function TopMatches({ matches }: { matches: TopMatch[] }) {
  const router = useRouter();
  const { selectedPet } = usePet();

  // Show placeholder if no matches
  if (!matches || matches.length === 0) {
    return (
      <View className="w-[90%] mt-6 self-center bg-[#F9DCDC] rounded-2xl p-4 border-[2px] border-white">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full items-center justify-center mr-3">
            <Image
              source={require("@/assets/images/Heart_Icon.png")}
              className="w-15 h-15"
            />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-baloo text-[#ea5b3a]">
              No Matches Yet
            </Text>
            <Text className="text-gray-500 text-sm">
              {selectedPet
                ? `No matches found for ${selectedPet.name}`
                : "Select a pet to find perfect matches"}
            </Text>
          </View>
        </View>

        {!selectedPet && (
          <TouchableOpacity
            className="mt-4 bg-[#ea5b3a] rounded-full py-3 px-6"
            onPress={() => router.push("/(verification)/add-pet")}
          >
            <Text className="text-white text-center font-semibold">
              Add Your First Pet
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Filter matches to only show those involving the selected pet
  const filteredMatches = selectedPet
    ? matches.filter(
        (match) =>
          match.pet1.pet_id === selectedPet.pet_id ||
          match.pet2.pet_id === selectedPet.pet_id
      )
    : matches;

  if (filteredMatches.length === 0) {
    return (
      <View className="w-[90%] mt-6 self-center bg-[#F9DCDC] rounded-2xl p-4 border-[2px] border-white">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full items-center justify-center mr-3">
            <Image
              source={require("@/assets/images/Heart_Icon.png")}
              className="w-15 h-15"
            />
          </View>
          <View className="flex-1">
            <Text className="text-lg font-baloo text-[#ea5b3a]">
              No Matches Yet
            </Text>
            <Text className="text-gray-500 text-sm">
              No matches found for {selectedPet?.name}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const topMatch = filteredMatches[0];

  return (
    <View className="w-[90%] mt-6 self-center bg-[#F9DCDC] rounded-2xl p-4 border-[2px] border-white">
      <View className="flex-row items-center">
        <View className="w-12 h-12 rounded-full items-center justify-center mr-3">
          <Image
            source={require("@/assets/images/Heart_Icon.png")}
            className="w-15 h-15"
          />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-baloo text-[#ea5b3a]">
            Perfect Match Found!
          </Text>
          <Text className="text-gray-500 text-sm">
            Based on your profile pet and preference
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mt-4">
        <View className="flex-row -space-x-3">
          {topMatch.pet1.photo_url && (
            <Image
              source={{
                uri: `${API_BASE_URL}/storage/${topMatch.pet1.photo_url}`,
              }}
              className="w-12 h-12 rounded-full border-4 border-white"
            />
          )}
          {topMatch.pet2.photo_url && (
            <Image
              source={{
                uri: `${API_BASE_URL}/storage/${topMatch.pet2.photo_url}`,
              }}
              className="w-12 h-12 rounded-full border-4 border-white"
              style={{ marginLeft: -12 }}
            />
          )}
        </View>

        <View className="flex-1 pl-4">
          <Text className="font-baloo text-base">
            {topMatch.pet1.name} & {topMatch.pet2.name}
          </Text>
          <Text className="text-sm text-gray-400">
            {topMatch.compatibility_score}% compatibility
          </Text>
        </View>

        <View>
          <TouchableOpacity>
            <Image
              source={require("@/assets/images/AI_Rec.png")}
              className="w-15 h-15"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function Homepage() {
  const { role } = useRole();
  const { badgeCount, hasRejected, refreshBadgeCount } = useNotifications();
  const [selectedTab, setSelectedTab] = useState<"pets" | "shooters">("pets");
  const [loading, setLoading] = useState(true);
  const [allPets, setAllPets] = useState<PetMatch[]>([]);
  const [topMatches, setTopMatches] = useState<TopMatch[]>([]);
  const [shooters, setShooters] = useState<ShooterProfile[]>([]);
  const router = useRouter();
  const { user } = useSession();
  const { selectedPet } = usePet();

  const bannerImages = [
    require("../../assets/images/Homepage_Banner.png"),
    require("../../assets/images/Homepage_Banner.png"),
    require("../../assets/images/Homepage_Banner.png"),
  ];

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [pets, tops, shootersList] = await Promise.all([
        getAllAvailablePets(),
        getTopMatches(),
        getShooters(),
      ]);
      setAllPets(pets);
      setTopMatches(tops);

      const filteredShooters = shootersList.filter(
        (shooter) => shooter.id !== Number(user?.id)
      );

      setShooters(filteredShooters);
    } catch (error) {
      console.error("Error fetching homepage data:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
    // Refresh notification badge count when homepage loads
    refreshBadgeCount();
  }, [selectedPet, fetchData, refreshBadgeCount]); // Refetch when selected pet changes

  // If role is Shooter, show ShooterHomepage
  if (role === "Shooter") {
    return <ShooterHomepage />;
  }

  const PetsGrid = () => (
    <View className="px-4">
      <Text className="text-2xl font-baloo text-[#ea5b3a] mb-4">
        All Available Pets
      </Text>
      {loading ? (
        <View className="flex-row justify-center py-10">
          <ActivityIndicator size="large" color="#ea5b3a" />
        </View>
      ) : allPets.length === 0 ? (
        <View className="py-10">
          <Text className="text-center text-gray-500">
            No pets available at the moment
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap justify-between">
          {allPets.map((pet) => {
            const primaryPhoto =
              pet.photos?.find((p) => p.is_primary) || pet.photos?.[0];
            return (
              <TouchableOpacity
                key={pet.pet_id}
                className="w-[48%] mb-4 bg-white rounded-2xl overflow-hidden shadow"
                style={{ elevation: 4 }}
                onPress={() =>
                  router.push(`/(pet)/view-profile?id=${pet.pet_id}`)
                }
              >
                <View className="relative">
                  {primaryPhoto?.photo_url ? (
                    <Image
                      source={{
                        uri: `${API_BASE_URL}/storage/${primaryPhoto.photo_url}`,
                      }}
                      className="w-full h-36"
                      resizeMode="cover"
                    />
                  ) : (
                    <Image
                      source={require("@/assets/images/icon.png")}
                      className="w-full h-36"
                      resizeMode="cover"
                    />
                  )}
                </View>
                <View className="p-3">
                  <Text
                    className="font-baloo text-lg text-[#111]"
                    numberOfLines={1}
                  >
                    {pet.name}
                  </Text>
                  <Text className="text-gray-400 text-sm" numberOfLines={1}>
                    {pet.breed}
                  </Text>
                  <View className="flex-row flex-wrap gap-2 mt-3">
                    <View className="bg-yellow-100 px-2 py-1 rounded-full">
                      <Text
                        className="text-xs text-yellow-800"
                        numberOfLines={1}
                      >
                        {calculateAge(pet.birthdate)}
                      </Text>
                    </View>
                    <View
                      className={`px-2 py-1 rounded-full ${
                        pet.sex?.toLowerCase() === "female"
                          ? "bg-pink-100"
                          : "bg-blue-100"
                      }`}
                    >
                      <Text
                        className={`text-xs ${
                          pet.sex?.toLowerCase() === "female"
                            ? "text-pink-700"
                            : "text-blue-700"
                        }`}
                        numberOfLines={1}
                      >
                        {pet.sex}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );

  const ShootersList = () => {
    const IMAGE_HEIGHT = 160;
    return (
      <View className="px-4">
        <Text className="text-2xl font-baloo text-[#ea5b3a] mb-4">
          Shooters
        </Text>

        {loading ? (
          <View className="flex-row justify-center py-10">
            <ActivityIndicator size="large" color="#ea5b3a" />
          </View>
        ) : shooters.length === 0 ? (
          <View className="py-10">
            <Text className="text-center text-gray-500">
              No verified shooters available at the moment
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {shooters.map((shooter) => {
              const age = Math.ceil(shooter.age || 0);
              const experienceYears = Math.ceil(shooter.experience_years || 0);

              return (
                <TouchableOpacity
                  key={shooter.id}
                  onPress={() => router.push(`/(shooter)/${shooter.id}`)}
                  activeOpacity={0.85}
                  className="w-[48%] mb-4 bg-white rounded-2xl overflow-hidden"
                  style={{ elevation: 4 }}
                >
                  <View style={{ position: "relative", height: IMAGE_HEIGHT }}>
                    {shooter.profile_image ? (
                      <Image
                        source={{
                          uri: shooter.profile_image.startsWith("http")
                            ? shooter.profile_image
                            : `${API_BASE_URL}/${shooter.profile_image.startsWith("storage/") ? shooter.profile_image : `storage/${shooter.profile_image}`}`,
                        }}
                        style={{
                          width: "100%",
                          height: IMAGE_HEIGHT,
                          borderTopLeftRadius: 16,
                          borderTopRightRadius: 16,
                        }}
                        resizeMode="cover"
                        onError={(e) =>
                          console.log(
                            "Homepage shooter image error:",
                            shooter.name,
                            e.nativeEvent.error
                          )
                        }
                      />
                    ) : (
                      <Image
                        source={require("@/assets/images/icon.png")}
                        style={{
                          width: "100%",
                          height: IMAGE_HEIGHT,
                          borderTopLeftRadius: 16,
                          borderTopRightRadius: 16,
                        }}
                        resizeMode="cover"
                      />
                    )}

                    {shooter.is_pet_owner && (
                      <View
                        style={{
                          position: "absolute",
                          right: 12,
                          top: IMAGE_HEIGHT - 16,
                          backgroundColor: "#ea5b3a",
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 20,
                          elevation: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontSize: 12,
                            fontFamily: "Mulish",
                          }}
                        >
                          Pet Owner
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="p-3 mt-0">
                    <Text
                      className="font-baloo text-lg text-[#111]"
                      numberOfLines={1}
                    >
                      {shooter.name}
                    </Text>

                    <View className="flex-row flex-wrap gap-2 mt-3">
                      <View className="bg-yellow-100 px-2 py-1 rounded-full">
                        <Text
                          className="text-xs text-yellow-800"
                          numberOfLines={1}
                        >
                          {age} year{age !== 1 ? "s" : ""} old
                        </Text>
                      </View>
                      {shooter.sex && (
                        <View
                          className={`px-2 py-1 rounded-full ${
                            shooter.sex?.toLowerCase() === "female"
                              ? "bg-pink-100"
                              : "bg-blue-100"
                          }`}
                        >
                          <Text
                            className={`text-xs ${
                              shooter.sex?.toLowerCase() === "female"
                                ? "text-pink-700"
                                : "text-blue-700"
                            }`}
                            numberOfLines={1}
                          >
                            {shooter.sex}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="mt-3">
                      <Text className="text-sm text-gray-400" numberOfLines={1}>
                        {experienceYears} year{experienceYears !== 1 ? "s" : ""}{" "}
                        experience
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 items-center bg-[#FFE0D8] relative">
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
            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              className="relative"
            >
              <Image
                className=""
                source={require("../../assets/images/Notif_Icon.png")}
              />
              {badgeCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </Text>
                </View>
              )}
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
        {/* Selected Pet Indicator */}
        {selectedPet && (
          <View className="w-[90%] self-center mb-4 bg-white rounded-2xl p-3 flex-row items-center border-2 border-[#ea5b3a]">
            <View className="mr-3">
              {selectedPet.photos?.find((p) => p.is_primary)?.photo_url ? (
                <Image
                  source={{
                    uri: `${API_BASE_URL}/storage/${
                      selectedPet.photos.find((p) => p.is_primary)?.photo_url
                    }`,
                  }}
                  className="w-12 h-12 rounded-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-[#FFE0D8] items-center justify-center">
                  <Text className="text-2xl">🐾</Text>
                </View>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500">Currently Viewing</Text>
              <Text className="font-baloo text-base text-[#111111]">
                {selectedPet.name}
              </Text>
            </View>
            <View className="bg-[#ea5b3a] px-3 py-1 rounded-full">
              <Text className="text-white text-xs font-semibold">ACTIVE</Text>
            </View>
          </View>
        )}

        <BannerCarousel images={bannerImages} />
        <TopMatches matches={topMatches} />

        <View className="flex-row items-center justify-center my-6 gap-4">
          <TouchableOpacity
            onPress={() => setSelectedTab("pets")}
            className={`px-6 py-2 rounded-full ${
              selectedTab === "pets" ? "bg-[#ea5b3a]" : "bg-white"
            }`}
            style={selectedTab === "pets" ? { elevation: 6 } : { elevation: 0 }}
          >
            <Text
              className={`font-mulish ${
                selectedTab === "pets" ? "text-white" : "text-[#ea5b3a]"
              }`}
            >
              PETS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedTab("shooters")}
            className={`px-6 py-2 rounded-full ${
              selectedTab === "shooters" ? "bg-[#ea5b3a]" : "bg-white"
            }`}
            style={
              selectedTab === "shooters" ? { elevation: 6 } : { elevation: 0 }
            }
          >
            <Text
              className={`font-mulish ${
                selectedTab === "shooters" ? "text-white" : "text-[#ea5b3a]"
              }`}
            >
              SHOOTERS
            </Text>
          </TouchableOpacity>
        </View>
        {selectedTab === "pets" ? <PetsGrid /> : <ShootersList />}
      </ScrollView>
    </View>
  );
}
