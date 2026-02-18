import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import {
  getMyPoolTransactions,
  getPoolBalance,
  formatPoolAmount,
  getTransactionTypeLabel,
  getTransactionTypeColor,
  getPoolStatusColor,
  isCredit,
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

type TabType = "transactions" | "disputes";
type FilterType = "all" | PoolTransactionType;

export default function MyPaymentsScreen() {
  const router = useRouter();
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
      <View className="mx-4 mt-4 mb-2 bg-gray-900 rounded-2xl p-5">
        <Text className="text-gray-400 text-sm font-medium mb-1">
          Pool Balance
        </Text>
        <Text className="text-white text-3xl font-bold mb-4">
          {formatPoolAmount(balance.total_held)}
        </Text>
        <View className="flex-row justify-between">
          <View>
            <Text className="text-gray-500 text-xs">Frozen</Text>
            <Text className="text-blue-400 text-sm font-semibold">
              {formatPoolAmount(balance.total_frozen)}
            </Text>
          </View>
          <View>
            <Text className="text-gray-500 text-xs">Pending</Text>
            <Text className="text-yellow-400 text-sm font-semibold">
              {formatPoolAmount(balance.total_pending)}
            </Text>
          </View>
          <View>
            <Text className="text-gray-500 text-xs">Total Released</Text>
            <Text className="text-green-400 text-sm font-semibold">
              {formatPoolAmount(balance.total_released)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTransactionItem = ({ item }: { item: PoolTransaction }) => {
    const typeColor = getTransactionTypeColor(item.type);
    const statusColor = getPoolStatusColor(item.status);
    const credit = isCredit(item.type);
    const date = new Date(item.created_at);

    return (
      <TouchableOpacity
        className="mx-4 mb-2 bg-white rounded-xl p-4 border border-gray-100"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center gap-2">
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
          <Text
            className={`text-base font-bold ${
              credit ? "text-green-600" : "text-red-600"
            }`}
          >
            {credit ? "+" : "-"}
            {formatPoolAmount(item.amount)}
          </Text>
        </View>

        {item.description && (
          <Text className="text-gray-500 text-sm mb-1" numberOfLines={1}>
            {item.description}
          </Text>
        )}

        <View className="flex-row items-center justify-between">
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
      </TouchableOpacity>
    );
  };

  const renderDisputeItem = ({ item }: { item: Dispute }) => {
    const statusColor = getDisputeStatusColor(item.status);
    const date = new Date(item.created_at);

    return (
      <View className="mx-4 mb-2 bg-white rounded-xl p-4 border border-gray-100">
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

        <Text className="text-gray-800 text-sm mb-2" numberOfLines={2}>
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

        <Text className="text-gray-400 text-xs">
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
              filter === opt.value ? "bg-[#E75234]" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                filter === opt.value ? "text-white" : "text-gray-600"
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
    <View className="items-center justify-center py-16">
      <Feather
        name={activeTab === "transactions" ? "inbox" : "check-circle"}
        size={48}
        color="#D1D5DB"
      />
      <Text className="text-gray-400 text-base font-medium mt-3">
        {activeTab === "transactions"
          ? "No pool transactions yet"
          : "No disputes filed"}
      </Text>
      <Text className="text-gray-300 text-sm mt-1">
        {activeTab === "transactions"
          ? "Payments from contracts will appear here"
          : "All clear! You have no disputes."}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <Feather name="arrow-left" size={24} color="#111827" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 flex-1">
          My Payments
        </Text>
      </View>

      {/* Balance Card */}
      {renderBalanceCard()}

      {/* Tabs */}
      <View className="flex-row mx-4 mt-3 mb-3 bg-gray-100 rounded-xl p-1">
        <TouchableOpacity
          onPress={() => setActiveTab("transactions")}
          className={`flex-1 py-2.5 rounded-lg ${
            activeTab === "transactions" ? "bg-white shadow-sm" : ""
          }`}
        >
          <Text
            className={`text-center text-sm font-semibold ${
              activeTab === "transactions" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Transactions
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("disputes")}
          className={`flex-1 py-2.5 rounded-lg ${
            activeTab === "disputes" ? "bg-white shadow-sm" : ""
          }`}
        >
          <Text
            className={`text-center text-sm font-semibold ${
              activeTab === "disputes" ? "text-gray-900" : "text-gray-500"
            }`}
          >
            Disputes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters (transactions tab only) */}
      {activeTab === "transactions" && renderFilters()}

      {/* Content */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#E75234" />
        </View>
      ) : activeTab === "transactions" ? (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTransactionItem}
          ListEmptyComponent={renderEmptyState}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E75234"
            />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <FlatList
          data={disputes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDisputeItem}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#E75234"
            />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}
