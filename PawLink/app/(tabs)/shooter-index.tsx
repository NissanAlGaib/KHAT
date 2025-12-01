import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { AnimatedSearchBar } from "@/components/app/AnimatedSearchBar";
import SettingsDropdown from "@/components/app/SettingsDropdown";
import { API_BASE_URL } from "@/config/env";
import {
  getShooterOffers,
  getMyShooterOffers,
  ShooterOffer,
} from "@/services/shooterService";
import { Feather } from "@expo/vector-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

// Enable relative time formatting for dayjs (e.g., "2 hours ago", "3 days ago")
dayjs.extend(relativeTime);

// Constants for styling
const PET_NAME_MAX_WIDTH = 70;

// Completed breeding statuses that mark a breeding assignment as finished
const COMPLETED_STATUSES = ["completed", "offspring_added", "offspring_allocated", "breeding_completed"];

// Helper function to check if a status is a completed status
const isCompletedStatus = (status?: string): boolean => {
  return status ? COMPLETED_STATUSES.includes(status) : false;
};

type TabType = "current" | "available" | "finished";

export default function ShooterHomepage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableOffers, setAvailableOffers] = useState<ShooterOffer[]>([]);
  const [myOffers, setMyOffers] = useState<ShooterOffer[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("available");

  // Separate offers into current (active), pending, and finished (completed/offspring_allocated)
  const currentAssignments = myOffers.filter(
    (o) => o.shooter_status === "accepted_by_owners"
  );
  const pendingAssignments = myOffers.filter(
    (o) => o.shooter_status === "accepted_by_shooter"
  );
  // Include all completed statuses
  const finishedAssignments = myOffers.filter(
    (o) => isCompletedStatus(o.shooter_status)
  );

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const [available, my] = await Promise.all([
        getShooterOffers(),
        getMyShooterOffers(),
      ]);

      setAvailableOffers(available);
      setMyOffers(my);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOffers();
    setRefreshing(false);
  }, [fetchOffers]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleOfferPress = (offer: ShooterOffer) => {
    if (
      offer.shooter_status === "accepted_by_owners" &&
      offer.conversation_id
    ) {
      router.push(`/(chat)/conversation?id=${offer.conversation_id}`);
    } else {
      router.push(`/(shooter)/offer-details?id=${offer.id}`);
    }
  };

  const getImageUrl = (path?: string) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}/storage/${path}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = dayjs(dateString);
    // Return empty string if the date is invalid
    if (!date.isValid()) return "";
    return date.fromNow();
  };

  // Stats Banner Component
  const StatsBanner = () => (
    <View style={styles.statsBanner}>
      <View style={styles.statsHeader}>
        <View style={styles.statsIconContainer}>
          <Feather name="activity" size={24} color="#fff" />
        </View>
        <View style={styles.statsHeaderText}>
          <Text style={styles.statsTitle}>Shooter Dashboard</Text>
          <Text style={styles.statsSubtitle}>Your breeding activity overview</Text>
        </View>
      </View>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{currentAssignments.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{pendingAssignments.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{finishedAssignments.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{availableOffers.length}</Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
      </View>
    </View>
  );

  // Tab Switcher Component
  const TabSwitcher = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "current" && styles.activeTab]}
        onPress={() => setActiveTab("current")}
      >
        <Feather 
          name="play-circle" 
          size={16} 
          color={activeTab === "current" ? "#fff" : "#ea5b3a"} 
        />
        <Text style={[styles.tabText, activeTab === "current" && styles.activeTabText]}>
          Current ({currentAssignments.length + pendingAssignments.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "available" && styles.activeTab]}
        onPress={() => setActiveTab("available")}
      >
        <Feather 
          name="inbox" 
          size={16} 
          color={activeTab === "available" ? "#fff" : "#ea5b3a"} 
        />
        <Text style={[styles.tabText, activeTab === "available" && styles.activeTabText]}>
          Available ({availableOffers.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "finished" && styles.activeTab]}
        onPress={() => setActiveTab("finished")}
      >
        <Feather 
          name="check-circle" 
          size={16} 
          color={activeTab === "finished" ? "#fff" : "#ea5b3a"} 
        />
        <Text style={[styles.tabText, activeTab === "finished" && styles.activeTabText]}>
          Finished ({finishedAssignments.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Modern Offer Card Component
  const ModernOfferCard = ({
    offer,
    variant = "available",
  }: {
    offer: ShooterOffer;
    variant?: "available" | "current" | "pending" | "finished";
  }) => {
    const isConfirmed = offer.shooter_status === "accepted_by_owners";
    const isPending = offer.shooter_status === "accepted_by_shooter";
    // Use the helper function to check for completed statuses
    const isFinished = isCompletedStatus(offer.shooter_status);

    const getStatusConfig = () => {
      if (offer.shooter_status === "offspring_allocated") {
        return { color: "#10B981", bg: "#D1FAE5", text: "Offspring Allocated", icon: "check-circle" as const };
      }
      if (offer.shooter_status === "offspring_added") {
        return { color: "#10B981", bg: "#D1FAE5", text: "Offspring Added", icon: "check-circle" as const };
      }
      if (offer.shooter_status === "breeding_completed") {
        return { color: "#10B981", bg: "#D1FAE5", text: "Breeding Completed", icon: "check-circle" as const };
      }
      if (isFinished) return { color: "#10B981", bg: "#D1FAE5", text: "Completed", icon: "check-circle" as const };
      if (isConfirmed) return { color: "#10B981", bg: "#D1FAE5", text: "Active", icon: "play-circle" as const };
      if (isPending) return { color: "#F59E0B", bg: "#FEF3C7", text: "Awaiting Owners", icon: "clock" as const };
      return { color: "#6B7280", bg: "#F3F4F6", text: "New", icon: "star" as const };
    };

    const status = getStatusConfig();

    return (
      <TouchableOpacity
        style={styles.modernCard}
        onPress={() => handleOfferPress(offer)}
        activeOpacity={0.9}
      >
        {/* Card Header with Images */}
        <View style={styles.cardImageSection}>
          <View style={styles.petImagesContainer}>
            <View style={styles.petImageWrapper}>
              {offer.pet1.photo_url ? (
                <Image
                  source={{ uri: getImageUrl(offer.pet1.photo_url) || undefined }}
                  style={styles.petImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.petImage, styles.petImagePlaceholder]}>
                  <Feather name="image" size={20} color="#CBD5E1" />
                </View>
              )}
              <View style={styles.petNameBadge}>
                <Text style={styles.petNameText} numberOfLines={1}>{offer.pet1.name}</Text>
              </View>
            </View>
            <View style={styles.heartConnector}>
              <Feather name="heart" size={16} color="#ea5b3a" />
            </View>
            <View style={styles.petImageWrapper}>
              {offer.pet2.photo_url ? (
                <Image
                  source={{ uri: getImageUrl(offer.pet2.photo_url) || undefined }}
                  style={styles.petImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.petImage, styles.petImagePlaceholder]}>
                  <Feather name="image" size={20} color="#CBD5E1" />
                </View>
              )}
              <View style={styles.petNameBadge}>
                <Text style={styles.petNameText} numberOfLines={1}>{offer.pet2.name}</Text>
              </View>
            </View>
          </View>
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Feather name={status.icon} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
          </View>
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          {/* Breed Info */}
          <View style={styles.breedSection}>
            <Text style={styles.breedText} numberOfLines={1}>
              {offer.pet1.breed || offer.pet1.species}
            </Text>
            <Text style={styles.breedSeparator}>×</Text>
            <Text style={styles.breedText} numberOfLines={1}>
              {offer.pet2.breed || offer.pet2.species}
            </Text>
          </View>

          {/* Payment Highlight */}
          <View style={styles.paymentContainer}>
            <Text style={styles.paymentAmount}>₱{offer.payment?.toLocaleString() || 0}</Text>
          </View>

          {/* Info Grid */}
          <View style={styles.infoGrid}>
            {/* Owners */}
            <View style={styles.infoItem}>
              <View style={styles.ownersAvatars}>
                <View style={styles.ownerAvatar}>
                  {offer.owner1.profile_image ? (
                    <Image
                      source={{ uri: getImageUrl(offer.owner1.profile_image) || undefined }}
                      style={styles.ownerAvatarImage}
                    />
                  ) : (
                    <Feather name="user" size={12} color="#9CA3AF" />
                  )}
                </View>
                <View style={[styles.ownerAvatar, styles.ownerAvatarSecond]}>
                  {offer.owner2.profile_image ? (
                    <Image
                      source={{ uri: getImageUrl(offer.owner2.profile_image) || undefined }}
                      style={styles.ownerAvatarImage}
                    />
                  ) : (
                    <Feather name="user" size={12} color="#9CA3AF" />
                  )}
                </View>
              </View>
              <Text style={styles.infoText} numberOfLines={1}>
                {(offer.owner1.name || "Owner 1").split(" ")[0]} & {(offer.owner2.name || "Owner 2").split(" ")[0]}
              </Text>
            </View>

            {/* Location */}
            {offer.location && (
              <View style={styles.infoItem}>
                <Feather name="map-pin" size={14} color="#6B7280" />
                <Text style={styles.infoText} numberOfLines={1}>{offer.location}</Text>
              </View>
            )}

            {/* Date */}
            {offer.created_at && (
              <View style={styles.infoItem}>
                <Feather name="clock" size={14} color="#6B7280" />
                <Text style={styles.infoText}>{formatDate(offer.created_at)}</Text>
              </View>
            )}
          </View>

          {/* Action indicator for confirmed */}
          {isConfirmed && (
            <View style={styles.chatIndicator}>
              <Feather name="message-circle" size={14} color="#fff" />
              <Text style={styles.chatIndicatorText}>Tap to open chat</Text>
            </View>
          )}

          {/* Pending status details */}
          {isPending && (
            <View 
              style={styles.pendingDetails}
              accessible={true}
              accessibilityLabel={`Owner 1 ${offer.owner1_accepted ? "accepted" : "pending"}, Owner 2 ${offer.owner2_accepted ? "accepted" : "pending"}`}
            >
              <Text style={styles.pendingText}>
                {offer.owner1_accepted ? "✓" : "○"} Owner 1 • {offer.owner2_accepted ? "✓" : "○"} Owner 2
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Empty State Component
  const EmptyState = ({ type }: { type: TabType }) => {
    const configs = {
      current: {
        icon: "play-circle" as const,
        title: "No Active Assignments",
        subtitle: "Accept offers to start breeding assignments",
      },
      available: {
        icon: "inbox" as const,
        title: "No Available Offers",
        subtitle: "New breeding offers will appear here",
      },
      finished: {
        icon: "check-circle" as const,
        title: "No Completed Assignments",
        subtitle: "Your completed breeding sessions will show here",
      },
    };

    const config = configs[type];

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconContainer}>
          <Feather name={config.icon} size={48} color="#CBD5E1" />
        </View>
        <Text style={styles.emptyTitle}>{config.title}</Text>
        <Text style={styles.emptySubtitle}>{config.subtitle}</Text>
      </View>
    );
  };

  // Section Header Component
  const SectionHeader = ({ title, count }: { title: string; count: number }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.countBadge}>
        <Text style={styles.countText}>{count}</Text>
      </View>
    </View>
  );

  // Render content based on active tab
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ea5b3a" />
          <Text style={styles.loadingText}>Loading offers...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case "current":
        const allCurrentOffers = [...currentAssignments, ...pendingAssignments];
        if (allCurrentOffers.length === 0) {
          return <EmptyState type="current" />;
        }
        return (
          <View style={styles.contentContainer}>
            {currentAssignments.length > 0 && (
              <>
                <SectionHeader title="Active Assignments" count={currentAssignments.length} />
                <Text style={styles.sectionSubtitle}>Tap to open chat with pet owners</Text>
                {currentAssignments.map((offer) => (
                  <ModernOfferCard key={offer.id} offer={offer} variant="current" />
                ))}
              </>
            )}
            {pendingAssignments.length > 0 && (
              <>
                <SectionHeader title="Pending Confirmation" count={pendingAssignments.length} />
                <Text style={styles.sectionSubtitle}>Waiting for owners to confirm</Text>
                {pendingAssignments.map((offer) => (
                  <ModernOfferCard key={offer.id} offer={offer} variant="pending" />
                ))}
              </>
            )}
          </View>
        );

      case "available":
        if (availableOffers.length === 0) {
          return <EmptyState type="available" />;
        }
        return (
          <View style={styles.contentContainer}>
            <SectionHeader title="Available Offers" count={availableOffers.length} />
            <Text style={styles.sectionSubtitle}>Tap to view details and accept</Text>
            {availableOffers.map((offer) => (
              <ModernOfferCard key={offer.id} offer={offer} variant="available" />
            ))}
          </View>
        );

      case "finished":
        if (finishedAssignments.length === 0) {
          return <EmptyState type="finished" />;
        }
        return (
          <View style={styles.contentContainer}>
            <SectionHeader title="Completed Assignments" count={finishedAssignments.length} />
            <Text style={styles.sectionSubtitle}>Your breeding history</Text>
            {finishedAssignments.map((offer) => (
              <ModernOfferCard key={offer.id} offer={offer} variant="finished" />
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>PAWLINK</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.headerIconButton}>
              <Image source={require("../../assets/images/Subscription_Icon.png")} style={styles.headerIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconButton}>
              <Image source={require("../../assets/images/Notif_Icon.png")} style={styles.headerIcon} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerBottomRow}>
          <AnimatedSearchBar />
          <View style={styles.settingsContainer}>
            <SettingsDropdown />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#ea5b3a"]} />
        }
      >
        <StatsBanner />
        <TabSwitcher />
        {renderContent()}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F3",
  },
  header: {
    backgroundColor: "white",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    color: "#ea5b3a",
    fontSize: 28,
    fontWeight: "bold",
    opacity: 0.8,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 16,
  },
  headerIconButton: {
    padding: 4,
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
  headerBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingsContainer: {
    zIndex: 50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // Stats Banner
  statsBanner: {
    backgroundColor: "#ea5b3a",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#ea5b3a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  statsHeaderText: {
    flex: 1,
  },
  statsTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  statsSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
  },

  // Tab Switcher
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#ea5b3a",
  },
  tabText: {
    color: "#ea5b3a",
    fontSize: 12,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#fff",
  },

  // Content Container
  contentContainer: {
    paddingBottom: 20,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },
  countBadge: {
    backgroundColor: "#ea5b3a",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  countText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  sectionSubtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginBottom: 16,
  },

  // Modern Card
  modernCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  cardImageSection: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  petImagesContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  petImageWrapper: {
    alignItems: "center",
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#fff",
    backgroundColor: "#F9FAFB",
  },
  petImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  petNameBadge: {
    backgroundColor: "#1F2937",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: -10,
  },
  petNameText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    maxWidth: PET_NAME_MAX_WIDTH,
  },
  heartConnector: {
    marginHorizontal: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardContent: {
    padding: 16,
  },
  breedSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  breedText: {
    fontSize: 13,
    color: "#6B7280",
    maxWidth: 120,
  },
  breedSeparator: {
    marginHorizontal: 8,
    color: "#D1D5DB",
    fontSize: 13,
  },
  paymentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  paymentAmount: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ea5b3a",
    marginLeft: 4,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: "#6B7280",
    maxWidth: 100,
  },
  ownersAvatars: {
    flexDirection: "row",
  },
  ownerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  ownerAvatarSecond: {
    marginLeft: -8,
  },
  ownerAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  chatIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  chatIndicatorText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  pendingDetails: {
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  pendingText: {
    fontSize: 12,
    color: "#F59E0B",
    fontWeight: "500",
  },

  // Loading
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    color: "#6B7280",
    marginTop: 12,
    fontSize: 14,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    paddingHorizontal: 40,
  },

  bottomSpacing: {
    height: 100,
  },
});
