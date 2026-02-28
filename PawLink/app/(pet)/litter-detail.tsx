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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  getLitterDetail,
  type LitterDetail,
  type LitterOffspring,
  type LitterMilestone,
  type ParentHealthVaccination,
  type LitterDetailParent,
} from "@/services/petService";
import { getStorageUrl } from "@/utils/imageUrl";
import { Colors } from "@/constants";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TABS = ["Overview", "Offspring", "Health"] as const;
type TabKey = (typeof TABS)[number];

export default function LitterDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const litterId = params.id as string;

  const [litter, setLitter] = useState<LitterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("Overview");

  const fetchLitterDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getLitterDetail(parseInt(litterId));
      setLitter(data);
    } catch (error) {
      console.error("Error fetching litter detail:", error);
    } finally {
      setLoading(false);
    }
  }, [litterId]);

  useEffect(() => {
    if (litterId) {
      fetchLitterDetail();
    }
  }, [litterId, fetchLitterDetail]);

  const getImageUrl = (path: string | null | undefined) => {
    return getStorageUrl(path);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return { bg: Colors.successLight, text: Colors.success };
      case "completed":
        return { bg: Colors.infoLight, text: Colors.info };
      default:
        return { bg: Colors.bgTertiary, text: Colors.textSecondary };
    }
  };

  const getAllocationColor = (status: string) => {
    switch (status) {
      case "assigned":
        return { bg: "#DBEAFE", text: "#2563EB", label: "Assigned" };
      case "transferred":
        return {
          bg: Colors.successLight,
          text: Colors.success,
          label: "Transferred",
        };
      default:
        return {
          bg: Colors.bgTertiary,
          text: Colors.textMuted,
          label: "Unassigned",
        };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading litter details...</Text>
      </View>
    );
  }

  if (!litter) {
    return (
      <View style={styles.loadingContainer}>
        <Feather name="alert-circle" size={40} color={Colors.textDisabled} />
        <Text style={[styles.loadingText, { marginTop: 12 }]}>
          Litter not found
        </Text>
      </View>
    );
  }

  const statusColor = getStatusColor(litter.status);

  // ===================== RENDER HELPERS =====================

  const renderParentCard = (
    parent: LitterDetailParent,
    role: "Sire" | "Dam",
  ) => {
    const isSire = role === "Sire";
    return (
      <TouchableOpacity
        style={[
          styles.parentCard,
          { backgroundColor: isSire ? "#EFF6FF" : "#FDF2F8" },
        ]}
        onPress={() => router.push(`/(pet)/view-profile?id=${parent.pet_id}`)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: getImageUrl(parent.photo) || undefined }}
          style={styles.parentCardPhoto}
        />
        <Text style={styles.parentCardName} numberOfLines={1}>
          {parent.name}
        </Text>
        <Text style={styles.parentCardBreed} numberOfLines={1}>
          {parent.breed}
        </Text>
        <View
          style={[
            styles.parentRoleBadge,
            { backgroundColor: isSire ? "#2563EB" : "#DB2777" },
          ]}
        >
          <Text style={styles.parentRoleText}>
            {role} {isSire ? "♂" : "♀"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderMilestoneTimeline = () => {
    const milestones = litter.milestones || [];
    if (milestones.length === 0) return null;

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Growth Timeline</Text>
        <View style={styles.timelineContainer}>
          {milestones.map((milestone, index) => {
            const isLast = index === milestones.length - 1;
            return (
              <View key={milestone.key} style={styles.timelineItem}>
                {/* Vertical Line */}
                {!isLast && (
                  <View
                    style={[
                      styles.timelineLine,
                      {
                        backgroundColor: milestone.completed
                          ? Colors.success
                          : Colors.borderLight,
                      },
                    ]}
                  />
                )}
                {/* Dot */}
                <View
                  style={[
                    styles.timelineDot,
                    milestone.completed
                      ? styles.timelineDotCompleted
                      : styles.timelineDotPending,
                  ]}
                >
                  {milestone.completed && (
                    <Feather name="check" size={10} color="#fff" />
                  )}
                </View>
                {/* Content */}
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineLabel,
                      !milestone.completed && { color: Colors.textDisabled },
                    ]}
                  >
                    {milestone.label}
                  </Text>
                  {milestone.date && (
                    <Text style={styles.timelineDate}>{milestone.date}</Text>
                  )}
                  <Text style={styles.timelineDescription}>
                    {milestone.description}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderStatChips = () => (
    <View style={styles.statsGrid}>
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: Colors.bgTertiary }]}>
          <Text style={styles.statBoxValue}>
            {litter.statistics.total_offspring}
          </Text>
          <Text style={styles.statBoxLabel}>Total</Text>
        </View>
        <View
          style={[styles.statBox, { backgroundColor: Colors.successLight }]}
        >
          <Text style={[styles.statBoxValue, { color: Colors.success }]}>
            {litter.statistics.alive_offspring}
          </Text>
          <Text style={styles.statBoxLabel}>Alive</Text>
        </View>
        {litter.statistics.died_offspring > 0 && (
          <View
            style={[styles.statBox, { backgroundColor: Colors.errorLight }]}
          >
            <Text style={[styles.statBoxValue, { color: Colors.error }]}>
              {litter.statistics.died_offspring}
            </Text>
            <Text style={styles.statBoxLabel}>Died</Text>
          </View>
        )}
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: "#EFF6FF" }]}>
          <Text style={[styles.statBoxValue, { color: "#2563EB" }]}>
            {litter.statistics.male_count}
          </Text>
          <Text style={styles.statBoxLabel}>Male</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: "#FDF2F8" }]}>
          <Text style={[styles.statBoxValue, { color: "#DB2777" }]}>
            {litter.statistics.female_count}
          </Text>
          <Text style={styles.statBoxLabel}>Female</Text>
        </View>
        {(litter.statistics.assigned_count ?? 0) > 0 && (
          <View style={[styles.statBox, { backgroundColor: "#DBEAFE" }]}>
            <Text style={[styles.statBoxValue, { color: "#2563EB" }]}>
              {litter.statistics.assigned_count}
            </Text>
            <Text style={styles.statBoxLabel}>Assigned</Text>
          </View>
        )}
      </View>
    </View>
  );

  // ===================== TAB: OVERVIEW =====================

  const renderOverviewTab = () => (
    <View>
      {/* Parents Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Parents</Text>
        <View style={styles.parentsRow}>
          {renderParentCard(litter.parents.sire, "Sire")}
          {renderParentCard(litter.parents.dam, "Dam")}
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Statistics</Text>
        {renderStatChips()}
      </View>

      {/* Milestone Timeline */}
      {renderMilestoneTimeline()}

      {/* Notes */}
      {litter.notes && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <Text style={styles.notesText}>{litter.notes}</Text>
        </View>
      )}

      {/* Contract Info */}
      {litter.has_contract && (
        <View style={styles.card}>
          <View style={styles.contractBanner}>
            <Feather name="file-text" size={18} color="#2563EB" />
            <Text style={styles.contractText}>
              This litter is part of a breeding contract
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  // ===================== TAB: OFFSPRING =====================

  const renderOffspringCard = (offspring: LitterOffspring) => {
    const allocationInfo = getAllocationColor(
      offspring.allocation_status || "unassigned",
    );
    const isDead = offspring.status === "died";

    return (
      <View
        key={offspring.offspring_id}
        style={[styles.offspringCard, isDead && styles.offspringCardDead]}
      >
        {/* Photo */}
        <View style={styles.offspringPhotoContainer}>
          {offspring.photo_url ? (
            <Image
              source={{ uri: getImageUrl(offspring.photo_url) || undefined }}
              style={styles.offspringPhoto}
            />
          ) : (
            <View style={styles.offspringPhotoPlaceholder}>
              <Feather name="image" size={24} color={Colors.textDisabled} />
            </View>
          )}
          {/* Sex badge */}
          <View
            style={[
              styles.sexBadge,
              {
                backgroundColor:
                  offspring.sex === "male" ? "#2563EB" : "#DB2777",
              },
            ]}
          >
            <Text style={styles.sexBadgeText}>
              {offspring.sex === "male" ? "♂" : "♀"}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.offspringInfo}>
          <Text style={styles.offspringName}>
            {offspring.name || "Unnamed"}
          </Text>

          <View style={styles.offspringMeta}>
            {offspring.color && (
              <View style={styles.metaChip}>
                <Feather name="droplet" size={10} color={Colors.textMuted} />
                <Text style={styles.metaChipText}>{offspring.color}</Text>
              </View>
            )}
            <View
              style={[
                styles.metaChip,
                {
                  backgroundColor: isDead
                    ? Colors.errorLight
                    : Colors.successLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.metaChipText,
                  { color: isDead ? Colors.error : Colors.success },
                ]}
              >
                {offspring.status}
              </Text>
            </View>
          </View>

          {/* Allocation Status */}
          <View style={styles.offspringAllocation}>
            <View
              style={[
                styles.allocationBadge,
                { backgroundColor: allocationInfo.bg },
              ]}
            >
              <Text
                style={[
                  styles.allocationBadgeText,
                  { color: allocationInfo.text },
                ]}
              >
                {allocationInfo.label}
              </Text>
            </View>
            {offspring.assigned_to && (
              <View style={styles.assignedToRow}>
                <Image
                  source={{
                    uri:
                      getImageUrl(offspring.assigned_to.profile_image) ||
                      undefined,
                  }}
                  style={styles.assignedToAvatar}
                />
                <Text style={styles.assignedToName} numberOfLines={1}>
                  {offspring.assigned_to.name}
                </Text>
              </View>
            )}
          </View>

          {/* Death info */}
          {isDead && offspring.death_date && (
            <Text style={styles.deathDate}>Passed: {offspring.death_date}</Text>
          )}

          {/* Notes */}
          {offspring.notes && (
            <Text style={styles.offspringNotes} numberOfLines={2}>
              {offspring.notes}
            </Text>
          )}

          {/* Registered badge */}
          {offspring.is_registered && (
            <View style={styles.registeredBadge}>
              <Feather name="check-circle" size={12} color={Colors.success} />
              <Text style={styles.registeredText}>Registered as pet</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderOffspringTab = () => {
    const males = litter.offspring.filter((o) => o.sex === "male");
    const females = litter.offspring.filter((o) => o.sex === "female");

    return (
      <View>
        {litter.offspring.length === 0 ? (
          <View style={styles.emptyTabContainer}>
            <Feather name="users" size={40} color={Colors.textDisabled} />
            <Text style={styles.emptyTabText}>No offspring recorded</Text>
          </View>
        ) : (
          <>
            {males.length > 0 && (
              <View style={styles.card}>
                <View style={styles.offspringSectionHeader}>
                  <Text style={styles.cardTitle}>Males</Text>
                  <View
                    style={[styles.countBadge, { backgroundColor: "#EFF6FF" }]}
                  >
                    <Text style={[styles.countBadgeText, { color: "#2563EB" }]}>
                      {males.length}
                    </Text>
                  </View>
                </View>
                {males.map(renderOffspringCard)}
              </View>
            )}

            {females.length > 0 && (
              <View style={styles.card}>
                <View style={styles.offspringSectionHeader}>
                  <Text style={styles.cardTitle}>Females</Text>
                  <View
                    style={[styles.countBadge, { backgroundColor: "#FDF2F8" }]}
                  >
                    <Text style={[styles.countBadgeText, { color: "#DB2777" }]}>
                      {females.length}
                    </Text>
                  </View>
                </View>
                {females.map(renderOffspringCard)}
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  // ===================== TAB: HEALTH =====================

  const renderHealthBar = (completed: number, total: number) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return (
      <View style={styles.healthBar}>
        <View
          style={[
            styles.healthBarFill,
            {
              width: `${percentage}%`,
              backgroundColor:
                percentage >= 100
                  ? Colors.success
                  : percentage >= 50
                    ? Colors.warning
                    : Colors.error,
            },
          ]}
        />
      </View>
    );
  };

  const renderParentHealth = (
    parent: LitterDetailParent,
    role: "Sire" | "Dam",
  ) => {
    const health = parent.health;
    if (!health) {
      return (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {role} ({parent.name}) - Health
          </Text>
          <Text style={styles.noDataText}>No health data available</Text>
        </View>
      );
    }

    const isSire = role === "Sire";

    return (
      <View style={styles.card}>
        <View style={styles.healthParentHeader}>
          <Image
            source={{ uri: getImageUrl(parent.photo) || undefined }}
            style={styles.healthParentAvatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>
              {parent.name}
              <Text style={styles.healthRoleLabel}>
                {" "}
                ({role} {isSire ? "♂" : "♀"})
              </Text>
            </Text>
            <Text style={styles.healthBreed}>{parent.breed}</Text>
          </View>
          {/* Health Score */}
          <View
            style={[
              styles.healthScoreCircle,
              {
                borderColor:
                  health.health_score >= 80
                    ? Colors.success
                    : health.health_score >= 50
                      ? Colors.warning
                      : Colors.error,
              },
            ]}
          >
            <Text
              style={[
                styles.healthScoreValue,
                {
                  color:
                    health.health_score >= 80
                      ? Colors.success
                      : health.health_score >= 50
                        ? Colors.warning
                        : Colors.error,
                },
              ]}
            >
              {health.health_score}%
            </Text>
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.healthSummaryRow}>
          <View style={styles.healthSummaryItem}>
            <Text style={styles.healthSummaryValue}>
              {health.completed_vaccines}/{health.total_vaccines}
            </Text>
            <Text style={styles.healthSummaryLabel}>Vaccines Done</Text>
          </View>
          <View style={styles.healthSummaryItem}>
            <Text style={styles.healthSummaryValue}>
              {health.completed_required}/{health.required_vaccines}
            </Text>
            <Text style={styles.healthSummaryLabel}>Required Done</Text>
          </View>
        </View>

        {/* Vaccination List */}
        {health.vaccinations.length > 0 && (
          <View style={styles.vaccinationList}>
            {health.vaccinations.map(
              (vax: ParentHealthVaccination, index: number) => (
                <View key={index} style={styles.vaccinationItem}>
                  <View style={styles.vaccinationHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.vaccinationNameRow}>
                        <Text style={styles.vaccinationName}>
                          {vax.vaccine_name}
                        </Text>
                        {vax.is_required && (
                          <View style={styles.requiredBadge}>
                            <Text style={styles.requiredBadgeText}>
                              Required
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.vaccinationProgress}>
                        {vax.completed_shots}/{vax.total_shots} shots
                      </Text>
                    </View>
                    <Feather
                      name={vax.is_complete ? "check-circle" : "clock"}
                      size={18}
                      color={
                        vax.is_complete ? Colors.success : Colors.textDisabled
                      }
                    />
                  </View>
                  {renderHealthBar(vax.completed_shots, vax.total_shots)}
                </View>
              ),
            )}
          </View>
        )}
      </View>
    );
  };

  const renderHealthTab = () => (
    <View>
      <View style={styles.healthInfoBanner}>
        <Feather name="info" size={16} color="#2563EB" />
        <Text style={styles.healthInfoText}>
          Health lineage shows the vaccination status of both parents at the
          time of this litter.
        </Text>
      </View>

      {renderParentHealth(litter.parents.sire, "Sire")}
      {renderParentHealth(litter.parents.dam, "Dam")}
    </View>
  );

  // ===================== MAIN RENDER =====================

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#FF6B4A", "#FF9A8B"]}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <Feather name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {litter.title}
              </Text>
              <Text style={styles.headerSubtitle}>
                {litter.birth_date} · {litter.age_in_months} months old
              </Text>
            </View>
            <View
              style={[
                styles.headerStatusBadge,
                { backgroundColor: "rgba(255,255,255,0.25)" },
              ]}
            >
              <Text style={styles.headerStatusText}>{litter.status}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "Overview" && renderOverviewTab()}
        {activeTab === "Offspring" && renderOffspringTab()}
        {activeTab === "Health" && renderHealthTab()}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

// ===================== STYLES =====================

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

  // Header
  headerGradient: {
    paddingBottom: 16,
  },
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
    paddingHorizontal: 8,
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
  headerStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  headerStatusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    textTransform: "capitalize",
  },

  // Tab Bar
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.primary,
  },

  // Common
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 14,
  },

  // Parents
  parentsRow: {
    flexDirection: "row",
    gap: 12,
  },
  parentCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
  },
  parentCardPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
    borderWidth: 3,
    borderColor: "#fff",
  },
  parentCardName: {
    fontSize: 15,
    fontWeight: "bold",
    color: Colors.textPrimary,
    textAlign: "center",
  },
  parentCardBreed: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: "center",
  },
  parentRoleBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  parentRoleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },

  // Stats Grid
  statsGrid: {
    gap: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  statBoxValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  statBoxLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // Milestone Timeline
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 64,
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    left: 9,
    top: 22,
    width: 2,
    bottom: 0,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  timelineDotCompleted: {
    backgroundColor: Colors.success,
  },
  timelineDotPending: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: Colors.borderMedium,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  timelineDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },

  // Notes
  notesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  // Contract
  contractBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  contractText: {
    flex: 1,
    fontSize: 13,
    color: "#2563EB",
    fontWeight: "500",
  },

  // Offspring Card
  offspringSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  countBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  offspringCard: {
    flexDirection: "row",
    backgroundColor: Colors.bgSecondary,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  offspringCardDead: {
    opacity: 0.6,
  },
  offspringPhotoContainer: {
    position: "relative",
    marginRight: 12,
  },
  offspringPhoto: {
    width: 70,
    height: 70,
    borderRadius: 14,
  },
  offspringPhotoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: Colors.bgMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  sexBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  sexBadgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  offspringInfo: {
    flex: 1,
  },
  offspringName: {
    fontSize: 15,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  offspringMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 6,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgTertiary,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
  },
  metaChipText: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: "capitalize",
  },
  offspringAllocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  allocationBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  allocationBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  assignedToRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  assignedToAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  assignedToName: {
    fontSize: 11,
    color: Colors.textMuted,
    maxWidth: 80,
  },
  deathDate: {
    fontSize: 11,
    color: Colors.error,
    marginTop: 2,
  },
  offspringNotes: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    fontStyle: "italic",
    lineHeight: 16,
  },
  registeredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  registeredText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: "500",
  },
  emptyTabContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTabText: {
    fontSize: 15,
    color: Colors.textMuted,
    marginTop: 12,
  },

  // Health Tab
  healthInfoBanner: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 14,
    alignItems: "flex-start",
  },
  healthInfoText: {
    flex: 1,
    fontSize: 13,
    color: "#2563EB",
    lineHeight: 18,
  },
  healthParentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  healthParentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  healthRoleLabel: {
    fontSize: 13,
    fontWeight: "400",
    color: Colors.textMuted,
  },
  healthBreed: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  healthScoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  healthScoreValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  healthSummaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  healthSummaryItem: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  healthSummaryValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.textPrimary,
  },
  healthSummaryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  vaccinationList: {
    gap: 10,
  },
  vaccinationItem: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 12,
    padding: 12,
  },
  vaccinationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  vaccinationNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vaccinationName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  requiredBadge: {
    backgroundColor: Colors.primaryLight,
    paddingVertical: 1,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  requiredBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: Colors.primaryDark,
  },
  vaccinationProgress: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  healthBar: {
    height: 6,
    backgroundColor: Colors.bgMuted,
    borderRadius: 3,
    overflow: "hidden",
  },
  healthBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  noDataText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontStyle: "italic",
  },
});
