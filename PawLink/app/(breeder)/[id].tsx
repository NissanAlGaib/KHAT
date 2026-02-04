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
  getBreederProfile,
  type BreederProfile,
  type BreederPet,
} from "@/services/userService";
import { getStorageUrl } from "@/utils/imageUrl";
import { LinearGradient } from "expo-linear-gradient";

export default function BreederProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const breederId = params.id as string;
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [breederData, setBreederData] = useState<BreederProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBreederData = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await getBreederProfile(parseInt(breederId));
      setBreederData(profile);
    } catch (error: unknown) {
      console.error("Error fetching breeder data:", error);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load breeder profile";
      showAlert({
        title: "Error",
        message: errorMessage,
        type: "error",
        buttons: [{ text: "Go Back", onPress: () => router.back() }],
      });
    } finally {
      setLoading(false);
    }
  }, [breederId, showAlert, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBreederData();
    setRefreshing(false);
  }, [fetchBreederData]);

  useEffect(() => {
    if (breederId) {
      fetchBreederData();
    }
  }, [breederId, fetchBreederData]);

  const getImageUrl = (path: string | null | undefined) => {
    return getStorageUrl(path);
  };

  const handlePetPress = (petId: number) => {
    router.push(`/(pet)/view-profile?id=${petId}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea5b3a" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (!breederData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Feather name="user-x" size={48} color="#CBD5E1" />
        <Text style={styles.errorText}>Breeder profile not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const experienceYears = Math.ceil(breederData.experience_years || 0);
  const stats = breederData.statistics || {
    total_pets: 0,
    dog_count: 0,
    cat_count: 0,
  };
  const displayedBreeds = breederData.pet_breeds || [];
  const ageText = breederData.age ? `${breederData.age} yrs` : null;
  const genderText = breederData.sex || null;
  const rating = breederData.rating || 0;

  // Pet Card Component
  const PetCard = ({ pet }: { pet: BreederPet }) => (
    <TouchableOpacity style={styles.petCard} onPress={() => handlePetPress(pet.pet_id)}>
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
        {pet.is_on_cooldown && (
          <View style={styles.cooldownBadge}>
            <Feather name="clock" size={10} color="#fff" />
          </View>
        )}
      </View>
      <Text style={styles.petName} numberOfLines={1}>{pet.name}</Text>
      <Text style={styles.petBreed} numberOfLines={1}>{pet.breed}</Text>
      {pet.breeding_price && (
        <Text style={styles.petPrice}>${pet.breeding_price}</Text>
      )}
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Breeder Profile</Text>
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
            {breederData.profile_image ? (
              <Image
                source={{ uri: getImageUrl(breederData.profile_image) || undefined }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImagePlaceholder]}>
                <Feather name="user" size={48} color="#CBD5E1" />
              </View>
            )}
            {breederData.id_verified && (
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={14} color="#fff" />
              </View>
            )}
          </View>

          <Text style={styles.breederName}>{breederData.name}</Text>
          
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
            <Text style={styles.quickStatValue}>{stats.total_pets}</Text>
            <Text style={styles.quickStatLabel}>Total Pets</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{stats.dog_count}</Text>
            <Text style={styles.quickStatLabel}>Dogs</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{stats.cat_count}</Text>
            <Text style={styles.quickStatLabel}>Cats</Text>
          </View>
        </View>

        {/* Verification Badges */}
        {(breederData.id_verified || breederData.breeder_verified) && (
          <View style={styles.verificationSection}>
            <Text style={styles.sectionTitle}>Verification</Text>
            <Text style={styles.sectionSubtitle}>Verified credentials</Text>
            <View style={styles.badgesContainer}>
              {breederData.id_verified && (
                <View style={styles.verificationBadge}>
                  <View style={[styles.badgeIcon, { backgroundColor: "#D1FAE5" }]}>
                    <Feather name="user-check" size={16} color="#059669" />
                  </View>
                  <Text style={styles.badgeText}>ID Verified</Text>
                </View>
              )}
              {breederData.breeder_verified && (
                <View style={styles.verificationBadge}>
                  <View style={[styles.badgeIcon, { backgroundColor: "#DBEAFE" }]}>
                    <Feather name="award" size={16} color="#2563EB" />
                  </View>
                  <Text style={styles.badgeText}>Licensed Breeder</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Breeds Section */}
        {displayedBreeds.length > 0 && (
          <View style={styles.breedsSection}>
            <Text style={styles.sectionTitle}>Breeds</Text>
            <Text style={styles.sectionSubtitle}>Pet breeds owned by this breeder</Text>
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

        {/* Pets Section */}
        {breederData.pets && breederData.pets.length > 0 && (
          <View style={styles.petsSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{breederData.name}&apos;s Pets</Text>
              <View style={styles.petCountBadge}>
                <Text style={styles.petCountText}>{breederData.pets.length}</Text>
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>Available for breeding</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.petsScrollContent}
            >
              {breederData.pets.map((pet) => (
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
              Experienced pet breeder with {experienceYears} year{experienceYears !== 1 ? "s" : ""} of experience. 
              Specializing in {displayedBreeds.length > 0 ? displayedBreeds.slice(0, 3).join(", ") : "various breeds"}.
              {breederData.breeder_verified && " Certified and licensed breeder."}
            </Text>
          </View>
        </View>

        {/* Contact Button */}
        <View style={styles.contactSection}>
          <TouchableOpacity style={styles.contactButton}>
            <Feather name="message-circle" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Contact Breeder</Text>
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
  breederName: {
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
  cooldownBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
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
  petPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ea5b3a",
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
