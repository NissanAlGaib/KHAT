import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Colors, Shadows, BorderRadius } from "@/constants";
import { API_BASE_URL } from "@/config/env";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 400;

interface MatchCardProps {
  match: {
    pet1: {
      pet_id: number;
      name: string;
      photo_url?: string;
      breed?: string;
      sex?: string;
      birthdate?: string;
    };
    pet2: {
      pet_id: number;
      name: string;
      photo_url?: string;
      breed?: string;
      sex?: string;
      birthdate?: string;
    };
    compatibility_score: number;
  };
  selectedPetId?: number;
}

const getAge = (birthdate?: string) => {
  if (!birthdate) return "";
  const birth = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age > 0 ? `${age}` : "<1";
};

/**
 * MatchCard - Individual match card for the stack
 * Shows the OTHER pet (not the selected one)
 */
export default function MatchCard({ match, selectedPetId }: MatchCardProps) {
  // Determine which pet to show (the one that's NOT the user's selected pet)
  const displayPet = 
    match.pet1.pet_id === selectedPetId ? match.pet2 : match.pet1;

  const photoUrl = displayPet.photo_url
    ? `${API_BASE_URL}/storage/${displayPet.photo_url}`
    : null;

  const age = getAge(displayPet.birthdate);

  return (
    <View style={styles.card}>
      {/* Photo */}
      <View style={styles.photoContainer}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.placeholderEmoji}>🐕</Text>
          </View>
        )}

        {/* Gradient overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.4)"]}
          style={styles.gradient}
        />

        {/* Compatibility badge */}
        <View style={styles.compatibilityBadge}>
          <Feather name="heart" size={14} color={Colors.primary} />
          <Text style={styles.compatibilityText}>
            {match.compatibility_score}% Match
          </Text>
        </View>
      </View>

      {/* Info section */}
      <View style={styles.infoSection}>
        <View>
          <View style={styles.nameRow}>
            <Text style={styles.petName} numberOfLines={1}>
              {displayPet.name}
              {age && <Text style={styles.petAge}>, {age}</Text>}
            </Text>
            {displayPet.sex && (
              <View
                style={[
                  styles.sexBadge,
                  {
                    backgroundColor:
                      displayPet.sex.toLowerCase() === "female"
                        ? "#FFE4E6"
                        : "#E0F2FE",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sexText,
                    {
                      color:
                        displayPet.sex.toLowerCase() === "female"
                          ? "#BE123C"
                          : "#0284C7",
                    },
                  ]}
                >
                  {displayPet.sex.toLowerCase() === "female" ? "♀" : "♂"}{" "}
                  {displayPet.sex}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.breedRow}>
            <Feather name="tag" size={16} color={Colors.primary} />
            <Text style={styles.breedText} numberOfLines={1}>
              {displayPet.breed || "Unknown Breed"}
            </Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={16} color={Colors.textMuted} />
            <Text style={styles.locationText}>Nearby</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius["2xl"],
    overflow: "hidden",
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  photoContainer: {
    width: "100%",
    height: 260,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  compatibilityBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    ...Shadows.sm,
  },
  compatibilityText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  infoSection: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  petName: {
    fontSize: 26,
    fontWeight: "800",
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  petAge: {
    fontSize: 26,
    fontWeight: "400",
    color: Colors.textPrimary,
  },
  breedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  breedText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  sexBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sexText: {
    fontSize: 12,
    fontWeight: "700",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: "500",
  },
});
