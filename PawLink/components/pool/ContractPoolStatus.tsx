import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  getContractPoolSummary,
  formatPoolAmount,
  getTransactionTypeLabel,
  getTransactionTypeColor,
  getPoolStatusColor,
  isCredit,
  ContractPoolSummary,
  PoolTransaction,
} from "@/services/poolService";

interface ContractPoolStatusProps {
  contractId: number;
  compact?: boolean;
}

/**
 * Inline pool status component for contract detail views.
 * Shows the pool summary and recent transactions for a contract.
 */
export default function ContractPoolStatus({
  contractId,
  compact = false,
}: ContractPoolStatusProps) {
  const [summary, setSummary] = useState<ContractPoolSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      const result = await getContractPoolSummary(contractId);
      if (result.success && result.data) {
        setSummary(result.data);
      }
      setLoading(false);
    };
    fetchSummary();
  }, [contractId]);

  if (loading) {
    return (
      <View className="bg-white rounded-xl p-4 border border-gray-100 items-center">
        <ActivityIndicator size="small" color="#E75234" />
      </View>
    );
  }

  if (
    !summary ||
    (summary.total_deposited === 0 && summary.transactions.length === 0)
  ) {
    return null; // No pool activity for this contract
  }

  if (compact) {
    return (
      <View className="bg-gray-50 rounded-lg p-3 border border-gray-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Feather name="shield" size={16} color="#6B7280" />
            <Text className="text-sm font-medium text-gray-700">Pool</Text>
          </View>
          <Text className="text-sm font-bold text-gray-900">
            {formatPoolAmount(summary.net_balance)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between p-4 bg-gray-50"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-lg bg-[#E75234]/10 items-center justify-center">
            <Feather name="shield" size={16} color="#E75234" />
          </View>
          <View>
            <Text className="text-sm font-bold text-gray-900">Money Pool</Text>
            <Text className="text-xs text-gray-500">
              Contract escrow status
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-bold text-gray-900">
            {formatPoolAmount(summary.net_balance)}
          </Text>
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={18}
            color="#9CA3AF"
          />
        </View>
      </TouchableOpacity>

      {/* Summary Stats */}
      <View className="flex-row px-4 py-3 border-b border-gray-100">
        <View className="flex-1">
          <Text className="text-xs text-gray-500">Deposited</Text>
          <Text className="text-sm font-semibold text-green-600">
            {formatPoolAmount(summary.total_deposited)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-500">Released</Text>
          <Text className="text-sm font-semibold text-blue-600">
            {formatPoolAmount(summary.total_released)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs text-gray-500">Fees</Text>
          <Text className="text-sm font-semibold text-orange-600">
            {formatPoolAmount(summary.total_fees)}
          </Text>
        </View>
      </View>

      {/* Expanded: Transaction List */}
      {expanded && summary.transactions.length > 0 && (
        <View className="px-4 py-2">
          <Text className="text-xs text-gray-500 font-semibold uppercase mb-2">
            Transactions
          </Text>
          {summary.transactions.map((txn: PoolTransaction) => {
            const typeColor = getTransactionTypeColor(txn.type);
            const credit = isCredit(txn.type);
            const date = new Date(txn.created_at);

            return (
              <View
                key={txn.id}
                className="flex-row items-center justify-between py-2 border-b border-gray-50"
              >
                <View className="flex-row items-center gap-2 flex-1">
                  <View className={`px-1.5 py-0.5 rounded ${typeColor.bg}`}>
                    <Text
                      className={`text-[10px] font-semibold ${typeColor.text}`}
                    >
                      {getTransactionTypeLabel(txn.type)}
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-400">
                    {date.toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </View>
                <Text
                  className={`text-sm font-semibold ${
                    credit ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {credit ? "+" : "-"}
                  {formatPoolAmount(txn.amount)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {expanded && summary.transactions.length === 0 && (
        <View className="p-4 items-center">
          <Text className="text-sm text-gray-400">No transactions yet</Text>
        </View>
      )}
    </View>
  );
}
