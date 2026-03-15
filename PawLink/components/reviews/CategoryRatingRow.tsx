/**
 * CategoryRatingRow – a single row with label + half-star selector.
 *
 * Supports 0.5-step ratings from 0.5 → 5.0.
 * Tapping the left half of a star sets a half-star; tapping the right half
 * sets a full star. Tapping the current value again clears it.
 */

import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "../../constants/colors";

interface CategoryRatingRowProps {
  label: string;
  value: number; // 0 = unset, 0.5–5.0 in 0.5 steps
  onChange: (value: number) => void;
  disabled?: boolean;
}

const STAR_COUNT = 5;
const STAR_SIZE = 26;
const STAR_GAP = 6;

const CategoryRatingRow: React.FC<CategoryRatingRowProps> = ({
  label,
  value,
  onChange,
  disabled = false,
}) => {
  const handleStarPress = useCallback(
    (starIndex: number, isLeftHalf: boolean) => {
      if (disabled) return;
      const newValue = isLeftHalf ? starIndex + 0.5 : starIndex + 1;
      // Toggle off if same value
      onChange(newValue === value ? 0 : newValue);
    },
    [disabled, onChange, value],
  );

  const renderStar = (index: number) => {
    const full = value >= index + 1;
    const half = !full && value >= index + 0.5;
    const isActive = full || half;

    return (
      <View
        key={index}
        style={[styles.starTouchArea, isActive && styles.starTouchAreaActive]}
      >
        {/* Left half */}
        <TouchableOpacity
          activeOpacity={0.6}
          disabled={disabled}
          onPress={() => handleStarPress(index, true)}
          style={styles.halfTouch}
          accessibilityLabel={`${label} ${index + 0.5} stars`}
        >
          <View style={styles.halfStarClip}>
            <Feather
              name="star"
              size={STAR_SIZE}
              color={isActive ? "#F59E0B" : Colors.borderMedium}
            />
          </View>
        </TouchableOpacity>

        {/* Right half */}
        <TouchableOpacity
          activeOpacity={0.6}
          disabled={disabled}
          onPress={() => handleStarPress(index, false)}
          style={styles.halfTouch}
          accessibilityLabel={`${label} ${index + 1} stars`}
        >
          <View style={[styles.halfStarClip, styles.halfStarRight]}>
            <Feather
              name="star"
              size={STAR_SIZE}
              color={full ? "#F59E0B" : Colors.borderMedium}
            />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.row, disabled && styles.rowDisabled]}>
      <View style={styles.rowHeader}>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>

        <View style={styles.valueBadge}>
          <Text style={styles.valueBadgeText}>
            {value > 0 ? value.toFixed(1) : "Tap stars"}
          </Text>
        </View>
      </View>

      <View style={styles.starsRow}>
        {Array.from({ length: STAR_COUNT }, (_, i) => renderStar(i))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingVertical: 10,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    flex: 1,
  },
  valueBadge: {
    minWidth: 70,
    borderRadius: 999,
    backgroundColor: Colors.bgWarmSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: "center",
  },
  valueBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    flexWrap: "nowrap",
  },
  starTouchArea: {
    flexDirection: "row",
    width: STAR_SIZE + STAR_GAP,
    height: STAR_SIZE,
    marginRight: 6,
    borderRadius: 10,
    backgroundColor: Colors.bgWarmSecondary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: "hidden",
  },
  starTouchAreaActive: {
    borderColor: "#FCD34D",
    backgroundColor: "#FFFAEB",
  },
  halfTouch: {
    width: (STAR_SIZE + STAR_GAP) / 2,
    height: STAR_SIZE,
    overflow: "hidden",
  },
  halfStarClip: {
    width: STAR_SIZE,
    height: STAR_SIZE,
  },
  halfStarRight: {
    marginLeft: -(STAR_SIZE + STAR_GAP) / 2,
  },
});

export default CategoryRatingRow;
