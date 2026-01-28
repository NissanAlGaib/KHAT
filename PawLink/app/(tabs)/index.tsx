import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  Text,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import dayjs from "dayjs";

// Contexts
import { useSession } from "@/context/AuthContext";
import { usePet } from "@/context/PetContext";
import { useRole } from "@/context/RoleContext";
import { useNotifications } from "@/context/NotificationContext";

// Services
import {
  getTopMatches,
  getShooters,
  getAllAvailablePets,
  type PetMatch,
  type TopMatch,
  type ShooterProfile,
} from "@/services/matchService";
import { sendMatchRequest } from "@/services/matchRequestService";

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
import ShooterHomepage from "./shooter-index";

export default function Homepage() {
  const router = useRouter();
  const { user } = useSession();
  const { role } = useRole();
  const { selectedPet } = usePet();
  const { badgeCount, refreshBadgeCount } = useNotifications();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [allPets, setAllPets] = useState<PetMatch[]>([]);
  const [topMatches, setTopMatches] = useState<TopMatch[]>([]);
  const [shooters, setShooters] = useState<ShooterProfile[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>("pets");

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
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
      setRefreshing(false);
    }
  }, [user?.id]);

  // Initial Load & Focus Effect
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
      refreshBadgeCount();
    }, [fetchData, refreshBadgeCount])
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
    // TODO: Implement pass logic
    console.log("Passed match:", match);
    // Optimistic update: remove from list
    setTopMatches((prev) => prev.filter((m) => m !== match));
  };

  const handleLike = async (match: TopMatch) => {
    // Determine which pet is the user's pet (requester) and which is the target
    const isUserPet1 = match.pet1.pet_id === selectedPet?.pet_id;
    const requesterPetId = isUserPet1 ? match.pet1.pet_id : match.pet2.pet_id;
    const targetPetId = isUserPet1 ? match.pet2.pet_id : match.pet1.pet_id;
    const targetPetName = isUserPet1 ? match.pet2.name : match.pet1.name;

    if (!selectedPet) {
      Alert.alert("No Pet Selected", "Please select a pet to send match requests.");
      return;
    }

    // Prevent double-tap
    if (sendingRequest) return;
    setSendingRequest(true);

    try {
      const result = await sendMatchRequest(requesterPetId, targetPetId);

      // Optimistic update: remove from list regardless of result
      setTopMatches((prev) => prev.filter((m) => m !== match));

      if (result.success) {
        Alert.alert(
          "Match Request Sent! 💕",
          `Your request to match with ${targetPetName} has been sent to their owner.`
        );
      } else if (result.requires_payment) {
        // Handle free tier users who need to pay
        // TODO: Implement payment flow screen
        Alert.alert(
          "Upgrade Required",
          `Free users need to pay ₱${result.payment_amount} per match request, or upgrade to a subscription for unlimited requests.`,
          [{ text: "OK", style: "default" }]
        );
      } else {
        Alert.alert("Request Failed", result.message);
      }
    } catch (error) {
      console.error("Error sending match request:", error);
      Alert.alert("Error", "Failed to send match request. Please try again.");
    } finally {
      setSendingRequest(false);
    }
  };

  const handleMessage = (match: TopMatch) => {
    // TODO: Implement message logic
    console.log("Message match:", match);
  };

  // Filter matches for selected pet
  const filteredMatches = selectedPet
    ? topMatches.filter(
        (match) =>
          match.pet1.pet_id === selectedPet.pet_id ||
          match.pet2.pet_id === selectedPet.pet_id
      )
    : topMatches;

  // Filter pets (exclude own pets and same sex if selected)
  const filteredPets = selectedPet
    ? allPets.filter(
        (pet) =>
          pet.sex?.toLowerCase() !== selectedPet.sex?.toLowerCase()
      )
    : allPets;

  // If role is Shooter, show ShooterHomepage
  if (role === "Shooter") {
    return <ShooterHomepage />;
  }

  return (
    <View style={styles.container}>
      <PlayfulHeader
        badgeCount={badgeCount}
        onNotificationPress={() => router.push("/notifications")}
        onSearchPress={() => router.push("/search")}
        onSubscriptionPress={() => console.log("Subscription pressed")}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
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
          tabs={[{ key: "pets", label: "Pets" }, { key: "shooters", label: "Shooters" }]}
          activeTab={selectedTab}
          onTabChange={setSelectedTab}
        />

        {/* Conditional Content */}
        {selectedTab === "pets" ? (
          <SectionContainer 
            title="Nearby Pets" 
            icon="🐕"
            showSeeAll
            onSeeAllPress={() => router.push("/search?tab=pets")}
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
            onSeeAllPress={() => router.push("/search?tab=shooters")}
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
});
