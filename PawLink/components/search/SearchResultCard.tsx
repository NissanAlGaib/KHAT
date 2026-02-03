import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSize, Shadows } from "@/constants";
import { getStorageUrl } from "@/utils/imageUrl";

interface PetCardProps {
  type: "pet";
  item: {
    pet_id: number;
    name: string;
    breed: string;
    sex: string;
    profile_image: string | null;
  };
  onPress: () => void;
}

interface UserCardProps {
  type: "breeder" | "shooter";
  item: {
    id: number;
    name: string;
    profile_image: string | null;
    pet_breeds?: string[];
    pet_count?: number;
    experience_years?: number;
  };
  onPress: () => void;
}

type SearchResultCardProps = PetCardProps | UserCardProps;

export default function SearchResultCard(props: SearchResultCardProps) {
  const { type, item, onPress } = props;

  const getImageUrl = (imageUrl: string | null): string | null => {
    return getStorageUrl(imageUrl);
  };

  if (type === "pet") {
    const petItem = item as PetCardProps["item"];
    const photoUrl = getImageUrl(petItem.profile_image);

    return (
      <TouchableOpacity style={styles.petCard} onPress={onPress} activeOpacity={0.8}>
        <View style={styles.petImageContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.petImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Feather name="image" size={24} color={Colors.textMuted} />
            </View>
          )}
          <View
            style={[
              styles.genderBadge,
              { backgroundColor: petItem.sex === "female" ? "#FFD1DC" : "#BAE6FD" },
            ]}
          >
            <Text
              style={[
                styles.genderText,
                { color: petItem.sex === "female" ? "#FF1493" : "#0077B6" },
              ]}
            >
              {petItem.sex === "female" ? "♀" : "♂"}
            </Text>
          </View>
        </View>
        <View style={styles.petContent}>
          <Text style={styles.petName} numberOfLines={1}>
            {petItem.name}
          </Text>
          <Text style={styles.petBreed} numberOfLines={1}>
            {petItem.breed}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Breeder or Shooter card
  const userItem = item as UserCardProps["item"];
  const photoUrl = getImageUrl(userItem.profile_image);
  const subtitle =
    type === "breeder"
      ? userItem.pet_breeds?.slice(0, 2).join(", ") || "Breeder"
      : `${userItem.experience_years || 0}y experience`;

  return (
    <TouchableOpacity style={styles.userCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.userAvatarContainer}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.userAvatar} />
        ) : (
          <View style={[styles.userAvatar, styles.placeholderAvatar]}>
            <Text style={styles.avatarText}>
              {userItem.name?.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.userName} numberOfLines={1}>
        {userItem.name}
      </Text>
      <Text style={styles.userSubtitle} numberOfLines={1}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Pet Card Styles
  petCard: {
    width: 140,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  petImageContainer: {
    width: "100%",
    height: 120,
    backgroundColor: Colors.bgTertiary,
    position: "relative",
  },
  petImage: {
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
    bottom: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  genderText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  petContent: {
    padding: Spacing.sm,
  },
  petName: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  petBreed: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },

  // User Card Styles (Breeder/Shooter)
  userCard: {
    width: 110,
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  userAvatarContainer: {
    marginBottom: Spacing.sm,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  placeholderAvatar: {
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.white,
  },
  userName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "center",
    marginBottom: 2,
  },
  userSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
