/**
 * ReviewModal – Category-based review submission modal.
 *
 * Props:
 *  - visible: controls modal visibility
 *  - type: "breeder" | "shooter" → determines which category set to show
 *  - subjectName: the name of the person being reviewed (for the header)
 *  - onSubmit: called with { ratings, comment } when the user taps Submit
 *  - onSkip: called when the user dismisses / skips
 *  - loading: disables interactions while submitting
 */

import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "../../constants/colors";
import {
  BREEDER_CATEGORIES,
  SHOOTER_CATEGORIES,
  ReviewType,
} from "../../types/Review";
import CategoryRatingRow from "./CategoryRatingRow";

interface ReviewModalProps {
  visible: boolean;
  type: ReviewType;
  subjectName: string;
  onSubmit: (data: {
    ratings: Record<string, number>;
    comment?: string;
  }) => void;
  onSkip: () => void;
  loading?: boolean;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  visible,
  type,
  subjectName,
  onSubmit,
  onSkip,
  loading = false,
}) => {
  const categories = useMemo(
    () => (type === "shooter" ? SHOOTER_CATEGORIES : BREEDER_CATEGORIES),
    [type],
  );

  const categoryKeys = useMemo(() => Object.keys(categories), [categories]);

  // Local state: one number per category (0 = unset)
  const [ratings, setRatings] = useState<Record<string, number>>(() =>
    Object.fromEntries(categoryKeys.map((k) => [k, 0])),
  );
  const [comment, setComment] = useState("");

  // Reset on close
  const resetForm = useCallback(() => {
    setRatings(Object.fromEntries(categoryKeys.map((k) => [k, 0])));
    setComment("");
  }, [categoryKeys]);

  const hasAnyRating = useMemo(
    () => Object.values(ratings).some((v) => v > 0),
    [ratings],
  );

  const ratedCount = useMemo(
    () => Object.values(ratings).filter((v) => v > 0).length,
    [ratings],
  );

  const averageRating = useMemo(() => {
    const values = Object.values(ratings).filter((v) => v > 0);
    if (!values.length) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }, [ratings]);

  const progressPercent =
    categoryKeys.length > 0 ? (ratedCount / categoryKeys.length) * 100 : 0;

  const handleCategoryChange = useCallback((key: string, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    // Strip out unset categories
    const filledRatings: Record<string, number> = {};
    for (const [k, v] of Object.entries(ratings)) {
      if (v > 0) filledRatings[k] = v;
    }
    onSubmit({
      ratings: filledRatings,
      comment: comment.trim() || undefined,
    });
    resetForm();
  }, [ratings, comment, onSubmit, resetForm]);

  const handleSkip = useCallback(() => {
    resetForm();
    onSkip();
  }, [onSkip, resetForm]);

  const title =
    type === "shooter" ? "Rate Your Shooter" : "Rate Your Breeding Partner";
  const subtitle =
    averageRating >= 4.5
      ? "Excellent experience"
      : averageRating >= 3
        ? "Good overall impression"
        : averageRating > 0
          ? "Needs improvement"
          : "Start rating the categories";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardWrap}
        >
          <View style={styles.container}>
            <LinearGradient
              colors={["#FF8C68", "#FF6B4A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.grabHandle} />

              <View style={styles.headerRow}>
                <View style={styles.headerTextWrap}>
                  <Text style={styles.title}>{title}</Text>
                  <Text style={styles.subjectName} numberOfLines={1}>
                    {subjectName}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleSkip}
                  style={styles.closeButton}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  disabled={loading}
                >
                  <Feather name="x" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.metricsRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {ratedCount}/{categoryKeys.length}
                  </Text>
                  <Text style={styles.metricLabel}>Categories rated</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>
                    {averageRating > 0 ? averageRating.toFixed(1) : "-"}
                  </Text>
                  <Text style={styles.metricLabel}>{subtitle}</Text>
                </View>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progressPercent}%` }]}
                />
              </View>
            </LinearGradient>

            <ScrollView
              style={styles.scrollBody}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.sectionHint}>
                Tap stars to rate each category. Half-star ratings are
                supported and optional.
              </Text>

              <View style={styles.categoryStack}>
                {categoryKeys.map((key) => (
                  <View key={key} style={styles.categoryCard}>
                    <CategoryRatingRow
                      label={categories[key as keyof typeof categories]}
                      value={ratings[key]}
                      onChange={(v) => handleCategoryChange(key, v)}
                      disabled={loading}
                    />
                  </View>
                ))}
              </View>

              <View style={styles.commentCard}>
                <Text style={styles.commentLabel}>Comment (optional)</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Share your experience to help other users..."
                  placeholderTextColor={Colors.textDisabled}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={1000}
                  editable={!loading}
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={handleSkip}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.skipBtnText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtnWrap}
                onPress={handleSubmit}
                disabled={!hasAnyRating || loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={
                    !hasAnyRating || loading
                      ? ["#D1D5DB", "#D1D5DB"]
                      : ["#FF8D67", "#FF6B4A"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitBtn}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit Review</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
  },
  keyboardWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.bgPrimary,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    overflow: "hidden",
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
  },
  hero: {
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  grabHandle: {
    width: 44,
    height: 5,
    borderRadius: 99,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.66)",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  subjectName: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  metricLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.86)",
    marginTop: 2,
  },
  progressTrack: {
    marginTop: 12,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.28)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
  },
  scrollBody: {
    flex: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 12,
    lineHeight: 18,
  },
  categoryStack: {
    gap: 10,
  },
  categoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  commentCard: {
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 90,
    lineHeight: 20,
    backgroundColor: Colors.bgWarmSecondary,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 2,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderLight,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderDark,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  skipBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  submitBtnWrap: {
    flex: 2,
    borderRadius: 14,
    overflow: "hidden",
  },
  submitBtn: {
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});

export default ReviewModal;
