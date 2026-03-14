import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants";
import { searchService } from "@/services/searchService";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BreedFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (breeds: string[]) => void;
  selectedBreeds: string[];
  species?: string; // "dog" or "cat" — to filter breed list
}

export default function BreedFilterModal({
  visible,
  onClose,
  onApply,
  selectedBreeds,
  species,
}: BreedFilterModalProps) {
  const [breeds, setBreeds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(selectedBreeds);

  useEffect(() => {
    if (visible) {
      setSelected(selectedBreeds);
      fetchBreeds();
    }
  }, [visible, species]);

  const fetchBreeds = async () => {
    try {
      const result = await searchService.getBreeds(species);
      if (species?.toLowerCase() === "cat") {
        setBreeds(result.cat_breeds.sort());
      } else if (species?.toLowerCase() === "dog") {
        setBreeds(result.dog_breeds.sort());
      } else {
        setBreeds(result.breeds.sort());
      }
    } catch (error) {
      console.error("Failed to fetch breeds:", error);
    }
  };

  const filteredBreeds = useCallback(() => {
    if (!search.trim()) return breeds;
    return breeds.filter((b) => b.toLowerCase().includes(search.toLowerCase()));
  }, [search, breeds]);

  const toggleBreed = (breed: string) => {
    setSelected((prev) =>
      prev.includes(breed) ? prev.filter((b) => b !== breed) : [...prev, breed],
    );
  };

  const handleApply = () => {
    onApply(selected);
    onClose();
  };

  const handleReset = () => {
    setSelected([]);
  };

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
            <Text style={styles.title}>Filter by Breed</Text>
            <TouchableOpacity onPress={handleReset}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Feather name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search breeds..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Feather name="x" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Selected count */}
          {selected.length > 0 && (
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedText}>
                {selected.length} breed{selected.length > 1 ? "s" : ""} selected
              </Text>
            </View>
          )}

          {/* Breed List */}
          <FlatList
            data={filteredBreeds()}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected = selected.includes(item);
              return (
                <TouchableOpacity
                  style={[
                    styles.breedItem,
                    isSelected && styles.breedItemSelected,
                  ]}
                  onPress={() => toggleBreed(item)}
                >
                  <Text
                    style={[
                      styles.breedItemText,
                      isSelected && styles.breedItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {isSelected && (
                    <Feather
                      name="check-circle"
                      size={20}
                      color={Colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No breeds found</Text>
            }
          />

          {/* Apply Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>
                {selected.length > 0
                  ? `Show ${selected.length} breed${selected.length > 1 ? "s" : ""}`
                  : "Show All Breeds"}
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
    maxHeight: SCREEN_HEIGHT * 0.7,
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
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  resetText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 42,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    height: "100%",
  },
  selectedInfo: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  selectedText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.primary,
  },
  breedItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  breedItemSelected: {
    backgroundColor: Colors.bgCoral,
  },
  breedItemText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  breedItemTextSelected: {
    fontWeight: "700",
    color: Colors.primaryDark,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: "center",
    paddingVertical: Spacing.xl,
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
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.white,
  },
});
