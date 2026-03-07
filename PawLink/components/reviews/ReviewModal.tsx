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
    type === "shooter" ? "Rate the Shooter" : "Rate Your Breeding Partner";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleSkip}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {subjectName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSkip}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              disabled={loading}
            >
              <Feather name="x" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Categories */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionHint}>
              Tap stars to rate (half-stars supported). All categories are
              optional.
            </Text>

            {categoryKeys.map((key) => (
              <CategoryRatingRow
                key={key}
                label={categories[key as keyof typeof categories]}
                value={ratings[key]}
                onChange={(v) => handleCategoryChange(key, v)}
                disabled={loading}
              />
            ))}

            {/* Comment */}
            <Text style={styles.commentLabel}>Comment (optional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your experience…"
              placeholderTextColor={Colors.textDisabled}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={1000}
              editable={!loading}
              textAlignVertical="top"
            />
          </ScrollView>

          {/* Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkip}
              disabled={loading}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!hasAnyRating || loading) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!hasAnyRating || loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.bgPrimary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scrollBody: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginTop: 16,
    marginBottom: 6,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    minHeight: 80,
    backgroundColor: Colors.bgSecondary,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderLight,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderMedium,
    alignItems: "center",
  },
  skipBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    backgroundColor: Colors.borderMedium,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});

export default ReviewModal;
