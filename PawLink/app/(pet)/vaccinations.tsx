import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import VaccinationCardComponent from "@/components/pet/VaccinationCard";
import AddShotModal from "@/components/pet/AddShotModal";
import {
  getPet,
  getVaccinationCards,
  addVaccinationShot,
  createCustomVaccinationCard,
  deleteVaccinationCard,
  VaccinationCard,
  VaccinationCardsResponse,
} from "@/services/petService";

export default function VaccinationsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = params.petId as string;
  const showImportBanner = params.showImportBanner === "true";
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [petName, setPetName] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vaccinationCards, setVaccinationCards] = useState<VaccinationCardsResponse>({
    required: [],
    optional: [],
  });

  // Modal states
  const [showAddShotModal, setShowAddShotModal] = useState(false);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<VaccinationCard | null>(null);
  const [addingShotLoading, setAddingShotLoading] = useState(false);

  // Custom card form state
  const [customVaccineName, setCustomVaccineName] = useState("");
  const [customTotalShots, setCustomTotalShots] = useState("1");
  const [customRecurrence, setCustomRecurrence] = useState<"none" | "recurring">("none");
  const [creatingCustomCard, setCreatingCustomCard] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [pet, cards] = await Promise.all([
        getPet(parseInt(petId)),
        getVaccinationCards(parseInt(petId)),
      ]);
      setPetName(pet.name);
      setVaccinationCards(cards);
    } catch (error) {
      console.error("Error fetching vaccination data:", error);
      showAlert({
        title: "Error",
        message: "Failed to load vaccination data",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [petId, showAlert]);

  useEffect(() => {
    if (petId) {
      fetchData();
    }
  }, [petId, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleOpenAddShotModal = (cardId: number) => {
    const allCards = [...vaccinationCards.required, ...vaccinationCards.optional];
    const card = allCards.find((c) => c.card_id === cardId);
    if (card) {
      setSelectedCard(card);
      setShowAddShotModal(true);
    }
  };

  const handleAddShot = async (shotData: {
    vaccination_record: any;
    clinic_name: string;
    veterinarian_name: string;
    date_administered: string;
    expiration_date: string;
    shot_number: number;
  }) => {
    if (!selectedCard) return;
    setAddingShotLoading(true);
    try {
      await addVaccinationShot(parseInt(petId), selectedCard.card_id, shotData);
      await fetchData();
      showAlert({
        title: "Success",
        message: "Shot record added successfully!",
        type: "success",
      });
    } catch (error: any) {
      showAlert({
        title: "Error",
        message: error.response?.data?.message || "Failed to add shot record",
        type: "error",
      });
      throw error;
    } finally {
      setAddingShotLoading(false);
    }
  };

  const handleCreateCustomCard = async () => {
    if (!customVaccineName.trim()) {
      showAlert({
        title: "Error",
        message: "Please enter a vaccine name",
        type: "error",
      });
      return;
    }

    setCreatingCustomCard(true);
    try {
      await createCustomVaccinationCard(parseInt(petId), {
        vaccine_name: customVaccineName.trim(),
        total_shots: parseInt(customTotalShots) || 1,
        recurrence_type: customRecurrence,
      });
      await fetchData();
      setShowAddCustomModal(false);
      setCustomVaccineName("");
      setCustomTotalShots("1");
      setCustomRecurrence("none");
      showAlert({
        title: "Success",
        message: "Custom vaccination card created!",
        type: "success",
      });
    } catch (error: any) {
      showAlert({
        title: "Error",
        message: error.response?.data?.message || "Failed to create vaccination card",
        type: "error",
      });
    } finally {
      setCreatingCustomCard(false);
    }
  };

  const handleDeleteCard = (cardId: number) => {
    const card = vaccinationCards.optional.find((c) => c.card_id === cardId);
    if (!card) return;

    showAlert({
      title: "Delete Vaccination Card",
      message: `Are you sure you want to delete "${card.vaccine_name}"? This action cannot be undone.`,
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteVaccinationCard(parseInt(petId), cardId);
              await fetchData();
              showAlert({
                title: "Deleted",
                message: "Vaccination card deleted successfully",
                type: "success",
              });
            } catch (error: any) {
              showAlert({
                title: "Error",
                message: error.response?.data?.message || "Failed to delete card",
                type: "error",
              });
            }
          },
        },
      ],
    });
  };

  // Calculate overall stats
  const totalCards = vaccinationCards.required.length + vaccinationCards.optional.length;
  const completedCards = [...vaccinationCards.required, ...vaccinationCards.optional].filter(
    (c) => c.status === "completed"
  ).length;
  const overdueCards = [...vaccinationCards.required, ...vaccinationCards.optional].filter(
    (c) => c.status === "overdue"
  ).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B4A" />
          <Text style={styles.loadingText}>Loading vaccinations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <LinearGradient colors={["#FF6B4A", "#FF9A8B"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Vaccinations</Text>
            <Text style={styles.headerSubtitle}>{petName}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddCustomModal(true)}
            style={styles.addButton}
          >
            <Feather name="plus" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B4A"]} />
        }
      >
        {/* Import History Banner */}
        {showImportBanner && (
          <TouchableOpacity
            style={styles.importBanner}
            onPress={() => router.push({
              pathname: "/(pet)/import-history",
              params: { petId }
            })}
          >
            <Ionicons name="time-outline" size={24} color="#3B82F6" />
            <View style={styles.importBannerText}>
              <Text style={styles.importBannerTitle}>Import Past Records</Text>
              <Text style={styles.importBannerSubtitle}>
                Add vaccination records from before you started using the app
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#3B82F6" />
          </TouchableOpacity>
        )}

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="medical" size={24} color="#FF6B4A" />
            <Text style={styles.statNumber}>{totalCards}</Text>
            <Text style={styles.statLabel}>Total Cards</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
            <Text style={[styles.statNumber, { color: "#22C55E" }]}>{completedCards}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="alert-circle" size={24} color="#EF4444" />
            <Text style={[styles.statNumber, { color: "#EF4444" }]}>{overdueCards}</Text>
            <Text style={styles.statLabel}>Overdue</Text>
          </View>
        </View>

        {/* Required Vaccinations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#FF6B4A" />
            <Text style={styles.sectionTitle}>Required Vaccinations</Text>
          </View>
          {vaccinationCards.required.length > 0 ? (
            vaccinationCards.required.map((card) => (
              <VaccinationCardComponent
                key={card.card_id}
                card={card}
                onAddShot={handleOpenAddShotModal}
              />
            ))
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No required vaccination cards</Text>
            </View>
          )}
        </View>

        {/* Optional Vaccinations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="add-circle" size={20} color="#6B7280" />
            <Text style={styles.sectionTitle}>Optional Vaccinations</Text>
          </View>
          {vaccinationCards.optional.length > 0 ? (
            vaccinationCards.optional.map((card) => (
              <View key={card.card_id}>
                <VaccinationCardComponent card={card} onAddShot={handleOpenAddShotModal} />
                <TouchableOpacity
                  style={styles.deleteCardButton}
                  onPress={() => handleDeleteCard(card.card_id)}
                >
                  <Feather name="trash-2" size={16} color="#EF4444" />
                  <Text style={styles.deleteCardText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <TouchableOpacity
              style={styles.addCustomButton}
              onPress={() => setShowAddCustomModal(true)}
            >
              <Ionicons name="add-circle-outline" size={32} color="#FF6B4A" />
              <Text style={styles.addCustomText}>Add Custom Vaccination</Text>
              <Text style={styles.addCustomSubtext}>
                Track additional vaccines not in the required list
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Add Shot Modal */}
      <AddShotModal
        visible={showAddShotModal}
        onClose={() => {
          setShowAddShotModal(false);
          setSelectedCard(null);
        }}
        card={selectedCard}
        onSubmit={handleAddShot}
        isLoading={addingShotLoading}
      />

      {/* Add Custom Vaccination Modal */}
      {showAddCustomModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.customModal}>
            <View style={styles.customModalHeader}>
              <Text style={styles.customModalTitle}>Add Custom Vaccination</Text>
              <TouchableOpacity onPress={() => setShowAddCustomModal(false)}>
                <Feather name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.customModalContent}>
              <Text style={styles.inputLabel}>Vaccine Name *</Text>
              <View style={styles.textInput}>
                <Feather name="edit-3" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.textInputField}
                  value={customVaccineName}
                  onChangeText={setCustomVaccineName}
                  placeholder="Enter vaccine name"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  returnKeyType="done"
                />
              </View>

              <Text style={styles.inputLabel}>Number of Shots</Text>
              <View style={styles.shotsSelector}>
                {["1", "2", "3", "4", "5", "6"].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.shotOption,
                      customTotalShots === num && styles.shotOptionActive,
                    ]}
                    onPress={() => setCustomTotalShots(num)}
                  >
                    <Text
                      style={[
                        styles.shotOptionText,
                        customTotalShots === num && styles.shotOptionTextActive,
                      ]}
                    >
                      {num}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Renewal Type</Text>
              <Text style={styles.inputHelper}>
                Choose whether this vaccine needs periodic renewal
              </Text>
              <View style={styles.recurrenceSelector}>
                {[
                  { value: "none", label: "One-time Series", description: "No renewal needed after completion" },
                  { value: "recurring", label: "Recurring", description: "Renew when expired" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.recurrenceOption,
                      customRecurrence === option.value && styles.recurrenceOptionActive,
                    ]}
                    onPress={() => setCustomRecurrence(option.value as any)}
                  >
                    <Text
                      style={[
                        styles.recurrenceOptionText,
                        customRecurrence === option.value && styles.recurrenceOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text
                      style={[
                        styles.recurrenceOptionSubtext,
                        customRecurrence === option.value && styles.recurrenceOptionSubtextActive,
                      ]}
                    >
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.customModalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddCustomModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, creatingCustomCard && styles.createButtonDisabled]}
                onPress={handleCreateCustomCard}
                disabled={creatingCustomCard}
              >
                {creatingCustomCard ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.createButtonText}>Create Card</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF4F4",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6B7280",
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
  addButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  importBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  importBannerText: {
    flex: 1,
  },
  importBannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 2,
  },
  importBannerSubtitle: {
    fontSize: 12,
    color: "#3B82F6",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FF6B4A",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginLeft: 8,
  },
  emptySection: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  deleteCardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    marginTop: -8,
    marginBottom: 8,
  },
  deleteCardText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  addCustomButton: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFE4DE",
    borderStyle: "dashed",
  },
  addCustomText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B4A",
    marginTop: 12,
  },
  addCustomSubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  customModal: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
  },
  customModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  customModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  customModalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },
  inputHelper: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 12,
    marginTop: -4,
  },
  textInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textInputField: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  placeholder: {
    color: "#9CA3AF",
  },
  shotsSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  shotOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  shotOptionActive: {
    backgroundColor: "#FF6B4A",
  },
  shotOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  shotOptionTextActive: {
    color: "white",
  },
  recurrenceSelector: {
    flexDirection: "row",
    gap: 8,
  },
  recurrenceOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  recurrenceOptionActive: {
    backgroundColor: "#FF6B4A",
  },
  recurrenceOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  recurrenceOptionTextActive: {
    color: "white",
  },
  recurrenceOptionSubtext: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 2,
    textAlign: "center",
  },
  recurrenceOptionSubtextActive: {
    color: "rgba(255,255,255,0.8)",
  },
  customModalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  createButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FF6B4A",
    alignItems: "center",
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
});
