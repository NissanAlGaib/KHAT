import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  ScrollView,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Shadows, FontSize } from "@/constants";
import {
  searchService,
  SearchFilters,
  GlobalSearchResults,
  ExplorePetItem,
  PaginationMeta,
} from "@/services/searchService";
import { getShooters, type ShooterProfile } from "@/services/matchService";
import { getStorageUrl } from "@/utils/imageUrl";
import DistanceBadge from "@/components/core/DistanceBadge";
import SearchMapView from "@/components/app/SearchMapView";
import ErrorBoundary from "@/components/ErrorBoundary";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - CARD_GAP) / 2;

// --- Types ---
type QuickFilter = "all" | "dogs" | "cats" | "male" | "female";

interface UnifiedResult {
  id: string;
  type: "pet" | "breeder" | "shooter";
  name: string;
  subtitle: string;
  imageUrl: string | null;
  petId?: number;
  userId?: number;
  species?: string;
  sex?: string;
  isOnCooldown?: boolean;
  cooldownDaysRemaining?: number | null;
  distanceLabel?: string | null;
}

// --- Main Component ---
function SearchScreenContent() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  // State
  const [query, setQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");

  // Advanced filters (from bottom sheet)
  const [advancedFilters, setAdvancedFilters] = useState<{
    breed?: string;
    age_range?: "<1" | "1-3" | "3-5" | "5+";
  }>({});
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // Pet grid data (default view)
  const [pets, setPets] = useState<ExplorePetItem[]>([]);
  const [petsMeta, setPetsMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Unified search results
  const [searchResults, setSearchResults] = useState<UnifiedResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);

  // Breed filter state (for bottom sheet)
  const [breedList, setBreedList] = useState<string[]>([]);
  const [breedSearch, setBreedSearch] = useState("");
  const [selectedBreed, setSelectedBreed] = useState<string | undefined>(
    undefined,
  );
  const [selectedAgeRange, setSelectedAgeRange] = useState<
    "<1" | "1-3" | "3-5" | "5+" | undefined
  >(undefined);

  // Featured shooters carousel
  const [featuredShooters, setFeaturedShooters] = useState<ShooterProfile[]>(
    [],
  );
  const [shootersLoading, setShootersLoading] = useState(true);
  const [showShooterTooltip, setShowShooterTooltip] = useState(false);
  const [showMapView, setShowMapView] = useState(false);

  const isSearchMode = query.trim().length > 0;

  // Derived filter params
  const getFilters = useCallback((): SearchFilters => {
    const f: SearchFilters = {};
    if (quickFilter === "dogs") f.species = "dog";
    if (quickFilter === "cats") f.species = "cat";
    if (quickFilter === "male") f.sex = "male";
    if (quickFilter === "female") f.sex = "female";
    if (advancedFilters.breed) f.breed = advancedFilters.breed;
    if (advancedFilters.age_range) f.age_range = advancedFilters.age_range;
    return f;
  }, [quickFilter, advancedFilters]);

  // Load pets on mount + filter change
  useEffect(() => {
    if (!isSearchMode) {
      loadPets(true);
    }
  }, [quickFilter, advancedFilters]);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
    loadBreedList();
    loadFeaturedShooters();

    // Check for incoming tab param (from See All buttons)
    const tabParam = params.tab as string;
    if (tabParam === "pets") setQuickFilter("all");

    // First-visit tooltip for shooter section
    AsyncStorage.getItem("shooterTooltipSeen").then((val) => {
      if (val !== "true") setShowShooterTooltip(true);
    });
  }, []);

  // Debounced search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Data loading — tries searchPets first, falls back to searchGlobal
  const loadPets = async (reset: boolean) => {
    if (reset) {
      setIsLoading(true);
      setErrorMessage(null);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const page = reset ? 1 : (petsMeta?.current_page || 0) + 1;
      const filters = getFilters();

      let petItems: ExplorePetItem[] = [];
      let meta: PaginationMeta = {
        current_page: page,
        per_page: 20,
        total: 0,
        last_page: 1,
      };

      try {
        // Primary: searchPets endpoint (exists on all backend versions)
        const result = await searchService.searchPets("", {
          ...filters,
          page,
          per_page: 20,
        });
        petItems = result.data || [];
        meta = result.meta;
      } catch (primaryErr: any) {
        console.warn(
          "searchPets failed:",
          primaryErr?.response?.status,
          primaryErr?.response?.data?.message || primaryErr?.message,
        );

        // Fallback: use searchGlobal to at least get some pets
        if (page === 1) {
          try {
            const globalResult = await searchService.searchGlobal("", 50);
            petItems = (globalResult.pets?.items || []).map((item) => ({
              ...item,
              photos: [] as Array<{ photo_url: string; is_primary: boolean }>,
              birthdate: null,
              behaviors: null,
              attributes: null,
              is_on_cooldown: item.is_on_cooldown ?? false,
              cooldown_days_remaining: item.cooldown_days_remaining ?? null,
              owner: item.owner ? { ...item.owner, profile_image: null } : null,
            }));
            meta = {
              current_page: 1,
              per_page: 50,
              total: petItems.length,
              last_page: 1,
            };
          } catch (fallbackErr: any) {
            console.warn(
              "searchGlobal fallback also failed:",
              fallbackErr?.message,
            );
            throw primaryErr; // Re-throw original error for the outer catch
          }
        } else {
          throw primaryErr;
        }
      }

      if (reset) {
        setPets(petItems);
      } else {
        setPets((prev) => [...prev, ...petItems]);
      }
      setPetsMeta(meta);
      setErrorMessage(null);
    } catch (error: any) {
      const msg =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";
      console.error(
        "Failed to load pets:",
        msg,
        error?.response?.status,
        error,
      );
      if (reset) {
        setErrorMessage(`Could not load pets: ${msg}`);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const performSearch = async () => {
    const q = query.trim();
    if (!q) return;

    setIsSearching(true);
    try {
      const results = await searchService.searchGlobal(q, 20);
      const unified: UnifiedResult[] = [];

      // Add pets
      results.pets.items.forEach((pet) => {
        unified.push({
          id: `pet-${pet.pet_id}`,
          type: "pet",
          name: pet.name,
          subtitle: `${pet.breed || pet.species}${pet.owner ? ` \u2022 ${pet.owner.name}` : ""}`,
          imageUrl: pet.profile_image,
          petId: pet.pet_id,
          species: pet.species,
          sex: pet.sex,
          isOnCooldown: pet.is_on_cooldown,
          cooldownDaysRemaining: pet.cooldown_days_remaining,
          distanceLabel: pet.distance_label,
        });
      });

      // Add breeders
      results.breeders.items.forEach((b) => {
        unified.push({
          id: `breeder-${b.id}`,
          type: "breeder",
          name: b.name,
          subtitle:
            b.pet_breeds?.slice(0, 2).join(", ") || `${b.pet_count || 0} pets`,
          imageUrl: b.profile_image,
          userId: b.id,
          distanceLabel: b.distance_label,
        });
      });

      // Add shooters
      results.shooters.items.forEach((s) => {
        unified.push({
          id: `shooter-${s.id}`,
          type: "shooter",
          name: s.name,
          subtitle: `${s.experience_years || 0}y experience`,
          imageUrl: s.profile_image,
          userId: s.id,
          distanceLabel: s.distance_label,
        });
      });

      setSearchResults(unified);
      await searchService.saveRecentSearch(q);
      loadRecentSearches();
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadRecentSearches = async () => {
    const recent = await searchService.getRecentSearches();
    setRecentSearches(recent);
  };

  const loadBreedList = async () => {
    try {
      const data = await searchService.getBreeds();
      setBreedList(data.breeds || []);
    } catch {
      // Breeds just won't be available in filter
    }
  };

  const loadFeaturedShooters = async () => {
    setShootersLoading(true);
    try {
      const shooters = await getShooters();
      setFeaturedShooters(shooters.slice(0, 10)); // cap at 10
    } catch {
      // Silently fail — carousel just won't show
    } finally {
      setShootersLoading(false);
    }
  };

  const dismissShooterTooltip = () => {
    setShowShooterTooltip(false);
    AsyncStorage.setItem("shooterTooltipSeen", "true");
  };

  // Handlers
  const handlePetPress = (petId: number) => {
    router.push(`/(pet)/view-profile?id=${petId}`);
  };

  const handleBreederPress = (userId: number) => {
    router.push(`/(breeder)/${userId}`);
  };

  const handleShooterPress = (userId: number) => {
    router.push(`/(shooter)/${userId}`);
  };

  const handleResultPress = (item: UnifiedResult) => {
    if (item.type === "pet" && item.petId) handlePetPress(item.petId);
    else if (item.type === "breeder" && item.userId)
      handleBreederPress(item.userId);
    else if (item.type === "shooter" && item.userId)
      handleShooterPress(item.userId);
  };

  const handleEndReached = () => {
    if (
      !isSearchMode &&
      !isLoadingMore &&
      petsMeta &&
      petsMeta.current_page < petsMeta.last_page
    ) {
      loadPets(false);
    }
  };

  const handleRecentPress = (term: string) => {
    setQuery(term);
    setSearchFocused(false);
  };

  const handleApplyAdvancedFilters = () => {
    setAdvancedFilters({
      breed: selectedBreed,
      age_range: selectedAgeRange,
    });
    setShowFilterSheet(false);
  };

  const handleResetAdvancedFilters = () => {
    setSelectedBreed(undefined);
    setSelectedAgeRange(undefined);
    setAdvancedFilters({});
  };

  const advancedFilterCount = [
    advancedFilters.breed,
    advancedFilters.age_range,
  ].filter(Boolean).length;

  // RENDER: Pet Grid Card
  const renderPetCard = ({ item }: { item: ExplorePetItem }) => {
    let photoUrl: string | null = null;
    if (item.profile_image) photoUrl = getStorageUrl(item.profile_image);
    if (!photoUrl && item.photos?.length > 0) {
      const primary = item.photos.find((p) => p.is_primary);
      photoUrl = getStorageUrl(
        primary ? primary.photo_url : item.photos[0].photo_url,
      );
    }

    const isFemale = item.sex?.toLowerCase() === "female";

    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => handlePetPress(item.pet_id)}
        activeOpacity={0.85}
      >
        {/* Image */}
        <View style={styles.gridImageWrap}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.gridImage} />
          ) : (
            <View style={styles.gridPlaceholder}>
              <Text style={{ fontSize: 32 }}>
                {item.species?.toLowerCase() === "cat"
                  ? "\uD83D\uDC31"
                  : "\uD83D\uDC36"}
              </Text>
            </View>
          )}

          {/* Gender badge */}
          <View
            style={[
              styles.genderBadge,
              { backgroundColor: isFemale ? "#FFD1DC" : "#BAE6FD" },
            ]}
          >
            <Text
              style={[
                styles.genderText,
                { color: isFemale ? "#FF1493" : "#0077B6" },
              ]}
            >
              {isFemale ? "\u2640" : "\u2642"}
            </Text>
          </View>

          {/* Species emoji */}
          <View style={styles.speciesBadge}>
            <Text style={{ fontSize: 12 }}>
              {item.species?.toLowerCase() === "cat"
                ? "\uD83D\uDC31"
                : "\uD83D\uDC36"}
            </Text>
          </View>

          {/* Cooldown overlay */}
          {item.is_on_cooldown && (
            <View style={styles.cooldownOverlay}>
              <View style={styles.cooldownBadge}>
                <Feather name="clock" size={10} color={Colors.white} />
                <Text style={styles.cooldownText}>
                  {item.cooldown_days_remaining
                    ? `${item.cooldown_days_remaining}d`
                    : "Cooldown"}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.gridInfo}>
          <Text style={styles.gridName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.gridBreed} numberOfLines={1}>
            {item.breed || item.species}
          </Text>
          {item.owner && (
            <View style={styles.gridOwnerRow}>
              <Feather name="user" size={10} color={Colors.textMuted} />
              <Text style={styles.gridOwnerName} numberOfLines={1}>
                {item.owner.name}
              </Text>
            </View>
          )}
          {item.distance_label && (
            <DistanceBadge distanceLabel={item.distance_label} size="sm" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // RENDER: Unified Search Result Row
  const renderSearchResult = ({ item }: { item: UnifiedResult }) => {
    const photoUrl = getStorageUrl(item.imageUrl);
    const typeLabel =
      item.type === "pet"
        ? "Pet"
        : item.type === "breeder"
          ? "Breeder"
          : "Shooter";
    const typeColor =
      item.type === "pet"
        ? Colors.primary
        : item.type === "breeder"
          ? Colors.info
          : Colors.warning;
    const typeIcon =
      item.type === "pet"
        ? item.species?.toLowerCase() === "cat"
          ? "\uD83D\uDC31"
          : "\uD83D\uDC36"
        : item.type === "breeder"
          ? "\uD83D\uDC64"
          : "\uD83D\uDCF8";

    return (
      <TouchableOpacity
        style={styles.resultRow}
        onPress={() => handleResultPress(item)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.resultAvatarWrap}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.resultAvatar} />
          ) : (
            <View style={[styles.resultAvatar, styles.resultAvatarPlaceholder]}>
              <Text style={{ fontSize: 20 }}>{typeIcon}</Text>
            </View>
          )}
          {/* Type dot */}
          <View style={[styles.typeDot, { backgroundColor: typeColor }]} />
        </View>

        {/* Text */}
        <View style={styles.resultText}>
          <Text style={styles.resultName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
          {item.distanceLabel && (
            <DistanceBadge distanceLabel={item.distanceLabel} size="sm" />
          )}
        </View>

        {/* Type badge */}
        <View style={[styles.typeBadge, { backgroundColor: typeColor + "18" }]}>
          <Text style={[styles.typeBadgeText, { color: typeColor }]}>
            {typeLabel}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Quick filter data
  const quickFilters: { key: QuickFilter; label: string; icon?: string }[] = [
    { key: "all", label: "All" },
    { key: "dogs", label: "Dogs", icon: "\uD83D\uDC36" },
    { key: "cats", label: "Cats", icon: "\uD83D\uDC31" },
    { key: "male", label: "Male", icon: "\u2642" },
    { key: "female", label: "Female", icon: "\u2640" },
  ];

  // RENDER: Recent searches
  const renderRecentSearches = () => {
    if (!searchFocused || query.trim()) return null;
    if (recentSearches.length === 0) return null;

    return (
      <View style={styles.recentContainer}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>Recent Searches</Text>
          <TouchableOpacity
            onPress={async () => {
              await searchService.clearRecentSearches();
              setRecentSearches([]);
            }}
          >
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        {recentSearches.map((term, i) => (
          <TouchableOpacity
            key={i}
            style={styles.recentRow}
            onPress={() => handleRecentPress(term)}
          >
            <Feather name="clock" size={16} color={Colors.textMuted} />
            <Text style={styles.recentText}>{term}</Text>
            <TouchableOpacity
              onPress={async () => {
                await searchService.removeRecentSearch(term);
                loadRecentSearches();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={16} color={Colors.textDisabled} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // RENDER: Filter Bottom Sheet
  const renderFilterSheet = () => {
    const filteredBreeds = breedSearch.trim()
      ? breedList.filter((b) =>
          b.toLowerCase().includes(breedSearch.toLowerCase()),
        )
      : breedList;

    const ageRanges: { key: "<1" | "1-3" | "3-5" | "5+"; label: string }[] = [
      { key: "<1", label: "Under 1 yr" },
      { key: "1-3", label: "1\u20133 yrs" },
      { key: "3-5", label: "3\u20135 yrs" },
      { key: "5+", label: "5+ yrs" },
    ];

    return (
      <Modal
        visible={showFilterSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterSheet(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={styles.sheetDismiss}
            onPress={() => setShowFilterSheet(false)}
          />
          <View style={styles.sheetContainer}>
            {/* Handle */}
            <View style={styles.sheetHandleRow}>
              <View style={styles.sheetHandle} />
            </View>

            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>More Filters</Text>
              <TouchableOpacity onPress={handleResetAdvancedFilters}>
                <Text style={styles.sheetReset}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.sheetBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Breed Section */}
              <Text style={styles.sheetSectionTitle}>Breed</Text>
              <View style={styles.breedSearchBar}>
                <Feather name="search" size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.breedSearchInput}
                  placeholder="Search breeds..."
                  placeholderTextColor={Colors.textMuted}
                  value={breedSearch}
                  onChangeText={setBreedSearch}
                />
                {breedSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setBreedSearch("")}>
                    <Feather name="x" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.breedChipsWrap}>
                {selectedBreed && (
                  <TouchableOpacity
                    style={[styles.breedChip, styles.breedChipActive]}
                    onPress={() => setSelectedBreed(undefined)}
                  >
                    <Text style={styles.breedChipActiveText}>
                      {selectedBreed} \u2715
                    </Text>
                  </TouchableOpacity>
                )}
                {filteredBreeds.slice(0, 30).map((breed) =>
                  breed === selectedBreed ? null : (
                    <TouchableOpacity
                      key={breed}
                      style={styles.breedChip}
                      onPress={() => setSelectedBreed(breed)}
                    >
                      <Text style={styles.breedChipText}>{breed}</Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>

              {/* Age Range Section */}
              <Text
                style={[styles.sheetSectionTitle, { marginTop: Spacing.xl }]}
              >
                Age Range
              </Text>
              <View style={styles.ageChipsRow}>
                {ageRanges.map((ar) => (
                  <TouchableOpacity
                    key={ar.key}
                    style={[
                      styles.ageChip,
                      selectedAgeRange === ar.key && styles.ageChipActive,
                    ]}
                    onPress={() =>
                      setSelectedAgeRange(
                        selectedAgeRange === ar.key ? undefined : ar.key,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.ageChipText,
                        selectedAgeRange === ar.key && styles.ageChipActiveText,
                      ]}
                    >
                      {ar.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ height: 40 }} />
            </ScrollView>

            {/* Apply button */}
            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyAdvancedFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // RENDER: Error state with retry
  const renderError = () => (
    <View style={styles.emptyContainer}>
      <View
        style={[styles.emptyIconWrap, { backgroundColor: Colors.warningBg }]}
      >
        <Feather name="wifi-off" size={36} color={Colors.warning} />
      </View>
      <Text style={styles.emptyTitle}>Failed to load</Text>
      <Text style={styles.emptySubtitle}>
        {errorMessage || "Please check your connection and try again."}
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => loadPets(true)}
      >
        <Feather name="refresh-cw" size={16} color={Colors.white} />
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  // RENDER: Empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Feather
          name={isSearchMode ? "search" : "inbox"}
          size={36}
          color={Colors.textDisabled}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {isSearchMode ? "No results found" : "No pets available"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isSearchMode
          ? "Try a different search term."
          : "Try adjusting your filters."}
      </Text>
    </View>
  );

  // RENDER: Featured Shooters horizontal carousel (above pet grid)
  const renderFeaturedShooters = () => {
    if (shootersLoading && featuredShooters.length === 0) return null;
    if (featuredShooters.length === 0) return null;

    return (
      <View style={styles.shooterSection}>
        {/* Tooltip — shown on first visit */}
        {showShooterTooltip && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>
              New! Browse breeding assistants near you
            </Text>
            <TouchableOpacity
              onPress={dismissShooterTooltip}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Feather name="x" size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.shooterSectionHeader}>
          <View style={styles.shooterTitleRow}>
            <Feather name="zap" size={16} color={Colors.warning} />
            <Text style={styles.shooterSectionTitle}>Featured Shooters</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shooterScroll}
        >
          {featuredShooters.map((shooter) => {
            const avatarUrl = getStorageUrl(shooter.profile_image);
            return (
              <TouchableOpacity
                key={shooter.id}
                style={styles.shooterCard}
                activeOpacity={0.8}
                onPress={() => handleShooterPress(shooter.id)}
              >
                <View style={styles.shooterAvatarWrap}>
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      style={styles.shooterAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.shooterAvatar,
                        styles.shooterAvatarPlaceholder,
                      ]}
                    >
                      <Feather
                        name="user"
                        size={22}
                        color={Colors.textDisabled}
                      />
                    </View>
                  )}
                  {shooter.shooter_verified && (
                    <View style={styles.shooterVerifiedBadge}>
                      <Feather name="check" size={8} color={Colors.white} />
                    </View>
                  )}
                </View>
                <Text style={styles.shooterName} numberOfLines={1}>
                  {shooter.name}
                </Text>
                {shooter.rating != null && (
                  <View style={styles.shooterRatingRow}>
                    <Feather name="star" size={10} color={Colors.warning} />
                    <Text style={styles.shooterRating}>
                      {shooter.rating.toFixed(1)}
                    </Text>
                  </View>
                )}
                {!shooter.rating && shooter.experience_years != null && (
                  <Text style={styles.shooterExp}>
                    {shooter.experience_years}y exp
                  </Text>
                )}
                {shooter.distance_label && (
                  <DistanceBadge distanceLabel={shooter.distance_label} size="sm" />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // RENDER: Main content
  const renderContent = () => {
    // Search mode: show unified list
    if (isSearchMode) {
      if (isSearching) {
        return (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        );
      }
      if (searchResults.length === 0) return renderEmpty();
      return (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      );
    }

    // Default: pet grid
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.emptySubtitle, { marginTop: Spacing.md }]}>
            Loading pets...
          </Text>
        </View>
      );
    }

    if (errorMessage) return renderError();

    if (pets.length === 0) return renderEmpty();

    return (
      <FlatList
        data={pets}
        renderItem={renderPetCard}
        keyExtractor={(item) => item.pet_id.toString()}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={renderFeaturedShooters}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ padding: Spacing.lg }}
            />
          ) : null
        }
      />
    );
  };

  // JSX
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={Colors.textMuted} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search pets, breeders, shooters..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Feather name="x" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Map toggle button */}
        <TouchableOpacity
          style={[
            styles.moreFilterBtn,
            showMapView && styles.moreFilterBtnActive,
          ]}
          onPress={() => setShowMapView((v) => !v)}
        >
          <Feather
            name="map"
            size={18}
            color={showMapView ? Colors.white : Colors.textSecondary}
          />
        </TouchableOpacity>

        {/* More filters button */}
        <TouchableOpacity
          style={[
            styles.moreFilterBtn,
            advancedFilterCount > 0 && styles.moreFilterBtnActive,
          ]}
          onPress={() => setShowFilterSheet(true)}
        >
          <Feather
            name="sliders"
            size={18}
            color={
              advancedFilterCount > 0 ? Colors.white : Colors.textSecondary
            }
          />
          {advancedFilterCount > 0 && (
            <View style={styles.moreFilterBadge}>
              <Text style={styles.moreFilterBadgeText}>
                {advancedFilterCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Filter Chips (only in grid mode) */}
      {!isSearchMode && (
        <View style={styles.chipBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
          >
            {quickFilters.map((f) => {
              const active = quickFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setQuickFilter(f.key)}
                >
                  {f.icon && <Text style={styles.chipIcon}>{f.icon}</Text>}
                  <Text
                    style={[styles.chipLabel, active && styles.chipLabelActive]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active advanced filters pills */}
          {advancedFilterCount > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.chipScroll, { paddingTop: 0 }]}
            >
              {advancedFilters.breed && (
                <View style={styles.advPill}>
                  <Text style={styles.advPillText}>
                    {advancedFilters.breed}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setAdvancedFilters({
                        ...advancedFilters,
                        breed: undefined,
                      })
                    }
                  >
                    <Feather name="x" size={12} color={Colors.primaryDark} />
                  </TouchableOpacity>
                </View>
              )}
              {advancedFilters.age_range && (
                <View style={styles.advPill}>
                  <Text style={styles.advPillText}>
                    {advancedFilters.age_range === "<1"
                      ? "Under 1yr"
                      : advancedFilters.age_range === "5+"
                        ? "5+ yrs"
                        : `${advancedFilters.age_range} yrs`}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setAdvancedFilters({
                        ...advancedFilters,
                        age_range: undefined,
                      })
                    }
                  >
                    <Feather name="x" size={12} color={Colors.primaryDark} />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      )}

      {/* Recent Searches Overlay */}
      {renderRecentSearches()}

      {/* Content */}
      <View style={styles.body}>
        {showMapView ? (
          <SearchMapView onClose={() => setShowMapView(false)} />
        ) : (
          renderContent()
        )}
      </View>

      {/* Filter Bottom Sheet */}
      {renderFilterSheet()}
    </View>
  );
}

// Export
export default function SearchScreen() {
  return (
    <ErrorBoundary>
      <SearchScreenContent />
    </ErrorBoundary>
  );
}

// Styles
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 42,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    height: "100%",
  },
  moreFilterBtn: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  moreFilterBtnActive: {
    backgroundColor: Colors.primary,
  },
  moreFilterBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: Colors.white,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  moreFilterBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.primary,
  },

  // Quick Filter Chips
  chipBar: {
    backgroundColor: Colors.white,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  chipScroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 4,
  },
  chipActive: {
    backgroundColor: Colors.bgCoral,
    borderColor: Colors.primary,
  },
  chipIcon: {
    fontSize: 13,
  },
  chipLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  chipLabelActive: {
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  advPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCoral,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 5,
  },
  advPillText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.primaryDark,
  },

  // Body
  body: {
    flex: 1,
  },

  // Pet Grid
  gridContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  gridRow: {
    justifyContent: "space-between",
    marginBottom: CARD_GAP,
  },
  gridCard: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  gridImageWrap: {
    width: "100%",
    height: CARD_WIDTH * 1.1,
    backgroundColor: Colors.bgTertiary,
    position: "relative",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gridPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bgTertiary,
  },
  genderBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  genderText: {
    fontSize: 14,
    fontWeight: "700",
  },
  speciesBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 10,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  cooldownOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  cooldownBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  cooldownText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.white,
  },
  gridInfo: {
    padding: Spacing.sm,
  },
  gridName: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  gridBreed: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 1,
  },
  gridOwnerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  gridOwnerName: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    flex: 1,
  },

  // Unified Search Results
  resultsList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.md,
  },
  resultAvatarWrap: {
    position: "relative",
  },
  resultAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  resultAvatarPlaceholder: {
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  typeDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  resultText: {
    flex: 1,
  },
  resultName: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  resultSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  typeBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
  },

  // Recent Searches
  recentContainer: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  recentTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clearText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  recentText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 240,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  retryButtonText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.white,
  },

  // Filter Bottom Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheetDismiss: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
  },
  sheetHandleRow: {
    alignItems: "center",
    paddingTop: Spacing.sm,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderMedium,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sheetTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  sheetReset: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  sheetBody: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  sheetSectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  breedSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 38,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  breedSearchInput: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    height: "100%",
  },
  breedChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  breedChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  breedChipActive: {
    backgroundColor: Colors.bgCoral,
    borderColor: Colors.primary,
  },
  breedChipText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  breedChipActiveText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  ageChipsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  ageChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  ageChipActive: {
    backgroundColor: Colors.bgCoral,
    borderColor: Colors.primary,
  },
  ageChipText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  ageChipActiveText: {
    color: Colors.primaryDark,
    fontWeight: "700",
  },
  sheetFooter: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.white,
  },

  // Featured Shooters Carousel
  shooterSection: {
    marginBottom: Spacing.md,
  },
  tooltip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primaryDark,
    marginHorizontal: 0,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  tooltipText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.white,
  },
  shooterSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  shooterTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shooterSectionTitle: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  shooterScroll: {
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  shooterCard: {
    width: 90,
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  shooterAvatarWrap: {
    position: "relative",
    marginBottom: 6,
  },
  shooterAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  shooterAvatarPlaceholder: {
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  shooterVerifiedBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.success,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  shooterName: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textPrimary,
    textAlign: "center",
    maxWidth: 80,
  },
  shooterRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  shooterRating: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  shooterExp: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
