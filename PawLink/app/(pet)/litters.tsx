import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import BubbleBackgroundRe from "@/components/app/BubbleBackground";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getPetLitters, type Litter } from "@/services/petService";
import { getStorageUrl } from "@/utils/imageUrl";
import dayjs from "dayjs";

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
      const data = await getPetLitters(parseInt(petId, 10));
      setLitters(Array.isArray(data) ? data : []);
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

  const getImageUrl = (path: string | null | undefined) =>
    getStorageUrl(path) ?? undefined;

  const formatLitterDate = (birthDate?: string, birthDateFull?: string) => {
    if (birthDateFull && birthDateFull.trim().length > 0) return birthDateFull;
    if (!birthDate) return "Date unavailable";

    const parsed = dayjs(birthDate);
    return parsed.isValid() ? parsed.format("MMM YYYY") : "Date unavailable";
  };

  const getStatusColor = (status: string) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "completed") {
      return { bg: "#EAF1FF", text: "#4D7FD3" };
    }
    if (normalized === "active") {
      return { bg: "#DCF7EE", text: "#3FA58C" };
    }
    if (normalized === "archived") {
      return { bg: "#EFE9E6", text: "#8A8594" };
    }

    return { bg: "#F7EFEC", text: "#8A8594" };
  };

  // Summary stats
  const totalLitters = litters.length;
  const totalOffspring = litters.reduce((sum, l) => sum + l.offspring.total, 0);
  const totalAlive = litters.reduce((sum, l) => sum + l.offspring.alive, 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color="#FF8C67" />
        <Text style={styles.loadingText}>Loading litters...</Text>
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF8C67"
            colors={["#FF8C67"]}
          />
        }
      >
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
              <Text style={styles.heroTitle}>Breeding History</Text>
              <Text style={styles.heroSubtitle}>{petName}'s litters</Text>
            </View>

            <View style={styles.iconSpacer} />
          </View>

          <View style={styles.heroCenterContent}>
            <Text style={styles.heroBigValue}>{totalLitters}</Text>
            <Text style={styles.heroBigLabel}>TOTAL LITTERS</Text>
          </View>
        </View>

        <View style={styles.contentSheet}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalLitters}</Text>
              <Text style={styles.summaryLabel}>LITTERS</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalOffspring}</Text>
              <Text style={styles.summaryLabel}>TOTAL PUPS</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{totalAlive}</Text>
              <Text style={styles.summaryLabel}>ALIVE</Text>
            </View>
          </View>

          {litters.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="heart-outline" size={36} color="#C6BFCB" />
              </View>
              <Text style={styles.emptyTitle}>No Litters Yet</Text>
              <Text style={styles.emptySubtitle}>
                Breeding history will appear here once your pet has recorded litters.
              </Text>
            </View>
          ) : (
            litters.map((litter, index) => {
              const statusColor = getStatusColor(litter.status);

              return (
                <TouchableOpacity
                  key={litter.litter_id}
                  style={styles.litterCard}
                  onPress={() =>
                    router.push(`/(pet)/litter-detail?id=${litter.litter_id}`)
                  }
                  activeOpacity={0.92}
                >
                  <View style={styles.litterHeaderBox}>
                    <View style={styles.litterHeaderLeft}>
                      <View style={styles.parentPhotos}>
                        <Image
                          source={{ uri: getImageUrl(litter.parents.sire.photo) }}
                          style={[styles.parentPhoto, styles.sirePhoto]}
                        />
                        <View style={styles.heartBadge}>
                          <Feather name="heart" size={10} color="#FFFFFF" />
                        </View>
                        <Image
                          source={{ uri: getImageUrl(litter.parents.dam.photo) }}
                          style={[styles.parentPhoto, styles.damPhoto]}
                        />
                      </View>

                      <View style={styles.litterTopLeft}>
                        <Text style={styles.litterTitle} numberOfLines={1}>
                          {litter.title}
                        </Text>
                        <Text style={styles.litterDate}>
                          {formatLitterDate(litter.birth_date, litter.birth_date_full)}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColor.bg },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusColor.text }]}>
                        {String(litter.status || "Unknown")}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statChipsRow}>
                    <View style={styles.statChip}>
                      <Text style={styles.statChipValue}>{litter.offspring.total}</Text>
                      <Text style={styles.statChipLabel}>Total</Text>
                    </View>
                    <View style={[styles.statChip, styles.statChipMale]}>
                      <Text style={[styles.statChipValue, styles.statChipValueMale]}>
                        {litter.offspring.male}
                      </Text>
                      <Text style={styles.statChipLabel}>Male</Text>
                    </View>
                    <View style={[styles.statChip, styles.statChipFemale]}>
                      <Text style={[styles.statChipValue, styles.statChipValueFemale]}>
                        {litter.offspring.female}
                      </Text>
                      <Text style={styles.statChipLabel}>Female</Text>
                    </View>
                  </View>

                  <View style={styles.offspringPreviewRow}>
                    <View style={styles.offspringAvatars}>
                      {(Array.isArray(litter.offspring_details)
                        ? litter.offspring_details
                        : []
                      )
                        .slice(0, 5)
                        .map((offspring) => (
                          <View
                            key={offspring.offspring_id}
                            style={styles.offspringPreviewItem}
                          >
                            <View style={styles.offspringCircleWrap}>
                              {offspring.photo_url ? (
                                <Image
                                  source={{ uri: getImageUrl(offspring.photo_url) }}
                                  style={styles.offspringCircleImage}
                                />
                              ) : (
                                <View style={styles.offspringCircleFallback}>
                                  <Ionicons name="paw" size={16} color="#D18C53" />
                                </View>
                              )}
                            </View>

                            <View
                              style={[
                                styles.offspringSexBadge,
                                String(offspring.sex).toLowerCase() === "male"
                                  ? styles.offspringSexBadgeMale
                                  : styles.offspringSexBadgeFemale,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.offspringSexText,
                                  String(offspring.sex).toLowerCase() === "male"
                                    ? styles.offspringSexTextMale
                                    : styles.offspringSexTextFemale,
                                ]}
                              >
                                {String(offspring.sex).toLowerCase() === "male" ? "M" : "F"}
                              </Text>
                            </View>
                          </View>
                        ))}
                    </View>

                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsText}>Details</Text>
                      <Feather name="chevron-right" size={16} color="#F38C69" />
                    </View>
                  </View>

                  {litter.offspring.died > 0 ? (
                    <View style={styles.deceasedStrip}>
                      <Ionicons name="warning-outline" size={13} color="#C44A4A" />
                      <Text style={styles.deceasedText}>
                        {litter.offspring.died} marked deceased in this litter.
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })
          )}

          <View style={styles.bottomPad} />
        </View>
      </ScrollView>

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
    backgroundColor: "#F8F1EF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F1EF",
  },
  loadingText: {
    marginTop: 10,
    color: "#8D8897",
    fontSize: 13,
  },

  heroHeader: {
    height: 210,
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
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 32,
  },
  heroSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
  },
  heroCenterContent: {
    marginTop: 18,
    alignItems: "center",
  },
  heroBigValue: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "700",
    lineHeight: 46,
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
    paddingBottom: 28,
  },
  contentSheet: {
    marginTop: -18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#F8F1EF",
    paddingTop: 12,
    paddingHorizontal: 12,
  },

  summaryCard: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEE8E6",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    overflow: "hidden",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  summaryValue: {
    fontSize: 31,
    lineHeight: 34,
    color: "#342F3F",
    fontWeight: "700",
  },
  summaryLabel: {
    marginTop: 2,
    fontSize: 10,
    color: "#A4A0AF",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  summaryDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: "#EFE9E6",
  },

  emptyContainer: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEE8E6",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 34,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F4EEEC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#312C3B",
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#8A8594",
    textAlign: "center",
    lineHeight: 20,
  },

  litterCard: {
    borderWidth: 1,
    borderColor: "#F1DDD3",
    borderRadius: 16,
    marginBottom: 10,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  litterHeaderBox: {
    backgroundColor: "#FFF3EE",
    borderBottomWidth: 1,
    borderBottomColor: "#F1DDD3",
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  litterHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  parentPhotos: {
    width: 56,
    height: 40,
    marginRight: 9,
  },
  parentPhoto: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#EFE9E6",
  },
  sirePhoto: {
    position: "absolute",
    left: 0,
    top: 3,
    zIndex: 2,
  },
  damPhoto: {
    position: "absolute",
    left: 20,
    top: 3,
    zIndex: 1,
  },
  heartBadge: {
    position: "absolute",
    left: 14,
    top: -1,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF8F67",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 3,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  litterTopLeft: {
    flex: 1,
  },
  litterTitle: {
    fontSize: 18,
    color: "#2F2B3A",
    fontWeight: "700",
  },
  litterDate: {
    marginTop: 2,
    fontSize: 13,
    color: "#8E8998",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },

  statChipsRow: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingTop: 10,
    gap: 8,
  },
  statChip: {
    flex: 1,
    backgroundColor: "#F0F1F4",
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statChipMale: {
    backgroundColor: "#E7EEFC",
  },
  statChipFemale: {
    backgroundColor: "#F9E9F0",
  },
  statChipValue: {
    fontSize: 27,
    lineHeight: 29,
    color: "#2F2B3A",
    fontWeight: "700",
  },
  statChipValueMale: {
    color: "#386CC4",
  },
  statChipValueFemale: {
    color: "#B4387C",
  },
  statChipLabel: {
    marginTop: 1,
    fontSize: 11,
    color: "#8E8998",
    fontWeight: "500",
  },

  offspringPreviewRow: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F2EBE8",
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  offspringAvatars: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  offspringPreviewItem: {
    marginRight: 8,
    alignItems: "center",
  },
  offspringCircleWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFD6C2",
    backgroundColor: "#FFF4EE",
  },
  offspringCircleImage: {
    width: "100%",
    height: "100%",
  },
  offspringCircleFallback: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFDDBB",
  },
  offspringSexBadge: {
    marginTop: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    minWidth: 34,
    alignItems: "center",
  },
  offspringSexBadgeMale: {
    backgroundColor: "#DDEAFE",
  },
  offspringSexBadgeFemale: {
    backgroundColor: "#FCE2EE",
    borderWidth: 1,
    borderColor: "#EC6BA5",
  },
  offspringSexText: {
    fontSize: 10,
    fontWeight: "700",
  },
  offspringSexTextMale: {
    color: "#6EA0D1",
  },
  offspringSexTextFemale: {
    color: "#E55C97",
  },

  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  detailsText: {
    color: "#F38C69",
    fontWeight: "700",
    fontSize: 13,
    marginRight: 2,
  },

  deceasedStrip: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#FDECEC",
    borderWidth: 1,
    borderColor: "#F6D1D1",
    paddingHorizontal: 9,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
  },
  deceasedText: {
    marginLeft: 6,
    color: "#C44A4A",
    fontSize: 11,
    fontWeight: "600",
  },

  bottomPad: {
    height: 22,
  },
});
