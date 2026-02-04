import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Shadows, BorderRadius, Spacing } from "@/constants";
import { getStorageUrl } from "@/utils/imageUrl";
import dayjs from "dayjs";

interface Pet {
  pet_id: number;
  name: string;
  breed?: string;
  species?: string;
  sex?: string;
  birthdate?: string;
  status?: string;
  photos?: { photo_url: string; is_primary: boolean }[];
  // Cooldown fields
  is_on_cooldown?: boolean;
  cooldown_until?: string;
  cooldown_days_remaining?: number;
}

interface ActivePetPillProps {
  pet: Pet | null;
  userPets?: Pet[];
  onSelectPet?: (pet: Pet) => void;
  onAddPetPress?: () => void;
}

/**
 * Calculate age from birthdate
 */
const calculateAge = (birthdate?: string): string => {
  if (!birthdate) return "";
  const birth = dayjs(birthdate);
  const now = dayjs();
  const years = now.diff(birth, "year");
  const months = now.diff(birth, "month") % 12;

  if (years > 0) {
    return `${years}y${months > 0 ? ` ${months}m` : ""}`;
  } else if (months > 0) {
    return `${months}m`;
  }
  return "Newborn";
};

/**
 * ActivePetPill - Shows the currently selected pet with details
 * Tapping opens a pet switcher modal (no navigation)
 */
export default function ActivePetPill({
  pet,
  userPets = [],
  onSelectPet,
  onAddPetPress,
}: ActivePetPillProps) {
  const [showPetPicker, setShowPetPicker] = useState(false);
  
  const primaryPhoto = pet?.photos?.find((p) => p.is_primary) || pet?.photos?.[0];
  // Count available pets (not on cooldown) for determining if switch is needed
  const availablePets = userPets.filter((p) => !p.is_on_cooldown);
  const hasMultiplePets = userPets.length > 1; // Show modal if there are multiple pets (even if some on cooldown)

  // Empty state - no pet selected
  if (!pet) {
    return (
      <TouchableOpacity
        style={styles.emptyContainer}
        onPress={onAddPetPress}
        activeOpacity={0.8}
      >
        <View style={styles.emptyIconContainer}>
          <Feather name="plus-circle" size={28} color={Colors.coralVibrant} />
        </View>
        <View style={styles.emptyTextContainer}>
          <Text style={styles.emptyTitle}>No pet selected</Text>
          <Text style={styles.emptySubtitle}>Add a pet to start matching</Text>
        </View>
        <Feather name="chevron-right" size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  }

  const handlePress = () => {
    if (hasMultiplePets) {
      setShowPetPicker(true);
    }
  };

  const handleSelectPet = (selectedPet: Pet) => {
    onSelectPet?.(selectedPet);
    setShowPetPicker(false);
  };

  const renderPetOption = ({ item }: { item: Pet }) => {
    const isSelected = item.pet_id === pet.pet_id;
    const photo = item.photos?.find((p) => p.is_primary) || item.photos?.[0];
    const isOnCooldown = item.is_on_cooldown;

    return (
      <TouchableOpacity
        style={[
          styles.petOption, 
          isSelected && styles.petOptionSelected,
          isOnCooldown && styles.petOptionDisabled
        ]}
        onPress={() => !isOnCooldown && handleSelectPet(item)}
        activeOpacity={isOnCooldown ? 1 : 0.7}
        disabled={isOnCooldown}
      >
        {photo?.photo_url ? (
          <Image
            source={{ uri: getStorageUrl(photo.photo_url)! }}
            style={[styles.petOptionAvatar, isOnCooldown && styles.avatarDisabled]}
          />
        ) : (
          <View style={[styles.petOptionAvatarPlaceholder, isOnCooldown && styles.avatarDisabled]}>
            <Text style={{ fontSize: 20 }}>🐾</Text>
          </View>
        )}
        <View style={styles.petOptionInfo}>
          <Text style={[styles.petOptionName, isOnCooldown && styles.textDisabled]}>
            {item.name}
          </Text>
          {isOnCooldown ? (
            <View style={styles.cooldownBadge}>
              <Feather name="clock" size={10} color={Colors.warning} />
              <Text style={styles.cooldownText}>
                Cooldown: {item.cooldown_days_remaining} days left
              </Text>
            </View>
          ) : (
            <Text style={styles.petOptionBreed}>{item.breed || "Unknown breed"}</Text>
          )}
        </View>
        {isSelected && !isOnCooldown && (
          <View style={styles.checkmark}>
            <Feather name="check" size={16} color={Colors.white} />
          </View>
        )}
        {isOnCooldown && (
          <View style={styles.cooldownIcon}>
            <Feather name="pause-circle" size={20} color={Colors.warning} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={styles.wrapper}
        onPress={handlePress}
        activeOpacity={hasMultiplePets ? 0.8 : 1}
        disabled={!hasMultiplePets}
      >
        <LinearGradient
          colors={[Colors.coralVibrant, Colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.container}
        >
          {/* Pet Avatar */}
          <View style={styles.avatarContainer}>
            {primaryPhoto?.photo_url ? (
              <Image
                source={{ uri: getStorageUrl(primaryPhoto.photo_url)! }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarEmoji}>🐾</Text>
              </View>
            )}
            {/* Status indicator - shows cooldown status */}
            <View style={[
              styles.statusDot,
              pet.is_on_cooldown && styles.statusDotCooldown
            ]} />
          </View>

          {/* Pet Info - More Details */}
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Finding matches for</Text>
            <Text style={styles.petName} numberOfLines={1}>{pet.name}</Text>
            
            {/* Details Row */}
            <View style={styles.detailsRow}>
              {pet.breed && (
                <View style={styles.detailChip}>
                  <Text style={styles.detailText}>{pet.breed}</Text>
                </View>
              )}
              {pet.sex && (
                <View style={[styles.detailChip, styles.sexChip]}>
                  <Text style={styles.detailText}>
                    {pet.sex === "Male" ? "♂" : "♀"} {pet.sex}
                  </Text>
                </View>
              )}
              {pet.birthdate && (
                <View style={styles.detailChip}>
                  <Text style={styles.detailText}>{calculateAge(pet.birthdate)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Switch Pet Indicator (only if multiple pets) */}
          {hasMultiplePets && (
            <View style={styles.switchContainer}>
              <Feather name="repeat" size={16} color={Colors.coralVibrant} />
              <Text style={styles.switchText}>Switch</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Pet Picker Modal */}
      <Modal
        visible={showPetPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPetPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowPetPicker(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Pet</Text>
              <TouchableOpacity
                onPress={() => setShowPetPicker(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={userPets}
              renderItem={renderPetOption}
              keyExtractor={(item) => item.pet_id.toString()}
              contentContainerStyle={styles.petList}
              showsVerticalScrollIndicator={false}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginVertical: 12,
    ...Shadows.md,
    backgroundColor: Colors.primary,
    borderRadius: 20,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingRight: 16,
    borderRadius: 20,
  },
  emptyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginVertical: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.coralVibrant,
    borderStyle: "dashed",
    ...Shadows.sm,
  },
  emptyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.bgCoralLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: "white",
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  avatarEmoji: {
    fontSize: 28,
  },
  statusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: "white",
  },
  statusDotCooldown: {
    backgroundColor: Colors.warning,
  },
  infoContainer: {
    flex: 1,
    marginLeft: 14,
  },
  label: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 2,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  petName: {
    fontSize: 20,
    fontWeight: "800",
    color: "white",
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  detailChip: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sexChip: {
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  detailText: {
    fontSize: 11,
    color: "white",
    fontWeight: "600",
  },
  switchContainer: {
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    ...Shadows.sm,
  },
  switchText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.coralVibrant,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "60%",
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  petList: {
    padding: 16,
    gap: 12,
  },
  petOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  petOptionSelected: {
    borderColor: Colors.coralVibrant,
    backgroundColor: Colors.bgCoralLight,
  },
  petOptionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  petOptionAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  petOptionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  petOptionName: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  petOptionBreed: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.coralVibrant,
    alignItems: "center",
    justifyContent: "center",
  },
  // Cooldown styles
  petOptionDisabled: {
    opacity: 0.6,
    backgroundColor: Colors.bgTertiary,
  },
  avatarDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: Colors.textMuted,
  },
  cooldownBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  cooldownText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: "600",
  },
  cooldownIcon: {
    marginLeft: 8,
  },
});
