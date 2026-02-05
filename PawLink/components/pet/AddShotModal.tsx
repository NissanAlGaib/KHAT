import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Colors, BorderRadius, Spacing, Shadows, Gradients } from "@/constants";
import { VaccinationCard } from "@/services/petService";

interface AddShotModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    vaccination_record: any;
    clinic_name: string;
    veterinarian_name: string;
    date_administered: string;
    expiration_date: string;
    shot_number: number;
  }) => Promise<void>;
  card: VaccinationCard | null;
  isLoading?: boolean;
}

export default function AddShotModal({
  visible,
  onClose,
  onSubmit,
  card,
  isLoading = false,
}: AddShotModalProps) {
  const [document, setDocument] = useState<any>(null);
  const [clinicName, setClinicName] = useState("");
  const [veterinarianName, setVeterinarianName] = useState("");
  const [dateAdministered, setDateAdministered] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<"administered" | "expiration">("administered");
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Shot number - user can specify which shot they're adding (for historical records)
  const defaultNextShotNumber = card ? card.completed_shots_count + 1 : 1;
  const [shotNumber, setShotNumber] = useState<string>(defaultNextShotNumber.toString());
  
  // Update shot number when card changes
  React.useEffect(() => {
    if (card) {
      setShotNumber((card.completed_shots_count + 1).toString());
    }
  }, [card]);

  const currentShotNumber = parseInt(shotNumber) || defaultNextShotNumber;
  const isBoosterShot = card?.total_shots_required && currentShotNumber > card.total_shots_required;

  const resetForm = () => {
    setDocument(null);
    setClinicName("");
    setVeterinarianName("");
    setDateAdministered("");
    setExpirationDate("");
    setShotNumber(defaultNextShotNumber.toString());
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocument(result.assets[0]);
        setErrors((prev) => ({ ...prev, document: "" }));
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setDocument({
          uri: result.assets[0].uri,
          name: `vaccination_${Date.now()}.jpg`,
          mimeType: "image/jpeg",
        });
        setErrors((prev) => ({ ...prev, document: "" }));
      }
    } catch (error) {
      console.error("Error taking photo:", error);
    }
  };

  const openDatePicker = (field: "administered" | "expiration") => {
    setDatePickerField(field);
    setShowDatePicker(true);
  };

  const handleDateConfirm = (date: Date) => {
    const formattedDate = date.toISOString().split("T")[0];
    if (datePickerField === "administered") {
      setDateAdministered(formattedDate);
      setErrors((prev) => ({ ...prev, dateAdministered: "" }));
      
      // Auto-calculate expiration date based on card configuration
      if (card?.interval_days) {
        const expDate = new Date(date);
        expDate.setDate(expDate.getDate() + card.interval_days);
        setExpirationDate(expDate.toISOString().split("T")[0]);
      }
    } else {
      setExpirationDate(formattedDate);
      setErrors((prev) => ({ ...prev, expirationDate: "" }));
    }
    setShowDatePicker(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!document) {
      newErrors.document = "Proof document is required";
    }
    if (!clinicName.trim()) {
      newErrors.clinicName = "Clinic name is required";
    }
    if (!veterinarianName.trim()) {
      newErrors.veterinarianName = "Veterinarian name is required";
    }
    if (!dateAdministered) {
      newErrors.dateAdministered = "Date administered is required";
    }
    if (!expirationDate) {
      newErrors.expirationDate = "Expiration date is required";
    }
    if (dateAdministered && expirationDate) {
      if (new Date(expirationDate) <= new Date(dateAdministered)) {
        newErrors.expirationDate = "Expiration must be after administered date";
      }
    }
    
    // Validate shot number
    const shotNum = parseInt(shotNumber);
    if (!shotNumber || isNaN(shotNum) || shotNum < 1) {
      newErrors.shotNumber = "Shot number must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit({
        vaccination_record: document,
        clinic_name: clinicName,
        veterinarian_name: veterinarianName,
        date_administered: dateAdministered,
        expiration_date: expirationDate,
        shot_number: parseInt(shotNumber),
      });
      handleClose();
    } catch (error) {
      console.error("Error submitting shot:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!card) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <LinearGradient
            colors={[...Gradients.primary]}
            style={styles.header}
          >
            <View>
              <Text style={styles.headerTitle}>Add Shot Record</Text>
              <Text style={styles.headerSubtitle}>
                {card.vaccine_name} - {isBoosterShot ? "Booster Shot" : `Shot ${currentShotNumber}`}
                {card.total_shots_required && !isBoosterShot ? ` of ${card.total_shots_required}` : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.white} />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            {/* Shot Number Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Shot Number *</Text>
              <View style={styles.shotNumberInputRow}>
                <TouchableOpacity
                  style={styles.shotNumberButton}
                  onPress={() => {
                    const num = parseInt(shotNumber) || 1;
                    if (num > 1) {
                      setShotNumber((num - 1).toString());
                      setErrors((prev) => ({ ...prev, shotNumber: "" }));
                    }
                  }}
                >
                  <Ionicons name="remove" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.shotNumberInput, errors.shotNumber && styles.inputError]}
                  value={shotNumber}
                  onChangeText={(text) => {
                    // Only allow numeric input
                    const numericValue = text.replace(/[^0-9]/g, '');
                    setShotNumber(numericValue);
                    setErrors((prev) => ({ ...prev, shotNumber: "" }));
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                  textAlign="center"
                />
                <TouchableOpacity
                  style={styles.shotNumberButton}
                  onPress={() => {
                    const num = parseInt(shotNumber) || 0;
                    setShotNumber((num + 1).toString());
                    setErrors((prev) => ({ ...prev, shotNumber: "" }));
                  }}
                >
                  <Ionicons name="add" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                Enter the shot number you're recording (e.g., Shot 1, Shot 2, etc.)
              </Text>
              {errors.shotNumber && (
                <Text style={styles.errorText}>{errors.shotNumber}</Text>
              )}
            </View>

            {/* Shot Type Badge */}
            <View style={[styles.shotNumberBadge, isBoosterShot && styles.boosterBadge]}>
              <Ionicons name={isBoosterShot ? "shield-checkmark" : "medical"} size={24} color={isBoosterShot ? Colors.success : Colors.primary} />
              <Text style={[styles.shotNumberText, isBoosterShot && styles.boosterText]}>
                {isBoosterShot ? "Booster Shot" : `Shot ${currentShotNumber}`}
                {card?.total_shots_required && !isBoosterShot ? ` of ${card.total_shots_required}` : ""}
              </Text>
            </View>

            {/* Booster Info Note */}
            {isBoosterShot && (
              <View style={styles.boosterNote}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.success} />
                <Text style={styles.boosterNoteText}>
                  This is an additional booster shot beyond the required {card.total_shots_required}-shot series.
                </Text>
              </View>
            )}

            {/* Document Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Proof Document *</Text>
              <View style={styles.uploadRow}>
                <TouchableOpacity
                  style={[styles.uploadButton, errors.document && styles.inputError]}
                  onPress={pickDocument}
                >
                  <Ionicons name="document-attach-outline" size={24} color={Colors.textMuted} />
                  <Text style={styles.uploadButtonText}>
                    {document?.name || "Upload File"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={pickImage}
                >
                  <Ionicons name="camera" size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>
              {document?.uri && document.mimeType?.startsWith("image") && (
                <Image source={{ uri: document.uri }} style={styles.previewImage} />
              )}
              {errors.document && (
                <Text style={styles.errorText}>{errors.document}</Text>
              )}
            </View>

            {/* Clinic Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Clinic Name *</Text>
              <TextInput
                style={[styles.input, errors.clinicName && styles.inputError]}
                placeholder="e.g., City Veterinary Clinic"
                placeholderTextColor={Colors.textMuted}
                value={clinicName}
                onChangeText={(text) => {
                  setClinicName(text);
                  setErrors((prev) => ({ ...prev, clinicName: "" }));
                }}
              />
              {errors.clinicName && (
                <Text style={styles.errorText}>{errors.clinicName}</Text>
              )}
            </View>

            {/* Veterinarian Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Veterinarian Name *</Text>
              <TextInput
                style={[styles.input, errors.veterinarianName && styles.inputError]}
                placeholder="e.g., Dr. Juan dela Cruz"
                placeholderTextColor={Colors.textMuted}
                value={veterinarianName}
                onChangeText={(text) => {
                  setVeterinarianName(text);
                  setErrors((prev) => ({ ...prev, veterinarianName: "" }));
                }}
              />
              {errors.veterinarianName && (
                <Text style={styles.errorText}>{errors.veterinarianName}</Text>
              )}
            </View>

            {/* Date Administered */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date Administered *</Text>
              <TouchableOpacity
                style={[styles.dateInput, errors.dateAdministered && styles.inputError]}
                onPress={() => openDatePicker("administered")}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />
                <Text style={[styles.dateText, !dateAdministered && styles.placeholder]}>
                  {dateAdministered ? formatDate(dateAdministered) : "Select date"}
                </Text>
              </TouchableOpacity>
              {errors.dateAdministered && (
                <Text style={styles.errorText}>{errors.dateAdministered}</Text>
              )}
            </View>

            {/* Expiration Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Expiration Date *</Text>
              <TouchableOpacity
                style={[styles.dateInput, errors.expirationDate && styles.inputError]}
                onPress={() => openDatePicker("expiration")}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />
                <Text style={[styles.dateText, !expirationDate && styles.placeholder]}>
                  {expirationDate ? formatDate(expirationDate) : "Select date"}
                </Text>
              </TouchableOpacity>
              {card.interval_days && dateAdministered && (
                <Text style={styles.helperText}>
                  Auto-calculated based on {card.interval_days}-day interval
                </Text>
              )}
              {errors.expirationDate && (
                <Text style={styles.errorText}>{errors.expirationDate}</Text>
              )}
            </View>

            {/* Info Note */}
            <View style={styles.infoNote}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.info} />
              <Text style={styles.infoText}>
                Shot records cannot be edited after submission. Please ensure all information is correct.
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color={Colors.white} />
                  <Text style={styles.submitButtonText}>Add Shot</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            onConfirm={handleDateConfirm}
            onCancel={() => setShowDatePicker(false)}
            maximumDate={datePickerField === "administered" ? new Date() : undefined}
            minimumDate={
              datePickerField === "expiration" && dateAdministered
                ? new Date(dateAdministered)
                : undefined
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Colors.bgPrimary,
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    padding: Spacing.xl,
  },
  shotNumberBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary + "15",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  shotNumberText: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  shotNumberInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  shotNumberInput: {
    flex: 1,
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  shotNumberButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgTertiary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  boosterBadge: {
    backgroundColor: Colors.success + "15",
  },
  boosterText: {
    color: Colors.success,
  },
  boosterNote: {
    flexDirection: "row",
    backgroundColor: Colors.successBg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    alignItems: "flex-start",
  },
  boosterNoteText: {
    flex: 1,
    fontSize: 13,
    color: Colors.success,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  inputError: {
    borderColor: Colors.error,
  },
  uploadRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  uploadButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderStyle: "dashed",
    gap: Spacing.sm,
  },
  uploadButtonText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textMuted,
  },
  cameraButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: 150,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  dateText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  placeholder: {
    color: Colors.textMuted,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    fontStyle: "italic",
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  infoNote: {
    flexDirection: "row",
    backgroundColor: Colors.infoLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.info,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgTertiary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  submitButton: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    gap: Spacing.sm,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
});
