import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Colors, Shadows, Spacing, BorderRadius } from "@/constants";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

interface SectionContainerProps {
  title: string;
  icon?: string; // feather icon name or 'paw' for MaterialCommunityIcons
  children: React.ReactNode;
  backgroundColor?: string;
  showSeeAll?: boolean;
  onSeeAllPress?: () => void;
}

export default function SectionContainer({
  title,
  icon = "paw",
  children,
  backgroundColor = "white",
  showSeeAll = false,
  onSeeAllPress,
}: SectionContainerProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {icon === "paw" ? (
            <MaterialCommunityIcons
              name="paw"
              size={18}
              color={Colors.primary}
              style={styles.iconSpacing}
            />
          ) : (
            <Feather
              name={icon as keyof typeof Feather.glyphMap}
              size={18}
              color={Colors.primary}
              style={styles.iconSpacing}
            />
          )}
          <Text style={styles.title}>{title}</Text>
        </View>

        {showSeeAll && (
          <TouchableOpacity onPress={onSeeAllPress} style={styles.seeAllButton}>
            <Text style={styles.seeAllText}>See All</Text>
            <Feather name="arrow-right" size={14} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    paddingVertical: 16,
    ...Shadows.sm,
    shadowColor: Colors.shadow,
    shadowOpacity: 0.05,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  iconSpacing: {
    marginRight: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.bgTertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seeAllText: {
    fontSize: 12,
    color: Colors.coralVibrant,
    fontWeight: "700",
  },
  content: {
    // Content styles
  },
});
