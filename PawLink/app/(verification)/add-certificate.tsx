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
import { useSession } from "@/context/AuthContext";

type CertificateType = "breeder" | "shooter";

interface CertificateConfig {
  type: CertificateType;
  title: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  bgColor: string;
  iconColor: string;
  infoBgColor: string;
  infoTextColor: string;
  infoMessage: string;
  documentKey: string;
  authType: string;
}

const CERTIFICATE_CONFIGS: Record<CertificateType, CertificateConfig> = {
  breeder: {
    type: "breeder",
    title: "Breeder License",
    subtitle: "Add your licensed breeder certificate",
    icon: "award",
    bgColor: "bg-amber-100",
    iconColor: "#D97706",
    infoBgColor: "bg-amber-50",
    infoTextColor: "text-amber-800",
    infoMessage:
      "Having a breeder license helps build trust with potential buyers and shows you're a certified breeder.",
    documentKey: "breeder_document",
    authType: "breeder_certificate",
  },
  shooter: {
    type: "shooter",
    title: "Shooter Certificate",
    subtitle: "Add your professional shooter certification",
    icon: "file-text",
    bgColor: "bg-blue-100",
    iconColor: "#2563EB",
    infoBgColor: "bg-blue-50",
    infoTextColor: "text-blue-800",
    infoMessage:
      "A shooter certificate allows you to offer your professional breeding services to pet owners.",
    documentKey: "shooter_document",
    authType: "shooter_certificate",
  },
};

export default function AddCertificateScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useSession();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const certificateType = (params.type as CertificateType) || "breeder";
  const config = CERTIFICATE_CONFIGS[certificateType];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [issuingAuthority, setIssuingAuthority] = useState("");
  const [issueDate, setIssueDate] = useState(new Date());
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async () => {
    if (!photo) {
      showAlert({
        title: "Certificate Required",
        message: "Please upload your certificate document.",
        type: "warning",
      });
      return;
    }

    if (!name.trim() || !certificateNumber.trim() || !issuingAuthority.trim()) {
      showAlert({
        title: "Missing Information",
        message: "Please fill in all required fields.",
        type: "warning",
      });
      return;
    }

    if (!user?.id) {
      showAlert({
        title: "Error",
        message: "User not found. Please log in again.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get file extension from URI
      const uriParts = photo.split(".");
      const fileExtension = uriParts[uriParts.length - 1].toLowerCase();

      const mimeTypes: Record<string, string> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        pdf: "application/pdf",
      };

      const mimeType = mimeTypes[fileExtension] || "image/jpeg";
      const filename = `${config.documentKey}_${Date.now()}.${fileExtension || "jpg"}`;

      const formData = new FormData();
      formData.append("user_id", user.id.toString());

      // Add the document file
      formData.append(config.documentKey, {
        uri: photo,
        name: filename,
        type: mimeType,
      } as any);

      // Add document metadata with correct prefixes
      const prefix = certificateType === "breeder" ? "breeder" : "shooter";
      formData.append(`${prefix}_name`, name);
      formData.append(`${prefix}_number`, certificateNumber);
      formData.append(`${prefix}_issuing_authority`, issuingAuthority);
      formData.append(`${prefix}_issue_date`, issueDate.toISOString());
      formData.append(`${prefix}_expiration_date`, expirationDate.toISOString());

      await axiosInstance.post("/api/verification/submit", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      showAlert({
        title: "Success!",
        message: "Your certificate has been submitted for review. We'll notify you once it's verified.",
        type: "success",
        buttons: [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ],
      });
    } catch (error: any) {
      console.error("Error submitting certificate:", error);
      showAlert({
        title: "Submission Failed",
        message:
          error.response?.data?.message ||
          "Failed to submit certificate. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <Text className="text-2xl font-bold text-gray-900">Add Certificate</Text>
              <Text className="text-sm text-gray-500">{config.title}</Text>
            </View>
          </View>
          <View className={`w-10 h-10 rounded-full ${config.bgColor} items-center justify-center`}>
            <Feather name={config.icon} size={20} color={config.iconColor} />
          </View>
        </View>
      </View>

      {/* Loading Overlay */}
      {isSubmitting && (
        <View className="absolute inset-0 bg-black/50 z-50 items-center justify-center">
          <View className="bg-white p-6 rounded-2xl items-center">
            <ActivityIndicator size="large" color="#FF6B4A" />
            <Text className="mt-4 text-lg font-semibold">Submitting certificate...</Text>
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
            <View className={`${config.infoBgColor} rounded-2xl p-4 mb-6 flex-row items-start`}>
              <Feather name="info" size={18} color={config.iconColor} />
              <Text className={`text-sm ${config.infoTextColor} ml-3 flex-1`}>
                {config.infoMessage}
              </Text>
            </View>

            {/* Document Upload */}
            <View className="mb-6">
              <DocumentUploader
                value={photo}
                onChange={setPhoto}
                label="Upload Certificate"
                placeholder="Take a clear photo of your certificate"
              />
            </View>

            {/* Certificate Information Card */}
            <View className="bg-white rounded-3xl p-5 shadow-sm mb-6">
              <Text className="text-lg font-bold text-gray-900 mb-4">
                Certificate Information
              </Text>

              {/* Name Input */}
              <AutoFilledInput
                label="Name on Certificate"
                value={name}
                onChangeText={setName}
                leftIcon="user"
                placeholder="Enter name as shown on certificate"
                autoCapitalize="words"
              />

              {/* Certificate Number Input */}
              <AutoFilledInput
                label="Certificate Number"
                value={certificateNumber}
                onChangeText={setCertificateNumber}
                leftIcon="hash"
                placeholder="Enter certificate number"
                autoCapitalize="characters"
              />

              {/* Issuing Authority Input */}
              <AutoFilledInput
                label="Issuing Authority"
                value={issuingAuthority}
                onChangeText={setIssuingAuthority}
                leftIcon="home"
                placeholder="e.g., Bureau of Animal Industry"
              />

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
                  Submit Certificate
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
