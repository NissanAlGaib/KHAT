import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import BubbleBackgroundRe from "@/components/app/BubbleBackground";
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

  const [activeTab, setActiveTab] = useState<"required" | "optional">("required");

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
      if (card.is_required) {
        showAlert({
          title: "Unavailable",
          message: "Required vaccine protocols can't be changed.",
          type: "info",
        });
        return;
      }

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B4A"]} />
        }
      >
        {/* Hero Header */}
        <View style={styles.heroHeader}>
          <View style={StyleSheet.absoluteFillObject}>
            <BubbleBackgroundRe
              backgroundColor="#F98D67"
              bubbleColor="rgba(255, 192, 170, 0.32)"
              bigCount={3}
              smallCount={5}
            />
          </View>

          <View style={styles.heroTopRow}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => router.back()}>
              <Feather name="chevron-left" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.heroTitleWrap}>
              <Text style={styles.heroTitle}>Vaccinations</Text>
              <Text style={styles.heroSubtitle}>{petName}</Text>
            </View>

            {availableProtocols.available.length > 0 ? (
              <TouchableOpacity style={styles.iconCircle} onPress={() => setShowOptInModal(true)}>
                <Feather name="plus" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.iconSpacer} />
            )}
          </View>

          <View style={styles.heroCenterContent}>
            <Text style={styles.heroBigValue}>{totalCards}</Text>
            <Text style={styles.heroBigLabel}>TOTAL CARDS</Text>
          </View>
        </View>

        {/* Content Sheet */}
        <View style={styles.contentSheet}>
          {/* Import History Banner */}
          {showImportBanner && (
            <TouchableOpacity
              style={styles.importBanner}
              onPress={() => router.push({
                pathname: "/(pet)/import-history",
                params: { petId }
              })}
            >
              <Ionicons name="time-outline" size={22} color="#3B82F6" />
              <View style={styles.importBannerText}>
                <Text style={styles.importBannerTitle}>Import Past Records</Text>
                <Text style={styles.importBannerSubtitle}>
                  Add records from before using the app
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#3B82F6" />
            </TouchableOpacity>
          )}

          {/* Stats Summary Row */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Ionicons name="medical" size={18} color="#FF6B4A" />
              <Text style={[styles.summaryValue, { color: "#FF6B4A" }]}>{totalCards}</Text>
              <Text style={styles.summaryLabel}>Cards</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="checkmark-circle" size={18} color="#22C55E" />
              <Text style={[styles.summaryValue, { color: "#22C55E" }]}>{verifiedCards}</Text>
              <Text style={styles.summaryLabel}>Done</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="hourglass" size={18} color="#F59E0B" />
              <Text style={[styles.summaryValue, { color: "#F59E0B" }]}>{pendingCards}</Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={[styles.summaryValue, { color: "#EF4444" }]}>{overdueCards}</Text>
              <Text style={styles.summaryLabel}>Overdue</Text>
            </View>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "required" && styles.tabBtnActive]}
              onPress={() => setActiveTab("required")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={activeTab === "required" ? "#FFFFFF" : "#A0927F"}
              />
              <Text style={[styles.tabBtnText, activeTab === "required" && styles.tabBtnTextActive]}>
                Required{vaccinationCards.required.length > 0 ? ` (${vaccinationCards.required.length})` : ""}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === "optional" && styles.tabBtnActive]}
              onPress={() => setActiveTab("optional")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="add-circle"
                size={14}
                color={activeTab === "optional" ? "#FFFFFF" : "#A0927F"}
              />
              <Text style={[styles.tabBtnText, activeTab === "optional" && styles.tabBtnTextActive]}>
                Optional{vaccinationCards.optional.length > 0 ? ` (${vaccinationCards.optional.length})` : ""}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Cards for active tab */}
          {activeTab === "required" ? (
            vaccinationCards.required.length > 0 ? (
              vaccinationCards.required.map((card) => (
                <VaccinationCardComponent
                  key={card.card_id}
                  card={card}
                  onAddShot={handleOpenAddShotModal}
                />
              ))
            ) : (
              <View style={styles.emptySection}>
                <Ionicons name="shield-outline" size={32} color="#D4CBCA" />
                <Text style={styles.emptyTitle}>No Required Vaccines</Text>
                <Text style={styles.emptySubtext}>All required cards will appear here.</Text>
              </View>
            )
          ) : (
            <>
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
                  <Ionicons name="medical-outline" size={32} color="#D4CBCA" />
                  <Text style={styles.emptyTitle}>No Optional Vaccines</Text>
                  <Text style={styles.emptySubtext}>Add extra vaccines from available protocols.</Text>
                </View>
              )}

              {availableProtocols.available.length > 0 && (
                <TouchableOpacity
                  style={styles.addCustomButton}
                  onPress={() => setShowOptInModal(true)}
                >
                  <Ionicons name="add-circle-outline" size={28} color="#FF6B4A" />
                  <Text style={styles.addCustomText}>Add Vaccine</Text>
                  <Text style={styles.addCustomSubtext}>
                    Select from available protocols
                  </Text>
                </TouchableOpacity>
              )}
            </>
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
                  <Text style={styles.emptySubtext}>
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
  heroHeader: {
    height: 200,
    overflow: "hidden",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.26)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconSpacer: {
    width: 34,
    height: 34,
  },
  heroTitleWrap: {
    alignItems: "center",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 30,
  },
  heroSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
  },
  heroCenterContent: {
    marginTop: 14,
    alignItems: "center",
  },
  heroBigValue: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "700",
    lineHeight: 44,
  },
  heroBigLabel: {
    marginTop: 2,
    color: "rgba(255,255,255,0.88)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  contentSheet: {
    marginTop: -18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#F8F1EF",
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  importBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
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
  summaryCard: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEE8E6",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    overflow: "hidden",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#EEE8E6",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF6B4A",
    marginTop: 3,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginTop: 1,
  },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#EDE5E2",
    borderRadius: 14,
    padding: 3,
    marginBottom: 14,
    gap: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 11,
    paddingVertical: 9,
    paddingHorizontal: 6,
  },
  tabBtnActive: {
    backgroundColor: "#FF6B4A",
    ...Platform.select({
      ios: {
        shadowColor: "#FF6B4A",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#A0927F",
  },
  tabBtnTextActive: {
    color: "#FFFFFF",
  },
  emptySection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE8E6",
    marginBottom: 12,
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
    color: "#5E5A68",
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 12,
    color: "#A09AA8",
    textAlign: "center",
  },
  addCustomButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFE4DE",
    borderStyle: "dashed",
    marginBottom: 12,
  },
  addCustomText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B4A",
    marginTop: 10,
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
