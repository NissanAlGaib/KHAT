import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import {
  FileText,
  ChevronRight,
  Clock,
  CreditCard,
  Baby,
  Shield,
  Heart,
} from "lucide-react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import { BreedingContract } from "@/services/contractService";
import { getStorageUrl } from "@/utils/imageUrl";

interface PetInfo {
  pet_id: number;
  name: string;
  photo_url?: string;
}

interface CompactContractCardProps {
  contract: BreedingContract;
  conversationId: number;
  pet1?: PetInfo | null;
  pet2?: PetInfo | null;
}

const statusConfig: Record<
  string,
  { label: string; emoji: string; color: string; bg: string }
> = {
  draft: { label: "Draft", emoji: "📝", color: "#6B7280", bg: "#F9FAFB" },
  pending_review: {
    label: "Pending Review",
    emoji: "⏳",
    color: "#eab308",
    bg: "#fefce8",
  },
  accepted: { label: "Active", emoji: "✅", color: "#16a34a", bg: "#f0fdf4" },
  rejected: { label: "Rejected", emoji: "❌", color: "#ef4444", bg: "#fef2f2" },
  fulfilled: {
    label: "Completed",
    emoji: "🎉",
    color: "#8b5cf6",
    bg: "#f5f3ff",
  },
};

// ─── Mini progress calculation ─────────────────────────────
function getProgressSteps(contract: BreedingContract): {
  total: number;
  completed: number;
} {
  const steps = [
    // 1. Created
    contract.status !== "draft",
    // 2. Accepted
    contract.status === "accepted" || contract.status === "fulfilled",
    // 3. Payment (simplified — just check if contract is active)
    contract.status === "accepted" || contract.status === "fulfilled",
    // 4. Breeding done
    contract.breeding_status === "completed" ||
      contract.breeding_status === "failed",
    // 5. Fulfilled
    contract.status === "fulfilled",
  ];
  return {
    total: steps.length,
    completed: steps.filter(Boolean).length,
  };
}

function getNextAction(
  contract: BreedingContract,
): { text: string; emoji: string } | null {
  const status = contract.status;

  if (status === "pending_review") {
    if (contract.can_accept) {
      return { text: "Review & accept the contract", emoji: "👀" };
    }
    return { text: "Waiting for other party to review", emoji: "⏳" };
  }

  if (status === "accepted") {
    const breedingStatus = contract.breeding_status || "pending";
    if (breedingStatus === "pending" || breedingStatus === "in_progress") {
      if (contract.can_mark_breeding_complete) {
        return { text: "Mark breeding as complete", emoji: "💕" };
      }
      return { text: "Breeding in progress", emoji: "💕" };
    }
    if (breedingStatus === "completed" && contract.has_offspring) {
      if (contract.can_input_offspring) {
        return { text: "Record or allocate offspring", emoji: "🐾" };
      }
      return { text: "Waiting for offspring recording", emoji: "🐾" };
    }
    if (breedingStatus === "failed") {
      return { text: "Breeding failed — review details", emoji: "😔" };
    }
    return null;
  }

  if (status === "fulfilled") {
    return { text: "Match completed!", emoji: "🎊" };
  }

  return null;
}

// ─── Breeding status pill ──────────────────────────────────
const breedingStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#eab308" },
  in_progress: { label: "In Progress", color: "#8b5cf6" },
  completed: { label: "Done", color: "#16a34a" },
  failed: { label: "Failed", color: "#ef4444" },
};

export default function CompactContractCard({
  contract,
  conversationId,
  pet1,
  pet2,
}: CompactContractCardProps) {
  const router = useRouter();
  const config = statusConfig[contract.status] || statusConfig.draft;
  const nextAction = getNextAction(contract);
  const progress = getProgressSteps(contract);
  const breedingStatus = contract.breeding_status || "pending";
  const breedingConfig = breedingStatusConfig[breedingStatus];

  const handlePress = () => {
    router.push({
      pathname: "/(chat)/contract-detail" as any,
      params: { conversationId: conversationId.toString() },
    });
  };

  const renderPetThumbnail = (
    pet: PetInfo | null | undefined,
    offset = false,
  ) => {
    const photoUrl = pet?.photo_url ? getStorageUrl(pet.photo_url) : null;
    return (
      <View
        className={`w-9 h-9 rounded-full bg-gray-200 items-center justify-center border-2 border-white ${offset ? "-ml-2.5" : ""}`}
      >
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            className="w-full h-full rounded-full"
          />
        ) : (
          <Feather name="image" size={14} color="#9CA3AF" />
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      className="mx-4 mb-3"
    >
      <View
        className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        style={{ elevation: 2 }}
      >
        {/* Header row: Pet thumbnails + title + status  */}
        <View className="px-4 py-3 flex-row items-center">
          {/* Pet thumbnails */}
          {(pet1 || pet2) && (
            <View className="flex-row mr-3">
              {renderPetThumbnail(pet1)}
              {renderPetThumbnail(pet2, true)}
            </View>
          )}

          <View className="flex-1">
            <View className="flex-row items-center">
              <FileText size={14} color="#FF6B6B" />
              <Text className="font-bold text-gray-800 text-sm ml-1.5">
                Breeding Contract
              </Text>
            </View>
            {pet1 && pet2 && (
              <Text className="text-gray-400 text-xs mt-0.5">
                {pet1.name} & {pet2.name}
              </Text>
            )}
          </View>

          {/* Status badge */}
          <View
            className="flex-row items-center px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${config.color}15` }}
          >
            <Text className="mr-1 text-xs">{config.emoji}</Text>
            <Text
              className="text-[10px] font-bold"
              style={{ color: config.color }}
            >
              {config.label}
            </Text>
          </View>
        </View>

        {/* Mini progress bar */}
        <View className="px-4 pb-1">
          <View className="flex-row items-center">
            <View className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full bg-[#FF6B6B] rounded-full"
                style={{
                  width: `${(progress.completed / progress.total) * 100}%`,
                }}
              />
            </View>
            <Text className="text-[10px] text-gray-400 ml-2">
              {progress.completed}/{progress.total}
            </Text>
          </View>
        </View>

        {/* Key terms row */}
        <View className="px-4 py-2 flex-row items-center flex-wrap">
          {contract.include_monetary_amount && contract.monetary_amount ? (
            <View className="flex-row items-center mr-3 mb-1">
              <CreditCard size={12} color="#9CA3AF" />
              <Text className="text-gray-500 text-[11px] ml-1">
                ₱{contract.monetary_amount?.toLocaleString()}
              </Text>
            </View>
          ) : null}
          {contract.share_offspring && (
            <View className="flex-row items-center mr-3 mb-1">
              <Baby size={12} color="#9CA3AF" />
              <Text className="text-gray-500 text-[11px] ml-1">
                Offspring split
              </Text>
            </View>
          )}
          {contract.collateral_total > 0 && (
            <View className="flex-row items-center mr-3 mb-1">
              <Shield size={12} color="#9CA3AF" />
              <Text className="text-gray-500 text-[11px] ml-1">
                ₱{contract.collateral_total?.toLocaleString()} collateral
              </Text>
            </View>
          )}
          {contract.end_contract_date && (
            <View className="flex-row items-center mr-3 mb-1">
              <Clock size={12} color="#9CA3AF" />
              <Text className="text-gray-500 text-[11px] ml-1">
                {dayjs(contract.end_contract_date).format("MMM D")}
              </Text>
            </View>
          )}
          {contract.status === "accepted" && breedingConfig && (
            <View className="flex-row items-center mb-1">
              <Heart size={12} color={breedingConfig.color} />
              <Text
                className="text-[11px] ml-1 font-medium"
                style={{ color: breedingConfig.color }}
              >
                {breedingConfig.label}
              </Text>
            </View>
          )}
        </View>

        {/* Next Action */}
        {nextAction && (
          <View className="mx-4 mb-3 bg-[#FFF5F3] rounded-xl px-3 py-2 flex-row items-center">
            <Text className="mr-2 text-sm">{nextAction.emoji}</Text>
            <Text className="text-[#FF6B6B] text-xs font-semibold flex-1">
              {nextAction.text}
            </Text>
            <ChevronRight size={14} color="#FF6B6B" />
          </View>
        )}

        {/* View Details Footer */}
        <View className="border-t border-gray-50 px-4 py-2 flex-row items-center justify-center">
          <Text className="text-[#FF6B6B] font-semibold text-xs">
            View Contract Details
          </Text>
          <ChevronRight size={14} color="#FF6B6B" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
