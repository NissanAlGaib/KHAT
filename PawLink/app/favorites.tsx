import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { SettingsLayout } from "@/components/settings";
import { getFavorites, removeFavorite } from "@/services/favoriteService";
import { FavoritePet } from "@/types/Pet";
import { getStorageUrl } from "@/utils/imageUrl";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

export default function FavoritesScreen() {
  const router = useRouter();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const [favorites, setFavorites] = useState<FavoritePet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = useCallback(async () => {
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchFavorites();
    }, [fetchFavorites]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (pet: FavoritePet) => {
    // Optimistic removal
    setFavorites((prev) => prev.filter((f) => f.pet_id !== pet.pet_id));
    try {
      await removeFavorite(pet.pet_id);
      showAlert({
        title: "Removed",
        message: `${pet.name} removed from favorites.`,
        type: "success",
      });
    } catch {
      // Revert on failure
      setFavorites((prev) => [...prev, pet]);
      showAlert({
        title: "Error",
        message: "Failed to remove favorite. Please try again.",
        type: "error",
      });
    }
  };

  const renderPetCard = ({ item }: { item: FavoritePet }) => {
    const imageUri = getStorageUrl(item.profile_image ?? null);
    const speciesIcon = item.species?.toLowerCase() === "cat" ? "🐱" : "🐶";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/(pet)/view-profile?id=${item.pet_id}`)}
      >
        {/* Pet Image */}
        <View style={styles.imageWrapper}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.cardImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="paw" size={40} color="#D1D5DB" />
            </View>
          )}
          {/* Species Badge */}
          <View style={styles.speciesBadge}>
            <Text style={styles.speciesEmoji}>{speciesIcon}</Text>
          </View>
          {/* Unfavorite Button */}
          <TouchableOpacity
            style={styles.unfavoriteBtn}
            onPress={() => handleRemoveFavorite(item)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="heart" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.petName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.petBreed} numberOfLines={1}>
            {item.breed}
          </Text>
          {/* Owner Row */}
          <View style={styles.ownerRow}>
            {item.owner.profile_image ? (
              <Image
                source={{
                  uri: getStorageUrl(item.owner.profile_image) ?? undefined,
                }}
                style={styles.ownerAvatar}
              />
            ) : (
              <View style={[styles.ownerAvatar, styles.ownerAvatarPlaceholder]}>
                <Ionicons name="person" size={10} color="#9CA3AF" />
              </View>
            )}
            <Text style={styles.ownerName} numberOfLines={1}>
              {item.owner.name}
            </Text>
          </View>
          {item.owner.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="#9CA3AF" />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.owner.location}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="heart-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No Favorites Yet</Text>
      <Text style={styles.emptySubtitle}>
        Browse pets and tap the heart icon to save them here.
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => router.push("/(tabs)")}
      >
        <Text style={styles.browseButtonText}>Browse Pets</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SettingsLayout headerTitle="My Favorites" scrollable={false}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B4A" />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => String(item.pet_id)}
          renderItem={renderPetCard}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.listContent,
            favorites.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#FF6B4A"]}
              tintColor="#FF6B4A"
            />
          }
          ListHeaderComponent={
            favorites.length > 0 ? (
              <Text style={styles.countText}>
                {favorites.length} saved pet{favorites.length !== 1 ? "s" : ""}
              </Text>
            ) : null
          }
        />
      )}
      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </SettingsLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyListContent: {
    flex: 1,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  countText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
    fontWeight: "500",
  },
  // Card
  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F3F4F6",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  speciesBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  speciesEmoji: {
    fontSize: 14,
  },
  unfavoriteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  // Info
  cardInfo: {
    padding: 10,
  },
  petName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  petBreed: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 6,
  },
  ownerAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  ownerAvatarPlaceholder: {
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  ownerName: {
    fontSize: 12,
    color: "#6B7280",
    flex: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    color: "#9CA3AF",
    flex: 1,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  browseButton: {
    marginTop: 24,
    backgroundColor: "#FF6B4A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  browseButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 15,
  },
});
