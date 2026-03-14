import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Dimensions,
  StyleSheet,
} from "react-native";
import { X, Plus, Check, ChevronRight, Eye, Star } from "lucide-react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn, ZoomIn } from "react-native-reanimated";
import { usePet } from "@/context/PetContext";
import { getStorageUrl } from "@/utils/imageUrl";
import {
  Colors,
  Gradients,
  Spacing,
  BorderRadius,
  FontSize,
  FontFamily,
  Shadows,
} from "@/constants";
import dayjs from "dayjs";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const MODAL_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 420);
const LIST_MAX_HEIGHT = SCREEN_HEIGHT * 0.45;

interface PetSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

const calculateAge = (birthdate: string) => {
  if (!birthdate) return "";
  const birth = dayjs(birthdate);
  const now = dayjs();
  const years = now.diff(birth, "year");
  const months = now.diff(birth, "month") % 12;

  if (years > 0) {
    return `${years}y ${months > 0 ? `${months}m` : ""}`.trim();
  } else {
    return `${months} mo${months > 1 ? "s" : ""}`;
  }
};

export default function PetSelectionModal({
  visible,
  onClose,
}: PetSelectionModalProps) {
  const {
    selectedPet,
    userPets,
    setSelectedPet,
    isLoading,
    loadUserPets,
    isPetPinned,
    togglePinnedPet,
  } = usePet();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Refresh pets list whenever modal becomes visible
  useEffect(() => {
    if (visible) {
      loadUserPets();
      setSearchQuery("");
    }
  }, [visible]);

  const handleSelectPet = useCallback(
    async (pet: any) => {
      if (pet.status !== "active" || pet.is_on_cooldown) return;
      await setSelectedPet(pet);
      onClose();
    },
    [setSelectedPet, onClose],
  );

  const handleSelectNone = useCallback(async () => {
    await setSelectedPet(null);
    onClose();
  }, [setSelectedPet, onClose]);

  const handleAddPet = useCallback(() => {
    onClose();
    setTimeout(() => router.push("/(verification)/add-pet"), 300);
  }, [onClose, router]);

  // Sort pets: active (not on cooldown) first, then cooldown, then pending/others
  const sortedPets = [...userPets].sort((a, b) => {
    const aAvailable = a.status === "active" && !a.is_on_cooldown;
    const bAvailable = b.status === "active" && !b.is_on_cooldown;
    if (aAvailable && !bAvailable) return -1;
    if (!aAvailable && bAvailable) return 1;

    const aCooldown = a.status === "active" && a.is_on_cooldown;
    const bCooldown = b.status === "active" && b.is_on_cooldown;
    if (aCooldown && !bCooldown) return -1;
    if (!aCooldown && bCooldown) return 1;

    return 0;
  });

  // Filter by search query
  const filteredPets = searchQuery.trim()
    ? sortedPets.filter((pet) =>
        pet.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : sortedPets;

  const renderStatusBadge = (pet: any) => {
    const isOnCooldown = pet.is_on_cooldown;
    const isActive = pet.status === "active";
    const isPending = pet.status === "pending_verification";

    if (isOnCooldown) {
      return (
        <View style={[styles.statusBadge, styles.statusCooldown]}>
          <Text style={[styles.statusText, styles.statusCooldownText]}>
            ⏸ {pet.cooldown_days_remaining}d
          </Text>
        </View>
      );
    }
    if (isActive) {
      return (
        <View style={[styles.statusBadge, styles.statusAvailable]}>
          <Text style={[styles.statusText, styles.statusAvailableText]}>
            Available
          </Text>
        </View>
      );
    }
    if (isPending) {
      return (
        <View style={[styles.statusBadge, styles.statusPending]}>
          <Text style={[styles.statusText, styles.statusPendingText]}>
            Pending
          </Text>
        </View>
      );
    }
    return null;
  };

  const renderActionIcon = (isSelected: boolean, isSelectable: boolean) => {
    if (isSelected) {
      return (
        <Animated.View
          entering={ZoomIn.springify().damping(12)}
          style={[styles.actionCircle, styles.actionCircleSelected]}
        >
          <Check size={20} color={Colors.white} strokeWidth={3} />
        </Animated.View>
      );
    }
    if (isSelectable) {
      return (
        <View style={[styles.actionCircle, styles.actionCircleDefault]}>
          <ChevronRight size={18} color={Colors.primary} strokeWidth={2.5} />
        </View>
      );
    }
    return (
      <View style={[styles.actionCircle, styles.actionCircleDisabled]}>
        <X size={14} color={Colors.textDisabled} strokeWidth={2} />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          entering={FadeIn.duration(180)}
          style={styles.modalContainer}
        >
          {/* Gradient Header */}
          <LinearGradient
            colors={[...Gradients.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Choose Your Pet</Text>
                <Text style={styles.headerSubtitle}>
                  Select a pet to find their perfect match
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                activeOpacity={0.7}
              >
                <X size={20} color={Colors.white} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Feather name="search" size={16} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search pets..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Pet List */}
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {isLoading ? (
              <View style={styles.emptyState}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : filteredPets.length === 0 && searchQuery.trim() ? (
              <View style={styles.emptyState}>
                <Feather name="search" size={32} color={Colors.textDisabled} />
                <Text style={styles.emptyText}>
                  No pets match "{searchQuery}"
                </Text>
              </View>
            ) : sortedPets.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="paw"
                  size={40}
                  color={Colors.textDisabled}
                />
                <Text style={styles.emptyText}>
                  No pets yet. Add your first pet!
                </Text>
              </View>
            ) : (
              <>
                {/* Browse All option */}
                <Animated.View entering={FadeInDown.duration(200)}>
                  <TouchableOpacity
                    onPress={handleSelectNone}
                    style={[
                      styles.petRow,
                      selectedPet === null && styles.petRowSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    {selectedPet === null && (
                      <View style={styles.selectedAccent} />
                    )}
                    <View
                      style={[
                        styles.petPhoto,
                        styles.browseAllPhoto,
                        selectedPet === null && styles.petPhotoSelected,
                      ]}
                    >
                      <Eye size={22} color={Colors.textMuted} />
                    </View>
                    <View style={styles.petInfo}>
                      <Text style={styles.petName}>Browse All</Text>
                      <Text style={styles.petBreed}>
                        View all available pets
                      </Text>
                    </View>
                    {renderActionIcon(selectedPet === null, true)}
                  </TouchableOpacity>
                </Animated.View>

                {/* Pet rows */}
                {filteredPets.map((pet, index) => {
                  const isSelected = selectedPet?.pet_id === pet.pet_id;
                  const primaryPhoto = pet.photos?.find(
                    (p: any) => p.is_primary,
                  );
                  const photoUrl = primaryPhoto?.photo_url;
                  const isActive = pet.status === "active";
                  const isOnCooldown = pet.is_on_cooldown;
                  const isSelectable = isActive && !isOnCooldown;

                  return (
                    <Animated.View
                      key={pet.pet_id}
                      entering={FadeInDown.delay(index * 30).duration(200)}
                    >
                      <TouchableOpacity
                        onPress={() => handleSelectPet(pet)}
                        disabled={!isSelectable}
                        style={[
                          styles.petRow,
                          isSelected && styles.petRowSelected,
                          !isSelectable && styles.petRowDisabled,
                        ]}
                        activeOpacity={0.7}
                      >
                        {isSelected && <View style={styles.selectedAccent} />}

                        {/* Pet Photo */}
                        <View
                          style={[
                            styles.petPhotoContainer,
                            isSelected && styles.petPhotoContainerSelected,
                          ]}
                        >
                          {photoUrl ? (
                            <Image
                              source={{ uri: getStorageUrl(photoUrl)! }}
                              style={styles.petPhotoImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View
                              style={[
                                styles.petPhoto,
                                styles.petPhotoPlaceholder,
                              ]}
                            >
                              <MaterialCommunityIcons
                                name="paw"
                                size={22}
                                color={Colors.primary}
                              />
                            </View>
                          )}
                        </View>

                        {/* Pet Info */}
                        <View style={styles.petInfo}>
                          <View style={styles.petNameRow}>
                            <Text
                              style={[
                                styles.petName,
                                !isSelectable && styles.petNameDisabled,
                              ]}
                              numberOfLines={1}
                            >
                              {pet.name}
                            </Text>
                            {renderStatusBadge(pet)}
                          </View>
                          <Text style={styles.petBreed} numberOfLines={1}>
                            {pet.breed}
                            {pet.birthdate
                              ? ` · ${calculateAge(pet.birthdate)}`
                              : ""}
                          </Text>
                        </View>

                        {/* Pin Toggle */}
                        {isSelectable && (
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              togglePinnedPet(pet.pet_id);
                            }}
                            style={styles.pinButton}
                            activeOpacity={0.6}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Star
                              size={16}
                              color={
                                isPetPinned(pet.pet_id)
                                  ? "#F59E0B"
                                  : Colors.textDisabled
                              }
                              fill={
                                isPetPinned(pet.pet_id)
                                  ? "#F59E0B"
                                  : "transparent"
                              }
                              strokeWidth={2}
                            />
                          </TouchableOpacity>
                        )}

                        {/* Action Icon */}
                        {renderActionIcon(isSelected, isSelectable)}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </>
            )}
          </ScrollView>

          {/* Quick-Add Pet Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleAddPet}
              style={styles.addPetButton}
              activeOpacity={0.7}
            >
              <Plus size={18} color={Colors.primary} strokeWidth={2.5} />
              <Text style={styles.addPetText}>Add New Pet</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: MODAL_WIDTH,
    maxHeight: SCREEN_HEIGHT * 0.75,
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius["3xl"],
    overflow: "hidden",
    ...Shadows.lg,
  },

  // --- Header ---
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderTopLeftRadius: BorderRadius["3xl"],
    borderTopRightRadius: BorderRadius["3xl"],
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.baloo,
    color: Colors.white,
    fontWeight: "bold",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.mulish,
    color: "rgba(255,255,255,0.85)",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // --- Search ---
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 40,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.mulish,
    color: Colors.textPrimary,
    paddingVertical: 0,
  },

  // --- List ---
  listContainer: {
    maxHeight: LIST_MAX_HEIGHT,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },

  // --- Empty State ---
  emptyState: {
    paddingVertical: Spacing["4xl"],
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.mulish,
    color: Colors.textMuted,
    textAlign: "center",
  },

  // --- Pet Row ---
  petRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.bgSecondary,
    overflow: "hidden",
  },
  petRowSelected: {
    backgroundColor: Colors.bgWarmSecondary,
    borderWidth: 0,
  },
  petRowDisabled: {
    backgroundColor: Colors.bgTertiary,
    opacity: 0.55,
  },
  selectedAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xl,
  },

  // --- Pet Photo ---
  petPhotoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    overflow: "hidden",
  },
  petPhotoContainerSelected: {
    borderColor: Colors.primary,
  },
  petPhotoImage: {
    width: "100%",
    height: "100%",
  },
  petPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  petPhotoPlaceholder: {
    backgroundColor: Colors.coralSubtle,
  },
  browseAllPhoto: {
    backgroundColor: Colors.bgTertiary,
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  petPhotoSelected: {
    borderColor: Colors.primary,
  },

  // --- Pet Info ---
  petInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  petNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 2,
  },
  petName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.baloo,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  petNameDisabled: {
    color: Colors.textMuted,
  },
  petBreed: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.mulish,
    color: Colors.textSecondary,
  },

  // --- Status Badges ---
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.mulishBold,
  },
  statusAvailable: {
    backgroundColor: Colors.successLight,
  },
  statusAvailableText: {
    color: Colors.success,
  },
  statusCooldown: {
    backgroundColor: Colors.warningLight,
  },
  statusCooldownText: {
    color: Colors.warning,
  },
  statusPending: {
    backgroundColor: Colors.warningBg,
  },
  statusPendingText: {
    color: "#92400E",
  },

  // --- Action Circle ---
  actionCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionCircleSelected: {
    backgroundColor: Colors.primary,
  },
  actionCircleDefault: {
    backgroundColor: Colors.coralSubtle,
  },
  actionCircleDisabled: {
    backgroundColor: Colors.bgTertiary,
  },

  // --- Pin Button ---
  pinButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.xs,
  },

  // --- Footer ---
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  addPetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
  },
  addPetText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.mulishBold,
    color: Colors.primary,
  },
});
