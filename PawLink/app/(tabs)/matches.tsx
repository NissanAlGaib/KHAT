import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import {
  getIncomingRequests,
  getOutgoingRequests,
  getAcceptedMatches,
  acceptMatchRequest,
  declineMatchRequest,
  cancelMatchRequest,
  getMatchHistory,
  type MatchRequest,
  type AcceptedMatch,
  type HistoryItem,
} from "@/services/matchRequestService";
import { getStorageUrl } from "@/utils/imageUrl";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type TabType = "REQUESTS" | "MATCHES" | "HISTORY";
type HistoryFilter = "all" | "declined" | "cancelled";

// ─── Collapsible Section Component ──────────────────────────────
const CollapsibleSection = ({
  title,
  count,
  icon,
  iconColor,
  defaultOpen = true,
  children,
}: {
  title: string;
  count: number;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleSection = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  return (
    <View className="mb-4">
      <TouchableOpacity
        className="flex-row items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm"
        onPress={toggleSection}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: iconColor + "20" }}
          >
            <Feather name={icon} size={16} color={iconColor} />
          </View>
          <Text className="font-bold text-base text-gray-800">{title}</Text>
          {count > 0 && (
            <View
              className="ml-2 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: iconColor + "20" }}
            >
              <Text className="text-xs font-bold" style={{ color: iconColor }}>
                {count}
              </Text>
            </View>
          )}
        </View>
        <Feather
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color="#9CA3AF"
        />
      </TouchableOpacity>
      {isOpen && <View className="mt-2">{children}</View>}
    </View>
  );
};

// ─── Status Badge Component ─────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Pending" },
    accepted: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "Accepted",
    },
    declined: { bg: "bg-red-100", text: "text-red-700", label: "Declined" },
    cancelled: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      label: "Cancelled",
    },
  };
  const c = config[status] || config.pending;

  return (
    <View className={`px-2.5 py-1 rounded-full ${c.bg}`}>
      <Text className={`text-xs font-semibold ${c.text}`}>{c.label}</Text>
    </View>
  );
};

// ─── Main Component ─────────────────────────────────────────────
const Matches = () => {
  const router = useRouter();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<TabType>("REQUESTS");
  const [incomingRequests, setIncomingRequests] = useState<MatchRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<MatchRequest[]>([]);
  const [acceptedMatches, setAcceptedMatches] = useState<AcceptedMatch[]>([]);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>("all");
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLastPage, setHistoryLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const getImageUrl = (path: string | null | undefined) => {
    return getStorageUrl(path);
  };

  const fetchData = useCallback(async () => {
    try {
      const [incoming, outgoing, matches] = await Promise.all([
        getIncomingRequests(),
        getOutgoingRequests(),
        getAcceptedMatches(),
      ]);
      setIncomingRequests(incoming);
      setOutgoingRequests(outgoing);
      setAcceptedMatches(matches);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchHistory = useCallback(
    async (page: number = 1, filter: HistoryFilter = historyFilter) => {
      try {
        const statusParam =
          filter === "all" ? undefined : (filter as "declined" | "cancelled");
        const result = await getMatchHistory(page, statusParam);
        if (page === 1) {
          setHistoryItems(result.data);
        } else {
          setHistoryItems((prev) => [...prev, ...result.data]);
        }
        setHistoryPage(result.meta.current_page);
        setHistoryLastPage(result.meta.last_page);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoadingMore(false);
      }
    },
    [historyFilter],
  );

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // Fetch history when switching to HISTORY tab or changing filter
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "HISTORY") {
      fetchHistory(1, historyFilter);
    }
  };

  const handleHistoryFilterChange = (filter: HistoryFilter) => {
    setHistoryFilter(filter);
    fetchHistory(1, filter);
  };

  const handleLoadMore = () => {
    if (historyPage < historyLastPage && !loadingMore) {
      setLoadingMore(true);
      fetchHistory(historyPage + 1);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeTab === "HISTORY") {
      fetchHistory(1, historyFilter);
      setRefreshing(false);
    } else {
      fetchData();
    }
  }, [fetchData, fetchHistory, activeTab, historyFilter]);

  const handleAccept = async (requestId: number) => {
    if (processingId) return;
    setProcessingId(requestId);

    try {
      const result = await acceptMatchRequest(requestId);
      if (result.success) {
        showAlert({
          title: "Match Accepted!",
          message: "You can now start chatting with the pet owner.",
          type: "success",
          buttons: [
            {
              text: "Start Chat",
              onPress: () => {
                if (result.conversation_id) {
                  router.push(
                    `/(chat)/conversation?id=${result.conversation_id}`,
                  );
                }
              },
            },
            { text: "Later", style: "cancel" },
          ],
        });
        fetchData();
      } else {
        showAlert({
          title: "Error",
          message: result.message,
          type: "error",
        });
      }
    } catch (error) {
      showAlert({
        title: "Error",
        message: "Failed to accept match request",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: number) => {
    if (processingId) return;
    setProcessingId(requestId);

    try {
      const result = await declineMatchRequest(requestId);
      if (result.success) {
        showAlert({
          title: "Request Declined",
          message: "The match request has been declined.",
          type: "info",
        });
        fetchData();
      } else {
        showAlert({
          title: "Error",
          message: result.message,
          type: "error",
        });
      }
    } catch (error) {
      showAlert({
        title: "Error",
        message: "Failed to decline match request",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (requestId: number) => {
    if (processingId) return;

    showAlert({
      title: "Cancel Request?",
      message: "Are you sure you want to withdraw this match request?",
      type: "warning",
      buttons: [
        {
          text: "Yes, Cancel",
          onPress: async () => {
            setProcessingId(requestId);
            try {
              const result = await cancelMatchRequest(requestId);
              if (result.success) {
                showAlert({
                  title: "Request Cancelled",
                  message: "Your match request has been withdrawn.",
                  type: "info",
                });
                fetchData();
              } else {
                showAlert({
                  title: "Error",
                  message: result.message,
                  type: "error",
                });
              }
            } catch (error) {
              showAlert({
                title: "Error",
                message: "Failed to cancel match request",
                type: "error",
              });
            } finally {
              setProcessingId(null);
            }
          },
        },
        { text: "No, Keep It", style: "cancel" },
      ],
    });
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // ─── Pet Avatar Component ──────────────────────────────────────
  const PetAvatar = ({
    photoUrl,
    size = "w-14 h-14",
  }: {
    photoUrl?: string | null;
    size?: string;
  }) =>
    photoUrl ? (
      <Image
        source={{ uri: getImageUrl(photoUrl) || undefined }}
        className={`${size} rounded-full bg-gray-200`}
      />
    ) : (
      <View
        className={`${size} rounded-full bg-gray-100 items-center justify-center`}
      >
        <Feather name="image" size={20} color="#D1D5DB" />
      </View>
    );

  // ─── Incoming Request Card ────────────────────────────────────
  const renderIncomingItem = (request: MatchRequest) => (
    <View
      key={request.id}
      className="bg-white rounded-2xl p-4 mb-2.5 shadow-sm"
    >
      <View className="flex-row items-center">
        <PetAvatar photoUrl={request.requester_pet.photo_url} />
        <View className="flex-1 ml-3">
          <Text className="text-gray-500 text-xs">{request.owner.name}</Text>
          <Text className="font-bold text-base text-gray-800">
            {request.requester_pet.name}
          </Text>
          {request.requester_pet.breed && (
            <Text className="text-gray-400 text-xs">
              {request.requester_pet.breed}
            </Text>
          )}
          <Text className="text-gray-400 text-xs mt-0.5">
            {formatTimeAgo(request.created_at)}
          </Text>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            onPress={() => handleDecline(request.id)}
            disabled={processingId === request.id}
          >
            {processingId === request.id ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <Feather name="x" size={18} color="#9CA3AF" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            className="w-10 h-10 bg-[#EA5B3A] rounded-full items-center justify-center"
            onPress={() => handleAccept(request.id)}
            disabled={processingId === request.id}
          >
            {processingId === request.id ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Feather name="heart" size={18} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // ─── Outgoing Request Card ────────────────────────────────────
  const renderOutgoingItem = (request: MatchRequest) => (
    <View
      key={request.id}
      className="bg-white rounded-2xl p-4 mb-2.5 shadow-sm"
    >
      <View className="flex-row items-center">
        <PetAvatar photoUrl={request.target_pet.photo_url} />
        <View className="flex-1 ml-3">
          <Text className="text-gray-500 text-xs">{request.owner.name}</Text>
          <Text className="font-bold text-base text-gray-800">
            {request.target_pet.name}
          </Text>
          {request.target_pet.breed && (
            <Text className="text-gray-400 text-xs">
              {request.target_pet.breed}
            </Text>
          )}
          <View className="flex-row items-center mt-1">
            <StatusBadge status={request.status} />
            <Text className="text-gray-400 text-xs ml-2">
              {formatTimeAgo(request.created_at)}
            </Text>
          </View>
        </View>
        {request.status === "pending" && (
          <TouchableOpacity
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            onPress={() => handleCancel(request.id)}
            disabled={processingId === request.id}
          >
            {processingId === request.id ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <Feather name="x-circle" size={18} color="#EF4444" />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // ─── Match Card ───────────────────────────────────────────────
  const renderMatchItem = (match: AcceptedMatch) => (
    <TouchableOpacity
      key={match.id}
      className="bg-white rounded-2xl p-4 mb-2.5 shadow-sm"
      onPress={() => {
        if (match.conversation_id) {
          router.push(`/(chat)/conversation?id=${match.conversation_id}`);
        }
      }}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center">
        <PetAvatar photoUrl={match.matched_pet.photo_url} />
        <View className="flex-1 ml-3">
          <Text className="text-gray-500 text-xs">{match.owner.name}</Text>
          <Text className="font-bold text-base text-gray-800">
            {match.matched_pet.name}
          </Text>
          <Text className="text-[#22C55E] text-xs">
            Matched {formatTimeAgo(match.matched_at)}
          </Text>
          {match.has_pending_shooter_request && (
            <View className="flex-row items-center mt-1">
              <View className="w-2 h-2 rounded-full bg-amber-400 mr-1.5" />
              <Text className="text-amber-600 text-xs font-semibold">
                Pending Shooter Request
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          className="w-10 h-10 bg-[#EA5B3A] rounded-full items-center justify-center"
          onPress={() => {
            if (match.conversation_id) {
              router.push(`/(chat)/conversation?id=${match.conversation_id}`);
            }
          }}
        >
          <Feather name="message-circle" size={18} color="white" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // ─── History Card ─────────────────────────────────────────────
  const renderHistoryItem = (item: HistoryItem) => (
    <View key={item.id} className="bg-white rounded-2xl p-4 mb-2.5 shadow-sm">
      <View className="flex-row items-center">
        <PetAvatar photoUrl={item.other_pet.photo_url} />
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text className="text-gray-500 text-xs">{item.owner.name}</Text>
            <View className="mx-1.5 w-1 h-1 rounded-full bg-gray-300" />
            <Text className="text-gray-400 text-xs">
              {item.direction === "outgoing" ? "Sent" : "Received"}
            </Text>
          </View>
          <Text className="font-bold text-base text-gray-800">
            {item.other_pet.name}
          </Text>
          {item.other_pet.breed && (
            <Text className="text-gray-400 text-xs">
              {item.other_pet.breed}
            </Text>
          )}
          <View className="flex-row items-center mt-1">
            <StatusBadge status={item.status} />
            <Text className="text-gray-400 text-xs ml-2">
              {formatTimeAgo(item.updated_at)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  // ─── Empty State Component ────────────────────────────────────
  const EmptyState = ({
    icon,
    title,
    subtitle,
  }: {
    icon: keyof typeof Feather.glyphMap;
    title: string;
    subtitle: string;
  }) => (
    <View className="items-center justify-center py-16">
      <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
        <Feather name={icon} size={28} color="#D1D5DB" />
      </View>
      <Text className="text-gray-500 font-semibold text-base">{title}</Text>
      <Text className="text-gray-400 text-sm text-center mt-1 px-8">
        {subtitle}
      </Text>
    </View>
  );

  // ─── Tab Button ───────────────────────────────────────────────
  const TabButton = ({
    label,
    tab,
    count,
  }: {
    label: string;
    tab: TabType;
    count?: number;
  }) => {
    const isActive = activeTab === tab;
    return (
      <TouchableOpacity
        className={`flex-1 py-2.5 rounded-full ${
          isActive ? "bg-[#EA5B3A]" : ""
        }`}
        onPress={() => handleTabChange(tab)}
      >
        <View className="flex-row items-center justify-center">
          <Text
            className={`text-center font-semibold text-sm ${
              isActive ? "text-white" : "text-gray-500"
            }`}
          >
            {label}
          </Text>
          {count !== undefined && count > 0 && (
            <View
              className={`ml-1.5 px-1.5 py-0.5 rounded-full ${
                isActive ? "bg-white/30" : "bg-[#EA5B3A]/10"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isActive ? "text-white" : "text-[#EA5B3A]"
                }`}
              >
                {count > 99 ? "99+" : count}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Requests Tab Content ─────────────────────────────────────
  const renderRequestsTab = () => {
    const pendingIncoming = incomingRequests.filter(
      (r) => r.status === "pending",
    );
    const pendingOutgoing = outgoingRequests.filter(
      (r) => r.status === "pending",
    );

    if (pendingIncoming.length === 0 && outgoingRequests.length === 0) {
      return (
        <EmptyState
          icon="inbox"
          title="No requests"
          subtitle="When someone sends a match request to your pet or you send one, it will appear here"
        />
      );
    }

    return (
      <>
        {/* Incoming Requests Section */}
        <CollapsibleSection
          title="Incoming"
          count={pendingIncoming.length}
          icon="arrow-down-left"
          iconColor="#EA5B3A"
          defaultOpen={true}
        >
          {pendingIncoming.length > 0 ? (
            pendingIncoming.map(renderIncomingItem)
          ) : (
            <View className="py-6 items-center">
              <Text className="text-gray-400 text-sm">
                No incoming requests
              </Text>
            </View>
          )}
        </CollapsibleSection>

        {/* Outgoing Requests Section */}
        <CollapsibleSection
          title="Outgoing"
          count={pendingOutgoing.length}
          icon="arrow-up-right"
          iconColor="#6366F1"
          defaultOpen={true}
        >
          {outgoingRequests.length > 0 ? (
            outgoingRequests.map(renderOutgoingItem)
          ) : (
            <View className="py-6 items-center">
              <Text className="text-gray-400 text-sm">
                No outgoing requests
              </Text>
            </View>
          )}
        </CollapsibleSection>
      </>
    );
  };

  // ─── Matches Tab Content ──────────────────────────────────────
  const renderMatchesTab = () => {
    if (acceptedMatches.length === 0) {
      return (
        <EmptyState
          icon="heart"
          title="No matches yet"
          subtitle="Accept match requests to start chatting with pet owners"
        />
      );
    }

    return acceptedMatches.map(renderMatchItem);
  };

  // ─── History Tab Content ──────────────────────────────────────
  const renderHistoryTab = () => (
    <>
      {/* Filter pills */}
      <View className="flex-row mb-4 gap-2">
        {(["all", "declined", "cancelled"] as HistoryFilter[]).map((filter) => {
          const isActive = historyFilter === filter;
          return (
            <TouchableOpacity
              key={filter}
              className={`px-4 py-2 rounded-full ${
                isActive ? "bg-[#EA5B3A]" : "bg-white"
              }`}
              onPress={() => handleHistoryFilterChange(filter)}
            >
              <Text
                className={`text-sm font-medium capitalize ${
                  isActive ? "text-white" : "text-gray-500"
                }`}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {historyItems.length > 0 ? (
        <>
          {historyItems.map(renderHistoryItem)}
          {historyPage < historyLastPage && (
            <TouchableOpacity
              className="bg-white rounded-2xl py-3 mb-4 items-center shadow-sm"
              onPress={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator size="small" color="#EA5B3A" />
              ) : (
                <Text className="text-[#EA5B3A] font-semibold text-sm">
                  Load More
                </Text>
              )}
            </TouchableOpacity>
          )}
        </>
      ) : (
        <EmptyState
          icon="clock"
          title="No history"
          subtitle="Past declined and cancelled requests will appear here"
        />
      )}
    </>
  );

  // ─── Loading State ────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FFF5F5] items-center justify-center">
        <ActivityIndicator size="large" color="#EA5B3A" />
      </SafeAreaView>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────
  const pendingIncomingCount = incomingRequests.filter(
    (r) => r.status === "pending",
  ).length;

  return (
    <SafeAreaView className="flex-1 bg-[#FFF5F5]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 bg-white shadow-sm">
        <Text className="text-2xl font-bold text-center text-gray-800">
          Matches
        </Text>
      </View>

      {/* Tab Toggle */}
      <View className="flex-row mx-4 mt-4 bg-gray-100 rounded-full p-1">
        <TabButton
          label="Requests"
          tab="REQUESTS"
          count={pendingIncomingCount}
        />
        <TabButton
          label="Matches"
          tab="MATCHES"
          count={acceptedMatches.length}
        />
        <TabButton label="History" tab="HISTORY" />
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4 mt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#EA5B3A"]}
            tintColor="#EA5B3A"
          />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {activeTab === "REQUESTS" && renderRequestsTab()}
        {activeTab === "MATCHES" && renderMatchesTab()}
        {activeTab === "HISTORY" && renderHistoryTab()}
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
};

export default Matches;
