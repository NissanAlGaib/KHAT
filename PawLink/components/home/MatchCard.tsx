import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Shadows } from "@/constants";
import { getStorageUrl } from "@/utils/imageUrl";

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
 * MatchCard v2 — Full-bleed photo card with overlay info.
 * Fills parent via flex: 1. Shows the OTHER pet (not the selected one).
 */
export default function MatchCard({ match, selectedPetId }: MatchCardProps) {
  const displayPet =
    match.pet1.pet_id === selectedPetId ? match.pet2 : match.pet1;

  const photoUrl = getStorageUrl(displayPet.photo_url);
  const age = getAge(displayPet.birthdate);

  return (
    <View style={styles.card}>
      {/* Full-bleed Photo */}
      <View style={styles.photoContainer}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <MaterialCommunityIcons
              name="dog"
              size={40}
              color="rgba(255,255,255,0.7)"
            />
          </View>
        )}

        {/* Top gradient for readability */}
        <LinearGradient
          colors={["rgba(0,0,0,0.25)", "transparent"]}
          style={styles.topGradient}
        />

        {/* Bottom gradient for info readability */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.65)"]}
          style={styles.bottomGradient}
        />

        {/* Compatibility badge — top right */}
        <View style={styles.compatibilityBadge}>
          <Feather name="heart" size={12} color={Colors.primary} />
          <Text style={styles.compatibilityText}>
            {match.compatibility_score}%
          </Text>
        </View>

        {/* Info overlay — bottom */}
        <View style={styles.infoOverlay}>
          <View style={styles.nameRow}>
            <Text style={styles.petName} numberOfLines={1}>
              {displayPet.name}
              {age ? <Text style={styles.petAge}>, {age}</Text> : null}
            </Text>
            {displayPet.sex && (
              <View
                style={[
                  styles.sexBadge,
                  {
                    backgroundColor:
                      displayPet.sex.toLowerCase() === "female"
                        ? "rgba(255, 228, 230, 0.9)"
                        : "rgba(224, 242, 254, 0.9)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sexText,
                    {
                      color:
                        displayPet.sex.toLowerCase() === "female"
                          ? Colors.femaleTxt
                          : Colors.maleTxt,
                    },
                  ]}
                >
                  {displayPet.sex.toLowerCase() === "female" ? "♀" : "♂"}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.breedTag}>
              <Feather name="tag" size={12} color={Colors.white} />
              <Text style={styles.breedText} numberOfLines={1}>
                {displayPet.breed || "Unknown Breed"}
              </Text>
            </View>
            <View style={styles.locationTag}>
              <Feather name="map-pin" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.locationText}>Nearby</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: 24,
    overflow: "hidden",
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  photoContainer: {
    flex: 1,
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
    fontSize: 80,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  bottomGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
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
    gap: 4,
    ...Shadows.sm,
  },
  compatibilityText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  infoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 28,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  petName: {
    fontSize: 30,
    fontWeight: "800",
    color: Colors.white,
    flex: 1,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  petAge: {
    fontSize: 28,
    fontWeight: "400",
    color: Colors.white,
  },
  sexBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  sexText: {
    fontSize: 16,
    fontWeight: "800",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  breedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  breedText: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: "600",
  },
  locationTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
});
