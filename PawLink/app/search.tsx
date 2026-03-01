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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Shadows, FontSize } from "@/constants";
import {
  searchService,
  SearchFilters,
  GlobalSearchResults,
  GlobalSearchPetItem,
  GlobalSearchBreederItem,
  GlobalSearchShooterItem,
  ExplorePetItem,
  PaginationMeta,
} from "@/services/searchService";
import { getStorageUrl } from "@/utils/imageUrl";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  CategorySection,
  SearchResultCard,
  FilterBottomSheet,
  ExploreCard,
} from "@/components/search";

// Types
type SearchMode = "explore" | "search";
type CategoryFilter = "all" | "pets" | "breeders" | "shooters";

function SearchScreenContent() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // State
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("explore");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");

  // Filters
  const [filters, setFilters] = useState<SearchFilters>({
    species: (params.species as "dog" | "cat") || undefined,
  });
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // Explore grid data
  const [exploreData, setExploreData] = useState<ExplorePetItem[]>([]);
  const [exploreMeta, setExploreMeta] = useState<PaginationMeta | null>(null);
  const [isLoadingExplore, setIsLoadingExplore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Search results
  const [globalResults, setGlobalResults] =
    useState<GlobalSearchResults | null>(null);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [filteredPetsMeta, setFilteredPetsMeta] =
    useState<PaginationMeta | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Track if initial load happened
  const initialLoadRef = useRef(false);

  // Check if came with pre-selected tab
  useEffect(() => {
    const tabParam = params.tab as string;
    if (tabParam && ["pets", "breeders", "shooters"].includes(tabParam)) {
      setActiveCategory(tabParam as CategoryFilter);
    }
  }, [params.tab]);

  // Load explore data on mount and when filters change
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadRecentSearches();
    }
    if (searchMode === "explore") {
      loadExploreData(true);
    }
  }, [filters]);

  // Debounced search
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setSearchMode("explore");
      setGlobalResults(null);
      setFilteredResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    // Immediately switch to search mode (no flash of explore grid)
    setSearchMode("search");
    setIsSearching(true);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      performSearch();
    }, 400);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, activeCategory, filters]);

  const loadRecentSearches = async () => {
    const recent = await searchService.getRecentSearches();
    setRecentSearches(recent);
  };

  const loadExploreData = async (reset: boolean) => {
    if (reset) {
      setIsLoadingExplore(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const page = reset ? 1 : (exploreMeta?.current_page || 0) + 1;
      let result;

      try {
        // Try the dedicated explore endpoint first
        result = await searchService.explore({
          ...filters,
          page,
          per_page: 20,
        });
      } catch {
        // Fallback: use searchPets with empty query (returns all approved pets)
        console.warn(
          "Explore endpoint unavailable, falling back to searchPets",
        );
        result = await searchService.searchPets("", {
          ...filters,
          page,
          per_page: 20,
        });
      }

      if (reset) {
        setExploreData(result.data);
      } else {
        setExploreData((prev) => [...prev, ...result.data]);
      }
      setExploreMeta(result.meta);
    } catch (error) {
      console.error("Explore load error:", error);
    } finally {
      setIsLoadingExplore(false);
      setIsLoadingMore(false);
    }
  };

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setSearchMode("search");

    try {
      if (activeCategory === "all") {
        const results = await searchService.searchGlobal(query, 5);
        setGlobalResults(results);
      } else if (activeCategory === "pets") {
        const result = await searchService.searchPets(query, {
          ...filters,
          page: 1,
        });
        setFilteredResults(result.data);
        setFilteredPetsMeta(result.meta);
      } else if (activeCategory === "breeders") {
        const data = await searchService.searchBreeders(query);
        setFilteredResults(Array.isArray(data) ? data : []);
      } else if (activeCategory === "shooters") {
        const data = await searchService.searchShooters(query);
        setFilteredResults(Array.isArray(data) ? data : []);
      }

      await searchService.saveRecentSearch(query);
      loadRecentSearches();
    } catch (error) {
      console.error("Search error:", error);
      setGlobalResults(null);
      setFilteredResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const loadMoreSearchPets = async () => {
    if (
      !filteredPetsMeta ||
      filteredPetsMeta.current_page >= filteredPetsMeta.last_page ||
      isLoadingMore
    )
      return;
    setIsLoadingMore(true);
    try {
      const result = await searchService.searchPets(query, {
        ...filters,
        page: filteredPetsMeta.current_page + 1,
      });
      setFilteredResults((prev) => [...prev, ...result.data]);
      setFilteredPetsMeta(result.meta);
    } catch (error) {
      console.error("Load more search pets error:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handlers
  const handleCategoryChange = (category: CategoryFilter) => {
    setActiveCategory(category);
    // Don't reset hasSearched — the useEffect on [query, activeCategory, filters]
    // will re-trigger the search. Show loading spinner during transition.
  };

  const handleSeeAllPress = (category: "pets" | "breeders" | "shooters") => {
    setActiveCategory(category);
  };

  const handleRecentSearchClick = (term: string) => {
    setQuery(term);
  };

  const handleRemoveRecentSearch = async (term: string) => {
    await searchService.removeRecentSearch(term);
    loadRecentSearches();
  };

  const handleClearAllRecentSearches = async () => {
    await searchService.clearRecentSearches();
    setRecentSearches([]);
  };

  const handlePetPress = (petId: number) => {
    router.push(`/(pet)/pet-profile?id=${petId}`);
  };

  const handleBreederPress = (userId: number) => {
    router.push(`/(breeder)/${userId}`);
  };

  const handleShooterPress = (userId: number) => {
    router.push(`/(shooter)/${userId}`);
  };

  const handleFilterApply = (newFilters: SearchFilters) => {
    setFilters(newFilters);
  };

  const handleExploreEndReached = () => {
    if (
      !isLoadingMore &&
      exploreMeta &&
      exploreMeta.current_page < exploreMeta.last_page
    ) {
      loadExploreData(false);
    }
  };

  // Count active filters
  const activeFilterCount = [
    filters.species,
    filters.sex,
    filters.breed,
    filters.age_range,
  ].filter(Boolean).length;

  // Render category chips
  const categories: { key: CategoryFilter; label: string; icon: string }[] = [
    { key: "all", label: "All", icon: "🔍" },
    { key: "pets", label: "Pets", icon: "🐕" },
    { key: "breeders", label: "Breeders", icon: "👤" },
    { key: "shooters", label: "Shooters", icon: "📸" },
  ];

  // Render recent searches overlay (when search focused + no query)
  const renderRecentSearches = () => {
    if (!searchFocused || query.trim()) return null;
    if (recentSearches.length === 0) return null;

    return (
      <View style={styles.recentOverlay}>
        <View style={styles.recentHeader}>
          <Text style={styles.sectionLabel}>Recent Searches</Text>
          <TouchableOpacity onPress={handleClearAllRecentSearches}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recentTags}>
          {recentSearches.map((term, index) => (
            <View key={index} style={styles.recentTag}>
              <TouchableOpacity
                style={styles.recentTagContent}
                onPress={() => handleRecentSearchClick(term)}
              >
                <Feather
                  name="clock"
                  size={14}
                  color={Colors.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.recentTagText}>{term}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeTagButton}
                onPress={() => handleRemoveRecentSearch(term)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Global search results (categorized preview)
  const renderGlobalResults = () => {
    if (!globalResults) return null;

    const { pets, breeders, shooters } = globalResults;
    const totalResults = pets.count + breeders.count + shooters.count;

    if (totalResults === 0) return renderEmptyState();

    return (
      <ScrollView
        style={styles.resultsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsContent}
      >
        {/* Pets Section */}
        <CategorySection
          title="Pets"
          icon="🐕"
          count={pets.count}
          onSeeAllPress={() => handleSeeAllPress("pets")}
        >
          {pets.items.map((pet) => (
            <SearchResultCard
              key={pet.pet_id}
              type="pet"
              item={pet}
              onPress={() => handlePetPress(pet.pet_id)}
            />
          ))}
        </CategorySection>

        {/* Breeders Section */}
        <CategorySection
          title="Breeders"
          icon="👤"
          count={breeders.count}
          onSeeAllPress={() => handleSeeAllPress("breeders")}
        >
          {breeders.items.map((breeder) => (
            <SearchResultCard
              key={breeder.id}
              type="breeder"
              item={breeder}
              onPress={() => handleBreederPress(breeder.id)}
            />
          ))}
        </CategorySection>

        {/* Shooters Section */}
        <CategorySection
          title="Shooters"
          icon="📸"
          count={shooters.count}
          onSeeAllPress={() => handleSeeAllPress("shooters")}
        >
          {shooters.items.map((shooter) => (
            <SearchResultCard
              key={shooter.id}
              type="shooter"
              item={shooter}
              onPress={() => handleShooterPress(shooter.id)}
            />
          ))}
        </CategorySection>

        <View style={{ height: 100 }} />
      </ScrollView>
    );
  };

  // Filtered search results (full list)
  const renderFilteredResults = () => {
    if (filteredResults.length === 0) return renderEmptyState();

    if (activeCategory === "pets") {
      return (
        <FlatList
          data={filteredResults}
          renderItem={({ item }) => (
            <ExploreCard
              item={item}
              onPress={() => handlePetPress(item.pet_id)}
            />
          )}
          keyExtractor={(item) => (item.pet_id || item.id).toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreSearchPets}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={{ padding: 16 }}
              />
            ) : null
          }
        />
      );
    }

    return (
      <FlatList
        data={filteredResults}
        renderItem={({ item }) => renderUserCard(item)}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  // User card for list view (breeders/shooters)
  const renderUserCard = (item: any) => {
    if (!item || !item.id) return null;

    const photoUrl = getStorageUrl(item.profile_image);
    const displayName = item.name || "Unknown";
    const isShooter = activeCategory === "shooters";

    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => {
          if (isShooter) {
            router.push(`/(shooter)/${item.id}`);
          } else {
            router.push(`/(breeder)/${item.id}`);
          }
        }}
      >
        <View style={styles.avatarContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <Text style={styles.avatarText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.listTextContent}>
          <Text style={styles.listTitle}>{displayName}</Text>
          <Text style={styles.listSubtitle}>
            {item.city && item.state
              ? `${item.city}, ${item.state}`
              : isShooter
                ? `${item.experience_years || 0}y experience`
                : item.pet_breeds?.slice(0, 2).join(", ") || "Breeder"}
          </Text>
          <View style={styles.ratingContainer}>
            <Feather name="star" size={12} color={Colors.warning} />
            <Text style={styles.ratingText}>{item.rating || "New"}</Text>
            {isShooter && item.experience_years ? (
              <Text style={styles.experienceText}>
                • {item.experience_years}y exp
              </Text>
            ) : null}
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.centerContainer}>
      <View style={styles.emptyIcon}>
        <Feather name="search" size={40} color={Colors.textDisabled} />
      </View>
      <Text style={styles.emptyTitle}>No results found</Text>
      <Text style={styles.emptySubtitle}>
        Try adjusting your search or filters to find what you're looking for.
      </Text>
    </View>
  );

  // Explore grid (default view - Instagram style)
  const renderExploreGrid = () => {
    if (isLoadingExplore) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>
            Loading pets...
          </Text>
        </View>
      );
    }

    if (exploreData.length === 0) {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="inbox" size={40} color={Colors.textDisabled} />
          </View>
          <Text style={styles.emptyTitle}>No pets found</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your filters to see more pets.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={exploreData}
        renderItem={({ item }) => (
          <ExploreCard
            item={item}
            onPress={() => handlePetPress(item.pet_id)}
          />
        )}
        keyExtractor={(item) => item.pet_id.toString()}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        onEndReached={handleExploreEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator
              size="small"
              color={Colors.primary}
              style={{ padding: 16 }}
            />
          ) : null
        }
      />
    );
  };

  // Main content
  const renderContent = () => {
    // Show loading spinner when search is in progress
    if (isSearching) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    // If in search mode, show results (or empty state if searched with no results)
    if (searchMode === "search") {
      if (!hasSearched) {
        // Still waiting for first results — show nothing special
        return (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        );
      }
      if (activeCategory === "all") {
        return renderGlobalResults();
      }
      return renderFilteredResults();
    }

    // Default: explore grid
    return renderExploreGrid();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Feather
            name="search"
            size={20}
            color={Colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search pets, breeders, shooters..."
            placeholderTextColor={Colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery("");
                setSearchMode("explore");
              }}
            >
              <Feather name="x" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        {/* Filter button */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilterCount > 0 && styles.filterButtonActive,
          ]}
          onPress={() => setShowFilterSheet(true)}
        >
          <Feather
            name="sliders"
            size={20}
            color={
              activeFilterCount > 0 ? Colors.primary : Colors.textSecondary
            }
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Category tabs (when in search mode) */}
      {searchMode === "search" && (
        <View style={styles.categoryBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  activeCategory === cat.key && styles.categoryChipActive,
                ]}
                onPress={() => handleCategoryChange(cat.key)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    activeCategory === cat.key && styles.categoryTextActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Active filters summary bar (explore mode) */}
      {searchMode === "explore" && activeFilterCount > 0 && (
        <View style={styles.activeFiltersBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: Spacing.lg,
              gap: Spacing.sm,
            }}
          >
            {filters.species && (
              <View style={styles.activeFilterPill}>
                <Text style={styles.activeFilterText}>
                  {filters.species === "dog" ? "🐶 Dogs" : "🐱 Cats"}
                </Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, species: undefined })}
                >
                  <Feather name="x" size={14} color={Colors.primaryDark} />
                </TouchableOpacity>
              </View>
            )}
            {filters.sex && (
              <View style={styles.activeFilterPill}>
                <Text style={styles.activeFilterText}>
                  {filters.sex === "male" ? "♂ Male" : "♀ Female"}
                </Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, sex: undefined })}
                >
                  <Feather name="x" size={14} color={Colors.primaryDark} />
                </TouchableOpacity>
              </View>
            )}
            {filters.breed && (
              <View style={styles.activeFilterPill}>
                <Text style={styles.activeFilterText}>{filters.breed}</Text>
                <TouchableOpacity
                  onPress={() => setFilters({ ...filters, breed: undefined })}
                >
                  <Feather name="x" size={14} color={Colors.primaryDark} />
                </TouchableOpacity>
              </View>
            )}
            {filters.age_range && (
              <View style={styles.activeFilterPill}>
                <Text style={styles.activeFilterText}>
                  {filters.age_range === "<1"
                    ? "Under 1yr"
                    : filters.age_range === "5+"
                      ? "5+ years"
                      : `${filters.age_range} years`}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setFilters({ ...filters, age_range: undefined })
                  }
                >
                  <Feather name="x" size={14} color={Colors.primaryDark} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Recent searches overlay */}
      {renderRecentSearches()}

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        onApply={handleFilterApply}
        currentFilters={filters}
      />
    </View>
  );
}

export default function SearchScreen() {
  return (
    <ErrorBoundary>
      <SearchScreenContent />
    </ErrorBoundary>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  backButton: {
    // no extra margin needed with gap
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    height: "100%",
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: Colors.bgCoral,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filterBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  // Category bar
  categoryBar: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  categoryScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgTertiary,
    gap: 4,
  },
  categoryChipActive: {
    backgroundColor: Colors.bgCoral,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.primaryDark,
  },
  // Active filters bar
  activeFiltersBar: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  activeFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgCoral,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 6,
  },
  activeFilterText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.primaryDark,
  },
  // Grid styles
  gridContent: {
    padding: Spacing.lg,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  // Results
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    paddingTop: Spacing.lg,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  // Recent searches
  recentOverlay: {
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
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clearAllText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  recentTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  recentTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgTertiary,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  recentTagContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  removeTagButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  recentTagText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  // Empty state
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 250,
  },
  // List styles (breeders/shooters)
  listContainer: {
    padding: Spacing.lg,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  placeholderAvatar: {
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.white,
  },
  listTextContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  listSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  experienceText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginLeft: 4,
  },
});
