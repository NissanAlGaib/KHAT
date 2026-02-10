import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import {
  blockUser,
  unblockUser,
  reportUser,
  getReportReasons,
  getBlockStatus,
  type ReportReason,
  type BlockStatus,
} from "@/services/safetyService";

interface BlockReportModalProps {
  visible: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  onBlockSuccess?: () => void;
}

export default function BlockReportModal({
  visible,
  onClose,
  userId,
  userName,
  onBlockSuccess,
}: BlockReportModalProps) {
  const [activeTab, setActiveTab] = useState<"block" | "report">("block");
  const [loading, setLoading] = useState(false);
  const [blockStatus, setBlockStatus] = useState<BlockStatus>({
    is_blocked: false,
    is_blocked_by: false,
  });
  const [reportReasons, setReportReasons] = useState<ReportReason[]>([]);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [fetchingStatus, setFetchingStatus] = useState(true);
  const { visible: alertVisible, alertOptions, showAlert, hideAlert } = useAlert();

  useEffect(() => {
    if (visible && userId) {
      fetchData();
    }
  }, [visible, userId]);

  const fetchData = async () => {
    setFetchingStatus(true);
    try {
      const [status, reasons] = await Promise.all([
        getBlockStatus(userId),
        getReportReasons(),
      ]);
      setBlockStatus(status);
      setReportReasons(reasons);
    } catch (error) {
      console.error("Error fetching safety data:", error);
    } finally {
      setFetchingStatus(false);
    }
  };

  const handleBlock = () => {
    showAlert({
      title: "Block User",
      message: `Are you sure you want to block ${userName}? You won't be able to see their pets in matching or receive messages from them.`,
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => confirmBlock(),
        },
      ],
    });
  };

  const confirmBlock = async () => {
    setLoading(true);
    const result = await blockUser(userId);
    setLoading(false);

    if (result.success) {
      showAlert({
        title: "Blocked",
        message: `${userName} has been blocked.`,
        type: "success",
        buttons: [
          {
            text: "OK",
            style: "default",
            onPress: () => {
              onBlockSuccess?.();
              onClose();
            },
          },
        ],
      });
      setBlockStatus({ ...blockStatus, is_blocked: true });
    } else {
      showAlert({
        title: "Error",
        message: result.message,
        type: "error",
      });
    }
  };

  const handleUnblock = async () => {
    setLoading(true);
    const result = await unblockUser(userId);
    setLoading(false);

    if (result.success) {
      showAlert({
        title: "Unblocked",
        message: `${userName} has been unblocked.`,
        type: "success",
      });
      setBlockStatus({ ...blockStatus, is_blocked: false });
    } else {
      showAlert({
        title: "Error",
        message: result.message,
        type: "error",
      });
    }
  };

  const handleReport = async () => {
    if (!selectedReason) {
      showAlert({
        title: "Error",
        message: "Please select a reason for your report.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    const result = await reportUser(userId, selectedReason, description);
    setLoading(false);

    if (result.success) {
      showAlert({
        title: "Report Submitted",
        message: "Thank you for your report. Our team will review it shortly.",
        type: "success",
        buttons: [{ text: "OK", style: "default", onPress: onClose }],
      });
      setSelectedReason("");
      setDescription("");
    } else {
      showAlert({
        title: "Error",
        message: result.message,
        type: "error",
      });
    }
  };

  const handleClose = () => {
    setActiveTab("block");
    setSelectedReason("");
    setDescription("");
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
            <Text className="text-lg font-bold">Safety Options</Text>
            <TouchableOpacity onPress={handleClose}>
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View className="flex-row border-b border-gray-100">
            <TouchableOpacity
              className={`flex-1 py-3 items-center ${
                activeTab === "block" ? "border-b-2 border-[#FF6B6B]" : ""
              }`}
              onPress={() => setActiveTab("block")}
            >
              <Text
                className={`font-medium ${
                  activeTab === "block" ? "text-[#FF6B6B]" : "text-gray-500"
                }`}
              >
                Block
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 items-center ${
                activeTab === "report" ? "border-b-2 border-[#FF6B6B]" : ""
              }`}
              onPress={() => setActiveTab("report")}
            >
              <Text
                className={`font-medium ${
                  activeTab === "report" ? "text-[#FF6B6B]" : "text-gray-500"
                }`}
              >
                Report
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="px-4 py-4">
            {fetchingStatus ? (
              <View className="items-center py-8">
                <ActivityIndicator size="large" color="#FF6B6B" />
              </View>
            ) : activeTab === "block" ? (
              /* Block Tab */
              <View>
                {blockStatus.is_blocked_by && (
                  <View className="bg-yellow-50 p-4 rounded-xl mb-4">
                    <View className="flex-row items-center">
                      <Feather name="alert-triangle" size={20} color="#F59E0B" />
                      <Text className="text-yellow-700 ml-2 flex-1">
                        This user has blocked you.
                      </Text>
                    </View>
                  </View>
                )}

                {blockStatus.is_blocked ? (
                  <View>
                    <View className="bg-gray-50 p-4 rounded-xl mb-4">
                      <View className="flex-row items-center">
                        <Feather name="slash" size={20} color="#EF4444" />
                        <Text className="text-gray-700 ml-2 flex-1">
                          You have blocked {userName}.
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      className="bg-gray-200 py-3 px-6 rounded-xl items-center"
                      onPress={handleUnblock}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#666" />
                      ) : (
                        <Text className="text-gray-700 font-semibold">
                          Unblock {userName}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View>
                    <View className="bg-red-50 p-4 rounded-xl mb-4">
                      <Text className="text-gray-700 mb-2 font-medium">
                        What happens when you block someone:
                      </Text>
                      <View className="space-y-2">
                        <View className="flex-row items-start">
                          <Text className="text-red-500 mr-2">•</Text>
                          <Text className="text-gray-600 flex-1">
                            Their pets won't appear in your matching pool
                          </Text>
                        </View>
                        <View className="flex-row items-start">
                          <Text className="text-red-500 mr-2">•</Text>
                          <Text className="text-gray-600 flex-1">
                            You won't receive messages from them
                          </Text>
                        </View>
                        <View className="flex-row items-start">
                          <Text className="text-red-500 mr-2">•</Text>
                          <Text className="text-gray-600 flex-1">
                            They won't be able to see your pets
                          </Text>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity
                      className="bg-red-500 py-3 px-6 rounded-xl items-center"
                      onPress={handleBlock}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <View className="flex-row items-center">
                          <Feather name="slash" size={18} color="white" />
                          <Text className="text-white font-semibold ml-2">
                            Block {userName}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              /* Report Tab */
              <View>
                <Text className="text-gray-700 mb-4">
                  Help us keep PawLink safe. Select a reason for reporting{" "}
                  {userName}:
                </Text>

                {/* Reason Selection */}
                <View className="mb-4">
                  {reportReasons.map((reason) => (
                    <TouchableOpacity
                      key={reason.value}
                      className={`flex-row items-center p-4 rounded-xl mb-2 ${
                        selectedReason === reason.value
                          ? "bg-[#FFF5F5] border border-[#FF6B6B]"
                          : "bg-gray-50"
                      }`}
                      onPress={() => setSelectedReason(reason.value)}
                    >
                      <View
                        className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                          selectedReason === reason.value
                            ? "border-[#FF6B6B] bg-[#FF6B6B]"
                            : "border-gray-300"
                        }`}
                      >
                        {selectedReason === reason.value && (
                          <Feather name="check" size={12} color="white" />
                        )}
                      </View>
                      <Text
                        className={
                          selectedReason === reason.value
                            ? "text-[#FF6B6B] font-medium"
                            : "text-gray-700"
                        }
                      >
                        {reason.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Description */}
                <Text className="text-gray-600 mb-2">
                  Additional details (optional):
                </Text>
                <TextInput
                  className="bg-gray-50 rounded-xl p-4 min-h-[100px] text-gray-700 mb-4"
                  placeholder="Describe the issue..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                  maxLength={1000}
                />

                {/* Submit Button */}
                <TouchableOpacity
                  className={`py-3 px-6 rounded-xl items-center ${
                    selectedReason ? "bg-[#FF6B6B]" : "bg-gray-300"
                  }`}
                  onPress={handleReport}
                  disabled={loading || !selectedReason}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <View className="flex-row items-center">
                      <Feather name="flag" size={18} color="white" />
                      <Text className="text-white font-semibold ml-2">
                        Submit Report
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* Bottom padding for safe area */}
          <View className="h-8" />
        </View>
      </View>
    </Modal>

      <AlertModal
        visible={alertVisible}
        {...alertOptions}
        onClose={hideAlert}
      />
    </>
  );
}
