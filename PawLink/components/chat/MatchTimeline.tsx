import React from "react";
import { View, Text } from "react-native";
import {
  Heart,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Edit3,
  Activity,
  Award,
  AlertCircle,
} from "lucide-react-native";
import { type BreedingContract } from "@/services/contractService";

interface MatchTimelineProps {
  matchAcceptedAt?: string;
  contract: BreedingContract | null;
}

type IconComponent = React.ComponentType<{ size: number; color: string }>;

type TimelineStage = {
  key: string;
  label: string;
  status: "completed" | "current" | "upcoming";
  date?: string;
  Icon: IconComponent;
  color?: string;
};

export default function MatchTimeline({
  matchAcceptedAt,
  contract,
}: MatchTimelineProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return undefined;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getStages = (): TimelineStage[] => {
    const stages: TimelineStage[] = [];

    // Stage 1: Matched
    stages.push({
      key: "matched",
      label: "Matched",
      status: "completed",
      date: formatDate(matchAcceptedAt),
      Icon: Heart,
    });

    // Stage 2: Contract Sent
    if (contract) {
      stages.push({
        key: "contract_sent",
        label: "Contract",
        status: "completed",
        date: formatDate(contract.created_at),
        Icon: FileText,
      });
    } else {
      stages.push({
        key: "contract_sent",
        label: "Contract",
        status: "current",
        Icon: FileText,
      });
      return stages;
    }

    // Stage 3: Contract Signed
    const isContractSigned =
      contract.status === "accepted" || contract.status === "fulfilled";
    if (isContractSigned) {
      stages.push({
        key: "contract_signed",
        label: "Signed",
        status: "completed",
        date: formatDate(contract.accepted_at),
        Icon: CheckCircle,
      });
    } else if (contract.status === "pending_review") {
      stages.push({
        key: "contract_signed",
        label: "Pending",
        status: "current",
        Icon: Clock,
      });
      return stages;
    } else if (contract.status === "rejected") {
      stages.push({
        key: "contract_signed",
        label: "Rejected",
        status: "completed",
        Icon: XCircle,
        color: "#EF4444",
      });
      return stages;
    } else {
      stages.push({
        key: "contract_signed",
        label: "Signing",
        status: "upcoming",
        Icon: Edit3,
      });
      return stages;
    }

    // Stage 4: Breeding
    const breedingStatus = contract.breeding_status;
    if (breedingStatus === "completed" || breedingStatus === "failed") {
      stages.push({
        key: "breeding",
        label: "Breeding",
        status: "completed",
        date: formatDate(contract.breeding_completed_at),
        Icon: Activity,
      });
    } else if (breedingStatus === "in_progress") {
      stages.push({
        key: "breeding",
        label: "Breeding",
        status: "current",
        Icon: Activity,
      });
      return stages;
    } else {
      stages.push({
        key: "breeding",
        label: "Breeding",
        status: "upcoming",
        Icon: Activity,
      });
      return stages;
    }

    // Stage 5: Result
    if (breedingStatus === "completed") {
      stages.push({
        key: "result",
        label: "Success",
        status: "completed",
        Icon: Award,
        color: "#10B981",
      });
    } else if (breedingStatus === "failed") {
      stages.push({
        key: "result",
        label: "Failed",
        status: "completed",
        Icon: AlertCircle,
        color: "#EF4444",
      });
    }

    return stages;
  };

  const stages = getStages();

  const getStageColors = (stage: TimelineStage) => {
    if (stage.color) {
      return { circle: stage.color, text: stage.color };
    }
    switch (stage.status) {
      case "completed":
        return { circle: "#FF6B6B", text: "#FF6B6B" };
      case "current":
        return { circle: "#FF6B6B", text: "#FF6B6B" };
      case "upcoming":
        return { circle: "#E5E7EB", text: "#9CA3AF" };
    }
  };

  return (
    <View className="mx-4 my-3 bg-white rounded-2xl p-4 shadow-sm">
      <Text className="text-sm font-semibold text-gray-700 mb-4">
        Match Progress
      </Text>

      {/* Each stage is a flex-1 column; connectors sit between them */}
      <View className="flex-row items-start">
        {stages.map((stage, index) => {
          const colors = getStageColors(stage);
          const isLast = index === stages.length - 1;
          const nextStage = stages[index + 1];

          return (
            <React.Fragment key={stage.key}>
              {/* Stage column — flex-1 so all stages share equal width */}
              <View className="items-center" style={{ flex: 1 }}>
                {/* Circle */}
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.circle }}
                >
                  <stage.Icon
                    size={18}
                    color={stage.status === "upcoming" ? "#9CA3AF" : "white"}
                  />
                </View>

                {/* Label */}
                <Text
                  className="text-[11px] font-semibold mt-1.5 text-center"
                  style={{ color: colors.text }}
                  numberOfLines={1}
                >
                  {stage.label}
                </Text>
                {stage.date && (
                  <Text className="text-[10px] text-gray-400 mt-0.5">
                    {stage.date}
                  </Text>
                )}
              </View>

              {/* Connector line between stages (not after last) */}
              {!isLast && (
                <View
                  className="h-0.5 self-center"
                  style={{
                    flex: 0.6,
                    marginTop: -12,
                    backgroundColor:
                      nextStage?.status === "upcoming" ? "#E5E7EB" : "#FF6B6B",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}
