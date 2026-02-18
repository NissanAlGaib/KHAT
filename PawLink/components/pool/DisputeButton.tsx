import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  createDispute,
  getDisputeStatusLabel,
  getDisputeStatusColor,
  isDisputeActive,
  Dispute,
} from "@/services/disputeService";
import { formatPoolAmount } from "@/services/poolService";

interface DisputeButtonProps {
  contractId: number;
  contractStatus: string;
  existingDispute?: Dispute | null;
  onDisputeFiled?: (dispute: Dispute) => void;
}

/**
 * Inline dispute filing button + status for contract views.
 */
export default function DisputeButton({
  contractId,
  contractStatus,
  existingDispute,
  onDisputeFiled,
}: DisputeButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Can only file dispute on accepted contracts without existing active disputes
  const canFileDispute =
    contractStatus === "accepted" &&
    (!existingDispute || !isDisputeActive(existingDispute.status));

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert("Error", "Please provide a reason for the dispute.");
      return;
    }

    Alert.alert(
      "File Dispute",
      "Are you sure you want to file a dispute? This will freeze all funds in the contract pool until the dispute is resolved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "File Dispute",
          style: "destructive",
          onPress: async () => {
            setSubmitting(true);
            const result = await createDispute({
              contract_id: contractId,
              reason: reason.trim(),
            });
            setSubmitting(false);

            if (result.success && result.data) {
              setShowForm(false);
              setReason("");
              Alert.alert(
                "Dispute Filed",
                "Your dispute has been filed and contract funds have been frozen. An admin will review your case.",
              );
              onDisputeFiled?.(result.data);
            } else {
              Alert.alert("Error", result.message);
            }
          },
        },
      ],
    );
  };

  // Show existing active dispute status
  if (existingDispute && isDisputeActive(existingDispute.status)) {
    const statusColor = getDisputeStatusColor(existingDispute.status);
    return (
      <View className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <View className="flex-row items-center gap-2 mb-2">
          <Feather name="alert-triangle" size={18} color="#F59E0B" />
          <Text className="text-sm font-bold text-yellow-800">
            Active Dispute
          </Text>
          <View className={`px-2 py-0.5 rounded-md ${statusColor.bg}`}>
            <Text className={`text-xs font-semibold ${statusColor.text}`}>
              {getDisputeStatusLabel(existingDispute.status)}
            </Text>
          </View>
        </View>
        <Text className="text-sm text-yellow-700" numberOfLines={3}>
          {existingDispute.reason}
        </Text>
        <Text className="text-xs text-yellow-600 mt-2">
          Filed{" "}
          {new Date(existingDispute.created_at).toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          . Funds are frozen until resolution.
        </Text>
      </View>
    );
  }

  // Show resolved dispute
  if (existingDispute && existingDispute.status === "resolved") {
    return (
      <View className="bg-green-50 rounded-xl p-4 border border-green-200">
        <View className="flex-row items-center gap-2 mb-2">
          <Feather name="check-circle" size={18} color="#22C55E" />
          <Text className="text-sm font-bold text-green-800">
            Dispute Resolved
          </Text>
        </View>
        {existingDispute.resolution_notes && (
          <Text className="text-sm text-green-700 mb-1">
            {existingDispute.resolution_notes}
          </Text>
        )}
        {existingDispute.resolved_amount && (
          <Text className="text-sm font-semibold text-green-800">
            Amount: {formatPoolAmount(existingDispute.resolved_amount)}
          </Text>
        )}
      </View>
    );
  }

  if (!canFileDispute) return null;

  // File dispute form
  if (showForm) {
    return (
      <View className="bg-white rounded-xl p-4 border border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-sm font-bold text-gray-900">
            File a Dispute
          </Text>
          <TouchableOpacity onPress={() => setShowForm(false)}>
            <Feather name="x" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <Text className="text-xs text-gray-500 mb-2">
          Filing a dispute will freeze all funds in the contract pool until an
          admin resolves it.
        </Text>

        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="Describe the issue in detail..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-800 mb-3 min-h-[100px]"
          editable={!submitting}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || !reason.trim()}
          className={`py-3 rounded-lg items-center ${
            submitting || !reason.trim() ? "bg-gray-200" : "bg-red-500"
          }`}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              className={`text-sm font-semibold ${
                !reason.trim() ? "text-gray-400" : "text-white"
              }`}
            >
              Submit Dispute
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  // File dispute button
  return (
    <TouchableOpacity
      onPress={() => setShowForm(true)}
      className="flex-row items-center justify-center gap-2 py-3 bg-gray-100 rounded-xl"
      activeOpacity={0.7}
    >
      <Feather name="alert-triangle" size={16} color="#6B7280" />
      <Text className="text-sm font-medium text-gray-600">File a Dispute</Text>
    </TouchableOpacity>
  );
}
