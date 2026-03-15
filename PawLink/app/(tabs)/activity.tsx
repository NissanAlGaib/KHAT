import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  getActivityNotifications,
  getActivityUnreadCount,
  markActivityAsRead,
  markAllActivityAsRead,
  getNotificationIcon,
  getNotificationColor,
  getNotificationTypeLabel,
  type ActivityNotification,
  type ActivityNotificationType,
} from "@/services/activityService";
import {
  getNotifications,
  type NotificationItem,
  type NotificationSummary,
} from "@/services/notificationService";
import { useNotifications } from "@/context/NotificationContext";

// ─── Utilities ──────────────────────────────────────────────────
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ─── Filter Chip ────────────────────────────────────────────────
const FilterChip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Notification Card (Activity) ───────────────────────────────
const ActivityCard = ({
  notification,
  onPress,
}: {
  notification: ActivityNotification;
  onPress: (notification: ActivityNotification) => void;
}) => {
  const icon = getNotificationIcon(notification.type);
  const color = getNotificationColor(notification.type);
  const typeLabel = getNotificationTypeLabel(notification.type);
  const isUnread = !notification.read_at;

  return (
    <TouchableOpacity
      style={[styles.card, isUnread && styles.cardUnread]}
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
    >
      {isUnread && <View style={styles.unreadDot} />}
      <View style={[styles.iconCircle, { backgroundColor: color + "18" }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.typeLabel}>{typeLabel}</Text>
          <Text style={styles.timeText}>
            {formatTimeAgo(notification.created_at)}
          </Text>
        </View>
        <Text
          style={[styles.titleText, isUnread && styles.titleTextUnread]}
          numberOfLines={1}
        >
          {notification.title}
        </Text>
        <Text style={styles.messageText} numberOfLines={2}>
          {notification.message}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ─── Verification Card ──────────────────────────────────────────
const VerificationCard = ({
  notification,
  onResubmit,
}: {
  notification: NotificationItem;
  onResubmit: (notification: NotificationItem) => void;
}) => {
  const needsResubmitAction =
    notification.status === "rejected" ||
    (notification.status === "warning" &&
      notification.type === "user_verification");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#15803d";
      case "rejected":
        return "#b91c1c";
      case "warning":
        return "#c2410c";
      default:
        return "#a16207";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "approved":
        return "#dcfce7";
      case "rejected":
        return "#fee2e2";
      case "warning":
        return "#fff7ed";
      default:
        return "#fef9c3";
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case "approved":
        return "check-circle";
      case "rejected":
        return "x-circle";
      case "warning":
        return "alert-triangle";
      default:
        return "clock";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "warning":
        return "Warning";
      default:
        return "Pending";
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case "user_verification":
        return "user-check";
      case "pet_vaccination":
        return "activity";
      case "pet_health_record":
        return "file-text";
      case "admin_warning":
        return "alert-triangle";
      default:
        return "bell";
    }
  };

  const statusColor = getStatusColor(notification.status);
  const statusBg = getStatusBg(notification.status);

  return (
    <View
      style={[
        styles.card,
        { borderLeftWidth: 3, borderLeftColor: statusColor },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: statusBg }]}>
        <Feather
          name={getTypeIcon(notification.type) as any}
          size={20}
          color={statusColor}
        />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Feather
              name={getStatusIcon(notification.status) as any}
              size={10}
              color={statusColor}
            />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {getStatusLabel(notification.status)}
            </Text>
          </View>
          <Text style={styles.timeText}>
            {formatTimeAgo(notification.updated_at)}
          </Text>
        </View>
        <Text style={styles.titleText} numberOfLines={2}>
          {notification.message}
        </Text>

        {/* Rejection reason */}
        {notification.status === "rejected" &&
          notification.rejection_reason && (
            <View
              style={[
                styles.reasonBox,
                { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
              ]}
            >
              <Text style={[styles.reasonLabel, { color: "#991b1b" }]}>
                Reason for rejection:
              </Text>
              <Text style={[styles.reasonText, { color: "#b91c1c" }]}>
                {notification.rejection_reason}
              </Text>
            </View>
          )}

        {/* Admin warning notes */}
        {notification.type === "admin_warning" && notification.admin_notes && (
          <View
            style={[
              styles.reasonBox,
              { backgroundColor: "#fff7ed", borderColor: "#fed7aa" },
            ]}
          >
            <Text style={[styles.reasonLabel, { color: "#9a3412" }]}>
              Details from admin:
            </Text>
            <Text style={[styles.reasonText, { color: "#c2410c" }]}>
              {notification.admin_notes}
            </Text>
          </View>
        )}

        {/* Resubmit button for rejected or expired user verification items */}
        {needsResubmitAction && notification.type !== "admin_warning" && (
            <TouchableOpacity
              style={styles.resubmitButton}
              onPress={() => onResubmit(notification)}
              activeOpacity={0.8}
            >
              <Feather name="upload" size={12} color="#FFF" />
              <Text style={styles.resubmitText}>Resubmit Document</Text>
            </TouchableOpacity>
          )}
      </View>
    </View>
  );
};

// ─── Main Screen ────────────────────────────────────────────────
type FilterType = "all" | "verification" | ActivityNotificationType;

const FILTERS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "verification", label: "Verification" },
  { key: "match_request", label: "Matches" },
  { key: "new_message", label: "Messages" },
  { key: "shooter_request", label: "Shooter" },
  { key: "subscription", label: "Subscription" },
  { key: "system", label: "System" },
];

export default function NotificationsTab() {
  const router = useRouter();
  const { refreshBadgeCount } = useNotifications();

  // Activity notifications state
  const [notifications, setNotifications] = useState<ActivityNotification[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);

  // Verification notifications state
  const [verificationItems, setVerificationItems] = useState<
    NotificationItem[]
  >([]);
  const [verificationSummary, setVerificationSummary] =
    useState<NotificationSummary | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const fetchNotifications = useCallback(
    async (pageNum: number = 1, filter: FilterType = activeFilter) => {
      if (filter === "verification") return; // Handled separately
      try {
        if (pageNum === 1) setLoading(true);
        const typeFilter =
          filter === "all" ? undefined : (filter as ActivityNotificationType);

        const response = await getActivityNotifications(
          pageNum,
          20,
          typeFilter,
        );

        if (pageNum === 1) {
          setNotifications(response.data);
        } else {
          setNotifications((prev) => [...prev, ...response.data]);
        }
        setPage(response.meta.current_page);
        setLastPage(response.meta.last_page);
      } catch (error) {
        console.error("Error fetching activity notifications:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeFilter],
  );

  const fetchVerificationNotifications = useCallback(async () => {
    try {
      setVerificationLoading(true);
      const data = await getNotifications();
      setVerificationItems(data.notifications);
      setVerificationSummary(data.summary);
    } catch (error) {
      console.error("Error fetching verification notifications:", error);
    } finally {
      setVerificationLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    const count = await getActivityUnreadCount();
    setUnreadCount(count);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (activeFilter === "verification") {
        fetchVerificationNotifications();
      } else {
        fetchNotifications(1, activeFilter);
      }
      fetchUnreadCount();
      // Also preload verification summary for "All" tab banner
      fetchVerificationNotifications();
    }, [
      fetchNotifications,
      fetchUnreadCount,
      fetchVerificationNotifications,
      activeFilter,
    ]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeFilter === "verification") {
      fetchVerificationNotifications().finally(() => setRefreshing(false));
    } else {
      fetchNotifications(1, activeFilter);
    }
    fetchUnreadCount();
    fetchVerificationNotifications();
  }, [
    fetchNotifications,
    fetchUnreadCount,
    fetchVerificationNotifications,
    activeFilter,
  ]);

  const handleLoadMore = () => {
    if (activeFilter !== "verification" && page < lastPage && !loadingMore) {
      setLoadingMore(true);
      fetchNotifications(page + 1, activeFilter);
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    if (filter === "verification") {
      fetchVerificationNotifications();
    } else {
      fetchNotifications(1, filter);
    }
  };

  const handleMarkAllRead = async () => {
    const success = await markAllActivityAsRead();
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read_at: n.read_at || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
      refreshBadgeCount();
    }
  };

  const handleNotificationPress = async (
    notification: ActivityNotification,
  ) => {
    // Mark as read
    if (!notification.read_at) {
      const success = await markActivityAsRead(notification.id);
      if (success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, read_at: new Date().toISOString() }
              : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        refreshBadgeCount();
      }
    }

    // Navigate based on type
    const data = notification.data || {};
    switch (notification.type) {
      case "match_request":
      case "match_accepted":
      case "match_declined":
        router.push("/(tabs)/matches");
        break;
      case "new_message":
        if (data.conversation_id) {
          router.push(`/(chat)/conversation?id=${data.conversation_id}`);
        }
        break;
      case "shooter_request":
      case "shooter_accepted":
        if (data.contract_id) {
          router.push(`/(shooter)/offer-details?contractId=${data.contract_id}`);
        } else {
          router.push("/(tabs)/matches");
        }
        break;
      case "contract_completed":
        if (data.conversation_id) {
          router.push(
            `/(chat)/contract-detail?conversationId=${data.conversation_id}`,
          );
        } else if (data.contract_id) {
          // Fallback: go to matches tab
          router.push("/(tabs)/matches");
        } else {
          router.push("/(tabs)/matches");
        }
        break;
      case "subscription":
        router.push("/subscription");
        break;
      case "payment":
        router.push("/my-payments");
        break;
      case "system":
        if (data.action_url) {
          router.push(data.action_url);
        }
        break;
    }
  };

  const handleResubmit = (notification: NotificationItem) => {
    if (notification.type === "user_verification") {
      router.push({
        pathname: "/(verification)/resubmit-user-verification",
        params: {
          authId: notification.auth_id,
          authType: notification.auth_type,
          documentType: notification.document_type,
        },
      } as any);
    } else if (notification.type === "pet_vaccination") {
      router.push({
        pathname: "/(verification)/resubmit-document",
        params: {
          type: "vaccination",
          petId: notification.pet_id,
          vaccinationId: notification.vaccination_id,
          petName: notification.pet_name,
          vaccineName: notification.vaccine_name,
        },
      } as any);
    } else if (notification.type === "pet_health_record") {
      router.push({
        pathname: "/(verification)/resubmit-document",
        params: {
          type: "health_record",
          petId: notification.pet_id,
          healthRecordId: notification.health_record_id,
          petName: notification.pet_name,
          recordType: notification.record_type,
        },
      } as any);
    }
  };

  const isCloseToBottom = ({
    layoutMeasurement,
    contentOffset,
    contentSize,
  }: any) => {
    return (
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 100
    );
  };

  // Verification summary for "All" tab banner
  const hasVerificationAlerts =
    verificationSummary &&
    ((verificationSummary.warnings ?? 0) > 0 ||
      verificationSummary.rejected > 0 ||
      verificationSummary.pending > 0);

  // Grouped verification items
  const warningItems = verificationItems.filter((n) => n.status === "warning");
  const rejectedItems = verificationItems.filter(
    (n) => n.status === "rejected",
  );
  const pendingItems = verificationItems.filter((n) => n.status === "pending");
  const approvedItems = verificationItems.filter(
    (n) => n.status === "approved",
  );

  const isVerificationFilter = activeFilter === "verification";
  const isLoadingContent = isVerificationFilter ? verificationLoading : loading;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && !isVerificationFilter && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={handleMarkAllRead}
            activeOpacity={0.7}
          >
            <Feather name="check-circle" size={16} color="#FF6B4A" />
            <Text style={styles.markAllText}>Read all</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((filter) => (
            <FilterChip
              key={filter.key}
              label={filter.label}
              active={activeFilter === filter.key}
              onPress={() => handleFilterChange(filter.key)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Content Feed */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#FF6B4A"]}
            tintColor="#FF6B4A"
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={({ nativeEvent }) => {
          if (isCloseToBottom(nativeEvent)) handleLoadMore();
        }}
        scrollEventThrottle={400}
      >
        {isLoadingContent && !refreshing ? (
          <ActivityIndicator
            size="large"
            color="#FF6B4A"
            style={{ marginTop: 60 }}
          />
        ) : isVerificationFilter ? (
          /* ─── Verification Feed ─── */
          verificationItems.length > 0 ? (
            <>
              {/* Summary badges */}
              {verificationSummary && (
                <View style={styles.summaryRow}>
                  {(verificationSummary.warnings ?? 0) > 0 && (
                    <View
                      style={[
                        styles.summaryBadge,
                        { backgroundColor: "#fff7ed", borderColor: "#fed7aa" },
                      ]}
                    >
                      <Feather
                        name="alert-triangle"
                        size={12}
                        color="#c2410c"
                      />
                      <Text
                        style={[styles.summaryBadgeText, { color: "#9a3412" }]}
                      >
                        {verificationSummary.warnings} warning
                        {(verificationSummary.warnings ?? 0) > 1 ? "s" : ""}
                      </Text>
                    </View>
                  )}
                  {verificationSummary.rejected > 0 && (
                    <View
                      style={[
                        styles.summaryBadge,
                        { backgroundColor: "#fee2e2", borderColor: "#fecaca" },
                      ]}
                    >
                      <Feather name="alert-circle" size={12} color="#b91c1c" />
                      <Text
                        style={[styles.summaryBadgeText, { color: "#991b1b" }]}
                      >
                        {verificationSummary.rejected} action
                        {verificationSummary.rejected > 1 ? "s" : ""} needed
                      </Text>
                    </View>
                  )}
                  {verificationSummary.pending > 0 && (
                    <View
                      style={[
                        styles.summaryBadge,
                        { backgroundColor: "#fef9c3", borderColor: "#fde68a" },
                      ]}
                    >
                      <Feather name="clock" size={12} color="#a16207" />
                      <Text
                        style={[styles.summaryBadgeText, { color: "#854d0e" }]}
                      >
                        {verificationSummary.pending} pending
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Admin warnings section */}
              {warningItems.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Admin Warnings</Text>
                  {warningItems.map((item) => (
                    <VerificationCard
                      key={item.id}
                      notification={item}
                      onResubmit={handleResubmit}
                    />
                  ))}
                </View>
              )}

              {/* Rejected section */}
              {rejectedItems.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Needs Your Attention</Text>
                  {rejectedItems.map((item) => (
                    <VerificationCard
                      key={item.id}
                      notification={item}
                      onResubmit={handleResubmit}
                    />
                  ))}
                </View>
              )}

              {/* Pending section */}
              {pendingItems.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Under Review</Text>
                  {pendingItems.map((item) => (
                    <VerificationCard
                      key={item.id}
                      notification={item}
                      onResubmit={handleResubmit}
                    />
                  ))}
                </View>
              )}

              {/* Approved section */}
              {approvedItems.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Approved</Text>
                  {approvedItems.map((item) => (
                    <VerificationCard
                      key={item.id}
                      notification={item}
                      onResubmit={handleResubmit}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Feather name="shield" size={36} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>No verification items</Text>
              <Text style={styles.emptySubtext}>
                Your documents and verifications will appear here.
              </Text>
            </View>
          )
        ) : (
          /* ─── Activity Feed ─── */
          <>
            {/* Verification alert banner on "All" tab */}
            {activeFilter === "all" && hasVerificationAlerts && (
              <TouchableOpacity
                style={styles.verificationBanner}
                onPress={() => handleFilterChange("verification")}
                activeOpacity={0.7}
              >
                <View style={styles.verificationBannerIcon}>
                  <Feather name="shield" size={18} color="#c2410c" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.verificationBannerTitle}>
                    Verification Updates
                  </Text>
                  <Text style={styles.verificationBannerText}>
                    {[
                      (verificationSummary?.warnings ?? 0) > 0
                        ? `${verificationSummary!.warnings} warning${(verificationSummary!.warnings ?? 0) > 1 ? "s" : ""}`
                        : null,
                      (verificationSummary?.rejected ?? 0) > 0
                        ? `${verificationSummary!.rejected} rejected`
                        : null,
                      (verificationSummary?.pending ?? 0) > 0
                        ? `${verificationSummary!.pending} pending`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            )}

            {notifications.length > 0 ? (
              <>
                {notifications.map((notification) => (
                  <ActivityCard
                    key={notification.id}
                    notification={notification}
                    onPress={handleNotificationPress}
                  />
                ))}
                {loadingMore && (
                  <ActivityIndicator
                    size="small"
                    color="#FF6B4A"
                    style={{ marginVertical: 16 }}
                  />
                )}
              </>
            ) : (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Feather name="bell-off" size={36} color="#D1D5DB" />
                </View>
                <Text style={styles.emptyTitle}>No notifications yet</Text>
                <Text style={styles.emptySubtext}>
                  {activeFilter === "all"
                    ? "When something happens, you'll see it here."
                    : `No ${FILTERS.find((f) => f.key === activeFilter)?.label.toLowerCase()} notifications.`}
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#111827" },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#FFF5F3",
  },
  markAllText: { fontSize: 13, fontWeight: "600", color: "#FF6B4A" },

  // Filter chips
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    marginRight: 8,
  },
  chipActive: { backgroundColor: "#FF6B4A" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  chipTextActive: { color: "white" },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F9FAFB",
  },
  cardUnread: { backgroundColor: "#FFF9F7" },
  unreadDot: {
    position: "absolute",
    left: 8,
    top: 24,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B4A",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardContent: { flex: 1 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  timeText: { fontSize: 12, color: "#9CA3AF" },
  titleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 2,
  },
  titleTextUnread: { color: "#111827", fontWeight: "700" },
  messageText: { fontSize: 13, color: "#6B7280", lineHeight: 18 },

  // Status badge (verification cards)
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Reason box (rejection / warning details)
  reasonBox: {
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  reasonText: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Resubmit button
  resubmitButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#EF4444",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  resubmitText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // Verification banner (shown on "All" tab)
  verificationBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  verificationBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  verificationBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9A3412",
    marginBottom: 1,
  },
  verificationBannerText: {
    fontSize: 12,
    color: "#C2410C",
  },

  // Summary badges row (verification tab)
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Section headers (verification)
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    marginBottom: 6,
    marginTop: 8,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
});
