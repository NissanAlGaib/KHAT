import React, { useState, useMemo, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SectionList,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, BorderRadius, Spacing, Shadows, FontFamily, FontSize } from "@/constants";

interface AddressOption {
  label: string;
  value: string;
}

interface Section {
  title: string;
  data: AddressOption[];
}

interface AddressPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  title: string;
  items: AddressOption[];
  selectedValue: string;
  searchPlaceholder?: string;
}

/**
 * AddressPickerModal - Custom address picker with SafeAreaView,
 * search bar, alphabetical section headers, and checkmark indicator.
 */
export default function AddressPickerModal({
  visible,
  onClose,
  onSelect,
  title,
  items,
  selectedValue,
  searchPlaceholder = "Search...",
}: AddressPickerModalProps) {
  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase().trim();
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, search]);

  const sections: Section[] = useMemo(() => {
    const grouped: Record<string, AddressOption[]> = {};
    for (const item of filteredItems) {
      const letter = item.label.charAt(0).toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(item);
    }
    return Object.keys(grouped)
      .sort()
      .map((letter) => ({ title: letter, data: grouped[letter] }));
  }, [filteredItems]);

  const handleSelect = useCallback(
    (value: string) => {
      onSelect(value);
      setSearch("");
      onClose();
    },
    [onSelect, onClose],
  );

  const handleClose = useCallback(() => {
    setSearch("");
    onClose();
  }, [onClose]);

  const renderItem = useCallback(
    ({ item }: { item: AddressOption }) => {
      const isSelected = item.value === selectedValue;
      return (
        <TouchableOpacity
          style={[styles.item, isSelected && styles.itemSelected]}
          onPress={() => handleSelect(item.value)}
          activeOpacity={0.6}
        >
          <Text
            style={[styles.itemText, isSelected && styles.itemTextSelected]}
            numberOfLines={1}
          >
            {item.label}
          </Text>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
          )}
        </TouchableOpacity>
      );
    },
    [selectedValue, handleSelect],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: Section }) => (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{section.title}</Text>
      </View>
    ),
    [],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{title}</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={18}
                color={Colors.textDisabled}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor={Colors.textDisabled}
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearch("")}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={Colors.textDisabled}
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* List */}
            {sections.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="search-outline"
                  size={40}
                  color={Colors.textDisabled}
                />
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            ) : (
              <SectionList
                sections={sections}
                keyExtractor={(item) => item.value}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                stickySectionHeadersEnabled
                keyboardShouldPersistTaps="handled"
                initialNumToRender={30}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>
        </SafeAreaView>
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
  safeArea: {
    width: "100%",
    maxHeight: "85%",
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius["2xl"],
    overflow: "hidden",
    maxHeight: "100%",
    ...Shadows.lg,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.mulishBold,
    color: Colors.textPrimary,
    flex: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.mulish,
    color: Colors.textPrimary,
    padding: 0,
  },
  // Section headers
  sectionHeader: {
    backgroundColor: Colors.bgSecondary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sectionHeaderText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.mulishBold,
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  // Items
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md + 2,
  },
  itemSelected: {
    backgroundColor: Colors.bgWarm,
  },
  itemText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.mulish,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  itemTextSelected: {
    fontFamily: FontFamily.mulishBold,
    color: Colors.primary,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.xl,
  },
  // Empty state
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["5xl"],
  },
  emptyText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.mulish,
    color: Colors.textDisabled,
    marginTop: Spacing.md,
  },
  // List
  listContent: {
    paddingBottom: Spacing.lg,
  },
});
