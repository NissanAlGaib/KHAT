import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import BlockReportModal from "@/components/chat/BlockReportModal";
import BubbleBackgroundRe from "@/components/app/BubbleBackground";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  getPetPublicProfile,
  getPetLitters,
  getCompatibilityScore,
  type PetPublicProfile,
  type Litter,
  type CompatibilityResult,
} from "@/services/petService";
import {
  sendMatchRequest,
  getConversations,
} from "@/services/matchRequestService";
import {
  addFavorite,
  removeFavorite,
  checkFavorite,
} from "@/services/favoriteService";
import { usePet } from "@/context/PetContext";
import { getStorageUrl } from "@/utils/imageUrl";
import MatchPaymentPromptModal from "@/components/pet/MatchPaymentPromptModal";
import dayjs from "dayjs";

type TabKey = "overview" | "health" | "breeding" | "gallery";

export default function ViewPetProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = params.id as string;
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const { selectedPet } = usePet();

  const [petData, setPetData] = useState<PetPublicProfile | null>(null);
  const [litters, setLitters] = useState<Litter[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [showMatchPaymentModal, setShowMatchPaymentModal] = useState(false);
  const [pendingMatchData, setPendingMatchData] = useState<{
    requesterPetId: number;
    targetPetId: number;
    paymentAmount: number;
  } | null>(null);
  const [compatData, setCompatData] = useState<CompatibilityResult | null>(
    null,
  );
  const [compatLoading, setCompatLoading] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteUpdating, setFavoriteUpdating] = useState(false);
  const [hasActiveChat, setHasActiveChat] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showBlockReport, setShowBlockReport] = useState(false);
  const [showRecordsModal, setShowRecordsModal] = useState(false);

  const fetchPetData = useCallback(async () => {
    try {
      setLoading(true);
      const [profile, litterData] = await Promise.all([
        getPetPublicProfile(parseInt(petId, 10)),
        getPetLitters(parseInt(petId, 10)),
      ]);
      setPetData(profile);
      setLitters(litterData);
    } catch (error) {
      console.error("Error fetching pet data:", error);
      showAlert({
        title: "Error",
        message: "Failed to load pet profile.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [petId, showAlert]);

  useEffect(() => {
    if (petId) {
      fetchPetData();
    }
  }, [petId, fetchPetData]);

  useEffect(() => {
    if (selectedPet && petData) {
      setCompatLoading(true);
      getCompatibilityScore(selectedPet.pet_id, petData.pet_id)
        .then(setCompatData)
        .catch(() => setCompatData(null))
        .finally(() => setCompatLoading(false));
    }
  }, [selectedPet, petData]);

  useEffect(() => {
    if (!petId) return;
    checkFavorite(parseInt(petId, 10))
      .then((res) => setIsFavorited(res.is_favorited))
      .catch(() => {});
  }, [petId]);

  useEffect(() => {
    if (!petData?.owner?.id || !petData?.pet_id || !selectedPet?.pet_id) {
      setHasActiveChat(false);
      setConversationId(null);
      return;
    }

    getConversations()
      .then((conversations) => {
        const existing = conversations.find(
          (c) =>
            c.status === "active" &&
            !c.is_shooter_conversation &&
            c.owner?.id === petData.owner.id &&
            c.matched_pet?.pet_id === petData.pet_id &&
            c.user_pet?.pet_id === selectedPet.pet_id,
        );

        if (existing) {
          setHasActiveChat(true);
          setConversationId(existing.id);
        } else {
          setHasActiveChat(false);
          setConversationId(null);
        }
      })
      .catch(() => {
        setHasActiveChat(false);
        setConversationId(null);
      });
  }, [petData?.owner?.id, petData?.pet_id, selectedPet?.pet_id]);

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return undefined;
    return getStorageUrl(path) ?? undefined;
  };

  const calculateAge = (birthdate: string) => {
    if (!birthdate) return "";
    const birth = dayjs(birthdate);
    const now = dayjs();
    const years = now.diff(birth, "year");
    const months = now.diff(birth, "month") % 12;
    if (years > 0) return `${years} Year${years > 1 ? "s" : ""}`;
    return `${months} Month${months > 1 ? "s" : ""}`;
  };

  const formatLitterDate = (birthDate: string, birthDateFull?: string) => {
    if (birthDateFull && birthDateFull.trim().length > 0) {
      return birthDateFull;
    }

    const parsed = dayjs(birthDate);
    return parsed.isValid() ? parsed.format("MMM YYYY") : "Date unavailable";
  };

  const clampScore = (value: number) =>
    Math.max(0, Math.min(95, Math.round(value)));

  const vaccinationCards = useMemo(
    () => [
      ...(petData?.vaccination_cards?.required ?? []),
      ...(petData?.vaccination_cards?.optional ?? []),
    ],
    [
      petData?.vaccination_cards?.optional,
      petData?.vaccination_cards?.required,
    ],
  );

  const healthMetrics = useMemo(() => {
    const vaccinationCount = vaccinationCards.length;
    const healthRecordCount = petData?.health_records?.length ?? 0;

    return {
      vaccinationCount,
      healthRecordCount,
    };
  }, [petData?.health_records?.length, vaccinationCards.length]);

  const offspringLabels = useMemo(() => {
    const species = (petData?.species || "").toLowerCase();
    if (species === "dog") return { singular: "puppy", plural: "puppies" };
    if (species === "cat") return { singular: "kitten", plural: "kittens" };
    return { singular: "offspring", plural: "offspring" };
  }, [petData?.species]);

  const compatibilityBars = useMemo(() => {
    if (!compatData || !petData) return [];

    const score = compatData.compatibility_score;
    const breakdown = compatData.breakdown;

    const temperament =
      breakdown.behavior_matches.length > 0
        ? clampScore(55 + breakdown.behavior_matches.length * 10)
        : clampScore(score - 15);

    const breedMatch = breakdown.breed_match
      ? clampScore(score + 8)
      : clampScore(score - 30);

    const sizeWeight = clampScore(score + 5);

    const ageRange = breakdown.age_in_range
      ? clampScore(score + 15)
      : clampScore(score - 30);

    const healthScore = clampScore(
      (petData.microchip_id ? 20 : 0) +
        Math.min(50, healthMetrics.vaccinationCount * 10) +
        Math.min(20, healthMetrics.healthRecordCount * 5) +
        10,
    );

    return [
      { label: "Temperament", value: temperament, color: "#56C8A6" },
      { label: "Breed Match", value: breedMatch, color: "#FF9B67" },
      { label: "Size and Weight", value: sizeWeight, color: "#7CBF9A" },
      { label: "Age Range", value: ageRange, color: "#A68AE9" },
      { label: "Health Score", value: healthScore, color: "#6FC5B2" },
    ];
  }, [
    compatData,
    healthMetrics.healthRecordCount,
    healthMetrics.vaccinationCount,
    petData,
  ]);

  const handleToggleFavorite = async () => {
    if (favoriteUpdating) return;

    setFavoriteUpdating(true);
    const petIdNum = parseInt(petId, 10);
    const wasFavorited = isFavorited;
    setIsFavorited(!wasFavorited);

    try {
      if (wasFavorited) {
        await removeFavorite(petIdNum);
      } else {
        await addFavorite(petIdNum);
      }

      showAlert({
        title: wasFavorited ? "Removed from Favorites" : "Added to Favorites",
        message: wasFavorited
          ? `${petData?.name || "Pet"} was removed from your favorites.`
          : `${petData?.name || "Pet"} was added to your favorites.`,
        type: "success",
      });
    } catch {
      setIsFavorited(wasFavorited);
      showAlert({
        title: "Error",
        message: "Failed to update favorite.",
        type: "error",
      });
    } finally {
      setFavoriteUpdating(false);
    }
  };

  const handleShareProfile = async () => {
    setShowMenuModal(false);
    showAlert({
      title: "Share",
      message: "Use the profile link from the menu copy option.",
      type: "info",
    });
  };

  const handleCopyLink = async () => {
    setShowMenuModal(false);
    showAlert({
      title: "Profile Link",
      message: `pawlink://pet/${petId}`,
      type: "info",
    });
  };

  const handleReportOwner = () => {
    setShowMenuModal(false);
    setShowBlockReport(true);
  };

  const handleBlockOwner = () => {
    setShowMenuModal(false);
    setShowBlockReport(true);
  };

  const handleChatPress = () => {
    if (!selectedPet) {
      showAlert({
        title: "No Pet Selected",
        message: "Select your pet first to open a conversation.",
        type: "warning",
      });
      return;
    }

    if (!hasActiveChat || !conversationId) {
      showAlert({
        title: "No Active Chat",
        message: "No active conversation exists for this exact pet pair yet.",
        type: "info",
      });
      return;
    }

    router.push(`/(chat)/conversation?id=${conversationId}`);
  };

  const closeMatchPaymentModal = () => {
    setShowMatchPaymentModal(false);
    setPendingMatchData(null);
  };

  const handleMatchPaymentSuccess = async () => {
    if (!pendingMatchData) {
      closeMatchPaymentModal();
      return;
    }

    setSendingRequest(true);
    try {
      const matchResult = await sendMatchRequest(
        pendingMatchData.requesterPetId,
        pendingMatchData.targetPetId,
      );

      if (matchResult.requires_payment) {
        showAlert({
          title: "Payment Processing",
          message:
            "Your payment was received, but confirmation is still processing. Please try sending the request again in a moment.",
          type: "info",
        });
      } else {
        showAlert({
          title: matchResult.success ? "Request Sent" : "Request Failed",
          message: matchResult.success
            ? "Payment verified and match request sent successfully."
            : matchResult.message,
          type: matchResult.success ? "success" : "error",
        });
      }
    } catch {
      showAlert({
        title: "Error",
        message: "Payment was received, but sending the match request failed.",
        type: "error",
      });
    } finally {
      closeMatchPaymentModal();
      setSendingRequest(false);
    }
  };

  const handleMatchRequest = async () => {
    if (!selectedPet) {
      showAlert({
        title: "No Pet Selected",
        message: "Please select one of your pets first.",
        type: "warning",
      });
      return;
    }

    if (sendingRequest || !petData?.is_available_for_matching) return;

    setSendingRequest(true);
    try {
      const result = await sendMatchRequest(
        selectedPet.pet_id,
        parseInt(petId, 10),
      );
      if (result.requires_payment && result.payment_amount) {
        setPendingMatchData({
          requesterPetId: result.requester_pet_id ?? selectedPet.pet_id,
          targetPetId: result.target_pet_id ?? parseInt(petId, 10),
          paymentAmount: result.payment_amount,
        });
        setShowMatchPaymentModal(true);
      } else {
        showAlert({
          title: result.success ? "Request Sent" : "Request Failed",
          message: result.message,
          type: result.success ? "success" : "error",
        });
      }
    } catch {
      showAlert({
        title: "Error",
        message: "Failed to send match request.",
        type: "error",
      });
    } finally {
      setSendingRequest(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.centeredBlock}>
          <ActivityIndicator size="large" color="#FF8C67" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!petData) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.centeredBlock}>
          <Text style={styles.errorText}>Pet not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderOverviewTab = () => {
    const details = [
      { label: "AGE", value: calculateAge(petData.birthdate) || "-" },
      { label: "SEX", value: petData.sex || "-" },
      { label: "WEIGHT", value: `${petData.weight} kg` },
      { label: "HEIGHT", value: `${petData.height} cm` },
      { label: "HAS BEEN BRED", value: petData.has_been_bred ? "Yes" : "No" },
      { label: "LITTERS", value: String(petData.litter_count || 0) },
    ];

    return (
      <View style={styles.tabContent}>
        <SectionCard
          icon="information-circle-outline"
          title={`About ${petData.name}`}
        >
          <Text style={styles.cardBodyText}>
            {petData.description || "No description available."}
          </Text>
        </SectionCard>

        <SectionCard icon="list-outline" title="Details">
          <View style={styles.gridContainer}>
            {details.map((item) => (
              <View key={item.label} style={styles.gridItem}>
                <Text style={styles.gridLabel}>{item.label}</Text>
                <Text style={styles.gridValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard icon="leaf-outline" title="Behavior and Temperament">
          {petData.behaviors?.length ? (
            <TagWrap tags={petData.behaviors} variant="mint" />
          ) : (
            <Text style={styles.cardBodyText}>No behavior tags.</Text>
          )}
        </SectionCard>

        <SectionCard icon="apps-outline" title="Physical Attributes">
          {petData.attributes?.length ? (
            <TagWrap tags={petData.attributes} variant="sun" />
          ) : (
            <Text style={styles.cardBodyText}>No attribute tags.</Text>
          )}
        </SectionCard>

        <SectionCard icon="heart-outline" title="Breeding Preferences">
          {petData.preferences?.length ? (
            <TagWrap tags={petData.preferences} variant="mint" />
          ) : (
            <Text style={styles.cardBodyText}>No preference tags.</Text>
          )}
        </SectionCard>
      </View>
    );
  };

  const renderHealthTab = () => {
    const vaccinationCount = healthMetrics.vaccinationCount;
    const recordCount = healthMetrics.healthRecordCount;

    return (
      <View style={styles.tabContent}>
        <SectionCard icon="medkit-outline" title="Health Overview">
          <HealthSummaryRow
            label="Vaccinations"
            value={`${vaccinationCount} on file`}
            ok={vaccinationCount > 0}
          />
          <HealthSummaryRow
            label="Health Records"
            value={`${recordCount} on file`}
            ok={recordCount > 0}
          />
        </SectionCard>

        <SectionCard icon="shield-checkmark-outline" title="Vaccinations">
          <Text style={styles.cardBodyText}>
            {vaccinationCount > 0
              ? `${vaccinationCount} vaccination card${vaccinationCount > 1 ? "s" : ""} on file.`
              : "No vaccination cards on file."}
          </Text>
          <TouchableOpacity
            style={styles.inlineLinkButton}
            onPress={() =>
              router.push(
                `/(pet)/vaccine-records?petId=${petData.pet_id}` as never,
              )
            }
          >
            <Text style={styles.inlineLinkText}>View Vaccination Details</Text>
            <Feather name="arrow-right" size={14} color="#FF8A66" />
          </TouchableOpacity>
        </SectionCard>

        <SectionCard icon="document-text-outline" title="Health Records">
          <Text style={styles.cardBodyText}>
            {recordCount > 0
              ? `${recordCount} health record${recordCount > 1 ? "s" : ""} on file.`
              : "No health records on file."}
          </Text>
          {recordCount > 0 && (
            <TouchableOpacity
              style={styles.inlineLinkButton}
              onPress={() => setShowRecordsModal(true)}
            >
              <Text style={styles.inlineLinkText}>View Health Records</Text>
              <Feather name="arrow-right" size={14} color="#FF8A66" />
            </TouchableOpacity>
          )}
        </SectionCard>
      </View>
    );
  };

  const renderBreedingTab = () => {
    if (!selectedPet) {
      return (
        <View style={styles.tabContent}>
          <SectionCard icon="analytics-outline" title="Compatibility">
            <View style={styles.emptyStateBlock}>
              <Ionicons name="shuffle-outline" size={34} color="#B8B8C3" />
              <Text style={styles.emptyStateTitle}>No Pet Selected</Text>
              <Text style={styles.emptyStateText}>
                Select one of your pets to calculate compatibility.
              </Text>
            </View>
          </SectionCard>
        </View>
      );
    }

    return (
      <View style={styles.tabContent}>
        <SectionCard icon="heart-outline" title="Compatibility">
          {compatLoading ? (
            <View style={styles.centeredBlock}>
              <ActivityIndicator size="small" color="#FF8A66" />
              <Text style={styles.loadingText}>Analyzing compatibility...</Text>
            </View>
          ) : compatData ? (
            <>
              <View style={styles.compatHeaderRow}>
                <AvatarLabel
                  image={getImageUrl(selectedPet.profile_image)}
                  name={selectedPet.name}
                  subtitle={`${selectedPet.species} ${selectedPet.sex}`}
                />
                <View style={styles.heartBadge}>
                  <Feather name="heart" size={16} color="#FFFFFF" />
                </View>
                <AvatarLabel
                  image={getImageUrl(petData.profile_image)}
                  name={petData.name}
                  subtitle={`${petData.species} ${petData.sex}`}
                />
              </View>

              <View style={styles.compatScoreWrap}>
                <View style={styles.compatScoreCircle}>
                  <Text style={styles.compatScoreValue}>
                    {compatData.compatibility_score}
                  </Text>
                  <Text style={styles.compatScoreSub}>/100 match</Text>
                </View>
              </View>

              <View style={styles.progressGroup}>
                {compatibilityBars.map((bar) => (
                  <ProgressLine
                    key={bar.label}
                    label={bar.label}
                    value={bar.value}
                    color={bar.color}
                  />
                ))}
              </View>
            </>
          ) : (
            <Text style={styles.cardBodyText}>
              Unable to calculate compatibility with available profile data.
            </Text>
          )}
        </SectionCard>

        <SectionCard icon="list-outline" title="LitterHistory">
          {litters.length > 0 ? (
            litters.map((litter, index) => {
              const offspringCount = litter.offspring.total;
              const offspringCountLabel = `${offspringCount} ${offspringCount === 1 ? offspringLabels.singular : offspringLabels.plural}`;

              return (
                <TouchableOpacity
                  key={litter.litter_id}
                  style={styles.litterCard}
                  onPress={() =>
                    router.push(`/(pet)/litter-detail?id=${litter.litter_id}`)
                  }
                >
                  <View style={styles.litterHeaderBox}>
                    <View style={styles.litterHeaderLeft}>
                      <View style={styles.litterOrderBadge}>
                        <Text style={styles.litterOrderBadgeText}>
                          {index + 1}
                        </Text>
                      </View>

                      <View style={styles.litterTopLeft}>
                        <Text style={styles.litterTitle}>{litter.title}</Text>
                        <Text style={styles.litterSubtitle}>
                          {`${formatLitterDate(litter.birth_date, litter.birth_date_full)} · ${offspringCountLabel}`}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.litterCountBadge}>
                      <Text style={styles.litterCountText}>
                        {offspringCountLabel}
                      </Text>
                    </View>

                    <Feather name="chevron-right" size={18} color="#A8A2B3" />
                  </View>

                  <View style={styles.litterOffspringRow}>
                    {litter.offspring_details.slice(0, 5).map((off) => (
                      <View
                        key={off.offspring_id}
                        style={styles.offspringPreviewItem}
                      >
                        <View style={styles.offspringCircleWrap}>
                          {off.photo_url ? (
                            <Image
                              source={{ uri: getImageUrl(off.photo_url) }}
                              style={styles.offspringCircleImage}
                            />
                          ) : (
                            <View style={styles.offspringCircleFallback}>
                              <Ionicons name="paw" size={18} color="#D18C53" />
                            </View>
                          )}
                        </View>

                        <Text
                          style={styles.offspringPreviewName}
                          numberOfLines={1}
                        >
                          {off.name || "Unnamed"}
                        </Text>

                        <View
                          style={[
                            styles.offspringSexBadge,
                            off.sex === "male"
                              ? styles.offspringSexBadgeMale
                              : styles.offspringSexBadgeFemale,
                          ]}
                        >
                          <Text
                            style={[
                              styles.offspringSexText,
                              off.sex === "male"
                                ? styles.offspringSexTextMale
                                : styles.offspringSexTextFemale,
                            ]}
                          >
                            {off.sex === "male" ? "M" : "F"}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.cardBodyText}>No litters recorded yet.</Text>
          )}
        </SectionCard>
      </View>
    );
  };

  const renderGalleryTab = () => (
    <View style={styles.tabContent}>
      {petData.photos?.length ? (
        <View style={styles.galleryGrid}>
          {petData.photos.map((photo) => (
            <View key={photo.photo_id} style={styles.galleryTile}>
              <Image
                source={{ uri: getImageUrl(photo.photo_url) }}
                style={styles.galleryImage}
              />
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyStateBlock}>
          <Ionicons name="images-outline" size={38} color="#B8B8C3" />
          <Text style={styles.emptyStateTitle}>No Photos</Text>
          <Text style={styles.emptyStateText}>
            This pet has no gallery photos yet.
          </Text>
        </View>
      )}
    </View>
  );

  const renderTabContent = () => {
    if (activeTab === "overview") return renderOverviewTab();
    if (activeTab === "health") return renderHealthTab();
    if (activeTab === "breeding") return renderBreedingTab();
    return renderGalleryTab();
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}>
        <View style={styles.heroHeader}>
          <View style={StyleSheet.absoluteFillObject}>
            <BubbleBackgroundRe
              backgroundColor="#F98D67"
              bubbleColor="rgba(255, 192, 170, 0.35)"
              bigCount={4}
              smallCount={7}
            />
          </View>

          <View style={styles.heroTopRow}>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => router.back()}
            >
              <Feather name="chevron-left" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.heroRightButtons}>
              <TouchableOpacity
                style={[
                  styles.iconCircle,
                  isFavorited && styles.iconCircleActive,
                  favoriteUpdating && styles.iconCircleDisabled,
                ]}
                onPress={handleToggleFavorite}
                disabled={favoriteUpdating}
              >
                {favoriteUpdating ? (
                  <ActivityIndicator
                    size="small"
                    color={isFavorited ? "#F98961" : "#FFFFFF"}
                  />
                ) : (
                  <Ionicons
                    name={isFavorited ? "heart" : "heart-outline"}
                    size={18}
                    color={isFavorited ? "#F98961" : "#FFFFFF"}
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconCircle}
                onPress={() => setShowMenuModal(true)}
              >
                <Feather name="more-vertical" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroCenterContent}>
            <View style={styles.avatarWrap}>
              <Image
                source={{ uri: getImageUrl(petData.profile_image) }}
                style={styles.avatar}
              />
              <View style={styles.verifyBadge}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.petName}>{petData.name}</Text>
            <Text style={styles.petSubTitle}>
              {petData.breed} - {petData.species}
            </Text>

            <View style={styles.chipsRow}>
              <HeaderChip
                icon="calendar-outline"
                text={calculateAge(petData.birthdate)}
              />
              <HeaderChip
                icon={
                  petData.sex === "male" ? "male-outline" : "female-outline"
                }
                text={petData.sex}
              />
              {petData.microchip_id ? (
                <HeaderChip icon="checkmark-outline" text="Microchip" />
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.contentTopWrap}>
          <TouchableOpacity
            style={styles.ownerCard}
            onPress={() => router.push(`/(breeder)/${petData.owner.id}`)}
          >
            <Image
              source={{ uri: getImageUrl(petData.owner.profile_image) }}
              style={styles.ownerAvatar}
            />

            <View style={styles.ownerBody}>
              <View style={styles.ownerNameRow}>
                <Text style={styles.ownerName}>{petData.owner.name}</Text>
                {petData.owner.is_verified ? (
                  <Ionicons name="checkmark-circle" size={14} color="#4DC9A6" />
                ) : null}
              </View>
              <Text style={styles.ownerLocation}>
                {petData.owner.location || "Location unavailable"}
              </Text>
              <Text style={styles.ownerLinkText}>View Breeder Profile</Text>
            </View>

            <Feather name="chevron-right" size={16} color="#B5B3BE" />
          </TouchableOpacity>

          {!petData.is_available_for_matching ? (
            <View style={styles.unavailableBanner}>
              <Ionicons name="alert-circle-outline" size={16} color="#A15A1B" />
              <Text style={styles.unavailableText}>
                {petData.is_on_cooldown
                  ? `On cooldown for ${petData.cooldown_days_remaining || 0} more days.`
                  : "This pet is not currently available for matching."}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!petData.is_available_for_matching || sendingRequest) &&
                styles.primaryButtonDisabled,
            ]}
            disabled={!petData.is_available_for_matching || sendingRequest}
            onPress={handleMatchRequest}
          >
            {sendingRequest ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Feather name="heart" size={16} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Send Match Request</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.featureRow}>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => {
                if (!selectedPet) {
                  showAlert({
                    title: "No Pet Selected",
                    message:
                      "Please select one of your pets to preview offspring.",
                    type: "warning",
                  });
                  return;
                }

                const primaryPhoto =
                  selectedPet.photos?.find((p) => p.is_primary) ||
                  selectedPet.photos?.[0];

                router.push({
                  pathname: "/(pet)/ai-offspring",
                  params: {
                    pet1Id: selectedPet.pet_id,
                    pet2Id: petData.pet_id,
                    pet1Name: selectedPet.name,
                    pet2Name: petData.name,
                    pet1Photo: primaryPhoto?.photo_url || "",
                    pet2Photo: petData.profile_image || "",
                    pet1Breed: selectedPet.breed || "Unknown",
                    pet2Breed: petData.breed || "Unknown",
                    compatibilityScore: String(
                      compatData?.compatibility_score ?? "85",
                    ),
                  },
                });
              }}
            >
              <View
                style={[styles.featureIconWrap, { backgroundColor: "#EFE8FF" }]}
              >
                <Ionicons name="sparkles-outline" size={16} color="#8677E3" />
              </View>
              <View style={styles.featureBody}>
                <Text style={styles.featureTitle}>AI Offspring</Text>
                <Text style={styles.featureSubTitle}>
                  {`Preview ${offspringLabels.plural}`}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.featureCard,
                !hasActiveChat && styles.featureCardDisabled,
              ]}
              disabled={!selectedPet || !hasActiveChat}
              onPress={handleChatPress}
            >
              <View
                style={[styles.featureIconWrap, { backgroundColor: "#E6F8F2" }]}
              >
                <Feather
                  name="message-square"
                  size={15}
                  color={selectedPet && hasActiveChat ? "#58BEA3" : "#9FA2AA"}
                />
              </View>
              <View style={styles.featureBody}>
                <Text
                  style={[
                    styles.featureTitle,
                    (!selectedPet || !hasActiveChat) && styles.disabledText,
                  ]}
                >
                  Chat
                </Text>
                <Text
                  style={[
                    styles.featureSubTitle,
                    (!selectedPet || !hasActiveChat) && styles.disabledText,
                  ]}
                >
                  {!selectedPet
                    ? "Select your pet"
                    : hasActiveChat
                      ? "Message owner"
                      : "Match required"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.tabsWrap}>
            <TabPill
              label="Overview"
              active={activeTab === "overview"}
              onPress={() => setActiveTab("overview")}
            />
            <TabPill
              label="Health"
              active={activeTab === "health"}
              onPress={() => setActiveTab("health")}
            />
            <TabPill
              label="Breeding"
              active={activeTab === "breeding"}
              onPress={() => setActiveTab("breeding")}
            />
            <TabPill
              label="Gallery"
              active={activeTab === "gallery"}
              onPress={() => setActiveTab("gallery")}
            />
          </View>

          {renderTabContent()}
        </View>
      </ScrollView>

      <Modal
        visible={showMenuModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setShowMenuModal(false)}
        >
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleShareProfile}
            >
              <Feather name="share-2" size={16} color="#4A4B53" />
              <Text style={styles.menuText}>Share Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleCopyLink}>
              <Feather name="copy" size={16} color="#4A4B53" />
              <Text style={styles.menuText}>Copy Profile Link</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleReportOwner}
            >
              <Feather name="flag" size={16} color="#DD4A4A" />
              <Text style={[styles.menuText, { color: "#DD4A4A" }]}>
                Report
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleBlockOwner}
            >
              <Feather name="slash" size={16} color="#DD4A4A" />
              <Text style={[styles.menuText, { color: "#DD4A4A" }]}>
                Block Owner
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showRecordsModal}
        animationType="slide"
        onRequestClose={() => setShowRecordsModal(false)}
      >
        <SafeAreaView style={styles.modalScreen} edges={["top"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Health Records</Text>
            <TouchableOpacity onPress={() => setShowRecordsModal(false)}>
              <Ionicons name="close" size={22} color="#4F4C57" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {(petData.health_records || []).map((record, index) => (
              <View
                key={`${record.record_type}-${index}`}
                style={styles.recordItem}
              >
                <Text style={styles.recordTitle}>{record.record_type}</Text>
                <Text style={styles.recordSub}>
                  {dayjs(record.given_date).format("MMMM D, YYYY")}
                </Text>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {pendingMatchData ? (
        <MatchPaymentPromptModal
          visible={showMatchPaymentModal}
          requesterPetId={pendingMatchData.requesterPetId}
          targetPetId={pendingMatchData.targetPetId}
          amount={pendingMatchData.paymentAmount}
          onSuccess={handleMatchPaymentSuccess}
          onDismiss={closeMatchPaymentModal}
        />
      ) : null}

      <AlertModal {...{ visible, ...alertOptions, onClose: hideAlert }} />

      {petData?.owner ? (
        <BlockReportModal
          visible={showBlockReport}
          onClose={() => setShowBlockReport(false)}
          userId={petData.owner.id}
          userName={petData.owner.name}
          onBlockSuccess={() => {
            setShowBlockReport(false);
            router.back();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionIconBubble}>
          <Ionicons name={icon} size={15} color="#FF8A66" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function HeaderChip({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.headerChip}>
      <Ionicons name={icon} size={12} color="#FFFFFF" />
      <Text style={styles.headerChipText}>{text}</Text>
    </View>
  );
}

function TabPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.tabButton} onPress={onPress}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
      {active ? <View style={styles.tabUnderline} /> : null}
    </TouchableOpacity>
  );
}

function TagWrap({
  tags,
  variant,
}: {
  tags: string[];
  variant: "mint" | "sun";
}) {
  return (
    <View style={styles.tagWrap}>
      {tags.map((tag, idx) => (
        <View
          key={`${tag}-${idx}`}
          style={[
            styles.tag,
            variant === "mint" ? styles.tagMint : styles.tagSun,
          ]}
        >
          <Text
            style={[
              styles.tagText,
              variant === "mint" ? styles.tagTextMint : styles.tagTextSun,
            ]}
          >
            {tag}
          </Text>
        </View>
      ))}
    </View>
  );
}

function HealthSummaryRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <View style={styles.healthSummaryRow}>
      <Text style={styles.healthSummaryLabel}>{label}</Text>
      <View style={styles.healthSummaryValueWrap}>
        <Ionicons
          name={ok ? "checkmark" : "close"}
          size={12}
          color={ok ? "#58BEA3" : "#D16C6C"}
        />
        <Text
          style={[
            styles.healthSummaryValue,
            ok ? styles.healthSummaryValueOk : styles.healthSummaryValueBad,
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function ProgressLine({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={styles.progressRow}>
      <Text style={styles.progressLabel}>{label}</Text>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${value}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={styles.progressValue}>{value}</Text>
    </View>
  );
}

function AvatarLabel({
  image,
  name,
  subtitle,
}: {
  image?: string;
  name: string;
  subtitle: string;
}) {
  return (
    <View style={styles.avatarLabelWrap}>
      <Image source={{ uri: image }} style={styles.compatAvatar} />
      <Text style={styles.avatarLabelName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.avatarLabelSub} numberOfLines={1}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8F1EF",
  },
  centeredBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#7E7B87",
  },
  errorText: {
    color: "#D15C5C",
    fontSize: 14,
    fontWeight: "600",
  },

  heroHeader: {
    height: 360,
    overflow: "hidden",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  heroRightButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.27)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  iconCircleActive: {
    backgroundColor: "#FFFFFF",
  },
  iconCircleDisabled: {
    opacity: 0.72,
  },
  heroCenterContent: {
    marginTop: 24,
    paddingHorizontal: 16,
    alignItems: "center",
  },

  contentTopWrap: {
    marginTop: -18,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    backgroundColor: "#F8F1EF",
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  avatarWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignSelf: "center",
    overflow: "visible",
    backgroundColor: "#FFFFFF",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 56,
  },
  verifyBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4CCAA6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  petName: {
    textAlign: "center",
    fontSize: 52,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 12,
    lineHeight: 56,
  },
  petSubTitle: {
    textAlign: "center",
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.98,
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
    flexWrap: "wrap",
  },
  headerChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.62)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
    marginBottom: 6,
  },
  headerChipText: {
    marginLeft: 4,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  ownerCard: {
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  ownerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  ownerBody: {
    flex: 1,
    marginLeft: 10,
  },
  ownerNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ownerName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2F2B3A",
    marginRight: 4,
  },
  ownerLocation: {
    fontSize: 11,
    color: "#9793A1",
    marginTop: 1,
  },
  ownerLinkText: {
    fontSize: 11,
    color: "#FF8A66",
    marginTop: 2,
    fontWeight: "600",
  },

  unavailableBanner: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#FEF1D9",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  unavailableText: {
    marginLeft: 6,
    flex: 1,
    color: "#A15A1B",
    fontSize: 12,
    fontWeight: "600",
  },

  primaryButton: {
    marginTop: 12,
    borderRadius: 18,
    backgroundColor: "#F98961",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryButtonDisabled: {
    backgroundColor: "#CFC8C6",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },

  featureRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  featureCard: {
    width: "48.5%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E9E3E0",
    backgroundColor: "#FFFFFF",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  featureCardDisabled: {
    opacity: 0.55,
  },
  featureIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  featureBody: {
    marginLeft: 9,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2F2B3A",
  },
  featureSubTitle: {
    fontSize: 11,
    marginTop: 1,
    color: "#7EA89A",
  },
  disabledText: {
    color: "#90939B",
  },

  tabsWrap: {
    marginTop: 13,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 66,
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 12,
    color: "#8C8895",
    fontWeight: "700",
  },
  tabLabelActive: {
    color: "#F98961",
  },
  tabUnderline: {
    width: 26,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#F98961",
    marginTop: 6,
  },

  tabContent: {
    marginTop: 12,
  },

  sectionCard: {
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionIconBubble: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#FFF1EB",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    marginLeft: 8,
    fontSize: 18,
    color: "#2F2B3A",
    fontWeight: "700",
  },
  cardBodyText: {
    fontSize: 13,
    color: "#6E6B77",
    lineHeight: 19,
  },

  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  gridItem: {
    width: "48.5%",
    borderRadius: 10,
    backgroundColor: "#FBF8F7",
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 10,
    color: "#AEAAB8",
    fontWeight: "700",
  },
  gridValue: {
    marginTop: 3,
    fontSize: 15,
    color: "#2F2B3A",
    fontWeight: "700",
    textTransform: "capitalize",
  },

  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 7,
    marginBottom: 7,
  },
  tagMint: {
    backgroundColor: "#DCF7EE",
  },
  tagSun: {
    backgroundColor: "#FFF2CF",
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tagTextMint: {
    color: "#3CA58B",
  },
  tagTextSun: {
    color: "#A58B34",
  },

  healthSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F2ECE9",
  },
  healthSummaryLabel: {
    fontSize: 14,
    color: "#3A3644",
    fontWeight: "600",
  },
  healthSummaryValueWrap: {
    borderRadius: 999,
    backgroundColor: "#F6FBF9",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  healthSummaryValue: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "700",
  },
  healthSummaryValueOk: {
    color: "#58BEA3",
  },
  healthSummaryValueBad: {
    color: "#D16C6C",
  },
  inlineLinkButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#FFD8CC",
    borderRadius: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  inlineLinkText: {
    fontSize: 13,
    color: "#FF8A66",
    fontWeight: "700",
    marginRight: 6,
  },

  emptyStateBlock: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  emptyStateTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "700",
    color: "#4A4654",
  },
  emptyStateText: {
    marginTop: 5,
    color: "#8E8A97",
    fontSize: 12,
    textAlign: "center",
    maxWidth: 220,
    lineHeight: 18,
  },

  compatHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarLabelWrap: {
    width: 102,
    alignItems: "center",
  },
  compatAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarLabelName: {
    marginTop: 5,
    fontSize: 15,
    fontWeight: "700",
    color: "#3A3644",
  },
  avatarLabelSub: {
    marginTop: 2,
    fontSize: 11,
    color: "#9A97A3",
  },
  heartBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F98961",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  compatScoreWrap: {
    marginTop: 12,
    alignItems: "center",
  },
  compatScoreCircle: {
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 6,
    borderColor: "#FFD0BF",
    alignItems: "center",
    justifyContent: "center",
  },
  compatScoreValue: {
    fontSize: 22,
    color: "#2F2B3A",
    fontWeight: "700",
  },
  compatScoreSub: {
    fontSize: 10,
    marginTop: 1,
    color: "#9592A0",
    fontWeight: "600",
  },
  progressGroup: {
    marginTop: 12,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    width: 96,
    fontSize: 12,
    color: "#6B6675",
    fontWeight: "600",
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 8,
    backgroundColor: "#F2E6E1",
    marginHorizontal: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 8,
  },
  progressValue: {
    width: 26,
    fontSize: 14,
    color: "#4A4654",
    fontWeight: "700",
    textAlign: "right",
  },

  litterCard: {
    borderWidth: 1,
    borderColor: "#F1DDD3",
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  litterHeaderBox: {
    backgroundColor: "#FFF3EE",
    borderBottomWidth: 1,
    borderBottomColor: "#F1DDD3",
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  litterHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  litterOrderBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FF9A67",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  litterOrderBadgeText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  litterTopLeft: {
    flex: 1,
    marginRight: 6,
  },
  litterTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3B3645",
  },
  litterSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#9A97A3",
  },
  litterCountBadge: {
    borderRadius: 999,
    backgroundColor: "#DCF7EE",
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
  },
  litterCountText: {
    color: "#3FA58C",
    fontSize: 12,
    fontWeight: "700",
  },
  litterOffspringRow: {
    minHeight: 106,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  offspringPreviewItem: {
    width: 86,
    marginRight: 8,
    alignItems: "center",
  },
  offspringCircleWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#FFD6C2",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF4EE",
  },
  offspringCircleImage: {
    width: "100%",
    height: "100%",
  },
  offspringCircleFallback: {
    width: "100%",
    height: "100%",
    backgroundColor: "#FFDDBB",
    alignItems: "center",
    justifyContent: "center",
  },
  offspringPreviewName: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#5B5764",
    textAlign: "center",
  },
  offspringSexBadge: {
    marginTop: 5,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 4,
    minWidth: 50,
    alignItems: "center",
  },
  offspringSexBadgeMale: {
    backgroundColor: "#DDEAFE",
  },
  offspringSexBadgeFemale: {
    backgroundColor: "#FCE2EE",
    borderWidth: 1,
    borderColor: "#EC6BA5",
  },
  offspringSexText: {
    fontSize: 11,
    fontWeight: "700",
  },
  offspringSexTextMale: {
    color: "#6EA0D1",
  },
  offspringSexTextFemale: {
    color: "#E55C97",
  },

  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  galleryTile: {
    width: "48.8%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
    backgroundColor: "#EEE7E6",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "flex-end",
    paddingTop: 86,
    paddingRight: 12,
  },
  menuCard: {
    width: 200,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    paddingVertical: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuText: {
    marginLeft: 10,
    color: "#4A4B53",
    fontSize: 14,
    fontWeight: "500",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F1EEEF",
  },

  modalScreen: {
    flex: 1,
    backgroundColor: "#F8F1EF",
  },
  modalHeader: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 18,
    color: "#302C3A",
    fontWeight: "700",
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  recordItem: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    marginBottom: 10,
  },
  recordTitle: {
    fontSize: 14,
    color: "#3B3645",
    fontWeight: "700",
  },
  recordSub: {
    marginTop: 3,
    fontSize: 12,
    color: "#9693A0",
  },
});
