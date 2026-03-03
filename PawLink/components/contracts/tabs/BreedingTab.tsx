import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import {
  Heart,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Baby,
  Clock,
  FileText,
} from "lucide-react-native";
import dayjs from "dayjs";
import {
  BreedingContract,
  BreedingCompletionData,
  completeBreeding,
} from "@/services/contractService";

interface BreedingTabProps {
  contract: BreedingContract;
  onContractUpdate: (updated: BreedingContract) => void;
  bothCollateralPaid?: boolean;
}

const statusConfig: Record<
  string,
  { icon: string; label: string; color: string; bg: string }
> = {
  pending: { icon: "clock", label: "Pending", color: "#eab308", bg: "#fefce8" },
  in_progress: {
    icon: "heart",
    label: "In Progress",
    color: "#8b5cf6",
    bg: "#f5f3ff",
  },
  completed: {
    icon: "check",
    label: "Completed",
    color: "#16a34a",
    bg: "#f0fdf4",
  },
  failed: { icon: "x", label: "Failed", color: "#ef4444", bg: "#fef2f2" },
};

export default function ContractBreedingTab({
  contract,
  onContractUpdate,
  bothCollateralPaid = true,
}: BreedingTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"completed" | "failed">("completed");
  const [hasOffspring, setHasOffspring] = useState(true);
  const [breedingNotes, setBreedingNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    visible: alertVisible,
    alertOptions,
    showAlert,
    hideAlert,
  } = useAlert();

  const breedingStatus = contract.breeding_status || "pending";
  const config = statusConfig[breedingStatus] || statusConfig.pending;

  const handleSubmit = async () => {
    if (!breedingNotes.trim()) {
      showAlert({
        title: "Required",
        message: "Please provide notes about the breeding outcome.",
        type: "error",
      });
      return;
    }

    const action = formType === "completed" ? "complete" : "mark as failed";
    showAlert({
      title: `Confirm ${formType === "completed" ? "Completion" : "Failure"}`,
      message: `Are you sure you want to ${action} the breeding? This cannot be undone.`,
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Proceed",
          style: "default",
          onPress: async () => {
            hideAlert();
            setIsSubmitting(true);
            try {
              const data: BreedingCompletionData = {
                breeding_status: formType,
                has_offspring: formType === "completed" ? hasOffspring : false,
                breeding_notes: breedingNotes,
              };

              const result = await completeBreeding(contract.id, data);
              if (result.success) {
                showAlert({
                  title:
                    formType === "completed"
                      ? "Breeding Complete!"
                      : "Breeding Marked as Failed",
                  message:
                    result.message ||
                    (formType === "completed"
                      ? "The breeding has been marked as complete."
                      : "The breeding has been recorded as failed."),
                  type: formType === "completed" ? "success" : "error",
                });
                setShowForm(false);
                setBreedingNotes("");
                if (result.data) onContractUpdate(result.data);
                else onContractUpdate(contract);
              } else {
                showAlert({
                  title: "Error",
                  message:
                    result.message || "Failed to update breeding status.",
                  type: "error",
                });
              }
            } catch (error) {
              showAlert({
                title: "Error",
                message: "Something went wrong.",
                type: "error",
              });
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ],
    });
  };

  if (contract.status !== "accepted" && contract.status !== "fulfilled") {
    return (
      <View className="items-center justify-center py-16 px-6">
        <Heart size={40} color="#8b5cf6" />
        <Text className="text-gray-800 font-bold text-lg mb-2 text-center mt-3">
          Breeding Not Started
        </Text>
        <Text className="text-gray-500 text-sm text-center">
          Contract must be accepted before breeding can begin.
        </Text>
      </View>
    );
  }

  return (
    <View className="px-4 pt-3">
      {/* Collateral payment warning */}
      {!bothCollateralPaid &&
        breedingStatus !== "completed" &&
        breedingStatus !== "failed" && (
          <View className="bg-amber-50 rounded-2xl p-4 mb-4 border border-amber-200 flex-row items-start">
            <AlertTriangle size={18} color="#d97706" />
            <View className="flex-1 ml-2">
              <Text className="text-amber-800 font-semibold text-sm">
                Collateral Not Fully Paid
              </Text>
              <Text className="text-amber-700 text-xs mt-0.5">
                Both parties must pay their collateral deposit before breeding
                can be marked as complete or failed. Go to the Payments tab to
                complete your payment.
              </Text>
            </View>
          </View>
        )}

      {/* Current Status Banner */}
      <View
        className="rounded-2xl p-5 mb-5 border"
        style={{ backgroundColor: config.bg, borderColor: `${config.color}30` }}
      >
        <View className="items-center">
          {config.icon === "clock" && <Clock size={36} color={config.color} />}
          {config.icon === "heart" && <Heart size={36} color={config.color} />}
          {config.icon === "check" && (
            <CheckCircle2 size={36} color={config.color} />
          )}
          {config.icon === "x" && <XCircle size={36} color={config.color} />}
          <Text
            className="font-bold text-lg mt-2"
            style={{ color: config.color }}
          >
            Breeding {config.label}
          </Text>
          {contract.breeding_completed_at && (
            <Text className="text-sm mt-1" style={{ color: config.color }}>
              {breedingStatus === "completed" ? "Completed" : "Recorded"} on{" "}
              {dayjs(contract.breeding_completed_at).format("MMM D, YYYY")}
            </Text>
          )}
        </View>
      </View>

      {/* Breeding Notes (if exists) */}
      {contract.breeding_notes && (
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <View className="flex-row items-center mb-1">
            <FileText size={16} color="#374151" />
            <Text className="font-bold text-gray-800 text-sm ml-1.5">
              Breeding Notes
            </Text>
          </View>
          <Text className="text-gray-600 text-sm">
            {contract.breeding_notes}
          </Text>
        </View>
      )}

      {/* Offspring Status */}
      {breedingStatus === "completed" && (
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <View className="flex-row items-center">
            <Baby size={18} color="#FF6B6B" />
            <Text className="font-bold text-gray-800 text-sm ml-2">
              Offspring Status
            </Text>
          </View>
          <View className="flex-row items-center mt-2">
            {contract.has_offspring ? (
              <>
                <CheckCircle2 size={16} color="#16a34a" />
                <Text className="text-green-700 text-sm ml-2">
                  Offspring expected — go to the Offspring tab to record them
                </Text>
              </>
            ) : (
              <>
                <XCircle size={16} color="#eab308" />
                <Text className="text-yellow-700 text-sm ml-2">
                  No offspring from this breeding
                </Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* Info Card for who can mark */}
      {contract.can_mark_breeding_complete &&
        breedingStatus !== "completed" &&
        breedingStatus !== "failed" && (
          <View className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100">
            <Text className="text-blue-800 text-sm">
              As the {contract.is_shooter ? "shooter" : "sire pet owner"}, you
              can mark the breeding as complete or failed once the process is
              done.
            </Text>
          </View>
        )}

      {/* Action Buttons */}
      {contract.can_mark_breeding_complete &&
        breedingStatus !== "completed" &&
        breedingStatus !== "failed" &&
        !showForm && (
          <View className="mb-4">
            {!bothCollateralPaid && (
              <Text className="text-amber-600 text-xs text-center mb-2 font-medium">
                Buttons disabled until both parties pay collateral
              </Text>
            )}
            <TouchableOpacity
              onPress={() => {
                setFormType("completed");
                setShowForm(true);
                setHasOffspring(true);
              }}
              disabled={!bothCollateralPaid}
              className={`py-4 rounded-2xl flex-row items-center justify-center mb-3 ${
                !bothCollateralPaid ? "bg-gray-300" : "bg-[#FF6B6B]"
              }`}
            >
              <CheckCircle2 size={20} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                Mark Breeding as Complete
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setFormType("failed");
                setShowForm(true);
                setHasOffspring(false);
              }}
              disabled={!bothCollateralPaid}
              className={`py-4 rounded-2xl flex-row items-center justify-center border-2 ${
                !bothCollateralPaid
                  ? "bg-gray-100 border-gray-200"
                  : "bg-white border-red-300"
              }`}
            >
              <XCircle size={20} color="#ef4444" />
              <Text className="text-red-500 font-bold text-base ml-2">
                Mark as Failed
              </Text>
            </TouchableOpacity>
          </View>
        )}

      {/* Completion Form */}
      {showForm && (
        <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
          <Text className="font-bold text-gray-800 text-base mb-4">
            {formType === "completed" ? "Breeding Complete" : "Breeding Failed"}
          </Text>

          {formType === "completed" && (
            <View className="mb-4">
              <Text className="font-semibold text-gray-700 text-sm mb-2">
                Were there any offspring?
              </Text>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={() => setHasOffspring(true)}
                  className={`flex-1 py-3 rounded-l-2xl border-2 ${
                    hasOffspring
                      ? "bg-green-500 border-green-500"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${hasOffspring ? "text-white" : "text-gray-600"}`}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setHasOffspring(false)}
                  className={`flex-1 py-3 rounded-r-2xl border-2 border-l-0 ${
                    !hasOffspring
                      ? "bg-gray-500 border-gray-500"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`text-center font-semibold ${!hasOffspring ? "text-white" : "text-gray-600"}`}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View className="mb-4">
            <Text className="font-semibold text-gray-700 text-sm mb-1">
              Notes *
            </Text>
            <TextInput
              className="bg-gray-100 rounded-xl px-4 py-3 text-base min-h-[80px]"
              placeholder={
                formType === "completed"
                  ? "Describe the breeding outcome..."
                  : "Explain why the breeding was unsuccessful..."
              }
              placeholderTextColor="#9CA3AF"
              value={breedingNotes}
              onChangeText={setBreedingNotes}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View className="flex-row">
            <TouchableOpacity
              onPress={() => {
                setShowForm(false);
                setBreedingNotes("");
              }}
              className="flex-1 bg-gray-200 py-3.5 rounded-2xl mr-2"
            >
              <Text className="text-center font-semibold text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 py-3.5 rounded-2xl ${
                formType === "completed"
                  ? isSubmitting
                    ? "bg-gray-400"
                    : "bg-green-500"
                  : isSubmitting
                    ? "bg-gray-400"
                    : "bg-red-500"
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-center font-bold text-white">
                  {formType === "completed" ? "Confirm" : "Confirm"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Not authorized message */}
      {!contract.can_mark_breeding_complete &&
        breedingStatus !== "completed" &&
        breedingStatus !== "failed" && (
          <View className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <View className="flex-row items-center">
              <Clock size={16} color="#9CA3AF" />
              <Text className="text-gray-500 text-sm ml-2">
                Waiting for the{" "}
                {contract.shooter_user_id ? "shooter" : "sire pet owner"} to
                mark breeding status.
              </Text>
            </View>
          </View>
        )}

      <AlertModal
        visible={alertVisible}
        {...alertOptions}
        onClose={hideAlert}
      />
    </View>
  );
}
