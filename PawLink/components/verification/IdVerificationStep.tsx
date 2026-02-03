import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import IdTypeSelector from "./IdTypeSelector";
import DocumentUploader from "./DocumentUploader";
import AutoFilledInput from "./AutoFilledInput";
import OcrLoadingOverlay from "./OcrLoadingOverlay";
import { extractIdInformation, OcrExtractedData } from "@/services/ocrService";

interface IdVerificationStepProps {
  onNext: (data: Record<string, unknown>) => void;
  initialData: Record<string, unknown>;
}

export default function IdVerificationStep({
  onNext,
  initialData,
}: IdVerificationStepProps) {
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  
  // Form state
  const [idType, setIdType] = useState<string>((initialData.idType as string) || "");
  const [idPhoto, setIdPhoto] = useState<string | null>(
    (initialData.idPhoto as string) || null
  );
  const [name, setName] = useState<string>((initialData.idName as string) || "");
  const [idNumber, setIdNumber] = useState<string>((initialData.idNumber as string) || "");
  const [birthdate, setBirthdate] = useState<Date>(
    initialData.idBirthdate ? new Date(initialData.idBirthdate as string) : new Date()
  );
  const [givenDate, setGivenDate] = useState<Date>(
    initialData.idGivenDate ? new Date(initialData.idGivenDate as string) : new Date()
  );
  const [expirationDate, setExpirationDate] = useState<Date>(
    initialData.idExpirationDate
      ? new Date(initialData.idExpirationDate as string)
      : new Date()
  );

  // UI state
  const [showBirthdatePicker, setShowBirthdatePicker] = useState(false);
  const [showGivenDatePicker, setShowGivenDatePicker] = useState(false);
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);
  
  // OCR state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

  // Handle photo upload and OCR
  const handlePhotoChange = async (uri: string | null) => {
    setIdPhoto(uri);
    
    if (uri && idType) {
      // Start OCR scanning
      setIsScanning(true);
      setScanProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      try {
        const result = await extractIdInformation(uri, idType);
        
        clearInterval(progressInterval);
        setScanProgress(100);

        if (result.success && result.extracted_fields) {
          applyExtractedData(result.extracted_fields);
        }
      } catch (error) {
        console.error("OCR Error:", error);
        clearInterval(progressInterval);
      } finally {
        setTimeout(() => {
          setIsScanning(false);
          setScanProgress(0);
        }, 500);
      }
    }
  };

  // Apply extracted OCR data to form
  const applyExtractedData = (data: OcrExtractedData) => {
    const newAutoFilled = new Set<string>();

    if (data.full_name) {
      setName(data.full_name);
      newAutoFilled.add("name");
    }
    if (data.id_number) {
      setIdNumber(data.id_number);
      newAutoFilled.add("idNumber");
    }
    if (data.birthdate) {
      setBirthdate(new Date(data.birthdate));
      newAutoFilled.add("birthdate");
    }
    if (data.issue_date) {
      setGivenDate(new Date(data.issue_date));
      newAutoFilled.add("givenDate");
    }
    if (data.expiration_date) {
      setExpirationDate(new Date(data.expiration_date));
      newAutoFilled.add("expirationDate");
    }

    setAutoFilledFields(newAutoFilled);

    if (newAutoFilled.size > 0) {
      showAlert({
        title: "Information Extracted",
        message: `AI successfully extracted ${newAutoFilled.size} field(s) from your ID. Please verify the information is correct.`,
        type: "success",
      });
    }
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleNext = () => {
    if (!idType) {
      showAlert({
        title: "ID Type Required",
        message: "Please select the type of ID you're uploading",
        type: "warning",
      });
      return;
    }

    if (!idPhoto) {
      showAlert({
        title: "ID Photo Required",
        message: "Please upload a photo of your ID",
        type: "warning",
      });
      return;
    }

    if (!name.trim()) {
      showAlert({
        title: "Name Required",
        message: "Please enter the name as it appears on your ID",
        type: "warning",
      });
      return;
    }

    if (!idNumber.trim()) {
      showAlert({
        title: "ID Number Required",
        message: "Please enter your ID number",
        type: "warning",
      });
      return;
    }

    onNext({
      idType,
      idPhoto,
      idName: name,
      idNumber,
      idBirthdate: birthdate.toISOString(),
      idGivenDate: givenDate.toISOString(),
      idExpirationDate: expirationDate.toISOString(),
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 180 : 0}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 pb-6">
        {/* Section: ID Type Selection */}
        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Select ID Type
          </Text>
          <IdTypeSelector value={idType} onSelect={setIdType} />
        </View>

        {/* Section: Document Upload */}
        <View className="mb-6">
          <DocumentUploader
            value={idPhoto}
            onChange={handlePhotoChange}
            isScanning={isScanning}
            label="Upload ID Photo"
            placeholder="Take a clear photo of your ID"
          />
        </View>

        {/* Section: ID Information */}
        <View className="bg-white rounded-3xl p-5 shadow-sm mb-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">
              ID Information
            </Text>
            {autoFilledFields.size > 0 && (
              <View className="flex-row items-center bg-[#FF6B4A]/10 px-3 py-1.5 rounded-full">
                <Feather name="zap" size={14} color="#FF6B4A" />
                <Text className="text-xs font-semibold text-[#FF6B4A] ml-1">
                  AI Auto-filled
                </Text>
              </View>
            )}
          </View>

          {/* Name Input */}
          <AutoFilledInput
            label="Full Name"
            value={name}
            onChangeText={setName}
            isAutoFilled={autoFilledFields.has("name")}
            required
            leftIcon="user"
            placeholder="Enter name as shown on ID"
            autoCapitalize="words"
          />

          {/* ID Number Input */}
          <AutoFilledInput
            label="ID Number"
            value={idNumber}
            onChangeText={setIdNumber}
            isAutoFilled={autoFilledFields.has("idNumber")}
            required
            leftIcon="hash"
            placeholder="Enter ID number"
            autoCapitalize="characters"
          />

          {/* Birthdate */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Birthdate
            </Text>
            <TouchableOpacity
              className={`bg-white rounded-2xl border-2 px-4 py-4 flex-row justify-between items-center ${
                autoFilledFields.has("birthdate")
                  ? "border-[#FF6B4A] bg-orange-50"
                  : "border-gray-200"
              }`}
              onPress={() => setShowBirthdatePicker(true)}
            >
              <View className="flex-row items-center">
                <Feather name="calendar" size={18} color="#9CA3AF" />
                <Text className="text-base text-gray-900 ml-3">
                  {formatDate(birthdate)}
                </Text>
              </View>
              {autoFilledFields.has("birthdate") && (
                <View className="flex-row items-center bg-[#FF6B4A]/10 px-2 py-1 rounded-full">
                  <Feather name="zap" size={12} color="#FF6B4A" />
                  <Text className="text-xs font-medium text-[#FF6B4A] ml-1">
                    AI
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {showBirthdatePicker && (
            <DateTimePicker
              value={birthdate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowBirthdatePicker(Platform.OS === "ios");
                if (selectedDate) {
                  setBirthdate(selectedDate);
                  setAutoFilledFields((prev) => {
                    const next = new Set(prev);
                    next.delete("birthdate");
                    return next;
                  });
                }
              }}
            />
          )}

          {/* Issue & Expiration Dates */}
          <View className="flex-row gap-3">
            {/* Issue Date */}
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Issue Date
              </Text>
              <TouchableOpacity
                className={`bg-white rounded-2xl border-2 px-3 py-4 flex-row justify-between items-center ${
                  autoFilledFields.has("givenDate")
                    ? "border-[#FF6B4A] bg-orange-50"
                    : "border-gray-200"
                }`}
                onPress={() => setShowGivenDatePicker(true)}
              >
                <View className="flex-row items-center flex-1">
                  <Feather name="calendar" size={16} color="#9CA3AF" />
                  <Text className="text-sm text-gray-900 ml-2" numberOfLines={1}>
                    {formatDate(givenDate)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {showGivenDatePicker && (
              <DateTimePicker
                value={givenDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowGivenDatePicker(Platform.OS === "ios");
                  if (selectedDate) {
                    setGivenDate(selectedDate);
                    setAutoFilledFields((prev) => {
                      const next = new Set(prev);
                      next.delete("givenDate");
                      return next;
                    });
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
                className={`bg-white rounded-2xl border-2 px-3 py-4 flex-row justify-between items-center ${
                  autoFilledFields.has("expirationDate")
                    ? "border-[#FF6B4A] bg-orange-50"
                    : "border-gray-200"
                }`}
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
                    setAutoFilledFields((prev) => {
                      const next = new Set(prev);
                      next.delete("expirationDate");
                      return next;
                    });
                  }
                }}
              />
            )}
          </View>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          className="bg-[#FF6B4A] rounded-2xl py-4 shadow-lg shadow-[#FF6B4A]/30"
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center justify-center">
            <Text className="text-white font-bold text-lg mr-2">Continue</Text>
            <Feather name="arrow-right" size={20} color="white" />
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

      {/* OCR Loading Overlay */}
      <OcrLoadingOverlay
        visible={isScanning}
        progress={scanProgress}
        message="Extracting information from your ID..."
      />

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </KeyboardAvoidingView>
  );
}
