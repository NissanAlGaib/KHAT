import React, { useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  Text,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";

// Contexts
import { useSession } from "@/context/AuthContext";
import { usePet } from "@/context/PetContext";
import { useRole } from "@/context/RoleContext";

// Services
import {
  getTopMatches,
  getShooters,
  getAllAvailablePets,
  type PetMatch,
  type TopMatch,
  type ShooterProfile,
} from "@/services/matchService";
import {
  sendMatchRequest,
  getOutgoingRequests,
  getIncomingRequests,
} from "@/services/matchRequestService";

// Utils
import { addPassedPet, getPassedPetIdsForPet } from "@/utils/passedPetsStorage";

// Hooks
import { useAlert } from "@/hooks/useAlert";

// Constants
import { Colors, Spacing, Shadows } from "@/constants";

// Components
import PlayfulHeader from "@/components/home/PlayfulHeader";
import MatchCardStack from "@/components/home/MatchCardStack";
import HorizontalPetScroll from "@/components/home/HorizontalPetScroll";
import HorizontalShooterScroll from "@/components/home/HorizontalShooterScroll";
import SkeletonLoader from "@/components/home/SkeletonLoader";
import SectionContainer from "@/components/home/SectionContainer";
import TabSwitcher from "@/components/home/TabSwitcher";
import AlertModal from "@/components/core/AlertModal";
import BreedFilterModal from "@/components/home/BreedFilterModal";
import ShooterHomepage from "./shooter-index";

export default function Homepage() {
  const router = useRouter();
  const { user } = useSession();
  const { role } = useRole();
  const { selectedPet } = usePet();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [allPets, setAllPets] = useState<PetMatch[]>([]);
  const [topMatches, setTopMatches] = useState<TopMatch[]>([]);
  const [shooters, setShooters] = useState<ShooterProfile[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("pets");
  // Breed filter for Top Matches swiping
  const [breedFilterVisible, setBreedFilterVisible] = useState(false);
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  // Track pet IDs that already have active match requests (for dupe guard)
  const activeRequestPetIdsRef = useRef<Set<number>>(new Set());
  // Track pet IDs that were passed (persisted in AsyncStorage)
  const passedPetIdsRef = useRef<Set<number>>(new Set());

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      const [pets, tops, shootersList, outgoing, incoming] = await Promise.all([
        getAllAvailablePets(),
        getTopMatches(),
        getShooters(),
        getOutgoingRequests(),
        getIncomingRequests(),
      ]);

      // Build set of pet IDs with active (pending/accepted) requests
      const activeIds = new Set<number>();
      [...outgoing, ...incoming].forEach((req) => {
        if (req.status === "pending" || req.status === "accepted") {
          activeIds.add(req.target_pet.pet_id);
          activeIds.add(req.requester_pet.pet_id);
        }
      });
      activeRequestPetIdsRef.current = activeIds;

      setAllPets(pets);
      setTopMatches(tops);

      const filteredShooters = shootersList.filter(
        (shooter) => shooter.id !== Number(user?.id),
      );
      setShooters(filteredShooters);
    } catch (error) {
      console.error("Error fetching homepage data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Load passed pets from AsyncStorage when selected pet changes
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();

      // Load passed pet IDs for the currently selected pet
      if (selectedPet?.pet_id) {
        getPassedPetIdsForPet(selectedPet.pet_id).then((ids) => {
          passedPetIdsRef.current = ids;
        });
      }
    }, [fetchData, selectedPet?.pet_id]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Handlers
  const handlePetPress = (pet: PetMatch) => {
    router.push(`/(pet)/view-profile?id=${pet.pet_id}`);
  };

  const handleShooterPress = (shooter: ShooterProfile) => {
    router.push(`/(shooter)/${shooter.id}`);
  };

  const handleMatchCardPress = (match: TopMatch) => {
    // Determine which pet to show (the one that's NOT the user's selected pet)
    const displayPet =
      match.pet1.pet_id === selectedPet?.pet_id ? match.pet2 : match.pet1;
    router.push(`/(pet)/view-profile?id=${displayPet.pet_id}`);
  };

  const handlePass = (match: TopMatch) => {
    // Determine which pet is the target (not the user's pet)
    const isUserPet1 = match.pet1.pet_id === selectedPet?.pet_id;
    const targetPetId = isUserPet1 ? match.pet2.pet_id : match.pet1.pet_id;

    // Persist the pass to AsyncStorage so it survives reloads
    if (selectedPet?.pet_id) {
      addPassedPet(selectedPet.pet_id, targetPetId);
      passedPetIdsRef.current.add(targetPetId);
    }

    // Remove from list immediately
    setTopMatches((prev) => prev.filter((m) => m !== match));
  };

  const handleLike = async (match: TopMatch) => {
    // Determine which pet is the user's pet (requester) and which is the target
    const isUserPet1 = match.pet1.pet_id === selectedPet?.pet_id;
    const requesterPetId = isUserPet1 ? match.pet1.pet_id : match.pet2.pet_id;
    const targetPetId = isUserPet1 ? match.pet2.pet_id : match.pet1.pet_id;
    const targetPetName = isUserPet1 ? match.pet2.name : match.pet1.name;

    if (!selectedPet) {
      showAlert({
        title: "No Pet Selected",
        message: "Please select a pet to send match requests.",
        type: "warning",
      });
      return;
    }

    // Prevent double-tap
    if (sendingRequest) return;
    setSendingRequest(true);

    try {
      const result = await sendMatchRequest(requesterPetId, targetPetId);

      if (result.success) {
        // Only remove from list on confirmed success
        setTopMatches((prev) => prev.filter((m) => m !== match));
        // Track in active requests set
        activeRequestPetIdsRef.current.add(targetPetId);
        showAlert({
          title: "Match Request Sent! 💕",
          message: `Your request to match with ${targetPetName} has been sent to their owner.`,
          type: "success",
        });
      } else if (result.requires_verification) {
        // Handle unverified users
        showAlert({
          title: "Verification Required",
          message:
            "You need to verify your ID before sending match requests. This helps keep our community safe.",
          type: "warning",
          buttons: [
            { text: "Later", style: "cancel" },
            {
              text: "Verify Now",
              onPress: () => router.push("/(verification)/verification-status"),
            },
          ],
        });
      } else if (result.requires_payment) {
        // Handle free tier users who need to pay
        // TODO: Implement payment flow screen
        showAlert({
          title: "Upgrade Required",
          message: `Free users need to pay ₱${result.payment_amount} per match request, or upgrade to a subscription for unlimited requests.`,
          type: "info",
        });
      } else {
        showAlert({
          title: "Request Failed",
          message: result.message || "Something went wrong.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error sending match request:", error);
      showAlert({
        title: "Error",
        message: "Failed to send match request. Please try again.",
        type: "error",
      });
    } finally {
      setSendingRequest(false);
    }
  };

  const handleMessage = (match: TopMatch) => {
    // TODO: Implement message logic
    console.log("Message match:", match);
  };

  // Filter matches for selected pet — show nothing if no pet is selected
  // Also filter out same-sex matches, passed pets, and pets with active requests
  const filteredMatches = selectedPet
    ? topMatches.filter((match) => {
        const isUserPet1 = match.pet1.pet_id === selectedPet.pet_id;
        const isUserPet2 = match.pet2.pet_id === selectedPet.pet_id;
        if (!isUserPet1 && !isUserPet2) return false;
        // Ensure opposite sex
        const otherPet = isUserPet1 ? match.pet2 : match.pet1;
        if (otherPet.sex?.toLowerCase() === selectedPet.sex?.toLowerCase())
          return false;
        // Filter out pets that were passed (stored in AsyncStorage)
        if (passedPetIdsRef.current.has(otherPet.pet_id)) return false;
        // Filter out pets that already have an active match request (dupe guard)
        if (activeRequestPetIdsRef.current.has(otherPet.pet_id)) return false;
        // Breed filter — if breeds are selected, only keep matches whose other pet's breed is in the list
        if (selectedBreeds.length > 0) {
          const otherBreed = (otherPet.breed || "").toLowerCase();
          if (!selectedBreeds.some((b) => b.toLowerCase() === otherBreed))
            return false;
        }
        return true;
      })
    : [];

  // Filter pets (same species only, exclude same sex)
  const filteredPets = selectedPet
    ? allPets.filter(
        (pet) =>
          pet.species?.toLowerCase() === selectedPet.species?.toLowerCase() &&
          pet.sex?.toLowerCase() !== selectedPet.sex?.toLowerCase(),
      )
    : allPets;

  // If role is Shooter, show ShooterHomepage
  if (role === "Shooter") {
    return <ShooterHomepage />;
  }

  return (
    <View style={styles.container}>
      <PlayfulHeader
        onSearchPress={() => router.navigate("/search")}
        onSubscriptionPress={() => router.push("/subscription")}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Match Stack */}
        <View style={styles.matchSectionContainer}>
          <View style={styles.matchHeader}>
            <Image
              source={require("@/assets/images/Heart_Icon.png")}
              style={styles.heartIcon}
            />
            <Text style={styles.matchTitle}>Top Matches</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[
                styles.breedFilterButton,
                selectedBreeds.length > 0 && styles.breedFilterButtonActive,
              ]}
              onPress={() => setBreedFilterVisible(true)}
            >
              <Feather
                name="sliders"
                size={16}
                color={
                  selectedBreeds.length > 0 ? Colors.white : Colors.coralDark
                }
              />
              {selectedBreeds.length > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {selectedBreeds.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ alignItems: "center" }}>
              <SkeletonLoader type="matchCard" />
            </View>
          ) : (
            <MatchCardStack
              matches={filteredMatches}
              selectedPetId={selectedPet?.pet_id}
              onPass={handlePass}
              onLike={handleLike}
              onMessage={handleMessage}
              onCardPress={handleMatchCardPress}
            />
          )}
        </View>

        {/* Tab Switcher */}
        <TabSwitcher
          tabs={[
            { key: "pets", label: "Pets" },
            { key: "shooters", label: "Shooters" },
          ]}
          activeTab={selectedTab}
          onTabChange={setSelectedTab}
        />

        {/* Conditional Content */}
        {selectedTab === "pets" ? (
          <SectionContainer
            title="Nearby Pets"
            icon="🐕"
            showSeeAll
            onSeeAllPress={() => router.navigate("/search?tab=pets")}
          >
            {loading ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <SkeletonLoader type="petCard" />
                <SkeletonLoader type="petCard" />
                <SkeletonLoader type="petCard" />
              </ScrollView>
            ) : (
              <HorizontalPetScroll
                pets={filteredPets}
                onPetPress={handlePetPress}
              />
            )}
          </SectionContainer>
        ) : (
          <SectionContainer
            title="Shooters"
            icon="📸"
            showSeeAll
            onSeeAllPress={() => router.navigate("/search?tab=shooters")}
          >
            {loading ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <SkeletonLoader type="shooterCard" />
                <SkeletonLoader type="shooterCard" />
                <SkeletonLoader type="shooterCard" />
              </ScrollView>
            ) : (
              <HorizontalShooterScroll
                shooters={shooters}
                onShooterPress={handleShooterPress}
              />
            )}
          </SectionContainer>
        )}

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      <AlertModal visible={visible} {...alertOptions} onClose={hideAlert} />

      <BreedFilterModal
        visible={breedFilterVisible}
        onClose={() => setBreedFilterVisible(false)}
        onApply={(breeds) => setSelectedBreeds(breeds)}
        selectedBreeds={selectedBreeds}
        species={selectedPet?.species}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCoral, // #FFE0D8
  },
  scrollContent: {
    paddingBottom: 20,
  },
  matchSectionContainer: {
    backgroundColor: Colors.matchCardBg, // #F9DCDC
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    ...Shadows.md,
    shadowColor: Colors.coralDark,
    shadowOpacity: 0.15,
    borderWidth: 1,
    borderColor: Colors.matchCardBorder,
  },
  matchHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  heartIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  matchTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.coralDark,
  },
  breedFilterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  breedFilterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.coralDark,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.white,
  },
});
