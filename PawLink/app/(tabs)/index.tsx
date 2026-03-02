import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

// Contexts
import { useSession } from "@/context/AuthContext";
import { usePet } from "@/context/PetContext";
import { useRole } from "@/context/RoleContext";

// Services
import { getTopMatches, type TopMatch } from "@/services/matchService";
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
import { Colors } from "@/constants";

// Components
import PlayfulHeader from "@/components/home/PlayfulHeader";
import MatchCardStack from "@/components/home/MatchCardStack";
import { SidePassButton, SideLikeButton } from "@/components/home/ActionBar";
import SkeletonLoader from "@/components/home/SkeletonLoader";
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
  const [topMatches, setTopMatches] = useState<TopMatch[]>([]);
  // Breed filter for Top Matches swiping
  const [breedFilterVisible, setBreedFilterVisible] = useState(false);
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  // Shooter promo banner
  const [showShooterBanner, setShowShooterBanner] = useState(false);
  // Track pet IDs that already have active match requests (for dupe guard)
  const activeRequestPetIdsRef = useRef<Set<number>>(new Set());
  // Track pet IDs that were passed (persisted in AsyncStorage)
  const passedPetIdsRef = useRef<Set<number>>(new Set());

  // Check if shooter banner was previously dismissed
  useEffect(() => {
    AsyncStorage.getItem("shooterBannerDismissed").then((val) => {
      if (val !== "true") setShowShooterBanner(true);
    });
  }, []);

  const dismissShooterBanner = () => {
    setShowShooterBanner(false);
    AsyncStorage.setItem("shooterBannerDismissed", "true");
  };

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      const [tops, outgoing, incoming] = await Promise.all([
        getTopMatches(),
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

      setTopMatches(tops);
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

  // Handlers
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

  // Programmatic swipe via ActionBar buttons
  const handleActionPass = () => {
    if (filteredMatches.length > 0) {
      handlePass(filteredMatches[0]);
    }
  };

  const handleActionLike = () => {
    if (filteredMatches.length > 0) {
      handleLike(filteredMatches[0]);
    }
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
        // Supports mixed breeds ("Breed1 × Breed2 Mix") by checking if any parent breed matches
        if (selectedBreeds.length > 0) {
          const otherBreed = (otherPet.breed || "").toLowerCase();
          const otherBreedParts = otherBreed.includes("×")
            ? otherBreed.split("×").map((p) => p.replace(/\s*mix$/i, "").trim())
            : [otherBreed];
          const matchesFilter = selectedBreeds.some((b) => {
            const filterBreed = b.toLowerCase();
            return (
              otherBreedParts.some((part) => part === filterBreed) ||
              filterBreed === otherBreed
            );
          });
          if (!matchesFilter) return false;
        }
        return true;
      })
    : [];

  // If role is Shooter, show ShooterHomepage
  if (role === "Shooter") {
    return <ShooterHomepage />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <PlayfulHeader
        onSearchPress={() => router.navigate("/search")}
        onSubscriptionPress={() => router.push("/subscription")}
        onFilterPress={() => setBreedFilterVisible(true)}
        filterActive={selectedBreeds.length > 0}
        filterCount={selectedBreeds.length}
      />

      {/* Shooter Promo Banner */}
      {showShooterBanner && (
        <View style={styles.shooterBanner}>
          <TouchableOpacity
            style={styles.shooterBannerContent}
            activeOpacity={0.8}
            onPress={() => router.push("/search")}
          >
            <View style={styles.shooterBannerIcon}>
              <Feather name="zap" size={18} color={Colors.warning} />
            </View>
            <View style={styles.shooterBannerText}>
              <Text style={styles.shooterBannerTitle}>
                Need breeding assistance?
              </Text>
              <Text style={styles.shooterBannerSub}>
                Browse verified Shooters nearby
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shooterBannerClose}
            onPress={dismissShooterBanner}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="x" size={14} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {/* Card Stack — fills viewport, half-buttons overlap edges */}
      <View style={styles.cardArea}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <SkeletonLoader type="matchCard" />
          </View>
        ) : (
          <View style={styles.stackWrapper}>
            <MatchCardStack
              matches={filteredMatches}
              selectedPetId={selectedPet?.pet_id}
              onPass={handlePass}
              onLike={handleLike}
              onCardPress={handleMatchCardPress}
            />
          </View>
        )}

        {/* Half-circle buttons — flush with screen edges, above the card */}
        <SidePassButton
          onPress={handleActionPass}
          disabled={filteredMatches.length === 0 || sendingRequest}
        />
        <SideLikeButton
          onPress={handleActionLike}
          disabled={filteredMatches.length === 0 || sendingRequest}
        />
      </View>

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
    backgroundColor: Colors.bgApp,
  },
  // Shooter promo banner
  shooterBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  shooterBannerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
  },
  shooterBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  shooterBannerText: {
    flex: 1,
  },
  shooterBannerTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  shooterBannerSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  shooterBannerClose: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  // Card area — no horizontal padding so half-buttons touch screen edges
  cardArea: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 100, // clear the CurvedTabBar overlay
    position: "relative",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stackWrapper: {
    flex: 1,
    marginHorizontal: 16, // card inset, but buttons stay at screen edge
  },
});
