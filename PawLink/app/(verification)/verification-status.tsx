import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useSession } from "@/context/AuthContext";
import {
  getVerificationStatus,
  type VerificationStatus,
} from "@/services/verificationService";
import dayjs from "dayjs";

type DocumentType = "id" | "breeder_certificate" | "shooter_certificate";

interface DocumentConfig {
  type: DocumentType;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  bgColor: string;
  iconColor: string;
  description: string;
}

const DOCUMENT_CONFIGS: DocumentConfig[] = [
  {
    type: "id",
    title: "ID Document",
    icon: "credit-card",
    bgColor: "bg-[#FF6B4A]/10",
    iconColor: "#FF6B4A",
    description: "Government-issued ID for identity verification",
  },
  {
    type: "breeder_certificate",
    title: "Breeder License",
    icon: "award",
    bgColor: "bg-amber-100",
    iconColor: "#D97706",
    description: "Official breeder certification document",
  },
  {
    type: "shooter_certificate",
    title: "Shooter Certificate",
    icon: "file-text",
    bgColor: "bg-blue-100",
    iconColor: "#2563EB",
    description: "Professional shooter certification",
  },
];

export default function VerificationStatusScreen() {
  const router = useRouter();
  const { user } = useSession();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifications, setVerifications] = useState<VerificationStatus[]>([]);

  const fetchVerificationStatus = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getVerificationStatus(Number(user.id));
      setVerifications(data);
    } catch (error) {
      console.error("Error fetching verification status:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchVerificationStatus();
    }, [fetchVerificationStatus])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVerificationStatus();
    setRefreshing(false);
  };

  const getDocumentStatus = (type: DocumentType): VerificationStatus | null => {
    return verifications.find((v) => v.auth_type === type) || null;
  };

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "approved":
        return {
          text: "Verified",
          bgColor: "bg-green-100",
          textColor: "text-green-700",
          icon: "check-circle" as const,
          iconColor: "#16A34A",
        };
      case "pending":
        return {
          text: "Under Review",
          bgColor: "bg-amber-100",
          textColor: "text-amber-700",
          icon: "clock" as const,
          iconColor: "#D97706",
        };
      case "rejected":
        return {
          text: "Rejected",
          bgColor: "bg-red-100",
          textColor: "text-red-700",
          icon: "x-circle" as const,
          iconColor: "#DC2626",
        };
      default:
        return {
          text: "Not Submitted",
          bgColor: "bg-gray-100",
          textColor: "text-gray-500",
          icon: "upload" as const,
          iconColor: "#6B7280",
        };
    }
  };

  const handleResubmit = (doc: VerificationStatus) => {
    const docTypeLabel =
      doc.auth_type === "id"
        ? "ID Document"
        : doc.auth_type === "breeder_certificate"
        ? "Breeder License"
        : "Shooter Certificate";

    router.push({
      pathname: "/(verification)/resubmit-user-verification",
      params: {
        authId: doc.auth_id.toString(),
        authType: doc.auth_type,
        documentType: docTypeLabel,
      },
    });
  };

  const handleSubmitNew = () => {
    router.push("/(verification)/verify");
  };

  const handleAddCertificate = (type: "breeder" | "shooter") => {
    router.push({
      pathname: "/(verification)/add-certificate" as any,
      params: { type },
    });
  };

  // Calculate summary stats
  const approvedCount = verifications.filter((v) => v.status === "approved").length;
  const pendingCount = verifications.filter((v) => v.status === "pending").length;
  const rejectedCount = verifications.filter((v) => v.status === "rejected").length;
  const totalSubmitted = verifications.length;

  const getSummaryMessage = () => {
    if (totalSubmitted === 0) {
      return "No documents submitted yet";
    }
    if (rejectedCount > 0) {
      return `${rejectedCount} document${rejectedCount > 1 ? "s" : ""} need${rejectedCount === 1 ? "s" : ""} attention`;
    }
    if (pendingCount > 0) {
      return `${pendingCount} document${pendingCount > 1 ? "s" : ""} under review`;
    }
    if (approvedCount === totalSubmitted) {
      return "All documents verified!";
    }
    return `${approvedCount} of ${totalSubmitted} verified`;
  };

  const getSummaryColor = () => {
    if (rejectedCount > 0) return { bg: "bg-red-500", text: "text-white" };
    if (pendingCount > 0) return { bg: "bg-amber-500", text: "text-white" };
    if (approvedCount > 0) return { bg: "bg-green-500", text: "text-white" };
    return { bg: "bg-gray-200", text: "text-gray-700" };
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FFF5F5] items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B4A" />
        <Text className="mt-4 text-gray-500">Loading verification status...</Text>
      </SafeAreaView>
    );
  }

  const summaryColors = getSummaryColor();

  return (
    <SafeAreaView className="flex-1 bg-[#FFF5F5]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 pt-4 pb-6 bg-white rounded-b-[35px] shadow-lg">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Feather name="arrow-left" size={20} color="#374151" />
            </TouchableOpacity>
            <View className="ml-4">
              <Text className="text-2xl font-bold text-gray-900">Verification</Text>
              <Text className="text-sm text-gray-500">Document Status</Text>
            </View>
          </View>
          <View className="w-10 h-10 rounded-full bg-[#FF6B4A]/10 items-center justify-center">
            <Feather name="shield" size={20} color="#FF6B4A" />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B4A"]} />
        }
      >
        <View className="px-5 pt-6">
          {/* Summary Banner */}
          <View className={`${summaryColors.bg} rounded-2xl p-5 mb-6`}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className={`text-lg font-bold ${summaryColors.text}`}>
                  {getSummaryMessage()}
                </Text>
                <Text className={`text-sm ${summaryColors.text} opacity-80 mt-1`}>
                  {totalSubmitted > 0
                    ? `${approvedCount} verified, ${pendingCount} pending, ${rejectedCount} rejected`
                    : "Submit your documents to get verified"}
                </Text>
              </View>
              <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
                <Feather
                  name={rejectedCount > 0 ? "alert-circle" : pendingCount > 0 ? "clock" : approvedCount > 0 ? "check-circle" : "file-plus"}
                  size={28}
                  color="white"
                />
              </View>
            </View>
          </View>

          {/* Document Cards */}
          <Text className="text-lg font-bold text-gray-900 mb-4">Your Documents</Text>

          {DOCUMENT_CONFIGS.map((config) => {
            const doc = getDocumentStatus(config.type);
            const statusInfo = getStatusBadge(doc?.status);
            const isRejected = doc?.status === "rejected";
            const isApproved = doc?.status === "approved";
            const isPending = doc?.status === "pending";
            const notSubmitted = !doc;

            return (
              <View
                key={config.type}
                className={`bg-white rounded-3xl p-5 mb-4 border-2 ${
                  isRejected
                    ? "border-red-200"
                    : isApproved
                    ? "border-green-200"
                    : isPending
                    ? "border-amber-200"
                    : "border-dashed border-gray-200"
                }`}
              >
                {/* Card Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center flex-1">
                    <View
                      className={`w-12 h-12 rounded-2xl ${config.bgColor} items-center justify-center`}
                    >
                      <Feather name={config.icon} size={24} color={config.iconColor} />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-bold text-gray-900">{config.title}</Text>
                      <Text className="text-xs text-gray-500 mt-0.5">{config.description}</Text>
                    </View>
                  </View>
                  {/* Status Badge */}
                  <View className={`${statusInfo.bgColor} px-3 py-1.5 rounded-full flex-row items-center`}>
                    <Feather name={statusInfo.icon} size={12} color={statusInfo.iconColor} />
                    <Text className={`text-xs font-semibold ${statusInfo.textColor} ml-1`}>
                      {statusInfo.text}
                    </Text>
                  </View>
                </View>

                {/* Document Details (if submitted) */}
                {doc && (
                  <View className="bg-gray-50 rounded-xl p-3 mb-3">
                    <View className="flex-row flex-wrap">
                      {doc.document_name && (
                        <View className="w-1/2 mb-2">
                          <Text className="text-xs text-gray-400">Name</Text>
                          <Text className="text-sm text-gray-700 font-medium">{doc.document_name}</Text>
                        </View>
                      )}
                      {doc.document_number && (
                        <View className="w-1/2 mb-2">
                          <Text className="text-xs text-gray-400">Number</Text>
                          <Text className="text-sm text-gray-700 font-medium">{doc.document_number}</Text>
                        </View>
                      )}
                      <View className="w-1/2">
                        <Text className="text-xs text-gray-400">Submitted</Text>
                        <Text className="text-sm text-gray-700 font-medium">
                          {dayjs(doc.date_created).format("MMM D, YYYY")}
                        </Text>
                      </View>
                      {doc.expiry_date && (
                        <View className="w-1/2">
                          <Text className="text-xs text-gray-400">Expires</Text>
                          <Text className="text-sm text-gray-700 font-medium">
                            {dayjs(doc.expiry_date).format("MMM D, YYYY")}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Rejection Reason */}
                {isRejected && doc?.rejection_reason && (
                  <View className="bg-red-50 rounded-xl p-3 mb-3 flex-row items-start">
                    <Feather name="alert-circle" size={16} color="#DC2626" />
                    <View className="ml-2 flex-1">
                      <Text className="text-xs font-semibold text-red-800">Rejection Reason</Text>
                      <Text className="text-sm text-red-700 mt-0.5">{doc.rejection_reason}</Text>
                    </View>
                  </View>
                )}

                {/* Action Button */}
                {isRejected && doc && (
                  <TouchableOpacity
                    className="bg-[#FF6B4A] rounded-xl py-3 flex-row items-center justify-center"
                    onPress={() => handleResubmit(doc)}
                  >
                    <Feather name="upload-cloud" size={18} color="white" />
                    <Text className="text-white font-bold ml-2">Resubmit Document</Text>
                  </TouchableOpacity>
                )}

                {notSubmitted && config.type === "id" && (
                  <TouchableOpacity
                    className="bg-[#FF6B4A] rounded-xl py-3 flex-row items-center justify-center"
                    onPress={handleSubmitNew}
                  >
                    <Feather name="plus" size={18} color="white" />
                    <Text className="text-white font-bold ml-2">Submit Document</Text>
                  </TouchableOpacity>
                )}

                {notSubmitted && config.type !== "id" && (
                  <TouchableOpacity
                    className="bg-gray-100 rounded-xl py-3 flex-row items-center justify-center border border-dashed border-gray-300"
                    onPress={() => handleAddCertificate(config.type === "breeder_certificate" ? "breeder" : "shooter")}
                  >
                    <Feather name="plus" size={18} color="#6B7280" />
                    <Text className="text-gray-600 font-semibold ml-2">Add Certificate (Optional)</Text>
                  </TouchableOpacity>
                )}

                {isPending && (
                  <View className="bg-amber-50 rounded-xl py-3 flex-row items-center justify-center">
                    <Feather name="clock" size={18} color="#D97706" />
                    <Text className="text-amber-700 font-semibold ml-2">Review in progress...</Text>
                  </View>
                )}

                {isApproved && (
                  <View className="bg-green-50 rounded-xl py-3 flex-row items-center justify-center">
                    <Feather name="check-circle" size={18} color="#16A34A" />
                    <Text className="text-green-700 font-semibold ml-2">Document Verified</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Help Section */}
          <View className="bg-white rounded-2xl p-4 mt-2 flex-row items-start">
            <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
              <Feather name="help-circle" size={20} color="#2563EB" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm font-semibold text-gray-900">Need Help?</Text>
              <Text className="text-xs text-gray-500 mt-1">
                ID verification is required to add pets. Breeder and shooter certificates are optional
                but unlock additional features.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
