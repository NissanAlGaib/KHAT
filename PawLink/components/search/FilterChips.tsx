import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
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
  const categories: { key: CategoryFilter; label: string; icon: string }[] = [
    { key: "all", label: "All", icon: "🔍" },
    { key: "pets", label: "Pets", icon: "🐕" },
    { key: "breeders", label: "Breeders", icon: "👤" },
    { key: "shooters", label: "Shooters", icon: "📸" },
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
            <Text style={styles.chipIcon}>{cat.icon}</Text>
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
        {showSpeciesFilters && (activeCategory === "all" || activeCategory === "pets") && (
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
              <Text style={styles.chipIcon}>🐶</Text>
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
              <Text style={styles.chipIcon}>🐱</Text>
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
              style={[
                styles.chip,
                sexFilter === "male" && styles.activeChip,
              ]}
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
