import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import StyledModal from "@/components/core/StyledModal";
import VaccinationCardComponent from "@/components/pet/VaccinationCard";
import AddShotModal from "@/components/pet/AddShotModal";
import AddVaccineSheet from "@/components/pet/AddVaccineSheet";
import {
  getPet,
  getVaccinationCards,
  addVaccinationShot,
  getAvailableProtocols,
  optInToProtocol,
  changeProtocol,
  VaccinationCard,
  VaccinationCardsResponse,
  AvailableProtocolsResponse,
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
  const [showOptInModal, setShowOptInModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState<VaccinationCard | null>(null);
  const [addingShotLoading, setAddingShotLoading] = useState(false);

  const [availableProtocols, setAvailableProtocols] = useState<AvailableProtocolsResponse>({
    enrolled: [],
    available: [],
  });

  // Edit Protocol state
  const [showEditProtocolModal, setShowEditProtocolModal] = useState(false);
  const [editingCard, setEditingCard] = useState<VaccinationCard | null>(null);
  const [changingProtocol, setChangingProtocol] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [pet, cards, protocols] = await Promise.all([
        getPet(parseInt(petId)),
        getVaccinationCards(parseInt(petId)),
        getAvailableProtocols(parseInt(petId)),
      ]);
      setPetName(pet.name);
      setVaccinationCards(cards);
      setAvailableProtocols(protocols);
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

  const handleOptIn = async (protocolId: number) => {
    try {
      await optInToProtocol(parseInt(petId), protocolId);
      await fetchData();
      showAlert({
        title: "Success",
        message: "Vaccine added to your pet's schedule!",
        type: "success",
      });
    } catch (error: any) {
      showAlert({
        title: "Error",
        message: error.response?.data?.message || "Failed to add vaccine",
        type: "error",
      });
    }
  };

  const handleOpenEditProtocolModal = (cardId: number) => {
    const allCards = [...vaccinationCards.required, ...vaccinationCards.optional];
    const card = allCards.find((c) => c.card_id === cardId);
    if (card) {
      setEditingCard(card);
      setShowEditProtocolModal(true);
    }
  };

  const handleChangeProtocol = async (protocolId: number) => {
    if (!editingCard) return;
    setChangingProtocol(true);
    try {
      await changeProtocol(parseInt(petId), editingCard.card_id, protocolId);
      await fetchData();
      showAlert({
        title: "Success",
        message: "Vaccination protocol updated successfully!",
        type: "success",
      });
      setShowEditProtocolModal(false);
    } catch (error: any) {
      showAlert({
        title: "Error",
        message: error.response?.data?.message || "Failed to update protocol",
        type: "error",
      });
    } finally {
      setChangingProtocol(false);
    }
  };

  // Calculate overall stats
  const totalCards = vaccinationCards.required.length + vaccinationCards.optional.length;
  const verifiedCards = [...vaccinationCards.required, ...vaccinationCards.optional].filter(
    (c) => c.status === "completed"
  ).length;
  const pendingCards = [...vaccinationCards.required, ...vaccinationCards.optional].filter(
    (c) => c.pending_shots_count > 0
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
          {availableProtocols.available.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowOptInModal(true)}
              style={styles.addButton}
            >
              <Feather name="plus" size={24} color="white" />
            </TouchableOpacity>
          )}
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
            <Text style={[styles.statNumber, { color: "#22C55E" }]}>{verifiedCards}</Text>
            <Text style={styles.statLabel}>Verified</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="hourglass" size={24} color="#F59E0B" />
            <Text style={[styles.statNumber, { color: "#F59E0B" }]}>{pendingCards}</Text>
            <Text style={styles.statLabel}>Pending</Text>
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
                onEdit={handleOpenEditProtocolModal}
              />
            ))
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No required vaccination cards</Text>
            </View>
          )}
        </View>

        {/* Additional Vaccinations */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="add-circle" size={20} color="#6B7280" />
            <Text style={styles.sectionTitle}>Additional Vaccines</Text>
          </View>
          {vaccinationCards.optional.length > 0 ? (
            vaccinationCards.optional.map((card) => (
              <VaccinationCardComponent
                key={card.card_id}
                card={card}
                onAddShot={handleOpenAddShotModal}
                onEdit={handleOpenEditProtocolModal}
              />
            ))
          ) : (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No additional vaccines added</Text>
            </View>
          )}

          {availableProtocols.available.length > 0 && (
            <TouchableOpacity
              style={styles.addCustomButton}
              onPress={() => setShowOptInModal(true)}
            >
              <Ionicons name="add-circle-outline" size={32} color="#FF6B4A" />
              <Text style={styles.addCustomText}>Add Vaccine</Text>
              <Text style={styles.addCustomSubtext}>
                Select from available vaccine protocols
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

      {/* Add Vaccine Bottom Sheet */}
      <AddVaccineSheet
        visible={showOptInModal}
        onClose={() => setShowOptInModal(false)}
        protocols={availableProtocols.available}
        onAdd={handleOptIn}
      />

      {/* Edit Protocol Modal */}
      <StyledModal
        visible={showEditProtocolModal}
        onClose={() => setShowEditProtocolModal(false)}
        title="Edit Protocol"
        content={() => (
          <View>
            <Text style={styles.inputLabel}>Select New Protocol</Text>
            <Text style={styles.inputHelper}>
              Changing the protocol will update the schedule and requirements for this vaccine.
            </Text>
            
            {availableProtocols.available.length > 0 ? (
              availableProtocols.available.map((protocol) => (
                <TouchableOpacity
                  key={protocol.id}
                  style={styles.protocolCard}
                  onPress={() => handleChangeProtocol(protocol.id)}
                  disabled={changingProtocol}
                >
                  <View style={styles.protocolHeader}>
                    <View style={styles.protocolInfo}>
                      <Text style={styles.protocolName}>{protocol.name}</Text>
                      <View style={styles.protocolBadges}>
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeBadgeText}>
                            {protocol.protocol_type_label}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {changingProtocol ? (
                       <ActivityIndicator size="small" color="#FF6B4A" />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    )}
                  </View>
                  {protocol.description && (
                    <Text style={styles.protocolDescription}>
                      {protocol.description}
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
               <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    No other protocols available.
                  </Text>
                </View>
            )}
          </View>
        )}
      />

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
  protocolCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  protocolHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  protocolInfo: {
    flex: 1,
    marginRight: 12,
  },
  protocolName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  protocolBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  typeBadge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#4B5563",
  },
  protocolDescription: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
  },
});
