import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  FileText,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  CreditCard,
  Heart,
  Baby,
  ClipboardList,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import { BreedingContract } from "@/services/contractService";

interface CompactContractCardProps {
  contract: BreedingContract;
  conversationId: number;
}

const statusConfig: Record<
  string,
  { label: string; emoji: string; color: string; bg: string }
> = {
  draft: { label: "Draft", emoji: "📝", color: "#6B7280", bg: "#F9FAFB" },
  pending_review: { label: "Pending Review", emoji: "⏳", color: "#eab308", bg: "#fefce8" },
  accepted: { label: "Active", emoji: "✅", color: "#16a34a", bg: "#f0fdf4" },
  rejected: { label: "Rejected", emoji: "❌", color: "#ef4444", bg: "#fef2f2" },
  fulfilled: { label: "Completed", emoji: "🎉", color: "#8b5cf6", bg: "#f5f3ff" },
};

function getNextAction(contract: BreedingContract): { text: string; emoji: string; tab?: string } | null {
  const status = contract.status;

  if (status === "pending_review") {
    if (contract.can_accept) {
      return { text: "Review & accept the contract", emoji: "👀", tab: "overview" };
    }
    return { text: "Waiting for other party to review", emoji: "⏳" };
  }

  if (status === "accepted") {
    // Check breeding status
    const breedingStatus = contract.breeding_status || "pending";
    if (breedingStatus === "pending" || breedingStatus === "in_progress") {
      if (contract.can_mark_breeding_complete) {
        return { text: "Mark breeding as complete", emoji: "💕", tab: "breeding" };
      }
      return { text: "Breeding in progress", emoji: "💕" };
    }
    if (breedingStatus === "completed" && contract.has_offspring) {
      if (contract.can_input_offspring) {
        return { text: "Record or allocate offspring", emoji: "🐾", tab: "offspring" };
      }
      return { text: "Waiting for offspring recording", emoji: "🐾" };
    }
    if (breedingStatus === "failed") {
      return { text: "Breeding failed — review details", emoji: "😔", tab: "breeding" };
    }
    return null;
  }

  if (status === "fulfilled") {
    return { text: "Match completed!", emoji: "🎊" };
  }

  return null;
}

export default function CompactContractCard({ contract, conversationId }: CompactContractCardProps) {
  const router = useRouter();
  const config = statusConfig[contract.status] || statusConfig.draft;
  const nextAction = getNextAction(contract);

  const handlePress = () => {
    router.push({
      pathname: "/(chat)/contract-detail" as any,
      params: { conversationId: conversationId.toString() },
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      className="mx-4 mb-3"
    >
      <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden" style={{ elevation: 2 }}>
        {/* Top Bar with gradient feel */}
        <View className="bg-[#FFF5F3] px-4 py-3 flex-row items-center justify-between border-b border-gray-50">
          <View className="flex-row items-center">
            <FileText size={16} color="#FF6B6B" />
            <Text className="font-bold text-gray-800 text-sm ml-2">Breeding Contract</Text>
          </View>
          <View className="flex-row items-center px-2.5 py-1 rounded-full" style={{ backgroundColor: `${config.color}15` }}>
            <Text className="mr-1">{config.emoji}</Text>
            <Text className="text-xs font-bold" style={{ color: config.color }}>{config.label}</Text>
          </View>
        </View>

        {/* Content */}
        <View className="px-4 py-3">
          {/* Quick Stats Row */}
          <View className="flex-row items-center mb-2">
            {contract.include_monetary_amount && contract.monetary_amount && (
              <View className="flex-row items-center mr-4">
                <CreditCard size={13} color="#9CA3AF" />
                <Text className="text-gray-500 text-xs ml-1">₱{contract.monetary_amount?.toLocaleString()}</Text>
              </View>
            )}
            {contract.share_offspring && (
              <View className="flex-row items-center mr-4">
                <Baby size={13} color="#9CA3AF" />
                <Text className="text-gray-500 text-xs ml-1">Offspring split</Text>
              </View>
            )}
            {contract.end_contract_date && (
              <View className="flex-row items-center">
                <Clock size={13} color="#9CA3AF" />
                <Text className="text-gray-500 text-xs ml-1">{dayjs(contract.end_contract_date).format("MMM D")}</Text>
              </View>
            )}
          </View>

          {/* Next Action */}
          {nextAction && (
            <View className="bg-[#FFF5F3] rounded-xl px-3 py-2.5 flex-row items-center">
              <Text className="mr-2">{nextAction.emoji}</Text>
              <Text className="text-[#FF6B6B] text-xs font-semibold flex-1">{nextAction.text}</Text>
              <ChevronRight size={14} color="#FF6B6B" />
            </View>
          )}
        </View>

        {/* View Details Footer */}
        <View className="border-t border-gray-50 px-4 py-2.5 flex-row items-center justify-center">
          <Text className="text-[#FF6B6B] font-semibold text-sm">View Contract Details</Text>
          <ChevronRight size={16} color="#FF6B6B" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
