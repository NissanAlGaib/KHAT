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
  LayoutChangeEvent,
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
const STAR_SIZE = 28;
const STAR_GAP = 4;

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

    return (
      <View key={index} style={styles.starTouchArea}>
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
              color={full || half ? "#F59E0B" : Colors.borderMedium}
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
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      <View style={styles.starsRow}>
        {Array.from({ length: STAR_COUNT }, (_, i) => renderStar(i))}
        {value > 0 && <Text style={styles.valueText}>{value.toFixed(1)}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  starTouchArea: {
    flexDirection: "row",
    width: STAR_SIZE + STAR_GAP,
    height: STAR_SIZE,
    marginRight: 2,
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
  valueText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F59E0B",
    marginLeft: 8,
    minWidth: 28,
  },
});

export default CategoryRatingRow;
