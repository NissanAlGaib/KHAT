import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Colors, BorderRadius, Spacing, Shadows, Gradients } from "@/constants";
import {
  getPet,
  getVaccinationCards,
  addHistoricalShot,
  VaccinationCard,
  VaccinationCardsResponse,
} from "@/services/petService";

interface PendingShot {
  id: string;
  shot_number: number;
  vaccination_record: any;
  clinic_name: string;
  veterinarian_name: string;
  date_administered: string;
  expiration_date: string;
}

export default function ImportHistoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = params.petId as string;
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [petName, setPetName] = useState("");
  const [loading, setLoading] = useState(true);
  const [vaccinationCards, setVaccinationCards] = useState<VaccinationCardsResponse>({
    required: [],
    optional: [],
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<VaccinationCard | null>(null);
  const [addingShot, setAddingShot] = useState(false);

  // Form state for add modal
  const [document, setDocument] = useState<any>(null);
  const [clinicName, setClinicName] = useState("");
  const [veterinarianName, setVeterinarianName] = useState("");
  const [dateAdministered, setDateAdministered] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [shotNumber, setShotNumber] = useState("1");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<"administered" | "expiration">("administered");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    try {
      const [pet, cards] = await Promise.all([
        getPet(parseInt(petId)),
        getVaccinationCards(parseInt(petId)),
      ]);
      setPetName(pet.name);
      setVaccinationCards(cards);
    } catch (error) {
      console.error("Error fetching data:", error);
      showAlert({
        title: "Error",
        message: "Failed to load vaccination data",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [petId, showAlert]);

  useEffect(() => {
    if (petId) {
      fetchData();
    }
  }, [petId, fetchData]);

  const resetForm = () => {
    setDocument(null);
    setClinicName("");
    setVeterinarianName("");
    setDateAdministered("");
    setExpirationDate("");
    setShotNumber("1");
    setErrors({});
  };

  const openAddModal = (card: VaccinationCard) => {
    setSelectedCard(card);
    // Suggest next shot number based on existing shots
    const existingShotNumbers = card.shots.map((s) => s.shot_number);
    let nextNumber = 1;
    while (existingShotNumbers.includes(nextNumber)) {
      nextNumber++;
    }
    setShotNumber(nextNumber.toString());
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    resetForm();
    setShowAddModal(false);
    setSelectedCard(null);
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });
      if (!result.canceled && result.assets?.length > 0) {
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
      // Auto-calculate expiration based on card interval
      if (selectedCard?.interval_days) {
        const expDate = new Date(date);
        expDate.setDate(expDate.getDate() + selectedCard.interval_days);
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
    const shotNum = parseInt(shotNumber);
    if (!shotNumber || isNaN(shotNum) || shotNum < 1) {
      newErrors.shotNumber = "Shot number must be at least 1";
    }
    // Check for duplicate shot number
    if (selectedCard && selectedCard.shots.some((s) => s.shot_number === shotNum)) {
      newErrors.shotNumber = `Shot ${shotNum} already exists`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddShot = async () => {
    if (!validateForm() || !selectedCard) return;

    setAddingShot(true);
    try {
      await addHistoricalShot(parseInt(petId), selectedCard.card_id, {
        vaccination_record: document,
        clinic_name: clinicName,
        veterinarian_name: veterinarianName,
        date_administered: dateAdministered,
        expiration_date: expirationDate,
        shot_number: parseInt(shotNumber),
      });

      await fetchData();
      closeAddModal();

      showAlert({
        title: "Success",
        message: "Historical shot record added!",
        type: "success",
      });
    } catch (error: any) {
      showAlert({
        title: "Error",
        message: error.response?.data?.message || "Failed to add shot",
        type: "error",
      });
    } finally {
      setAddingShot(false);
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

  const allCards = [...vaccinationCards.required, ...vaccinationCards.optional];
  const totalHistoricalShots = allCards.reduce(
    (sum, card) => sum + card.shots.filter((s) => s.is_historical).length,
    0
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <LinearGradient colors={[...Gradients.primary]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Import History</Text>
            <Text style={styles.headerSubtitle}>{petName}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="time-outline" size={24} color={Colors.info} />
          <View style={styles.infoBannerText}>
            <Text style={styles.infoBannerTitle}>Add Past Vaccination Records</Text>
            <Text style={styles.infoBannerSubtitle}>
              Import records from before you started using the app. These will be marked as
              "Historical" and won't require verification.
            </Text>
          </View>
        </View>

        {/* Stats */}
        {totalHistoricalShots > 0 && (
          <View style={styles.statsCard}>
            <Ionicons name="documents-outline" size={20} color={Colors.success} />
            <Text style={styles.statsText}>
              {totalHistoricalShots} historical record{totalHistoricalShots > 1 ? "s" : ""} imported
            </Text>
          </View>
        )}

        {/* Vaccination Cards List */}
        {allCards.map((card) => (
          <View key={card.card_id} style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleRow}>
                <Ionicons
                  name={card.is_required ? "shield-checkmark" : "add-circle"}
                  size={20}
                  color={card.is_required ? Colors.primary : Colors.textMuted}
                />
                <Text style={styles.cardTitle}>{card.vaccine_name}</Text>
              </View>
              <TouchableOpacity style={styles.addButton} onPress={() => openAddModal(card)}>
                <Ionicons name="add" size={20} color={Colors.white} />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Shot Progress */}
            {card.total_shots_required && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${card.progress_percentage}%` }]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {card.completed_shots_count} / {card.total_shots_required} shots
                </Text>
              </View>
            )}

            {/* Existing Shots */}
            {card.shots.length > 0 ? (
              <View style={styles.shotsList}>
                {card.shots.map((shot) => (
                  <View key={shot.shot_id} style={styles.shotItem}>
                    <View style={styles.shotInfo}>
                      <Text style={styles.shotNumber}>Shot {shot.shot_number}</Text>
                      <Text style={styles.shotDate}>{shot.date_administered_display}</Text>
                    </View>
                    {shot.is_historical && (
                      <View style={styles.historicalBadge}>
                        <Ionicons name="time-outline" size={12} color={Colors.info} />
                        <Text style={styles.historicalBadgeText}>Historical</Text>
                      </View>
                    )}
                    {!shot.is_historical && (
                      <View style={[styles.historicalBadge, styles.liveBadge]}>
                        <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
                        <Text style={[styles.historicalBadgeText, styles.liveBadgeText]}>
                          {shot.verification_status === "approved" ? "Verified" : "Pending"}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noShotsText}>No records yet</Text>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.back()}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => {
            router.replace({
              pathname: "/(pet)/vaccinations",
              params: { petId },
            });
          }}
        >
          <Text style={styles.doneButtonText}>Done</Text>
          <Ionicons name="checkmark" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Add Historical Shot Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={closeAddModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient colors={[...Gradients.primary]} style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Historical Record</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedCard?.vaccine_name} - Shot {shotNumber}
                </Text>
              </View>
              <TouchableOpacity onPress={closeAddModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
              {/* Shot Number */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shot Number *</Text>
                <View style={styles.shotNumberRow}>
                  <TouchableOpacity
                    style={styles.shotNumberBtn}
                    onPress={() => {
                      const num = parseInt(shotNumber) || 1;
                      if (num > 1) setShotNumber((num - 1).toString());
                    }}
                  >
                    <Ionicons name="remove" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.shotNumberInput, errors.shotNumber && styles.inputError]}
                    value={shotNumber}
                    onChangeText={(text) => {
                      setShotNumber(text.replace(/[^0-9]/g, ""));
                      setErrors((prev) => ({ ...prev, shotNumber: "" }));
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    textAlign="center"
                  />
                  <TouchableOpacity
                    style={styles.shotNumberBtn}
                    onPress={() => {
                      const num = parseInt(shotNumber) || 0;
                      setShotNumber((num + 1).toString());
                    }}
                  >
                    <Ionicons name="add" size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                {errors.shotNumber && <Text style={styles.errorText}>{errors.shotNumber}</Text>}
              </View>

              {/* Document Upload */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Proof Document *</Text>
                <View style={styles.uploadRow}>
                  <TouchableOpacity
                    style={[styles.uploadButton, errors.document && styles.inputError]}
                    onPress={pickDocument}
                  >
                    <Ionicons name="document-attach-outline" size={24} color={Colors.textMuted} />
                    <Text style={styles.uploadButtonText} numberOfLines={1}>
                      {document?.name || "Upload File"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                    <Ionicons name="camera" size={24} color={Colors.white} />
                  </TouchableOpacity>
                </View>
                {document?.uri && document.mimeType?.startsWith("image") && (
                  <Image source={{ uri: document.uri }} style={styles.previewImage} />
                )}
                {errors.document && <Text style={styles.errorText}>{errors.document}</Text>}
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
                {errors.clinicName && <Text style={styles.errorText}>{errors.clinicName}</Text>}
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
                {selectedCard?.interval_days && dateAdministered && (
                  <Text style={styles.helperText}>
                    Auto-calculated based on {selectedCard.interval_days}-day interval
                  </Text>
                )}
                {errors.expirationDate && (
                  <Text style={styles.errorText}>{errors.expirationDate}</Text>
                )}
              </View>

              {/* Historical Note */}
              <View style={styles.historicalNote}>
                <Ionicons name="time-outline" size={18} color={Colors.info} />
                <Text style={styles.historicalNoteText}>
                  This record will be marked as historical and won't go through the verification
                  queue.
                </Text>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={closeAddModal} disabled={addingShot}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, addingShot && styles.disabledButton]}
                onPress={handleAddShot}
                disabled={addingShot}
              >
                {addingShot ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color={Colors.white} />
                    <Text style={styles.submitButtonText}>Add Record</Text>
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

      <AlertModal visible={visible} {...alertOptions} onClose={hideAlert} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textMuted,
  },
  header: {
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  infoBanner: {
    flexDirection: "row",
    backgroundColor: Colors.infoLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  infoBannerText: {
    flex: 1,
  },
  infoBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.info,
    marginBottom: 4,
  },
  infoBannerSubtitle: {
    fontSize: 13,
    color: Colors.info,
    lineHeight: 18,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successBg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  statsText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.success,
  },
  cardContainer: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.white,
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  shotsList: {
    gap: Spacing.sm,
  },
  shotItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.bgTertiary,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  shotInfo: {
    flex: 1,
  },
  shotNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  shotDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  historicalBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.infoLight,
    paddingVertical: 2,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  historicalBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: Colors.info,
  },
  liveBadge: {
    backgroundColor: Colors.successBg,
  },
  liveBadgeText: {
    color: Colors.success,
  },
  noShotsText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: Spacing.sm,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.md,
  },
  skipButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgTertiary,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  doneButton: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    gap: Spacing.sm,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  // Modal styles
  modalOverlay: {
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
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.white,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  modalContent: {
    padding: Spacing.xl,
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
  shotNumberRow: {
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
  shotNumberBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgTertiary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
  historicalNote: {
    flexDirection: "row",
    backgroundColor: Colors.infoLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
    alignItems: "flex-start",
  },
  historicalNoteText: {
    flex: 1,
    fontSize: 13,
    color: Colors.info,
  },
  modalFooter: {
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
