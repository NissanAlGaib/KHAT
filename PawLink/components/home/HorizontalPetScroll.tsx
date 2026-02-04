import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { Colors, Spacing, BorderRadius, Shadows, FontSize } from "@/constants";
import { getStorageUrl } from "@/utils/imageUrl";
import { PetMatch } from "@/services/matchService";

interface HorizontalPetScrollProps {
  pets: PetMatch[];
  onPetPress: (pet: PetMatch) => void;
}

/**
 * HorizontalPetScroll - Headless horizontal scroll for pets
 * Header is provided by SectionContainer wrapper
 */
export default function HorizontalPetScroll({
  pets,
  onPetPress,
}: HorizontalPetScrollProps) {
  const renderItem = ({ item }: { item: PetMatch }) => {
    const primaryPhotoUrl = item.photos?.find((p) => p.is_primary)?.photo_url;
    const photoUrl = getStorageUrl(primaryPhotoUrl);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => onPetPress(item)}
      >
        <View style={styles.imageContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={{ fontSize: 24 }}>🐾</Text>
            </View>
          )}
          {item.sex && (
            <View
              style={[
                styles.sexBadge,
                {
                  backgroundColor:
                    item.sex.toLowerCase() === "female"
                      ? "#FFD1DC"
                      : "#BAE6FD",
                },
              ]}
            >
              <Text
                style={[
                  styles.sexText,
                  {
                    color:
                      item.sex.toLowerCase() === "female"
                        ? "#FF1493"
                        : "#0077B6",
                  },
                ]}
              >
                {item.sex.toLowerCase() === "female" ? "♀" : "♂"}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.breed} numberOfLines={1}>
            {item.breed || "Unknown"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!pets || pets.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No pets nearby</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={pets}
      renderItem={renderItem}
      keyExtractor={(item) => item.pet_id.toString()}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      snapToInterval={120 + 12} // Card width + gap
      decelerationRate="fast"
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: 12,
  },
  card: {
    width: 120,
    height: 160,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.coralBorder, // Subtle coral border
  },
  imageContainer: {
    width: "100%",
    height: 100,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  sexBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  sexText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  infoContainer: {
    padding: 8,
  },
  name: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  breed: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  emptyState: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bgSecondary,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
});
