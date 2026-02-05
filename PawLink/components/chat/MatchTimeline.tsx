import React from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { type BreedingContract } from "@/services/contractService";

interface MatchTimelineProps {
  matchAcceptedAt?: string;
  contract: BreedingContract | null;
}

type TimelineStage = {
  key: string;
  label: string;
  status: "completed" | "current" | "upcoming";
  date?: string;
  icon: keyof typeof Feather.glyphMap;
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

    // Stage 1: Matched - Always completed if we're viewing
    stages.push({
      key: "matched",
      label: "Matched",
      status: "completed",
      date: formatDate(matchAcceptedAt),
      icon: "heart",
    });

    // Stage 2: Contract Sent
    if (contract) {
      stages.push({
        key: "contract_sent",
        label: "Contract",
        status: "completed",
        date: formatDate(contract.created_at),
        icon: "file-text",
      });
    } else {
      stages.push({
        key: "contract_sent",
        label: "Contract",
        status: "current",
        icon: "file-text",
      });
      return stages; // Stop here if no contract
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
        icon: "check-circle",
      });
    } else if (contract.status === "pending_review") {
      stages.push({
        key: "contract_signed",
        label: "Pending",
        status: "current",
        icon: "clock",
      });
      return stages;
    } else if (contract.status === "rejected") {
      stages.push({
        key: "contract_signed",
        label: "Rejected",
        status: "completed",
        icon: "x-circle",
        color: "#EF4444",
      });
      return stages;
    } else {
      stages.push({
        key: "contract_signed",
        label: "Signing",
        status: "upcoming",
        icon: "edit-3",
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
        icon: "activity",
      });
    } else if (breedingStatus === "in_progress") {
      stages.push({
        key: "breeding",
        label: "Breeding",
        status: "current",
        icon: "activity",
      });
      return stages;
    } else {
      stages.push({
        key: "breeding",
        label: "Breeding",
        status: "upcoming",
        icon: "activity",
      });
      return stages;
    }

    // Stage 5: Result
    if (breedingStatus === "completed") {
      stages.push({
        key: "result",
        label: "Success",
        status: "completed",
        icon: "award",
        color: "#10B981", // Green
      });
    } else if (breedingStatus === "failed") {
      stages.push({
        key: "result",
        label: "Failed",
        status: "completed",
        icon: "alert-circle",
        color: "#EF4444", // Red
      });
    }

    return stages;
  };

  const stages = getStages();

  const getStageStyle = (stage: TimelineStage) => {
    if (stage.color) {
      return {
        circleColor: stage.color,
        textColor: stage.color,
      };
    }

    switch (stage.status) {
      case "completed":
        return {
          circleColor: "#FF6B6B",
          textColor: "#FF6B6B",
        };
      case "current":
        return {
          circleColor: "#FF6B6B",
          textColor: "#FF6B6B",
        };
      case "upcoming":
        return {
          circleColor: "#D1D5DB",
          textColor: "#9CA3AF",
        };
    }
  };

  return (
    <View className="mx-4 my-3 bg-white rounded-2xl p-4 shadow-sm">
      <Text className="text-sm font-semibold text-gray-700 mb-4">
        Match Progress
      </Text>

      <View className="flex-row items-start justify-between">
        {stages.map((stage, index) => {
          const style = getStageStyle(stage);
          const isLast = index === stages.length - 1;

          return (
            <View
              key={stage.key}
              className="items-center"
              style={{ flex: 1 }}
            >
              {/* Circle with icon */}
              <View className="relative">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: style.circleColor }}
                >
                  {stage.status === "completed" ? (
                    <Feather
                      name={stage.icon}
                      size={18}
                      color="white"
                    />
                  ) : stage.status === "current" ? (
                    <Feather name={stage.icon} size={18} color="white" />
                  ) : (
                    <Feather name={stage.icon} size={18} color="#9CA3AF" />
                  )}
                </View>

                {/* Connecting line */}
                {!isLast && (
                  <View
                    className="absolute top-5 left-10 h-0.5"
                    style={{
                      width: 40,
                      backgroundColor:
                        stages[index + 1]?.status === "upcoming"
                          ? "#E5E7EB"
                          : "#FF6B6B",
                    }}
                  />
                )}
              </View>

              {/* Label */}
              <Text
                className="text-xs font-medium mt-2 text-center"
                style={{ color: style.textColor }}
                numberOfLines={1}
              >
                {stage.label}
              </Text>

              {/* Date */}
              {stage.date && (
                <Text className="text-xs text-gray-400 mt-0.5">
                  {stage.date}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
