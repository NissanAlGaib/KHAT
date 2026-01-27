import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { Colors, Spacing, BorderRadius, Shadows, FontSize } from "@/constants";
import { API_BASE_URL } from "@/config/env";
import { ShooterProfile } from "@/services/matchService";

interface HorizontalShooterScrollProps {
  shooters: ShooterProfile[];
  onShooterPress: (shooter: ShooterProfile) => void;
}

/**
 * HorizontalShooterScroll - Headless horizontal scroll for shooters
 * Header is provided by SectionContainer wrapper
 */
export default function HorizontalShooterScroll({
  shooters,
  onShooterPress,
}: HorizontalShooterScrollProps) {
  const renderItem = ({ item }: { item: ShooterProfile }) => {
    const photoUrl = item.profile_image
      ? item.profile_image.startsWith("http")
        ? item.profile_image
        : `${API_BASE_URL}/${item.profile_image.startsWith("storage/") ? item.profile_image : `storage/${item.profile_image}`}`
      : null;

    const experienceYears = Math.ceil(item.experience_years || 0);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => onShooterPress(item)}
      >
        <View style={styles.imageContainer}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.image} />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={{ fontSize: 24 }}>👤</Text>
            </View>
          )}
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          
          <View style={styles.badgeContainer}>
            <View style={styles.expBadge}>
              <Text style={styles.expText}>
                {experienceYears}y exp
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!shooters || shooters.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No shooters available</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={shooters}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      snapToInterval={120 + 12} // Card width + gap
      decelerationRate="fast"
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: 12,
  },
  card: {
    width: 120,
    height: 160,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    padding: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.coralBorder,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.bgTertiary,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContainer: {
    width: "100%",
    alignItems: "center",
  },
  name: {
    fontSize: FontSize.base,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  badgeContainer: {
    flexDirection: "row",
  },
  expBadge: {
    backgroundColor: Colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  expText: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.warning,
  },
  emptyState: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
});
