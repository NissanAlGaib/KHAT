import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
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
import { LinearGradient } from "expo-linear-gradient";

// Section subtitle text constants
const SECTION_SUBTITLES = {
  BREEDING_STATS: "Performance from breeding contracts",
  BREEDS_HANDLED: "Experience from breeding contracts",
  VERIFICATION: "Verified credentials",
  OWN_PETS: "Personal pets (not from contracts)",
};

export default function ShooterProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const shooterId = params.id as string;
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [shooterData, setShooterData] = useState<ShooterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchShooterData = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await getShooterProfile(parseInt(shooterId));
      setShooterData(profile);
    } catch (error: unknown) {
      console.error("Error fetching shooter data:", error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
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
  }, [shooterId, showAlert, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchShooterData();
    setRefreshing(false);
  }, [fetchShooterData]);

  useEffect(() => {
    if (shooterId) {
      fetchShooterData();
    }
  }, [shooterId, fetchShooterData]);

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
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea5b3a" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!shooterData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Feather name="user-x" size={48} color="#CBD5E1" />
        <Text style={styles.errorText}>Shooter profile not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const experienceYears = Math.ceil(shooterData.experience_years || 0);
  const stats = shooterData.statistics || {
    total_pets: 0,
    matched: 0,
    dog_count: 0,
    cat_count: 0,
    breeders_handled: 0,
    successful_shoots: 0,
  };
  const displayedBreeds = shooterData.breeds_handled || [];
  const ageText = shooterData.age ? `${shooterData.age} yrs` : null;
  const genderText = shooterData.sex || null;
  const rating = shooterData.rating || 0;

  // Calculate success rate
  const successRate = stats.breeders_handled > 0 
    ? Math.round((stats.successful_shoots / stats.breeders_handled) * 100) 
    : 0;

  // Pet Card Component
  const PetCard = ({ pet }: { pet: ShooterPet }) => (
    <View style={styles.petCard}>
      <View style={styles.petImageContainer}>
        {pet.profile_image ? (
          <Image
            source={{ uri: getImageUrl(pet.profile_image) || undefined }}
            style={styles.petImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.petImage, styles.petImagePlaceholder]}>
            <Feather name="image" size={20} color="#CBD5E1" />
          </View>
        )}
        <View style={[
          styles.petStatusBadge,
          { backgroundColor: pet.status === "Breeding" ? "#FEE2E2" : "#D1FAE5" }
        ]}>
          <View style={[
            styles.petStatusDot,
            { backgroundColor: pet.status === "Breeding" ? "#EF4444" : "#10B981" }
          ]} />
        </View>
      </View>
      <Text style={styles.petName} numberOfLines={1}>{pet.name}</Text>
      <Text style={styles.petBreed} numberOfLines={1}>{pet.breed}</Text>
      <View style={[
        styles.petStatusTag,
        { backgroundColor: pet.status === "Breeding" ? "#FEF2F2" : "#F0FDF4" }
      ]}>
        <Text style={[
          styles.petStatusText,
          { color: pet.status === "Breeding" ? "#DC2626" : "#16A34A" }
        ]}>
          {pet.status}
        </Text>
      </View>
    </View>
  );

  // Stat Card Component
  const StatCard = ({ 
    value, 
    label, 
    icon, 
    colors 
  }: { 
    value: number | string; 
    label: string; 
    icon: keyof typeof Feather.glyphMap;
    colors: readonly [string, string];
  }) => (
    <LinearGradient colors={colors} style={styles.statCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.statIconContainer}>
        <Feather name={icon} size={20} color="#fff" />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Feather name="arrow-left" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shooter Profile</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Feather name="share-2" size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#ea5b3a"]} />
        }
      >
        {/* Profile Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.profileImageContainer}>
            {shooterData.profile_image ? (
              <Image
                source={{ uri: getImageUrl(shooterData.profile_image) || undefined }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Feather name="user" size={48} color="#CBD5E1" />
              </View>
            )}
            {shooterData.shooter_verified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={14} color="#fff" />
              </View>
            )}
          </View>

          <Text style={styles.shooterName}>{shooterData.name}</Text>
          
          {/* Tags Row */}
          <View style={styles.tagsRow}>
            {ageText && (
              <View style={[styles.tag, styles.ageTag]}>
                <Feather name="calendar" size={12} color="#D97706" />
                <Text style={styles.ageTagText}>{ageText}</Text>
              </View>
            )}
            {genderText && (
              <View style={[styles.tag, styles.genderTag]}>
                <Feather name="user" size={12} color="#0284C7" />
                <Text style={styles.genderTagText}>{genderText}</Text>
              </View>
            )}
            <View style={[styles.tag, styles.experienceTag]}>
              <Feather name="award" size={12} color="#7C3AED" />
              <Text style={styles.experienceTagText}>{experienceYears} yr{experienceYears !== 1 ? "s" : ""} exp</Text>
            </View>
          </View>

          {/* Rating */}
          {rating > 0 && (
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Feather 
                    key={star} 
                    name="star" 
                    size={16} 
                    color={star <= Math.round(rating) ? "#F59E0B" : "#E5E7EB"} 
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Quick Stats Banner */}
        <View style={styles.quickStatsBanner}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{stats.breeders_handled}</Text>
            <Text style={styles.quickStatLabel}>Contracts</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{successRate}%</Text>
            <Text style={styles.quickStatLabel}>Success</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{stats.total_pets}</Text>
            <Text style={styles.quickStatLabel}>Pets Handled</Text>
          </View>
        </View>

        {/* Verification Badges */}
        {(shooterData.id_verified || shooterData.breeder_verified || shooterData.shooter_verified) && (
          <View style={styles.verificationSection}>
            <Text style={styles.sectionTitle}>Verification</Text>
            <Text style={styles.sectionSubtitle}>{SECTION_SUBTITLES.VERIFICATION}</Text>
            <View style={styles.badgesContainer}>
              {shooterData.id_verified && (
                <View style={styles.verificationBadge}>
                  <View style={[styles.badgeIcon, { backgroundColor: "#D1FAE5" }]}>
                    <Feather name="user-check" size={16} color="#059669" />
                  </View>
                  <Text style={styles.badgeText}>ID Verified</Text>
                </View>
              )}
              {shooterData.breeder_verified && (
                <View style={styles.verificationBadge}>
                  <View style={[styles.badgeIcon, { backgroundColor: "#DBEAFE" }]}>
                    <Feather name="award" size={16} color="#2563EB" />
                  </View>
                  <Text style={styles.badgeText}>Licensed Breeder</Text>
                </View>
              )}
              {shooterData.shooter_verified && (
                <View style={styles.verificationBadge}>
                  <View style={[styles.badgeIcon, { backgroundColor: "#FEE2E2" }]}>
                    <Feather name="shield" size={16} color="#DC2626" />
                  </View>
                  <Text style={styles.badgeText}>Licensed Shooter</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Breeding Statistics Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Breeding Statistics</Text>
          <Text style={styles.sectionSubtitle}>{SECTION_SUBTITLES.BREEDING_STATS}</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              value={stats.breeders_handled} 
              label="Total Contracts" 
              icon="heart"
              colors={["#F472B6", "#EC4899"] as const}
            />
            <StatCard 
              value={stats.successful_shoots} 
              label="Successful" 
              icon="check-circle"
              colors={["#34D399", "#10B981"] as const}
            />
            <StatCard 
              value={stats.dog_count} 
              label="Dogs Handled" 
              icon="gitlab"
              colors={["#FB923C", "#F97316"] as const}
            />
            <StatCard 
              value={stats.cat_count} 
              label="Cats Handled" 
              icon="github"
              colors={["#A78BFA", "#8B5CF6"] as const}
            />
          </View>
        </View>

        {/* Breeds Handled from Contracts */}
        {displayedBreeds.length > 0 && (
          <View style={styles.breedsSection}>
            <Text style={styles.sectionTitle}>Breeds Handled</Text>
            <Text style={styles.sectionSubtitle}>{SECTION_SUBTITLES.BREEDS_HANDLED}</Text>
            <View style={styles.breedsContainer}>
              {displayedBreeds.map((breed, index) => (
                <View key={breed + index} style={styles.breedChip}>
                  <Feather name="check" size={12} color="#ea5b3a" />
                  <Text style={styles.breedChipText}>{breed}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Shooter&apos;s Own Pets (if they are also a pet owner) */}
        {shooterData.is_pet_owner && shooterData.pets && shooterData.pets.length > 0 && (
          <View style={styles.petsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{shooterData.name}&apos;s Own Pets</Text>
              <View style={styles.petCountBadge}>
                <Text style={styles.petCountText}>{shooterData.pets.length}</Text>
              </View>
            </View>
            <Text style={styles.ownPetsSubtitle}>{SECTION_SUBTITLES.OWN_PETS}</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.petsScrollContent}
            >
              {shooterData.pets.map((pet) => (
                <PetCard key={pet.pet_id} pet={pet} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              Professional pet breeding specialist with {experienceYears} year{experienceYears !== 1 ? "s" : ""} of experience. 
              Specializing in handling breeding sessions with care and expertise.
              {shooterData.is_pet_owner && " As a fellow pet owner, I understand the importance of proper breeding practices and animal welfare."}
            </Text>
          </View>
        </View>

        {/* Contact Button */}
        <View style={styles.contactSection}>
          <TouchableOpacity style={styles.contactButton}>
            <Feather name="message-circle" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Contact Shooter</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7F5",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFF7F5",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },
  errorText: {
    marginTop: 16,
    color: "#6B7280",
    fontSize: 16,
  },
  backButton: {
    marginTop: 16,
    backgroundColor: "#ea5b3a",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Hero Section
  heroSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
  },
  profileImagePlaceholder: {
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  shooterName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  ageTag: {
    backgroundColor: "#FEF3C7",
  },
  ageTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#D97706",
  },
  genderTag: {
    backgroundColor: "#DBEAFE",
  },
  genderTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0284C7",
    textTransform: "capitalize",
  },
  experienceTag: {
    backgroundColor: "#EDE9FE",
  },
  experienceTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7C3AED",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },

  // Quick Stats Banner
  quickStatsBanner: {
    flexDirection: "row",
    backgroundColor: "#ea5b3a",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
  },
  quickStatItem: {
    flex: 1,
    alignItems: "center",
  },
  quickStatValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
  },
  quickStatLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 4,
  },

  // Section Styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ownPetsSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
    marginTop: -8,
  },

  // Verification Section
  verificationSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "47%",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },

  // Breeds Section
  breedsSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  breedsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  breedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  breedChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
  },

  // Pets Section
  petsSection: {
    marginTop: 24,
    paddingLeft: 16,
  },
  petCountBadge: {
    backgroundColor: "#ea5b3a",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 16,
  },
  petCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  petsScrollContent: {
    paddingRight: 16,
    gap: 12,
  },
  petCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    width: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  petImageContainer: {
    position: "relative",
    marginBottom: 8,
  },
  petImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  petImagePlaceholder: {
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  petStatusBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  petStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  petName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 6,
  },
  petStatusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  petStatusText: {
    fontSize: 10,
    fontWeight: "600",
  },

  // About Section
  aboutSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  aboutCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#4B5563",
  },

  // Contact Section
  contactSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ea5b3a",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
