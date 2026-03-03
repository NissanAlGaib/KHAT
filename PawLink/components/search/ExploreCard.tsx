import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from "@/constants";
import { getStorageUrl } from "@/utils/imageUrl";
import { ExplorePetItem } from "@/services/searchService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = Spacing.sm;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - CARD_GAP) / 2;

interface ExploreCardProps {
  item: ExplorePetItem;
  onPress: () => void;
}

export default function ExploreCard({ item, onPress }: ExploreCardProps) {
  // Resolve photo URL
  let photoUrl: string | null = null;
  if (item.profile_image) {
    photoUrl = getStorageUrl(item.profile_image);
  }
  if (!photoUrl && item.photos?.length > 0) {
    const primary = item.photos.find((p) => p.is_primary);
    photoUrl = getStorageUrl(
      primary ? primary.photo_url : item.photos[0].photo_url,
    );
  }

  const petGender = item.sex;
  const isOnCooldown = item.is_on_cooldown;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.imageContainer}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Feather name="image" size={28} color={Colors.textDisabled} />
          </View>
        )}

        {/* Gender badge */}
        <View
          style={[
            styles.genderBadge,
            {
              backgroundColor:
                petGender === "female" || petGender === "Female"
                  ? "#FFD1DC"
                  : "#BAE6FD",
            },
          ]}
        >
          <Text
            style={[
              styles.genderText,
              {
                color:
                  petGender === "female" || petGender === "Female"
                    ? "#FF1493"
                    : "#0077B6",
              },
            ]}
          >
            {petGender === "female" || petGender === "Female" ? "♀" : "♂"}
          </Text>
        </View>

        {/* Cooldown badge */}
        {isOnCooldown && (
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

        {/* Species icon */}
        <View style={styles.speciesIcon}>
          <MaterialCommunityIcons
            name={item.species?.toLowerCase() === "cat" ? "cat" : "dog"}
            size={14}
            color={Colors.textMuted || "#6B7280"}
          />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.breed} numberOfLines={1}>
          {item.breed}
        </Text>
        {item.owner && (
          <View style={styles.ownerRow}>
            <Feather name="user" size={10} color={Colors.textMuted} />
            <Text style={styles.ownerName} numberOfLines={1}>
              {item.owner.name}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export { CARD_WIDTH, CARD_GAP };

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: CARD_GAP,
  },
  imageContainer: {
    width: "100%",
    height: CARD_WIDTH,
    backgroundColor: Colors.bgTertiary,
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bgTertiary,
  },
  genderBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  genderText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  cooldownOverlay: {
    position: "absolute",
    top: 8,
    left: 8,
  },
  cooldownBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  cooldownText: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.white,
  },
  speciesIcon: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: BorderRadius.full,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  speciesEmoji: {
    fontSize: 13,
  },
  content: {
    padding: Spacing.sm,
  },
  name: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 1,
  },
  breed: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ownerName: {
    fontSize: FontSize.xs - 1,
    color: Colors.textMuted,
  },
});
