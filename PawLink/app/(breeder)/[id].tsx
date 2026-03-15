import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import BubbleBackgroundRe from "@/components/app/BubbleBackground";
import AlertModal from "@/components/core/AlertModal";
import { useAlert } from "@/hooks/useAlert";
import { getUserReviews } from "@/services/reviewService";
import type { CategoryAverage, UserReview } from "@/types/Review";
import {
  getBreederProfile,
  type BreederPet,
  type BreederProfile,
} from "@/services/userService";
import { getStorageUrl } from "@/utils/imageUrl";

function getLocationLabel(profile: BreederProfile): string {
  if (
    typeof profile.address === "string" &&
    profile.address.trim().length > 0
  ) {
    return profile.address;
  }

  if (profile.address && typeof profile.address === "object") {
    const city =
      profile.address.city ||
      profile.address.municipality ||
      profile.address.province;
    if (typeof city === "string" && city.trim().length > 0) {
      return city;
    }
  }

  if (profile.distance_label) {
    return profile.distance_label;
  }

  return "Location not set";
}

function RatingBar({ label, fill }: { label: string; fill: number }) {
  return (
    <View style={styles.ratingBarRow}>
      <Text style={styles.ratingBarLabel}>{label}</Text>
      <View style={styles.ratingTrack}>
        <View style={[styles.ratingFill, { width: `${fill}%` }]} />
      </View>
    </View>
  );
}

function parseNumeric(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function formatYearLabel(value: unknown): string | null {
  const num = parseNumeric(value);
  if (num === null || num <= 0) return null;
  if (num < 1) return "<1 yr";

  const years = Math.floor(num);
  return `${years} yr${years === 1 ? "" : "s"}`;
}

type RatingBucket = 1 | 2 | 3 | 4 | 5;

function StarIcons({ rating, size }: { rating: unknown; size: number }) {
  const normalized = Math.max(0, Math.min(5, parseNumeric(rating) ?? 0));

  return (
    <>
      {[1, 2, 3, 4, 5].map((star) => {
        let iconName: keyof typeof Ionicons.glyphMap = "star-outline";
        let color = "#E2DCD9";

        if (normalized >= star) {
          iconName = "star";
          color = "#F6B11A";
        } else if (normalized >= star - 0.5) {
          iconName = "star-half";
          color = "#F6B11A";
        }

        return (
          <Ionicons
            key={`${String(rating)}-${star}-${size}`}
            name={iconName}
            size={size}
            color={color}
          />
        );
      })}
    </>
  );
}

function ReviewTag({ text }: { text: string }) {
  const value = text.toLowerCase();
  let bg = "#EAF7F2";
  let color = "#4CBFA2";
  let icon: keyof typeof Feather.glyphMap = "check";

  if (value.includes("easy") || value.includes("work")) {
    bg = "#FFF1EC";
    color = "#F08D6A";
    icon = "edit-3";
  } else if (value.includes("knowledge") || value.includes("skill")) {
    bg = "#EFE8FF";
    color = "#8F79DE";
    icon = "zap";
  } else if (value.includes("recommend")) {
    bg = "#FFF5D8";
    color = "#C89A2E";
    icon = "check";
  }

  return (
    <View style={[styles.reviewTag, { backgroundColor: bg }]}>
      <Feather name={icon} size={9} color={color} />
      <Text style={[styles.reviewTagText, { color }]}>{text}</Text>
    </View>
  );
}

export default function BreederProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const breederIdParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const breederId = typeof breederIdParam === "string" ? breederIdParam : "";
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [breederData, setBreederData] = useState<BreederProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [petsSectionY, setPetsSectionY] = useState(0);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [categoryAverages, setCategoryAverages] = useState<
    Record<string, CategoryAverage>
  >({});
  const [reviewCategories, setReviewCategories] = useState<
    Record<string, string>
  >({});
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewLastPage, setReviewLastPage] = useState(1);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const fetchBreederData = useCallback(async () => {
    try {
      setLoading(true);
      const breederIdNum = parseInt(breederId, 10);
      if (!Number.isFinite(breederIdNum) || breederIdNum <= 0) {
        throw new Error("Invalid breeder profile ID.");
      }
      const profile = await getBreederProfile(breederIdNum);
      setBreederData(profile);

      try {
        const reviewData = await getUserReviews(breederIdNum, "breeder");
        setReviews(reviewData.reviews?.data || []);
        setReviewCount(reviewData.review_count || 0);
        setOverallRating(reviewData.overall_average || 0);
        setCategoryAverages(reviewData.category_averages || {});
        setReviewCategories(reviewData.categories || {});
        setReviewPage(reviewData.reviews?.current_page || 1);
        setReviewLastPage(reviewData.reviews?.last_page || 1);
      } catch {
        setReviews([]);
        setReviewCount(0);
        setOverallRating(0);
        setCategoryAverages({});
        setReviewCategories({});
        setReviewPage(1);
        setReviewLastPage(1);
      }
    } catch (error: unknown) {
      console.error("Error fetching breeder profile:", error);
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      showAlert({
        title: "Error",
        message:
          err.response?.data?.message ||
          err.message ||
          "Failed to load breeder profile.",
        type: "error",
        buttons: [{ text: "Go Back", onPress: () => router.back() }],
      });
    } finally {
      setLoading(false);
    }
  }, [breederId, router, showAlert]);

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
    if (!path) return undefined;
    return getStorageUrl(path) ?? undefined;
  };

  const handlePetPress = (petId: number) => {
    router.push(`/(pet)/view-profile?id=${petId}`);
  };

  const handleSharePress = () => {
    if (!breederData) return;

    showAlert({
      title: "Profile Link",
      message: `pawlink://breeder/${breederData.id}`,
      type: "info",
    });
  };

  const handleViewPetsPress = () => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, petsSectionY - 14),
      animated: true,
    });
  };

  const handleLoadMoreReviews = useCallback(async () => {
    if (loadingMoreReviews || reviewPage >= reviewLastPage) return;

    try {
      setLoadingMoreReviews(true);
      const nextPage = reviewPage + 1;
      const reviewData = await getUserReviews(
        parseInt(breederId, 10),
        "breeder",
        nextPage,
      );

      setReviews((prev) => [...prev, ...(reviewData.reviews?.data || [])]);
      setReviewPage(reviewData.reviews?.current_page || nextPage);
      setReviewLastPage(reviewData.reviews?.last_page || reviewLastPage);
    } catch {
      // Keep existing list when pagination request fails
    } finally {
      setLoadingMoreReviews(false);
    }
  }, [breederId, loadingMoreReviews, reviewLastPage, reviewPage]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={["top"]}>
        <ActivityIndicator size="large" color="#F98D67" />
        <Text style={styles.loadingText}>Loading breeder profile...</Text>
      </SafeAreaView>
    );
  }

  if (!breederData) {
    return (
      <SafeAreaView style={styles.loadingScreen} edges={["top"]}>
        <Feather name="user-x" size={36} color="#B8B4C1" />
        <Text style={styles.loadingText}>Breeder profile unavailable.</Text>
      </SafeAreaView>
    );
  }

  const ageText = formatYearLabel(breederData.age);
  const sexText = breederData.sex ? breederData.sex : null;
  const locationText = getLocationLabel(breederData);
  const ratingDisplay =
    overallRating > 0 ? overallRating : (breederData.rating ?? 0);
  const hasLiveReviews = reviewCount > 0 && reviews.length > 0;
  const hasReviewSummary = reviewCount > 0 || ratingDisplay > 0;
  const stats = breederData.statistics || {
    total_pets: breederData.pet_count || 0,
    dog_count: 0,
    cat_count: 0,
  };
  const breederPetBreeds = Array.isArray(breederData.pet_breeds)
    ? breederData.pet_breeds
    : [];
  const breederPets = Array.isArray(breederData.pets) ? breederData.pets : [];

  const topCategoryTags = Object.values(categoryAverages)
    .filter((entry) => entry.average !== null)
    .sort((a, b) => (b.average || 0) - (a.average || 0))
    .slice(0, 4)
    .map((entry) => `${entry.label} ${(entry.average || 0).toFixed(1)}`);

  const bucketCounts = reviews.reduce(
    (acc, review) => {
      const ratingNum = parseNumeric(review.average_rating);
      if (ratingNum === null) return acc;

      const bucket = Math.max(
        1,
        Math.min(5, Math.round(ratingNum)),
      ) as RatingBucket;
      acc[bucket] += 1;
      return acc;
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  );
  const histogramTotal =
    bucketCounts[1] +
    bucketCounts[2] +
    bucketCounts[3] +
    bucketCounts[4] +
    bucketCounts[5];

  const reviewFill = {
    five: histogramTotal > 0 ? (bucketCounts[5] / histogramTotal) * 100 : 0,
    four: histogramTotal > 0 ? (bucketCounts[4] / histogramTotal) * 100 : 0,
    three: histogramTotal > 0 ? (bucketCounts[3] / histogramTotal) * 100 : 0,
    two: histogramTotal > 0 ? (bucketCounts[2] / histogramTotal) * 100 : 0,
    one: histogramTotal > 0 ? (bucketCounts[1] / histogramTotal) * 100 : 0,
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#F98D67"]}
            tintColor="#F98D67"
          />
        }
      >
        <View style={styles.heroWrap}>
          <View style={StyleSheet.absoluteFillObject}>
            <BubbleBackgroundRe
              backgroundColor="#F98D67"
              bubbleColor="rgba(255, 192, 170, 0.28)"
              bigCount={2}
              smallCount={4}
            />
          </View>

          <View style={styles.heroTopRow}>
            <TouchableOpacity
              style={styles.heroIconButton}
              onPress={() => router.back()}
            >
              <Feather name="chevron-left" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.heroTopTitle}>Breeder Profile</Text>

            <TouchableOpacity
              style={styles.heroIconButton}
              onPress={handleSharePress}
            >
              <Feather name="share-2" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.heroIdentityBlock}>
            <View style={styles.avatarFrame}>
              {breederData.profile_image ? (
                <Image
                  source={{ uri: getImageUrl(breederData.profile_image) }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                  <Feather name="user" size={32} color="#CED0D8" />
                </View>
              )}
              {breederData.id_verified ? (
                <View style={styles.avatarVerifyBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              ) : null}
            </View>

            <Text style={styles.heroName}>{breederData.name}</Text>
            <Text style={styles.heroMeta}>
              Verified Breeder · {locationText}
            </Text>

            <View style={styles.heroChipRow}>
              {ageText ? (
                <View style={styles.heroChip}>
                  <Feather name="calendar" size={11} color="#FFFFFF" />
                  <Text style={styles.heroChipText}>{ageText}</Text>
                </View>
              ) : null}
              {sexText ? (
                <View style={styles.heroChip}>
                  <Feather name="user" size={11} color="#FFFFFF" />
                  <Text style={styles.heroChipText}>{sexText}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.overlaySheet}>
          {hasReviewSummary ? (
            <View style={styles.ratingStrip}>
              <View style={styles.ratingStripStars}>
                <StarIcons rating={ratingDisplay} size={12} />
              </View>
              <Text style={styles.ratingStripValue}>
                {ratingDisplay.toFixed(1)}
              </Text>
              <Text style={styles.ratingStripHint}>
                ({reviewCount} reviews)
              </Text>
            </View>
          ) : null}

          <View style={styles.statsCard}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{stats.total_pets}</Text>
              <Text style={styles.statLabel}>TOTAL PETS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{stats.dog_count}</Text>
              <Text style={styles.statLabel}>DOGS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: "#56C6A7" }]}>
                {stats.cat_count}
              </Text>
              <Text style={styles.statLabel}>CATS</Text>
            </View>
          </View>

          {breederData.id_verified || breederData.breeder_verified ? (
            <View style={styles.cardSection}>
              <Text style={styles.sectionTitle}>Verification</Text>
              <Text style={styles.sectionSubtitle}>Verified credentials</Text>

              {breederData.id_verified ? (
                <View style={styles.verificationRow}>
                  <View
                    style={[
                      styles.verificationIconWrap,
                      { backgroundColor: "#DDF5EE" },
                    ]}
                  >
                    <Feather name="shield" size={14} color="#4CBFA2" />
                  </View>
                  <View style={styles.verificationBody}>
                    <Text style={styles.verificationTitle}>User Verified</Text>
                    <Text style={styles.verificationSub}>
                      Verification confirmed
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.verificationState,
                      { backgroundColor: "#DCF7EE" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.verificationStateText,
                        { color: "#4CBFA2" },
                      ]}
                    >
                      Verified
                    </Text>
                  </View>
                </View>
              ) : null}

              {breederData.breeder_verified ? (
                <View style={styles.verificationRow}>
                  <View
                    style={[
                      styles.verificationIconWrap,
                      { backgroundColor: "#EFE7FF" },
                    ]}
                  >
                    <Feather name="award" size={14} color="#9A7CE0" />
                  </View>
                  <View style={styles.verificationBody}>
                    <Text style={styles.verificationTitle}>
                      Licensed Breeder
                    </Text>
                    <Text style={styles.verificationSub}>
                      DA-accredited license on file
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.verificationState,
                      { backgroundColor: "#EFE7FF" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.verificationStateText,
                        { color: "#9A7CE0" },
                      ]}
                    >
                      Licensed
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}

          {breederPetBreeds.length > 0 ? (
            <View style={styles.cardSection}>
              <Text style={styles.sectionTitle}>Breeds</Text>
              <Text style={styles.sectionSubtitle}>
                Pet breeds owned by this breeder
              </Text>
              <View style={styles.breedWrap}>
                {breederPetBreeds.map((breed, index) => (
                  <View key={`${breed}-${index}`} style={styles.breedChip}>
                    <Feather name="check" size={11} color="#F38C69" />
                    <Text style={styles.breedChipText}>{breed}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View
            style={styles.cardSection}
            onLayout={(event) => setPetsSectionY(event.nativeEvent.layout.y)}
          >
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>
                {breederData.name}&apos;s Pets
              </Text>
              <TouchableOpacity
                style={styles.viewPetsButton}
                onPress={handleViewPetsPress}
              >
                <Feather name="eye" size={12} color="#F38C69" />
                <Text style={styles.viewPetsText}>View breeder pets</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionSubtitle}>Available for breeding</Text>

            {breederPets.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.petListRow}
              >
                {breederPets.map((pet: BreederPet) => {
                  const petAge = formatYearLabel(pet.age) || "Age n/a";

                  return (
                    <TouchableOpacity
                      key={pet.pet_id}
                      style={styles.petCard}
                      onPress={() => handlePetPress(pet.pet_id)}
                    >
                      {pet.profile_image ? (
                        <Image
                          source={{ uri: getImageUrl(pet.profile_image) }}
                          style={styles.petImage}
                        />
                      ) : (
                        <View
                          style={[styles.petImage, styles.petImagePlaceholder]}
                        >
                          <Ionicons name="paw" size={20} color="#A8A5B3" />
                        </View>
                      )}

                      <Text style={styles.petName} numberOfLines={1}>
                        {pet.name}
                      </Text>
                      <Text style={styles.petMeta} numberOfLines={2}>
                        {pet.species} · {pet.sex} · {petAge}
                      </Text>

                      <View
                        style={[
                          styles.petStatusPill,
                          pet.is_on_cooldown
                            ? styles.petStatusCooldown
                            : styles.petStatusAvailable,
                        ]}
                      >
                        <Text
                          style={[
                            styles.petStatusText,
                            pet.is_on_cooldown
                              ? styles.petStatusCooldownText
                              : styles.petStatusAvailableText,
                          ]}
                        >
                          {pet.is_on_cooldown ? "On Cooldown" : "For Breeding"}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyBlock}>
                <Ionicons name="paw-outline" size={22} color="#B4AFBD" />
                <Text style={styles.emptyText}>No pets available yet.</Text>
              </View>
            )}
          </View>

          <View style={styles.cardSection}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <Text style={styles.sectionSubtitle}>What other breeders say</Text>

            <View style={styles.reviewsSummaryCard}>
              <View style={styles.reviewsScoreCol}>
                <Text style={styles.reviewsScore}>
                  {ratingDisplay.toFixed(1)}
                </Text>
                <View style={styles.ratingStripStars}>
                  <StarIcons rating={ratingDisplay} size={12} />
                </View>
                <Text style={styles.reviewsHint}>{reviewCount} reviews</Text>
              </View>

              <View style={styles.reviewsBarsCol}>
                <RatingBar label="5" fill={reviewFill.five} />
                <RatingBar label="4" fill={reviewFill.four} />
                <RatingBar label="3" fill={reviewFill.three} />
                <RatingBar label="2" fill={reviewFill.two} />
                <RatingBar label="1" fill={reviewFill.one} />
              </View>
            </View>

            {topCategoryTags.length > 0 ? (
              <View style={styles.reviewCategoryRow}>
                {topCategoryTags.map((tag) => (
                  <View key={tag} style={styles.reviewCategoryChip}>
                    <Text style={styles.reviewCategoryText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {hasLiveReviews ? (
              <>
                {reviews.map((review) => {
                  const reviewerName = review.reviewer?.name || "Anonymous";
                  const initials = reviewerName
                    .split(" ")
                    .map((part) => part.charAt(0))
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const ratingTags = (review.ratings || [])
                    .slice(0, 4)
                    .map((entry, index) => {
                      const label =
                        reviewCategories[entry.category] || entry.category;
                      const ratingValue = parseNumeric(entry.rating);
                      if (ratingValue === null) return null;

                      return {
                        key: `${review.id}-${entry.category}-${index}`,
                        text: `${label} ${ratingValue.toFixed(1)}`,
                      };
                    })
                    .filter(
                      (tag): tag is { key: string; text: string } =>
                        tag !== null,
                    );

                  return (
                    <View key={review.id} style={styles.reviewCard}>
                      <View style={styles.reviewTopRow}>
                        <View style={styles.reviewerHeadWrap}>
                          {review.reviewer?.profile_image ? (
                            <Image
                              source={{
                                uri: getImageUrl(review.reviewer.profile_image),
                              }}
                              style={styles.reviewerAvatar}
                            />
                          ) : (
                            <View
                              style={[
                                styles.reviewerAvatar,
                                styles.reviewerAvatarPlaceholder,
                              ]}
                            >
                              <Text style={styles.reviewerInitials}>
                                {initials || "AN"}
                              </Text>
                            </View>
                          )}

                          <View>
                            <Text style={styles.reviewerName}>
                              {reviewerName}
                            </Text>
                            <Text style={styles.reviewerDate}>
                              {dayjs(review.created_at).format("MMM YYYY")}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.reviewStarsWrap}>
                          <StarIcons rating={review.average_rating} size={10} />
                        </View>
                      </View>

                      {review.comment ? (
                        <Text style={styles.reviewComment} numberOfLines={2}>
                          {review.comment}
                        </Text>
                      ) : null}

                      {ratingTags.length > 0 ? (
                        <View style={styles.reviewTagRow}>
                          {ratingTags.map((tag) => (
                            <ReviewTag key={tag.key} text={tag.text} />
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })}

                {reviewPage < reviewLastPage ? (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={handleLoadMoreReviews}
                    disabled={loadingMoreReviews}
                  >
                    {loadingMoreReviews ? (
                      <ActivityIndicator size="small" color="#F38C69" />
                    ) : (
                      <Text style={styles.loadMoreButtonText}>
                        Show More Reviews
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : null}
              </>
            ) : (
              <View style={styles.emptyReviewsCard}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color="#B4AFBD"
                />
                <Text style={styles.emptyText}>
                  No reviews yet for this breeder.
                </Text>
              </View>
            )}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4EFED",
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#F4EFED",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: "#8D8897",
  },

  heroWrap: {
    height: 288,
    overflow: "hidden",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  heroIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.24)",
  },
  heroTopTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  heroIdentityBlock: {
    marginTop: 12,
    alignItems: "center",
    paddingHorizontal: 18,
  },
  avatarFrame: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    overflow: "visible",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 46,
  },
  avatarPlaceholder: {
    backgroundColor: "#EFF0F4",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarVerifyBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#59C9A8",
    alignItems: "center",
    justifyContent: "center",
  },
  heroName: {
    marginTop: 10,
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 38,
    textAlign: "center",
  },
  heroMeta: {
    marginTop: 2,
    color: "rgba(255,255,255,0.92)",
    fontSize: 12,
    textAlign: "center",
  },
  heroChipRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  heroChip: {
    marginHorizontal: 4,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.56)",
    flexDirection: "row",
    alignItems: "center",
  },
  heroChipText: {
    marginLeft: 4,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  body: {
    flex: 1,
  },
  bodyContent: {
    paddingBottom: 28,
  },
  overlaySheet: {
    marginTop: -22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#F4EFED",
    paddingTop: 10,
    paddingHorizontal: 10,
  },

  ratingStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  ratingStripStars: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  ratingStripValue: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "700",
    color: "#322E3D",
  },
  ratingStripHint: {
    marginLeft: 6,
    fontSize: 10,
    color: "#9C98A8",
  },

  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEE8E6",
    overflow: "hidden",
    marginBottom: 10,
  },
  statCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  statDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#EFE9E6",
  },
  statValue: {
    fontSize: 34,
    fontWeight: "700",
    color: "#342F3F",
    lineHeight: 36,
  },
  statLabel: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: "700",
    color: "#A4A0AF",
    letterSpacing: 0.6,
  },

  cardSection: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEE8E6",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2F2A3A",
  },
  sectionSubtitle: {
    marginTop: 2,
    marginBottom: 10,
    fontSize: 11,
    color: "#9E9AA8",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  verificationRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#F9F6F5",
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  verificationIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  verificationBody: {
    flex: 1,
    marginLeft: 8,
  },
  verificationTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#312C3B",
  },
  verificationSub: {
    marginTop: 1,
    fontSize: 10,
    color: "#9A96A4",
  },
  verificationState: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verificationStateText: {
    fontSize: 10,
    fontWeight: "700",
  },

  breedWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  breedChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#FFF1EB",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  breedChipText: {
    marginLeft: 4,
    fontSize: 11,
    color: "#D66E4A",
    fontWeight: "600",
  },

  viewPetsButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F7D8CB",
    backgroundColor: "#FFF6F2",
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  viewPetsText: {
    marginLeft: 5,
    fontSize: 10,
    fontWeight: "700",
    color: "#F38C69",
    textTransform: "uppercase",
  },

  petListRow: {
    paddingRight: 2,
  },
  petCard: {
    width: 132,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0EAE7",
    backgroundColor: "#FFFAF8",
    padding: 8,
    marginRight: 9,
  },
  petImage: {
    width: "100%",
    height: 86,
    borderRadius: 10,
    backgroundColor: "#EDE9ED",
  },
  petImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  petName: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
    color: "#2F2A3A",
  },
  petMeta: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 14,
    color: "#8E8A98",
    textTransform: "capitalize",
    minHeight: 28,
  },
  petStatusPill: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  petStatusAvailable: {
    backgroundColor: "#FFF1EB",
  },
  petStatusCooldown: {
    backgroundColor: "#EAF0FF",
  },
  petStatusText: {
    fontSize: 9,
    fontWeight: "700",
  },
  petStatusAvailableText: {
    color: "#F38C69",
  },
  petStatusCooldownText: {
    color: "#5F83D8",
  },

  emptyBlock: {
    borderRadius: 12,
    backgroundColor: "#F9F6F5",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  emptyText: {
    marginTop: 6,
    fontSize: 12,
    color: "#9E9AA8",
  },

  reviewsSummaryCard: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0EAE7",
    backgroundColor: "#FFFBFA",
    padding: 10,
  },
  reviewsScoreCol: {
    width: 86,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  reviewsScore: {
    fontSize: 40,
    lineHeight: 40,
    color: "#2F2A3A",
    fontWeight: "700",
  },
  reviewsHint: {
    marginTop: 6,
    fontSize: 10,
    color: "#9C98A8",
  },
  reviewsBarsCol: {
    flex: 1,
    justifyContent: "center",
    paddingLeft: 6,
  },
  reviewCategoryRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  reviewCategoryChip: {
    borderRadius: 999,
    backgroundColor: "#F6F1FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  reviewCategoryText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7F71C7",
  },
  reviewCard: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F0EAE7",
    backgroundColor: "#FFFFFF",
    padding: 10,
  },
  reviewTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewerHeadWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewerAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 8,
    backgroundColor: "#EBE6EF",
  },
  reviewerAvatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  reviewerInitials: {
    fontSize: 9,
    color: "#8A8497",
    fontWeight: "700",
  },
  reviewerName: {
    fontSize: 12,
    color: "#312C3B",
    fontWeight: "700",
  },
  reviewerDate: {
    fontSize: 9,
    color: "#AAA6B4",
    marginTop: 1,
  },
  reviewStarsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  reviewComment: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 15,
    color: "#5D5969",
  },
  reviewTagRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  reviewTag: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  reviewTagText: {
    marginLeft: 4,
    fontSize: 9,
    fontWeight: "700",
  },
  loadMoreButton: {
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F7D8CB",
    backgroundColor: "#FFF6F2",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  loadMoreButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F38C69",
    textTransform: "uppercase",
  },
  emptyReviewsCard: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#F9F6F5",
    borderWidth: 1,
    borderColor: "#EFE8E5",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  ratingBarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ratingBarLabel: {
    width: 10,
    fontSize: 10,
    fontWeight: "700",
    color: "#8A8695",
  },
  ratingTrack: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: "#E8E2E0",
  },
  ratingFill: {
    height: 4,
    borderRadius: 4,
    backgroundColor: "#F1A916",
  },
});
