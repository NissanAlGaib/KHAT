import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getPetLitters, type Litter } from "@/services/petService";
import { getStorageUrl } from "@/utils/imageUrl";
import { Colors } from "@/constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PetLittersScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = params.petId as string;
  const petName = (params.petName as string) || "Pet";
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [litters, setLitters] = useState<Litter[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLitters = useCallback(async () => {
    try {
      const data = await getPetLitters(parseInt(petId));
      setLitters(data);
    } catch (error) {
      console.error("Error fetching litters:", error);
      showAlert({
        title: "Error",
        message: "Failed to load litters",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [petId, showAlert]);

  useEffect(() => {
    if (petId) {
      setLoading(true);
      fetchLitters();
    }
  }, [petId, fetchLitters]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLitters();
  }, [fetchLitters]);

  const getImageUrl = (path: string | null | undefined) => {
    return getStorageUrl(path);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return { bg: Colors.successLight, text: Colors.success };
      case "completed":
        return { bg: Colors.infoLight, text: Colors.info };
      case "archived":
        return { bg: Colors.bgTertiary, text: Colors.textMuted };
      default:
        return { bg: Colors.bgTertiary, text: Colors.textSecondary };
    }
  };

  // Summary stats
  const totalLitters = litters.length;
  const totalOffspring = litters.reduce((sum, l) => sum + l.offspring.total, 0);
  const totalAlive = litters.reduce((sum, l) => sum + l.offspring.alive, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading litters...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#FF6B4A", "#FF9A8B"]}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Feather name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Breeding History</Text>
              <Text style={styles.headerSubtitle}>{petName}'s Litters</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Summary Stats Bar */}
      {totalLitters > 0 && (
        <View style={styles.summaryBar}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalLitters}</Text>
            <Text style={styles.summaryLabel}>Litters</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalOffspring}</Text>
            <Text style={styles.summaryLabel}>Total Pups</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{totalAlive}</Text>
            <Text style={styles.summaryLabel}>Alive</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {litters.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="heart" size={40} color={Colors.textDisabled} />
            </View>
            <Text style={styles.emptyTitle}>No Litters Yet</Text>
            <Text style={styles.emptySubtitle}>
              Breeding history will appear here once your pet has litters
              recorded.
            </Text>
          </View>
        ) : (
          litters.map((litter) => {
            const statusColor = getStatusColor(litter.status);
            return (
              <TouchableOpacity
                key={litter.litter_id}
                style={styles.litterCard}
                onPress={() =>
                  router.push(`/(pet)/litter-detail?id=${litter.litter_id}`)
                }
                activeOpacity={0.7}
              >
                {/* Card Header: Parents + Status */}
                <View style={styles.cardHeader}>
                  <View style={styles.parentPhotos}>
                    <Image
                      source={{
                        uri:
                          getImageUrl(litter.parents.sire.photo) || undefined,
                      }}
                      style={[styles.parentPhoto, styles.sirePhoto]}
                    />
                    <View style={styles.heartBadge}>
                      <Feather name="heart" size={10} color="#fff" />
                    </View>
                    <Image
                      source={{
                        uri: getImageUrl(litter.parents.dam.photo) || undefined,
                      }}
                      style={[styles.parentPhoto, styles.damPhoto]}
                    />
                  </View>

                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.litterTitle} numberOfLines={1}>
                      {litter.title}
                    </Text>
                    <Text style={styles.litterDate}>{litter.birth_date}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: statusColor.bg },
                    ]}
                  >
                    <Text
                      style={[styles.statusText, { color: statusColor.text }]}
                    >
                      {litter.status}
                    </Text>
                  </View>
                </View>

                {/* Stat Chips */}
                <View style={styles.statChipsRow}>
                  <View style={styles.statChip}>
                    <Text style={styles.statChipValue}>
                      {litter.offspring.total}
                    </Text>
                    <Text style={styles.statChipLabel}>Total</Text>
                  </View>
                  <View
                    style={[styles.statChip, { backgroundColor: "#EFF6FF" }]}
                  >
                    <Text style={[styles.statChipValue, { color: "#2563EB" }]}>
                      {litter.offspring.male}
                    </Text>
                    <Text style={styles.statChipLabel}>Male</Text>
                  </View>
                  <View
                    style={[styles.statChip, { backgroundColor: "#FDF2F8" }]}
                  >
                    <Text style={[styles.statChipValue, { color: "#DB2777" }]}>
                      {litter.offspring.female}
                    </Text>
                    <Text style={styles.statChipLabel}>Female</Text>
                  </View>
                  {litter.offspring.died > 0 && (
                    <View
                      style={[
                        styles.statChip,
                        { backgroundColor: Colors.errorLight },
                      ]}
                    >
                      <Text
                        style={[styles.statChipValue, { color: Colors.error }]}
                      >
                        {litter.offspring.died}
                      </Text>
                      <Text style={styles.statChipLabel}>Died</Text>
                    </View>
                  )}
                </View>

                {/* Offspring Preview */}
                {litter.offspring_details.length > 0 && (
                  <View style={styles.offspringPreview}>
                    <View style={styles.offspringAvatars}>
                      {litter.offspring_details.slice(0, 5).map((offspring) => (
                        <View
                          key={offspring.offspring_id}
                          style={styles.offspringAvatar}
                        >
                          {offspring.photo_url ? (
                            <Image
                              source={{
                                uri:
                                  getImageUrl(offspring.photo_url) || undefined,
                              }}
                              style={styles.offspringAvatarImage}
                            />
                          ) : (
                            <View style={styles.offspringAvatarPlaceholder}>
                              <Text style={styles.offspringAvatarIcon}>
                                {offspring.sex === "male" ? "♂" : "♀"}
                              </Text>
                            </View>
                          )}
                        </View>
                      ))}
                      {litter.offspring_details.length > 5 && (
                        <View
                          style={[
                            styles.offspringAvatar,
                            styles.offspringAvatarMore,
                          ]}
                        >
                          <Text style={styles.offspringMoreText}>
                            +{litter.offspring_details.length - 5}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.viewDetailsButton}>
                      <Text style={styles.viewDetailsText}>Details</Text>
                      <Feather
                        name="chevron-right"
                        size={14}
                        color={Colors.primary}
                      />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </View>
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
    backgroundColor: "#FDF4F4",
  },
  loadingText: {
    marginTop: 12,
    color: Colors.textMuted,
    fontSize: 14,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  headerSafeArea: {},
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
  summaryBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.bgTertiary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  litterCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  parentPhotos: {
    flexDirection: "row",
    alignItems: "center",
    width: 68,
    height: 44,
    marginRight: 12,
  },
  parentPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  sirePhoto: {
    position: "absolute",
    left: 0,
    zIndex: 2,
  },
  damPhoto: {
    position: "absolute",
    left: 24,
    zIndex: 1,
  },
  heartBadge: {
    position: "absolute",
    left: 16,
    top: -2,
    zIndex: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  cardHeaderInfo: {
    flex: 1,
  },
  litterTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  litterDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  statChipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  statChip: {
    flex: 1,
    backgroundColor: Colors.bgTertiary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center",
  },
  statChipValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  statChipLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  offspringPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  offspringAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  offspringAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: -8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  offspringAvatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  offspringAvatarPlaceholder: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.bgTertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  offspringAvatarIcon: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  offspringAvatarMore: {
    backgroundColor: Colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  offspringMoreText: {
    fontSize: 10,
    fontWeight: "bold",
    color: Colors.primary,
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
});
