import React, { useState, useEffect, useRef } from "react";
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
} from "@/services/searchService";
import { getStorageUrl } from "@/utils/imageUrl";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  CategorySection,
  SearchResultCard,
  FilterChips,
  CategoryFilter,
} from "@/components/search";

// Types
type SearchMode = "global" | "filtered";

function SearchScreenContent() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // State
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("global");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all");
  const [speciesFilter, setSpeciesFilter] = useState<"dog" | "cat" | undefined>(
    (params.species as "dog" | "cat") || undefined
  );
  const [sexFilter, setSexFilter] = useState<"male" | "female" | undefined>(undefined);

  // Global search results
  const [globalResults, setGlobalResults] = useState<GlobalSearchResults | null>(null);

  // Filtered search results (when category is selected)
  const [filteredResults, setFilteredResults] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Check if came with pre-selected tab
  useEffect(() => {
    const tabParam = params.tab as string;
    if (tabParam && ["pets", "breeders", "shooters"].includes(tabParam)) {
      setActiveCategory(tabParam as CategoryFilter);
      setSearchMode("filtered");
    }
  }, [params.tab]);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    const recent = await searchService.getRecentSearches();
    setRecentSearches(recent);
  };

  // Debounced search
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      performSearch();
    }, 300);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, activeCategory, speciesFilter, sexFilter]);

  const performSearch = async () => {
    if (!query.trim()) {
      setGlobalResults(null);
      setFilteredResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      if (activeCategory === "all") {
        // Global search - get all categories at once
        const results = await searchService.searchGlobal(query, 5);
        setGlobalResults(results);
        setSearchMode("global");
      } else {
        // Filtered search - get specific category with full results
        setSearchMode("filtered");
        let data: any[] = [];

        switch (activeCategory) {
          case "pets":
            const filters: SearchFilters = {};
            if (speciesFilter) filters.species = speciesFilter;
            if (sexFilter) filters.sex = sexFilter;
            data = await searchService.searchPets(query, filters);
            break;
          case "breeders":
            data = await searchService.searchBreeders(query);
            break;
          case "shooters":
            data = await searchService.searchShooters(query);
            break;
        }

        setFilteredResults(Array.isArray(data) ? data : []);
      }

      // Save to recent searches
      await searchService.saveRecentSearch(query);
      loadRecentSearches();
    } catch (error) {
      console.error("Search error:", error);
      setGlobalResults(null);
      setFilteredResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handlers
  const handleCategoryChange = (category: CategoryFilter) => {
    setActiveCategory(category);
    if (category === "all") {
      setSearchMode("global");
    } else {
      setSearchMode("filtered");
    }
  };

  const handleSeeAllPress = (category: "pets" | "breeders" | "shooters") => {
    setActiveCategory(category);
    setSearchMode("filtered");
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
    router.push(`/(tabs)/profile?userId=${userId}`);
  };

  const handleShooterPress = (userId: number) => {
    router.push(`/(shooter)/${userId}`);
  };

  // Render recent searches (when no query)
  const renderRecentSearches = () => (
    <View style={styles.recentContainer}>
      <View style={styles.recentHeader}>
        <Text style={styles.sectionTitle}>Recent Searches</Text>
        {recentSearches.length > 0 && (
          <TouchableOpacity onPress={handleClearAllRecentSearches}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      {recentSearches.length === 0 ? (
        <Text style={styles.noRecentText}>No recent searches</Text>
      ) : (
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
      )}
    </View>
  );

  // Render global search results (categorized)
  const renderGlobalResults = () => {
    if (!globalResults) return null;

    const { pets, breeders, shooters } = globalResults;
    const totalResults = pets.count + breeders.count + shooters.count;

    if (totalResults === 0) {
      return renderEmptyState();
    }

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

  // Render filtered results (full list for specific category)
  const renderFilteredResults = () => {
    if (filteredResults.length === 0) {
      return renderEmptyState();
    }

    if (activeCategory === "pets") {
      return (
        <FlatList
          data={filteredResults}
          renderItem={({ item }) => renderPetCard(item)}
          keyExtractor={(item) => (item.pet_id || item.id).toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
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

  // Render pet card for grid view
  const renderPetCard = (item: any) => {
    if (!item) return null;

    const petId = item.pet_id || item.id;
    if (!petId) return null;

    const petGender = item.sex || item.gender;
    const profileImage = item.profile_image;
    const photos = item.photos;
    const displayName = item.name || "Unknown";
    const displayBreed = item.breed || "Unknown breed";

    let photoUrl = item.primary_photo_url;
    if (!photoUrl && profileImage) {
      photoUrl = profileImage;
    }
    if (!photoUrl && photos && photos.length > 0) {
      const primary = photos.find((p: any) => p.is_primary);
      photoUrl = primary ? primary.photo_url : photos[0].photo_url;
    }

    const fullPhotoUrl = getStorageUrl(photoUrl);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(pet)/pet-profile?id=${petId}`)}
      >
        <View style={styles.imageContainer}>
          {fullPhotoUrl ? (
            <Image source={{ uri: fullPhotoUrl }} style={styles.cardImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Feather name="image" size={24} color={Colors.textMuted} />
            </View>
          )}
          <View
            style={[
              styles.badge,
              { backgroundColor: petGender === "female" ? "#FFD1DC" : "#BAE6FD" },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: petGender === "female" ? "#FF1493" : "#0077B6" },
              ]}
            >
              {petGender === "female" ? "♀" : "♂"}
            </Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {displayBreed}
          </Text>
          <Text style={styles.cardPrice}>
            {item.breeding_price ? `$${item.breeding_price}` : "Contact for price"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render user card for list view
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
            router.push(`/(tabs)/profile?userId=${item.id}`);
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
              : "Location unknown"}
          </Text>
          <View style={styles.ratingContainer}>
            <Feather name="star" size={12} color={Colors.warning} />
            <Text style={styles.ratingText}>{item.rating || "New"}</Text>
            {isShooter && item.experience_years && (
              <Text style={styles.experienceText}>• {item.experience_years}y exp</Text>
            )}
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  // Render empty state
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

  // Render main content
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    if (!hasSearched && !query) {
      return renderRecentSearches();
    }

    if (searchMode === "global" && activeCategory === "all") {
      return renderGlobalResults();
    }

    return renderFilteredResults();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header with Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
            autoFocus={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Feather name="x" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips (shown when user has searched) */}
      {hasSearched && (
        <FilterChips
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          speciesFilter={speciesFilter}
          sexFilter={sexFilter}
          onSpeciesChange={setSpeciesFilter}
          onSexChange={setSexFilter}
          showSpeciesFilters={activeCategory === "pets" || activeCategory === "all"}
        />
      )}

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
    </View>
  );
}

// Wrap with ErrorBoundary to catch crashes and show fallback UI
export default function SearchScreen() {
  return (
    <ErrorBoundary>
      <SearchScreenContent />
    </ErrorBoundary>
  );
}

const { width } = Dimensions.get("window");
const cardWidth = (width - Spacing.lg * 2 - Spacing.md) / 2;

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
  },
  backButton: {
    marginRight: Spacing.md,
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
  content: {
    flex: 1,
  },
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
  recentContainer: {
    padding: Spacing.lg,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
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
  noRecentText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: "italic",
  },
  recentTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  recentTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
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
  // Grid Styles
  gridContent: {
    padding: Spacing.lg,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  card: {
    width: cardWidth,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  imageContainer: {
    height: cardWidth,
    backgroundColor: Colors.bgTertiary,
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  cardContent: {
    padding: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  // List Styles
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
