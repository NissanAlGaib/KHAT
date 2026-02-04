import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import DocumentUploader from "@/components/verification/DocumentUploader";
import AutoFilledInput from "@/components/verification/AutoFilledInput";
import axiosInstance from "@/config/axiosConfig";
import { useNotifications } from "@/context/NotificationContext";

export default function ResubmitUserVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const { refreshNotifications, refreshBadgeCount } = useNotifications();

  const authId = params.authId as string;
  const authType = params.authType as string;
  const documentType = params.documentType as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [document, setDocument] = useState<string | null>(null);
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [expirationDate, setExpirationDate] = useState<Date>(new Date());
  const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);

  const isIdDocument = authType === "id";
  const title = `Resubmit ${documentType || "Document"}`;

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDocumentIcon = () => {
    switch (authType) {
      case "id":
        return "credit-card";
      case "breeder_certificate":
        return "award";
      case "shooter_certificate":
        return "file-text";
      default:
        return "file";
    }
  };

  const getDocumentColor = () => {
    switch (authType) {
      case "id":
        return { bg: "bg-[#FF6B4A]/10", icon: "#FF6B4A" };
      case "breeder_certificate":
        return { bg: "bg-amber-100", icon: "#D97706" };
      case "shooter_certificate":
        return { bg: "bg-blue-100", icon: "#2563EB" };
      default:
        return { bg: "bg-gray-100", icon: "#6B7280" };
    }
  };

  const handleSubmit = async () => {
    if (!document) {
      showAlert({
        title: "Document Required",
        message: "Please upload a document to resubmit.",
        type: "warning",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get file extension from URI
      const uriParts = document.split(".");
      const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
      
      const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        pdf: "application/pdf",
      };
      
      const mimeType = mimeTypes[fileExtension] || "image/jpeg";
      const filename = `document_${Date.now()}.${fileExtension || "jpg"}`;

      const formData = new FormData();
      formData.append("document", {
        uri: document,
        name: filename,
        type: mimeType,
      } as any);

      if (documentNumber) formData.append("document_number", documentNumber);
      if (documentName) formData.append("document_name", documentName);
      if (issuingAuthority) formData.append("issuing_authority", issuingAuthority);
      formData.append("issue_date", issueDate.toISOString());
      formData.append("expiration_date", expirationDate.toISOString());

      await axiosInstance.post(`/api/verification/${authId}/resubmit`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Refresh notifications
      await refreshNotifications();
      await refreshBadgeCount();

      showAlert({
        title: "Success",
        message: "Your document has been resubmitted for review. We'll notify you once it's reviewed.",
        type: "success",
        buttons: [
          {
            text: "OK",
            onPress: () => router.back(),
            style: "default",
          },
        ],
      });
    } catch (error: any) {
      console.error("Error resubmitting document:", error);
      showAlert({
        title: "Error",
        message:
          error.response?.data?.message ||
          "Failed to resubmit document. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const colors = getDocumentColor();

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
              <Text className="text-2xl font-bold text-gray-900">Resubmit</Text>
              <Text className="text-sm text-gray-500">{documentType}</Text>
            </View>
          </View>
          <View className={`w-10 h-10 rounded-full ${colors.bg} items-center justify-center`}>
            <Feather name={getDocumentIcon() as any} size={20} color={colors.icon} />
          </View>
        </View>
      </View>

      {/* Loading Overlay */}
      {isSubmitting && (
        <View className="absolute inset-0 bg-black/50 z-50 items-center justify-center">
          <View className="bg-white p-6 rounded-2xl items-center">
            <ActivityIndicator size="large" color="#FF6B4A" />
            <Text className="mt-4 text-lg font-semibold">
              Submitting document...
            </Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-5 pt-6">
            {/* Info Banner */}
            <View className="bg-red-50 rounded-2xl p-4 mb-6 flex-row items-start">
              <Feather name="alert-circle" size={20} color="#DC2626" />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-semibold text-red-800">
                  Previous submission was rejected
                </Text>
                <Text className="text-sm text-red-700 mt-1">
                  Please upload a clear, valid document and ensure all information is correct.
                </Text>
              </View>
            </View>

            {/* Document Upload */}
            <View className="mb-6">
              <DocumentUploader
                value={document}
                onChange={setDocument}
                label="Upload New Document"
                placeholder="Take a clear photo of your document"
              />
            </View>

            {/* Document Information Card */}
            <View className="bg-white rounded-3xl p-5 shadow-sm mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Document Information
              </Text>

              {/* Name Input */}
              <AutoFilledInput
                label="Name on Document"
                value={documentName}
                onChangeText={setDocumentName}
                leftIcon="user"
                placeholder="Enter name as shown on document"
                autoCapitalize="words"
              />

              {/* Document Number Input */}
              <AutoFilledInput
                label="Document Number"
                value={documentNumber}
                onChangeText={setDocumentNumber}
                leftIcon="hash"
                placeholder="Enter document number"
                autoCapitalize="characters"
              />

              {/* Issuing Authority (for certificates) */}
              {!isIdDocument && (
                <AutoFilledInput
                  label="Issuing Authority"
                  value={issuingAuthority}
                  onChangeText={setIssuingAuthority}
                  leftIcon="home"
                  placeholder="e.g., Bureau of Animal Industry"
                />
              )}

              {/* Dates Row */}
              <View className="flex-row gap-3">
                {/* Issue Date */}
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Issue Date
                  </Text>
                  <TouchableOpacity
                    className="bg-white rounded-2xl border-2 border-gray-200 px-3 py-4 flex-row justify-between items-center"
                    onPress={() => setShowIssueDatePicker(true)}
                  >
                    <View className="flex-row items-center flex-1">
                      <Feather name="calendar" size={16} color="#9CA3AF" />
                      <Text className="text-sm text-gray-900 ml-2" numberOfLines={1}>
                        {formatDate(issueDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {showIssueDatePicker && (
                  <DateTimePicker
                    value={issueDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowIssueDatePicker(Platform.OS === "ios");
                      if (selectedDate) {
                        setIssueDate(selectedDate);
                      }
                    }}
                  />
                )}

                {/* Expiration Date */}
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                    Expiration
                  </Text>
                  <TouchableOpacity
                    className="bg-white rounded-2xl border-2 border-gray-200 px-3 py-4 flex-row justify-between items-center"
                    onPress={() => setShowExpirationDatePicker(true)}
                  >
                    <View className="flex-row items-center flex-1">
                      <Feather name="calendar" size={16} color="#9CA3AF" />
                      <Text className="text-sm text-gray-900 ml-2" numberOfLines={1}>
                        {formatDate(expirationDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {showExpirationDatePicker && (
                  <DateTimePicker
                    value={expirationDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowExpirationDatePicker(Platform.OS === "ios");
                      if (selectedDate) {
                        setExpirationDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className="bg-[#FF6B4A] rounded-2xl py-4 shadow-lg shadow-[#FF6B4A]/30"
              onPress={handleSubmit}
              activeOpacity={0.8}
              disabled={isSubmitting}
            >
              <View className="flex-row items-center justify-center">
                <Feather name="upload-cloud" size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Resubmit Document
                </Text>
              </View>
            </TouchableOpacity>

            {/* Help Text */}
            <View className="flex-row items-center justify-center mt-4 px-4">
              <Feather name="shield" size={14} color="#9CA3AF" />
              <Text className="text-xs text-gray-400 ml-2 text-center">
                Your information is encrypted and securely stored
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}
