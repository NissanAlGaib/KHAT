import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  getMyPoolTransactions,
  getPoolBalance,
  formatPoolAmount,
  getTransactionTypeLabel,
  getTransactionTypeColor,
  getPoolStatusColor,
  getTransactionDirectionLabel,
  isCredit,
  isEarned,
  PoolTransaction,
  PoolBalance,
  PoolTransactionType,
} from "@/services/poolService";
import {
  getMyDisputes,
  getDisputeStatusLabel,
  getDisputeStatusColor,
  Dispute,
} from "@/services/disputeService";
import { useSession } from "@/context/AuthContext";
import { SettingsLayout } from "@/components/settings";
import { Colors } from "@/constants";

type TabType = "transactions" | "disputes";
type FilterType = "all" | PoolTransactionType;

export default function MyPaymentsScreen() {
  const router = useRouter();
  const { user } = useSession();
  const currentUserId = Number(user?.id ?? 0);
  const [activeTab, setActiveTab] = useState<TabType>("transactions");
  const [filter, setFilter] = useState<FilterType>("all");
  const [transactions, setTransactions] = useState<PoolTransaction[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [balance, setBalance] = useState<PoolBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchBalance = useCallback(async () => {
    const result = await getPoolBalance();
    if (result.success && result.data) {
      setBalance(result.data);
    }
  }, []);

  const fetchTransactions = useCallback(
    async (pageNum: number = 1, reset: boolean = false) => {
      const filterParam = filter === "all" ? undefined : filter;
      const result = await getMyPoolTransactions({
        type: filterParam,
        page: pageNum,
      });
      if (result.success && result.data) {
        const newData = result.data.data;
        setTransactions((prev) => (reset ? newData : [...prev, ...newData]));
        setHasMore(result.data.current_page < result.data.last_page);
        setPage(result.data.current_page);
      }
    },
    [filter],
  );

  const fetchDisputes = useCallback(async () => {
    const result = await getMyDisputes();
    if (result.success && result.data) {
      setDisputes(result.data.data);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchBalance(),
      activeTab === "transactions"
        ? fetchTransactions(1, true)
        : fetchDisputes(),
    ]);
    setLoading(false);
  }, [activeTab, fetchBalance, fetchTransactions, fetchDisputes]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === "transactions") {
      setTransactions([]);
      fetchTransactions(1, true);
    }
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchTransactions(page + 1, false);
    }
  }, [hasMore, loading, page, fetchTransactions]);

  const filterOptions: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Deposits", value: "deposit" },
    { label: "Releases", value: "release" },
    { label: "Refunds", value: "refund" },
    { label: "Fees", value: "fee_deduction" },
  ];

  const renderBalanceCard = () => {
    if (!balance) return null;
    return (
      <View
        className="mx-4 mt-4 mb-2 bg-white rounded-2xl p-5"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
          elevation: 2,
        }}
      >
        <View className="flex-row items-center gap-2 mb-1">
          <View className="w-2 h-2 rounded-full bg-primary" />
          <Text className="text-gray-500 text-sm font-medium">
            Pool Balance
          </Text>
        </View>
        <Text className="text-gray-900 text-3xl font-bold mb-4">
          {formatPoolAmount(balance.held)}
        </Text>
        <View className="flex-row justify-between bg-gray-50 rounded-xl p-3">
          <View className="items-center">
            <Text className="text-gray-400 text-xs mb-0.5">Frozen</Text>
            <Text className="text-blue-600 text-sm font-semibold">
              {formatPoolAmount(balance.frozen)}
            </Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="items-center">
            <Text className="text-gray-400 text-xs mb-0.5">Pending</Text>
            <Text className="text-amber-600 text-sm font-semibold">
              {formatPoolAmount(balance.pending_deposits)}
            </Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="items-center">
            <Text className="text-gray-400 text-xs mb-0.5">Released Out</Text>
            <Text className="text-green-600 text-sm font-semibold">
              {formatPoolAmount(balance.total_released)}
            </Text>
            <Text className="text-emerald-600 text-[10px] mt-0.5">
              In: {formatPoolAmount(balance.incoming_releases ?? 0)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTransactionItem = ({ item }: { item: PoolTransaction }) => {
    const releaseToUserId = Number(item.metadata?.released_to_user_id ?? 0);
    const isIncomingReleaseForViewer =
      item.type === "release" &&
      currentUserId > 0 &&
      releaseToUserId === currentUserId;
    const isOutgoingReleaseForViewer =
      item.type === "release" &&
      currentUserId > 0 &&
      item.user_id === currentUserId &&
      releaseToUserId > 0 &&
      releaseToUserId !== currentUserId;

    const typeColor = getTransactionTypeColor(item.type);
    const statusColor = getPoolStatusColor(item.status);
    const credit = isCredit(item.type);
    const earned =
      isIncomingReleaseForViewer ||
      (isEarned(item.type) && !isOutgoingReleaseForViewer);
    const direction = isIncomingReleaseForViewer
      ? { label: "Compensation received", icon: "arrow-down-left" }
      : isOutgoingReleaseForViewer
        ? { label: "Released to partner", icon: "arrow-up-right" }
        : getTransactionDirectionLabel(item.type);
    const date = new Date(item.created_at);

    // Determine amount color: green for money coming to user, red for money going out
    const amountColor = earned
      ? "text-green-600"
      : credit
        ? "text-orange-600"
        : "text-red-600";
    const amountPrefix = earned ? "+" : credit ? "" : "-";

    return (
      <View
        className="mx-4 mb-3 bg-white rounded-2xl p-4 border border-gray-100"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 1,
        }}
      >
        {/* Direction label + Amount */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <Feather
              name={direction.icon as any}
              size={14}
              color={earned ? "#16A34A" : credit ? "#EA580C" : "#DC2626"}
            />
            <Text className="text-gray-600 text-xs font-medium">
              {direction.label}
            </Text>
          </View>
          <Text className={`text-lg font-bold ${amountColor}`}>
            {amountPrefix}
            {formatPoolAmount(item.amount)}
          </Text>
        </View>

        {/* Type badge + Status badge */}
        <View className="flex-row items-center gap-2 mb-2">
          <View className={`px-2 py-1 rounded-md ${typeColor.bg}`}>
            <Text className={`text-xs font-semibold ${typeColor.text}`}>
              {getTransactionTypeLabel(item.type)}
            </Text>
          </View>
          <View className={`px-2 py-1 rounded-md ${statusColor.bg}`}>
            <Text className={`text-xs font-semibold ${statusColor.text}`}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        {item.description && (
          <Text className="text-gray-500 text-sm mb-1" numberOfLines={1}>
            {item.description}
          </Text>
        )}

        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
          {item.contract_id ? (
            <Text className="text-gray-400 text-xs">
              Contract #{item.contract_id}
            </Text>
          ) : (
            <View />
          )}
          <Text className="text-gray-400 text-xs">
            {date.toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderDisputeItem = ({ item }: { item: Dispute }) => {
    const statusColor = getDisputeStatusColor(item.status);
    const date = new Date(item.created_at);

    return (
      <View
        className="mx-4 mb-3 bg-white rounded-2xl p-4 border border-gray-100"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
          elevation: 1,
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
            <View className={`px-2 py-1 rounded-md ${statusColor.bg}`}>
              <Text className={`text-xs font-semibold ${statusColor.text}`}>
                {getDisputeStatusLabel(item.status)}
              </Text>
            </View>
            <Text className="text-gray-400 text-xs">
              Contract #{item.contract_id}
            </Text>
          </View>
          <Feather
            name="alert-triangle"
            size={16}
            color={item.status === "open" ? "#F59E0B" : "#9CA3AF"}
          />
        </View>

        <Text
          className="text-gray-800 text-sm mb-2 font-medium"
          numberOfLines={2}
        >
          {item.reason}
        </Text>

        {item.resolution_notes && (
          <View className="bg-green-50 rounded-lg p-3 mb-2">
            <Text className="text-green-700 text-xs font-medium">
              Resolution: {item.resolution_type?.replace("_", " ")}
            </Text>
            <Text className="text-green-600 text-xs mt-1">
              {item.resolution_notes}
            </Text>
            {item.resolved_amount && (
              <Text className="text-green-800 text-xs font-bold mt-1">
                Amount: {formatPoolAmount(item.resolved_amount)}
              </Text>
            )}
          </View>
        )}

        <Text className="text-gray-400 text-xs text-right mt-1">
          Filed{" "}
          {date.toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
      </View>
    );
  };

  const renderFilters = () => (
    <View className="mx-4 mb-3">
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={filterOptions}
        keyExtractor={(item) => item.value}
        renderItem={({ item: opt }) => (
          <TouchableOpacity
            onPress={() => setFilter(opt.value)}
            className={`mr-2 px-4 py-2 rounded-full ${
              filter === opt.value
                ? "bg-primary"
                : "bg-white border border-gray-200"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                filter === opt.value ? "text-white" : "text-gray-500"
              }`}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View className="items-center justify-center py-16 px-4">
      <View className="bg-orange-50 p-4 rounded-full mb-4">
        <Feather
          name={activeTab === "transactions" ? "inbox" : "check-circle"}
          size={32}
          color={Colors.primary}
        />
      </View>
      <Text className="text-gray-900 text-lg font-semibold text-center">
        {activeTab === "transactions"
          ? "No transactions yet"
          : "No disputes filed"}
      </Text>
      <Text className="text-gray-500 text-sm mt-2 text-center leading-5 px-8">
        {activeTab === "transactions"
          ? "Payments from your breeding contracts will appear here automatically."
          : "Great news! You don't have any active disputes at the moment."}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Balance Card */}
      {renderBalanceCard()}

      {/* Tabs */}
      <View className="flex-row mx-4 mt-3 mb-4 bg-gray-100 p-1 rounded-2xl">
        <TouchableOpacity
          onPress={() => setActiveTab("transactions")}
          className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
            activeTab === "transactions" ? "bg-white" : ""
          }`}
          style={
            activeTab === "transactions"
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 1,
                }
              : undefined
          }
        >
          <Text
            className={`text-sm font-semibold ${
              activeTab === "transactions" ? "text-gray-900" : "text-gray-400"
            }`}
          >
            Transactions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("disputes")}
          className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
            activeTab === "disputes" ? "bg-white" : ""
          }`}
          style={
            activeTab === "disputes"
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 1,
                }
              : undefined
          }
        >
          <Text
            className={`text-sm font-semibold ${
              activeTab === "disputes" ? "text-gray-900" : "text-gray-400"
            }`}
          >
            Disputes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters (transactions tab only) */}
      {activeTab === "transactions" && renderFilters()}
    </View>
  );

  return (
    <SettingsLayout headerTitle="My Payments" scrollable={false}>
      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center pt-20">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : activeTab === "transactions" ? (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTransactionItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={disputes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDisputeItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SettingsLayout>
  );
}
