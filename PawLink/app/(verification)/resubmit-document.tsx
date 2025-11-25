import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import axiosInstance from "@/config/axiosConfig";
import { useNotifications } from "@/context/NotificationContext";

export default function ResubmitDocumentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const { refreshNotifications, refreshBadgeCount } = useNotifications();

  const documentType = params.type as string;
  const petId = params.petId as string;
  const petName = params.petName as string;
  const vaccinationId = params.vaccinationId as string;
  const healthRecordId = params.healthRecordId as string;
  const vaccineName = params.vaccineName as string;
  const recordType = params.recordType as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [document, setDocument] = useState<any>(null);
  const [clinicName, setClinicName] = useState("");
  const [veterinarianName, setVeterinarianName] = useState("");
  const [givenDate, setGivenDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<string | null>(null);

  const isVaccination = documentType === "vaccination";
  const title = isVaccination
    ? `Resubmit ${vaccineName} Vaccination`
    : `Resubmit ${recordType}`;

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocument(result.assets[0]);
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  const openDatePicker = (field: string) => {
    setDatePickerField(field);
    setShowDatePicker(true);
  };

  const handleDateConfirm = (date: Date) => {
    const formattedDate = date.toISOString().split("T")[0];
    if (datePickerField === "givenDate") {
      setGivenDate(formattedDate);
    } else if (datePickerField === "expirationDate") {
      setExpirationDate(formattedDate);
    }
    setShowDatePicker(false);
    setDatePickerField(null);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
    setDatePickerField(null);
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "dd/mm/yy";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async () => {
    // Validation
    if (!document) {
      showAlert({
        title: "Error",
        message: "Please upload a document.",
        type: "error",
      });
      return;
    }
    if (!clinicName.trim()) {
      showAlert({
        title: "Error",
        message: "Please enter the clinic name.",
        type: "error",
      });
      return;
    }
    if (!veterinarianName.trim()) {
      showAlert({
        title: "Error",
        message: "Please enter the veterinarian's name.",
        type: "error",
      });
      return;
    }
    if (!givenDate) {
      showAlert({
        title: "Error",
        message: "Please select the given date.",
        type: "error",
      });
      return;
    }
    if (!expirationDate) {
      showAlert({
        title: "Error",
        message: "Please select the expiration date.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("document", {
        uri: document.uri,
        name: document.name || "document.pdf",
        type: document.mimeType || "application/pdf",
      } as any);
      formData.append("clinic_name", clinicName);
      formData.append("veterinarian_name", veterinarianName);
      formData.append("given_date", givenDate);
      formData.append("expiration_date", expirationDate);

      let endpoint = "";
      if (isVaccination) {
        endpoint = `/api/pets/${petId}/vaccinations/${vaccinationId}/resubmit`;
      } else {
        endpoint = `/api/pets/${petId}/health-records/${healthRecordId}/resubmit`;
      }

      await axiosInstance.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Refresh notifications
      await refreshNotifications();
      await refreshBadgeCount();

      showAlert({
        title: "Success",
        message: "Your document has been resubmitted for review.",
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

  return (
    <SafeAreaView className="flex-1 bg-[#FFF5F5]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 pt-4 pb-6 bg-white rounded-b-[35px] shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-black ml-4" numberOfLines={1}>
            {title}
          </Text>
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

      <ScrollView
        className="flex-1 px-6 pt-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Pet info */}
        <View className="bg-[#ea5b3a]/10 rounded-2xl p-4 mb-6">
          <Text className="text-[#ea5b3a] font-semibold">
            Resubmitting for: {petName}
          </Text>
          <Text className="text-gray-600 text-sm mt-1">
            {isVaccination
              ? `${vaccineName} Vaccination Record`
              : `${recordType}`}
          </Text>
        </View>

        {/* Document Upload */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-black mb-2">
            Upload Document
          </Text>
          <TouchableOpacity
            className="border border-gray-300 rounded-lg px-4 py-6 bg-gray-50"
            onPress={pickDocument}
          >
            <View className="flex-row items-center">
              <Feather name="upload" size={20} color="gray" />
              <Text className="text-gray-600 ml-2">
                {document ? document.name : "Choose file"}
              </Text>
            </View>
            <Text className="text-gray-500 text-xs mt-2">
              Supported: JPG, PNG, PDF
            </Text>
          </TouchableOpacity>
        </View>

        {/* Clinic Name */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-black mb-2">
            Clinic Name
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
            placeholder="Enter clinic name"
            value={clinicName}
            onChangeText={setClinicName}
          />
        </View>

        {/* Veterinarian's Name */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-black mb-2">
            Veterinarian&apos;s Name
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
            placeholder="Enter veterinarian's name"
            value={veterinarianName}
            onChangeText={setVeterinarianName}
          />
        </View>

        {/* Dates */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1">
            <Text className="text-base font-semibold text-black mb-2">
              Given Date
            </Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row items-center justify-between"
              onPress={() => openDatePicker("givenDate")}
            >
              <Text className={givenDate ? "text-black" : "text-gray-400"}>
                {formatDateDisplay(givenDate)}
              </Text>
              <Feather name="calendar" size={20} color="gray" />
            </TouchableOpacity>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-black mb-2">
              Expiration Date
            </Text>
            <TouchableOpacity
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row items-center justify-between"
              onPress={() => openDatePicker("expirationDate")}
            >
              <Text className={expirationDate ? "text-black" : "text-gray-400"}>
                {formatDateDisplay(expirationDate)}
              </Text>
              <Feather name="calendar" size={20} color="gray" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`rounded-lg py-4 mb-8 ${isSubmitting ? "bg-gray-400" : "bg-[#ea5b3a]"}`}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text className="text-white text-center font-semibold text-base">
            {isSubmitting ? "Submitting..." : "Resubmit Document"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
        maximumDate={datePickerField === "givenDate" ? new Date() : undefined}
      />

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
