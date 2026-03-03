import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants";

export type CategoryFilter = "all" | "pets" | "breeders" | "shooters";

interface FilterChipsProps {
  activeCategory: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  speciesFilter?: "dog" | "cat" | undefined;
  sexFilter?: "male" | "female" | undefined;
  onSpeciesChange?: (species: "dog" | "cat" | undefined) => void;
  onSexChange?: (sex: "male" | "female" | undefined) => void;
  showSpeciesFilters?: boolean;
}

export default function FilterChips({
  activeCategory,
  onCategoryChange,
  speciesFilter,
  sexFilter,
  onSpeciesChange,
  onSexChange,
  showSpeciesFilters = false,
}: FilterChipsProps) {
  const categories: {
    key: CategoryFilter;
    label: string;
    iconName: string;
    iconType: "feather" | "mci";
  }[] = [
    { key: "all", label: "All", iconName: "search", iconType: "feather" },
    { key: "pets", label: "Pets", iconName: "paw", iconType: "mci" },
    {
      key: "breeders",
      label: "Breeders",
      iconName: "user",
      iconType: "feather",
    },
    {
      key: "shooters",
      label: "Shooters",
      iconName: "camera",
      iconType: "feather",
    },
  ];

  return (
    <View style={styles.container}>
      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[
              styles.chip,
              activeCategory === cat.key && styles.activeChip,
            ]}
            onPress={() => onCategoryChange(cat.key)}
          >
            <View style={styles.chipIconContainer}>
              {cat.iconType === "mci" ? (
                <MaterialCommunityIcons
                  name={cat.iconName as any}
                  size={14}
                  color={
                    activeCategory === cat.key
                      ? Colors.white
                      : Colors.textSecondary
                  }
                />
              ) : (
                <Feather
                  name={cat.iconName as any}
                  size={14}
                  color={
                    activeCategory === cat.key
                      ? Colors.white
                      : Colors.textSecondary
                  }
                />
              )}
            </View>
            <Text
              style={[
                styles.chipText,
                activeCategory === cat.key && styles.activeChipText,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Species/Sex Filters (only when pets category or all) */}
        {showSpeciesFilters &&
          (activeCategory === "all" || activeCategory === "pets") && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={[
                  styles.chip,
                  speciesFilter === "dog" && styles.activeChip,
                ]}
                onPress={() =>
                  onSpeciesChange?.(speciesFilter === "dog" ? undefined : "dog")
                }
              >
                <View style={styles.chipIconContainer}>
                  <MaterialCommunityIcons
                    name="dog"
                    size={14}
                    color={
                      speciesFilter === "dog"
                        ? Colors.white
                        : Colors.textSecondary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.chipText,
                    speciesFilter === "dog" && styles.activeChipText,
                  ]}
                >
                  Dogs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chip,
                  speciesFilter === "cat" && styles.activeChip,
                ]}
                onPress={() =>
                  onSpeciesChange?.(speciesFilter === "cat" ? undefined : "cat")
                }
              >
                <View style={styles.chipIconContainer}>
                  <MaterialCommunityIcons
                    name="cat"
                    size={14}
                    color={
                      speciesFilter === "cat"
                        ? Colors.white
                        : Colors.textSecondary
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.chipText,
                    speciesFilter === "cat" && styles.activeChipText,
                  ]}
                >
                  Cats
                </Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={[styles.chip, sexFilter === "male" && styles.activeChip]}
                onPress={() =>
                  onSexChange?.(sexFilter === "male" ? undefined : "male")
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    sexFilter === "male" && styles.activeChipText,
                  ]}
                >
                  ♂ Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.chip,
                  sexFilter === "female" && styles.activeChip,
                ]}
                onPress={() =>
                  onSexChange?.(sexFilter === "female" ? undefined : "female")
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    sexFilter === "female" && styles.activeChipText,
                  ]}
                >
                  ♀ Female
                </Text>
              </TouchableOpacity>
            </>
          )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgTertiary,
    gap: 4,
  },
  activeChip: {
    backgroundColor: Colors.bgCoral,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipIconContainer: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  activeChipText: {
    color: Colors.primaryDark,
  },
  divider: {
    width: 1,
    height: "60%",
    backgroundColor: Colors.borderMedium,
    alignSelf: "center",
    marginHorizontal: 4,
  },
});
