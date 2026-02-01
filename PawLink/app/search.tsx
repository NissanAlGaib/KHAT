import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, Shadows, FontSize } from "@/constants";
import { searchService, SearchFilters, Breeder } from "@/services/searchService";
import { Pet } from "@/types/Pet";
import { ShooterProfile } from "@/types/User";
import { API_BASE_URL } from "@/config/env";
import ErrorBoundary from "@/components/ErrorBoundary";

// Types
type TabType = "pets" | "breeders" | "shooters";

function SearchScreenContent() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  // State
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>((params.tab as TabType) || "pets");
  const [filters, setFilters] = useState<SearchFilters>({
    species: (params.species as "dog" | "cat") || undefined,
    sex: undefined,
  });
  
  const [results, setResults] = useState<(Pet | Breeder | ShooterProfile)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    const recent = await searchService.getRecentSearches();
    setRecentSearches(recent);
  };

  // Search function
  const performSearch = async (searchQuery: string, currentTab: TabType, currentFilters: SearchFilters) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      let data: any[] = [];
      
      switch (currentTab) {
        case "pets":
          data = await searchService.searchPets(searchQuery, currentFilters);
          break;
        case "breeders":
          data = await searchService.searchBreeders(searchQuery);
          break;
        case "shooters":
          data = await searchService.searchShooters(searchQuery);
          break;
      }
      
      // Ensure data is always an array
      const safeData = Array.isArray(data) ? data : [];
      setResults(safeData);
      
      // Save to recent searches if we got results
      if (safeData.length > 0) {
        await searchService.saveRecentSearch(searchQuery);
        // Reload recent searches to update the list
        loadRecentSearches();
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search using native setTimeout (no external dependency)
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Effect to trigger search when dependencies change
  useEffect(() => {
    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new debounce timeout
    debounceTimeoutRef.current = setTimeout(() => {
      performSearch(query, activeTab, filters);
    }, 300);

    // Cleanup on unmount or dependency change
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [query, activeTab, filters]);

  // Handlers
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setResults([]); // Clear results on tab change to avoid flash of wrong content
  };

  const toggleFilter = (type: "species" | "sex", value: string) => {
    setFilters((prev) => {
      const newValue = prev[type] === value ? undefined : (value as any);
      return { ...prev, [type]: newValue };
    });
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

  // Render Items
  const renderPetCard = ({ item }: { item: Pet }) => {
    // Defensive check - skip rendering if item is invalid
    if (!item) return null;
    
    // Handle both frontend Pet type (id, gender, images) and backend response (pet_id, sex, photos)
    const petId = (item as any).pet_id || item.id;
    if (!petId) return null;
    
    const petGender = (item as any).sex || item.gender;
    const profileImage = (item as any).profile_image;
    const photos = (item as any).photos;
    const displayName = item.name || 'Unknown';
    const displayBreed = item.breed || 'Unknown breed';
    
    // Try to get photo URL from various sources
    let photoUrl = item.primary_photo_url;
    if (!photoUrl && profileImage) {
      photoUrl = profileImage;
    }
    if (!photoUrl && photos && photos.length > 0) {
      const primary = photos.find((p: any) => p.is_primary);
      photoUrl = primary ? primary.photo_url : photos[0].photo_url;
    }
    if (!photoUrl && item.images && item.images.length > 0) {
      photoUrl = item.images[0].url;
    }
    
    const fullPhotoUrl = photoUrl ? (photoUrl.startsWith('http') ? photoUrl : `${API_BASE_URL}/storage/${photoUrl}`) : null;

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
          <View style={[
            styles.badge, 
            { backgroundColor: petGender === 'female' ? '#FFD1DC' : '#BAE6FD' }
          ]}>
            <Text style={[
              styles.badgeText,
              { color: petGender === 'female' ? '#FF1493' : '#0077B6' }
            ]}>
              {petGender === 'female' ? '♀' : '♂'}
            </Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>{displayBreed}</Text>
          <Text style={styles.cardPrice}>
            {item.breeding_price ? `$${item.breeding_price}` : 'Contact for price'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderUserCard = ({ item, type }: { item: Breeder | ShooterProfile, type: 'breeder' | 'shooter' }) => {
    // Defensive check - skip rendering if item is invalid
    if (!item || !item.id) return null;
    
    const photoUrl = item.profile_image ? (item.profile_image.startsWith('http') ? item.profile_image : `${API_BASE_URL}/storage/${item.profile_image}`) : null;
    const displayName = item.name || 'Unknown';
    
    return (
      <TouchableOpacity 
        style={styles.listCard}
        onPress={() => {
          if (type === 'shooter') {
            router.push(`/(shooter)/${item.id}`);
          } else {
            // Assuming breeder profile route exists or using generic profile
            router.push(`/(tabs)/profile?userId=${item.id}`);
          }
        }}
      >
        <View style={styles.avatarContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={styles.listTextContent}>
          <Text style={styles.listTitle}>{displayName}</Text>
          <Text style={styles.listSubtitle}>
            {item.city && item.state ? `${item.city}, ${item.state}` : 'Location unknown'}
          </Text>
          <View style={styles.ratingContainer}>
            <Feather name="star" size={12} color={Colors.warning} />
            <Text style={styles.ratingText}>{item.rating || 'New'}</Text>
            {type === 'shooter' && (item as ShooterProfile).experience_years && (
              <Text style={styles.experienceText}>• {(item as ShooterProfile).experience_years}y exp</Text>
            )}
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    if (!hasSearched && !query) {
      return (
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
                    <Feather name="clock" size={14} color={Colors.textMuted} style={{ marginRight: 6 }} />
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
    }

    if (results.length === 0) {
      return (
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
    }

    if (activeTab === "pets") {
      return (
        <FlatList
          data={results as Pet[]}
          renderItem={renderPetCard}
          keyExtractor={(item) => ((item as any).pet_id || item.id).toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    return (
      <FlatList
        data={results as (Breeder | ShooterProfile)[]}
        renderItem={({ item }) => renderUserCard({ item, type: activeTab === 'breeders' ? 'breeder' : 'shooter' })}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Feather name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab}...`}
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

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {(["pets", "breeders", "shooters"] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => handleTabChange(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Filters (Only for Pets) */}
      {activeTab === "pets" && (
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
            <TouchableOpacity 
              style={[styles.filterChip, filters.species === 'dog' && styles.activeFilterChip]}
              onPress={() => toggleFilter('species', 'dog')}
            >
              <Text style={[styles.filterText, filters.species === 'dog' && styles.activeFilterText]}>🐶 Dogs</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, filters.species === 'cat' && styles.activeFilterChip]}
              onPress={() => toggleFilter('species', 'cat')}
            >
              <Text style={[styles.filterText, filters.species === 'cat' && styles.activeFilterText]}>🐱 Cats</Text>
            </TouchableOpacity>
            <View style={styles.filterDivider} />
            <TouchableOpacity 
              style={[styles.filterChip, filters.sex === 'male' && styles.activeFilterChip]}
              onPress={() => toggleFilter('sex', 'male')}
            >
              <Text style={[styles.filterText, filters.sex === 'male' && styles.activeFilterText]}>♂ Male</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterChip, filters.sex === 'female' && styles.activeFilterChip]}
              onPress={() => toggleFilter('sex', 'female')}
            >
              <Text style={[styles.filterText, filters.sex === 'female' && styles.activeFilterText]}>♀ Female</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
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

const { width } = Dimensions.get('window');
const cardWidth = (width - Spacing.lg * 2 - Spacing.md) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    height: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  tab: {
    marginRight: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  activeTabText: {
    color: Colors.primary,
  },
  filtersContainer: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeFilterChip: {
    backgroundColor: Colors.bgCoral,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  activeFilterText: {
    color: Colors.primaryDark,
  },
  filterDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.borderMedium,
    alignSelf: 'center',
    marginHorizontal: Spacing.xs,
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  recentContainer: {
    padding: Spacing.lg,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAllText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  noRecentText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  recentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  recentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  recentTagContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 250,
  },
  // Grid Styles
  gridContent: {
    padding: Spacing.lg,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  card: {
    width: cardWidth,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  imageContainer: {
    height: cardWidth, // Square image
    backgroundColor: Colors.bgTertiary,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
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
    fontWeight: '600',
    color: Colors.primary,
  },
  // List Styles
  listContainer: {
    padding: Spacing.lg,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  listTextContent: {
    flex: 1,
  },
  listTitle: {
    fontSize: FontSize.base,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  listSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  experienceText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginLeft: 4,
  },
});
