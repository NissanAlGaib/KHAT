import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  FlatList,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants";
import { SearchFilters, searchService } from "@/services/searchService";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type AgeRange = "<1" | "1-3" | "3-5" | "5+";

interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: SearchFilters) => void;
  currentFilters: SearchFilters;
}

const AGE_RANGES: { key: AgeRange; label: string }[] = [
  { key: "<1", label: "Under 1 year" },
  { key: "1-3", label: "1 - 3 years" },
  { key: "3-5", label: "3 - 5 years" },
  { key: "5+", label: "5+ years" },
];

export default function FilterBottomSheet({
  visible,
  onClose,
  onApply,
  currentFilters,
}: FilterBottomSheetProps) {
  const [species, setSpecies] = useState<"dog" | "cat" | undefined>(
    currentFilters.species,
  );
  const [sex, setSex] = useState<"male" | "female" | undefined>(
    currentFilters.sex,
  );
  const [breed, setBreed] = useState<string>(currentFilters.breed || "");
  const [ageRange, setAgeRange] = useState<AgeRange | undefined>(
    currentFilters.age_range,
  );
  const [breedSearch, setBreedSearch] = useState("");
  const [showBreedPicker, setShowBreedPicker] = useState(false);
  const [allBreeds, setAllBreeds] = useState<string[]>([]);
  const [dogBreeds, setDogBreeds] = useState<string[]>([]);
  const [catBreeds, setCatBreeds] = useState<string[]>([]);

  // Sync with external filters when modal opens
  useEffect(() => {
    if (visible) {
      setSpecies(currentFilters.species);
      setSex(currentFilters.sex);
      setBreed(currentFilters.breed || "");
      setAgeRange(currentFilters.age_range);
    }
  }, [visible, currentFilters]);

  // Fetch breeds on mount
  useEffect(() => {
    fetchBreeds();
  }, []);

  const fetchBreeds = async () => {
    try {
      const result = await searchService.getBreeds();
      setAllBreeds(result.breeds);
      setDogBreeds(result.dog_breeds);
      setCatBreeds(result.cat_breeds);
    } catch (error) {
      console.error("Failed to fetch breeds:", error);
    }
  };

  const getFilteredBreeds = useCallback(() => {
    let breeds = allBreeds;
    if (species === "dog") breeds = dogBreeds;
    if (species === "cat") breeds = catBreeds;

    if (!breedSearch.trim()) return breeds;
    return breeds.filter((b) =>
      b.toLowerCase().includes(breedSearch.toLowerCase()),
    );
  }, [species, breedSearch, allBreeds, dogBreeds, catBreeds]);

  const handleApply = () => {
    onApply({
      species,
      sex,
      breed: breed || undefined,
      age_range: ageRange,
    });
    onClose();
  };

  const handleReset = () => {
    setSpecies(undefined);
    setSex(undefined);
    setBreed("");
    setAgeRange(undefined);
    setBreedSearch("");
  };

  const activeFilterCount = [species, sex, breed, ageRange].filter(
    Boolean,
  ).length;

  // Breed picker sub-view
  if (showBreedPicker) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBreedPicker(false)}
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.breedPickerContainer}
          >
            {/* Header */}
            <View style={styles.breedPickerHeader}>
              <TouchableOpacity onPress={() => setShowBreedPicker(false)}>
                <Feather
                  name="arrow-left"
                  size={24}
                  color={Colors.textPrimary}
                />
              </TouchableOpacity>
              <Text style={styles.breedPickerTitle}>Select Breed</Text>
              <TouchableOpacity
                onPress={() => {
                  setBreed("");
                  setBreedSearch("");
                  setShowBreedPicker(false);
                }}
              >
                <Text style={styles.clearBreedText}>Clear</Text>
              </TouchableOpacity>
            </View>

            {/* Search input */}
            <View style={styles.breedSearchBar}>
              <Feather name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.breedSearchInput}
                placeholder="Search or type a breed..."
                placeholderTextColor={Colors.textMuted}
                value={breedSearch}
                onChangeText={setBreedSearch}
                autoFocus
              />
              {breedSearch.length > 0 && (
                <TouchableOpacity onPress={() => setBreedSearch("")}>
                  <Feather name="x" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Custom breed option (when user types something not in list) */}
            {breedSearch.trim() &&
              !getFilteredBreeds().some(
                (b) => b.toLowerCase() === breedSearch.trim().toLowerCase(),
              ) && (
                <TouchableOpacity
                  style={styles.customBreedItem}
                  onPress={() => {
                    setBreed(breedSearch.trim());
                    setShowBreedPicker(false);
                  }}
                >
                  <Feather
                    name="plus-circle"
                    size={18}
                    color={Colors.primary}
                  />
                  <Text style={styles.customBreedText}>
                    Use "{breedSearch.trim()}"
                  </Text>
                </TouchableOpacity>
              )}

            {/* Breed list */}
            <FlatList
              data={getFilteredBreeds()}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.breedItem,
                    breed === item && styles.breedItemActive,
                  ]}
                  onPress={() => {
                    setBreed(item);
                    setShowBreedPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.breedItemText,
                      breed === item && styles.breedItemTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                  {breed === item && (
                    <Feather name="check" size={18} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <Text style={styles.emptyBreedText}>No breeds found</Text>
              }
            />
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTap} onPress={onClose} />
        <View style={styles.container}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filters</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Species Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Species</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    species === "dog" && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setSpecies(species === "dog" ? undefined : "dog")
                  }
                >
                  <MaterialCommunityIcons
                    name="dog"
                    size={16}
                    color={
                      species === "dog" ? Colors.white : Colors.textPrimary
                    }
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.chipLabel,
                      species === "dog" && styles.chipLabelActive,
                    ]}
                  >
                    Dogs
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    species === "cat" && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setSpecies(species === "cat" ? undefined : "cat")
                  }
                >
                  <MaterialCommunityIcons
                    name="cat"
                    size={16}
                    color={
                      species === "cat" ? Colors.white : Colors.textPrimary
                    }
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.chipLabel,
                      species === "cat" && styles.chipLabelActive,
                    ]}
                  >
                    Cats
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Sex Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sex</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    sex === "male" && styles.filterChipActive,
                  ]}
                  onPress={() => setSex(sex === "male" ? undefined : "male")}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      sex === "male" && styles.chipLabelActive,
                    ]}
                  >
                    ♂ Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    sex === "female" && styles.filterChipActive,
                  ]}
                  onPress={() =>
                    setSex(sex === "female" ? undefined : "female")
                  }
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      sex === "female" && styles.chipLabelActive,
                    ]}
                  >
                    ♀ Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Breed Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Breed</Text>
              <TouchableOpacity
                style={styles.breedSelector}
                onPress={() => setShowBreedPicker(true)}
              >
                <Text
                  style={[
                    styles.breedSelectorText,
                    !breed && styles.breedSelectorPlaceholder,
                  ]}
                >
                  {breed || "All breeds"}
                </Text>
                <Feather
                  name="chevron-right"
                  size={20}
                  color={Colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Age Range Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Age</Text>
              <View style={styles.chipRow}>
                {AGE_RANGES.map((range) => (
                  <TouchableOpacity
                    key={range.key}
                    style={[
                      styles.filterChip,
                      ageRange === range.key && styles.filterChipActive,
                    ]}
                    onPress={() =>
                      setAgeRange(
                        ageRange === range.key ? undefined : range.key,
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        ageRange === range.key && styles.chipLabelActive,
                      ]}
                    >
                      {range.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>
                Apply Filters
                {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  overlayTap: {
    flex: 1,
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    maxHeight: SCREEN_HEIGHT * 0.75,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.borderMedium,
    borderRadius: BorderRadius.full,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  resetText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgTertiary,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.bgCoral,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  chipLabelActive: {
    color: Colors.primaryDark,
  },
  breedSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
  },
  breedSelectorText: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  breedSelectorPlaceholder: {
    color: Colors.textMuted,
    fontWeight: "400",
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl + 10,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.full,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.white,
  },
  // Breed Picker Styles
  breedPickerContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    marginTop: 60,
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
  },
  breedPickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  breedPickerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  clearBreedText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  breedSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  breedSearchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    height: "100%",
  },
  customBreedItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.bgWarm,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  customBreedText: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.primary,
  },
  breedItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  breedItemActive: {
    backgroundColor: Colors.bgCoral,
  },
  breedItemText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  breedItemTextActive: {
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  emptyBreedText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
});
