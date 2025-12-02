import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  Alert,
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
import { getVerificationStatus, type VerificationStatus } from "@/services/verificationService";
import { API_BASE_URL } from "@/config/env";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
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
      style={[styles.carouselContainer, { width: containerWidth }]}
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
        style={{ width: containerWidth }}
      >
        {images.map((src, i) => (
          <View key={i} style={{ width: containerWidth, alignItems: "center" }}>
            <Image source={src} style={styles.bannerImage} resizeMode="cover" />
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {images.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function TopMatches({ matches, onAddPetPress }: { matches: TopMatch[], onAddPetPress: () => void }) {
  const router = useRouter();
  const { selectedPet } = usePet();

  // Show placeholder if no matches
  if (!matches || matches.length === 0) {
    return (
      <View style={styles.topMatchPlaceholder}>
        <View style={styles.topMatchContent}>
          <Image
            source={require("@/assets/images/Heart_Icon.png")}
            style={styles.topMatchIcon}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.topMatchTitle}>No Matches Yet</Text>
            <Text style={styles.topMatchSubtitle}>
              {selectedPet
                ? `No matches found for ${selectedPet.name}`
                : "Select a pet to find perfect matches"}
            </Text>
          </View>
        </View>

        {!selectedPet && (
          <TouchableOpacity
            style={styles.topMatchActionButton}
            onPress={onAddPetPress}
          >
            <Text style={styles.topMatchActionButtonText}>
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
      <View style={styles.topMatchPlaceholder}>
        <View style={styles.topMatchContent}>
          <Image
            source={require("@/assets/images/Heart_Icon.png")}
            style={styles.topMatchIcon}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.topMatchTitle}>No Matches Yet</Text>
            <Text style={styles.topMatchSubtitle}>
              No matches found for {selectedPet?.name}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const topMatch = filteredMatches[0];

  return (
    <View style={styles.topMatchContainer}>
      <View style={styles.topMatchContent}>
        <Image
          source={require("@/assets/images/Heart_Icon.png")}
          style={styles.topMatchIcon}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.topMatchTitle}>Perfect Match Found!</Text>
          <Text style={styles.topMatchSubtitle}>
            Based on your profile pet and preference
          </Text>
        </View>
      </View>

      <View style={styles.matchDetails}>
        <View style={styles.matchAvatars}>
          {topMatch.pet1.photo_url && (
            <Image
              source={{
                uri: `${API_BASE_URL}/storage/${topMatch.pet1.photo_url}`,
              }}
              style={styles.matchAvatar}
            />
          )}
          {topMatch.pet2.photo_url && (
            <Image
              source={{
                uri: `${API_BASE_URL}/storage/${topMatch.pet2.photo_url}`,
              }}
              style={[styles.matchAvatar, { marginLeft: -12 }]}
            />
          )}
        </View>

        <View style={{ flex: 1, paddingLeft: 16 }}>
          <Text style={styles.matchNames}>
            {topMatch.pet1.name} & {topMatch.pet2.name}
          </Text>
          <Text style={styles.matchCompatibility}>
            {topMatch.compatibility_score}% compatibility
          </Text>
        </View>

        <TouchableOpacity>
          <Image
            source={require("@/assets/images/AI_Rec.png")}
            style={styles.aiRecIcon}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function Homepage() {
  const { role } = useRole();
  const { badgeCount, refreshBadgeCount } = useNotifications();
  const [selectedTab, setSelectedTab] = useState<"pets" | "shooters">("pets");
  const [loading, setLoading] = useState(true);
  const [allPets, setAllPets] = useState<PetMatch[]>([]);
  const [topMatches, setTopMatches] = useState<TopMatch[]>([]);
  const [shooters, setShooters] = useState<ShooterProfile[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus[]>([]);
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
      const [pets, tops, shootersList, verification] = await Promise.all([
        getAllAvailablePets(),
        getTopMatches(),
        getShooters(),
        user?.id ? getVerificationStatus(Number(user.id)) : Promise.resolve([]),
      ]);
      setAllPets(pets);
      setTopMatches(tops);
      setVerificationStatus(verification);

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

  // Check if user has approved ID verification
  const isIdVerified = () => {
    if (!verificationStatus || verificationStatus.length === 0) return false;
    const idVerification = verificationStatus.find((v) => v.auth_type === "id");
    return idVerification?.status === "approved";
  };

  // Handle add pet button - check verification first
  const handleAddPetPress = () => {
    if (!isIdVerified()) {
      Alert.alert(
        "Verification Required",
        "You must complete identity verification before adding a pet",
        [
          {
            text: "Verify Now",
            onPress: () => {
              router.push("/(verification)/verify");
            },
          },
          { text: "Later", style: "cancel" },
        ]
      );
      return;
    }
    router.push("/(verification)/add-pet");
  };

  // If role is Shooter, show ShooterHomepage
  if (role === "Shooter") {
    return <ShooterHomepage />;
  }

  const PetsGrid = () => (
    <View style={styles.sectionPadding}>
      <Text style={styles.sectionTitle}>All Available Pets</Text>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ea5b3a" />
        </View>
      ) : allPets.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>
            No pets available at the moment
          </Text>
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {allPets.map((pet) => {
            const primaryPhoto =
              pet.photos?.find((p) => p.is_primary) || pet.photos?.[0];
            return (
              <TouchableOpacity
                key={pet.pet_id}
                style={styles.gridItem}
                onPress={() =>
                  router.push(`/(pet)/view-profile?id=${pet.pet_id}`)
                }
              >
                <View style={styles.gridImageContainer}>
                  {primaryPhoto?.photo_url ? (
                    <Image
                      source={{
                        uri: `${API_BASE_URL}/storage/${primaryPhoto.photo_url}`,
                      }}
                      style={styles.gridImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <Image
                      source={require("@/assets/images/icon.png")}
                      style={styles.gridImage}
                      resizeMode="cover"
                    />
                  )}
                </View>
                <View style={styles.gridContent}>
                  <Text style={styles.gridTitle} numberOfLines={1}>
                    {pet.name}
                  </Text>
                  <Text style={styles.gridSubtitle} numberOfLines={1}>
                    {pet.breed}
                  </Text>
                  <View style={styles.infoChipContainer}>
                    <InfoChip
                      text={calculateAge(pet.birthdate)}
                      backgroundColor="#FFF4E6"
                      textColor="#D97706"
                    />
                    <InfoChip
                      text={pet.sex}
                      backgroundColor={
                        pet.sex?.toLowerCase() === "female"
                          ? "#FFE4E6"
                          : "#E0F2FE"
                      }
                      textColor={
                        pet.sex?.toLowerCase() === "female"
                          ? "#BE123C"
                          : "#0284C7"
                      }
                    />
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
      <View style={styles.sectionPadding}>
        <Text style={styles.sectionTitle}>Shooters</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ea5b3a" />
          </View>
        ) : shooters.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>
              No verified shooters available at the moment
            </Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {shooters.map((shooter) => {
              const age = Math.ceil(shooter.age || 0);
              const experienceYears = Math.ceil(shooter.experience_years || 0);

              return (
                <TouchableOpacity
                  key={shooter.id}
                  onPress={() => router.push(`/(shooter)/${shooter.id}`)}
                  activeOpacity={0.85}
                  style={styles.gridItem}
                >
                  <View style={{ position: "relative", height: IMAGE_HEIGHT }}>
                    {shooter.profile_image ? (
                      <Image
                        source={{
                          uri: shooter.profile_image.startsWith("http")
                            ? shooter.profile_image
                            : `${API_BASE_URL}/${shooter.profile_image.startsWith("storage/") ? shooter.profile_image : `storage/${shooter.profile_image}`}`,
                        }}
                        style={styles.gridImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Image
                        source={require("@/assets/images/icon.png")}
                        style={styles.gridImage}
                        resizeMode="cover"
                      />
                    )}

                    {shooter.is_pet_owner && (
                      <View style={styles.shooterOwnerBadge}>
                        <Text style={styles.shooterOwnerBadgeText}>
                          Pet Owner
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.gridContent}>
                    <Text style={styles.gridTitle} numberOfLines={1}>
                      {shooter.name}
                    </Text>

                    <View style={styles.infoChipContainer}>
                      <InfoChip
                        text={`${age} yrs old`}
                        backgroundColor="#FFF4E6"
                        textColor="#D97706"
                      />
                      {shooter.sex && (
                        <InfoChip
                          text={shooter.sex}
                          backgroundColor={
                            shooter.sex?.toLowerCase() === "female"
                              ? "#FFE4E6"
                              : "#E0F2FE"
                          }
                          textColor={
                            shooter.sex?.toLowerCase() === "female"
                              ? "#BE123C"
                              : "#0284C7"
                          }
                        />
                      )}
                    </View>

                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.gridSubtitle} numberOfLines={1}>
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

  const renderContent = () => {
    return selectedTab === "pets" ? <PetsGrid /> : <ShootersList />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>PAWLINK</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => router.push("/subscription")}>
              <Image
                source={require("../../assets/images/Subscription_Icon.png")}
                style={styles.iconImage}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              style={styles.notificationIcon}
            >
              <Image
                source={require("../../assets/images/Notif_Icon.png")}
                style={styles.iconImage}
              />
              {badgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerBottomRow}>
          <AnimatedSearchBar />
          <TouchableOpacity style={styles.filterIconContainer} onPress={() => console.log("Open Filter!")}>
            <Feather name="filter" size={24} color="#FF6B4A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Pet Indicator */}
        {selectedPet && (
          <View style={styles.selectedPetCard}>
            <View style={styles.selectedPetInfo}>
              {selectedPet.photos?.find((p) => p.is_primary)?.photo_url ? (
                <Image
                  source={{
                    uri: `${API_BASE_URL}/storage/${
                      selectedPet.photos.find((p) => p.is_primary)?.photo_url
                    }`,
                  }}
                  style={styles.selectedPetImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.selectedPetImage,
                    styles.selectedPetImagePlaceholder,
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>🐾</Text>
                </View>
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.selectedPetLabel}>Currently Viewing</Text>
              <Text style={styles.selectedPetName}>{selectedPet.name}</Text>
            </View>
            <View style={styles.selectedPetStatusBadge}>
              <Text style={styles.selectedPetStatusText}>ACTIVE</Text>
            </View>
          </View>
        )}

        <BannerCarousel images={bannerImages} />
        <TopMatches matches={topMatches} onAddPetPress={handleAddPetPress} />

        <View style={styles.tabSwitcherContainer}>
          <TabButton
            title="Pets"
            isActive={selectedTab === "pets"}
            onPress={() => setSelectedTab("pets")}
          />
          <TabButton
            title="Shooters"
            isActive={selectedTab === "shooters"}
            onPress={() => setSelectedTab("shooters")}
          />
        </View>

        {renderContent()}
      </ScrollView>
    </View>
  );
}

const TabButton = ({
  title,
  isActive,
  onPress,
}: {
  title: string;
  isActive: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.tabButton, isActive && styles.tabButtonActive]}
    onPress={onPress}
  >
    <Text
      style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

const InfoChip = ({
  text,
  backgroundColor,
  textColor,
}: {
  text: string;
  backgroundColor: string;
  textColor: string;
}) => (
  <View style={[styles.infoChip, { backgroundColor }]}>
    <Text style={[styles.infoChipText, { color: textColor }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFE0D8" },
  header: {
    backgroundColor: "white",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 24,
    paddingTop: 50, // For SafeArea
    paddingBottom: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginBottom: 20, // Space below header
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerTitle: {
    color: "#ea5b3a",
    fontSize: 32,
    fontWeight: "bold",
    opacity: 0.7,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconImage: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  notificationIcon: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -10,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  headerBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // Added for filter icon
    gap: 10, 
  },
  filterIconContainer: {
    padding: 8,
    backgroundColor: 'white',
    borderRadius: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scrollViewContent: { paddingBottom: 100 },
  selectedPetCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 0, // Adjusted from 20 to 0 because header has margin-bottom
    marginBottom: 20,
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderLeftWidth: 5,
    borderColor: "#FF6B4A",
  },
  selectedPetInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  selectedPetImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6", // Lighter gray for placeholder
    justifyContent: "center",
    alignItems: "center",
  },
  selectedPetImagePlaceholder: {
    backgroundColor: "#FFE0D8",
  },
  selectedPetLabel: {
    fontSize: 12,
    color: "#888",
  },
  selectedPetName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  selectedPetStatusBadge: {
    backgroundColor: "#FF6B4A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  selectedPetStatusText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  carouselContainer: { alignItems: "center", marginVertical: 20 },
  bannerImage: { width: SCREEN_W * 0.9, height: 192, borderRadius: 16 }, // Adjusted for padding
  pagination: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: "#FF6B4A",
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotInactive: {
    backgroundColor: "rgba(0,0,0,0.2)",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  topMatchContainer: {
    backgroundColor: "#F9DCDC", // Light red background
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#EF4444", // Reddish shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1, // Subtle border
    borderColor: "#FECACA", // Lighter red border
  },
  topMatchPlaceholder: {
    backgroundColor: "#F9DCDC", // Light red background
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#EF4444", // Reddish shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1, // Subtle border
    borderColor: "#FECACA", // Lighter red border
  },
  topMatchContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  topMatchIcon: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  topMatchTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#DC2626", // Red color for title
  },
  topMatchSubtitle: {
    fontSize: 14,
    color: "#B91C1C", // Darker red for subtitle
  },
  topMatchActionButton: {
    backgroundColor: "#ea5b3a",
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  topMatchActionButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  matchDetails: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderColor: "#FCA5A5", // Lighter red for border
  },
  matchAvatars: {
    flexDirection: "row",
  },
  matchAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "#F3F4F6",
  },
  matchNames: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4B5563", // Dark gray
  },
  matchCompatibility: {
    fontSize: 14,
    color: "#6B7280", // Medium gray
  },
  aiRecIcon: {
    width: 50,
    height: 50,
  },
  actionButton: {
    backgroundColor: "#ea5b3a",
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  actionButtonText: { color: "white", fontWeight: "bold" },
  tabSwitcherContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 20,
    marginHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 30,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#FF6B4A",
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B4A",
  },
  tabButtonTextActive: {
    color: "white",
  },
  sectionPadding: { paddingHorizontal: 20 },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateContainer: { paddingVertical: 40 },
  emptyStateText: { textAlign: "center", color: "#888", fontSize: 16 },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 18,
    marginBottom: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F3E5E5", // Light border
  },
  gridImageContainer: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
  },
  gridImage: { width: "100%", height: "100%" },
  gridContent: { padding: 12 },
  gridTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  gridSubtitle: { fontSize: 14, color: "#777", marginTop: 2 },
  infoChipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  infoChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 15 },
  infoChipText: { fontSize: 12, fontWeight: "bold" },
  shooterOwnerBadge: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: "#FF6B4A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    elevation: 3,
  },
  shooterOwnerBadgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
});
