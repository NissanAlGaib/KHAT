/**
 * ReviewBreakdown – Displays overall average + per-category bar chart.
 *
 * Used on user / shooter profile screens to show the category-based
 * rating breakdown.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";
import { CategoryAverage } from "../../types/Review";

interface ReviewBreakdownProps {
  overallAverage: number;
  reviewCount: number;
  categoryAverages: Record<string, CategoryAverage>;
  /** Compact mode hides the individual bars */
  compact?: boolean;
}

const MAX_RATING = 5;

const ReviewBreakdown: React.FC<ReviewBreakdownProps> = ({
  overallAverage,
  reviewCount,
  categoryAverages,
  compact = false,
}) => {
  if (reviewCount === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Feather name="star" size={20} color={Colors.textDisabled} />
        <Text style={styles.emptyText}>No reviews yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Overall */}
      <View style={styles.overallRow}>
        <View style={styles.overallLeft}>
          <Text style={styles.overallValue}>{overallAverage.toFixed(1)}</Text>
          <View style={styles.starsRow}>
            {Array.from({ length: 5 }, (_, i) => (
              <Feather
                key={i}
                name="star"
                size={14}
                color={
                  i < Math.round(overallAverage)
                    ? "#F59E0B"
                    : Colors.borderMedium
                }
              />
            ))}
          </View>
        </View>
        <Text style={styles.reviewCountText}>
          {reviewCount} review{reviewCount !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Category bars */}
      {!compact &&
        Object.entries(categoryAverages).map(([key, cat]) => {
          if (!cat.average && cat.average !== 0) return null;
          const pct = ((cat.average ?? 0) / MAX_RATING) * 100;
          return (
            <View key={key} style={styles.catRow}>
              <Text style={styles.catLabel} numberOfLines={1}>
                {cat.label}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[styles.barFill, { width: `${Math.min(pct, 100)}%` }]}
                />
              </View>
              <Text style={styles.catValue}>
                {cat.average != null ? cat.average.toFixed(1) : "–"}
              </Text>
            </View>
          );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  emptyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textDisabled,
  },
  overallRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  overallLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  overallValue: {
    fontSize: 28,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  reviewCountText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  catLabel: {
    width: 120,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.bgTertiary,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#F59E0B",
  },
  catValue: {
    width: 28,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textPrimary,
    textAlign: "right",
  },
});

export default ReviewBreakdown;
