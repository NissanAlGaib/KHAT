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
import DocumentUploader from "./DocumentUploader";
import AutoFilledInput from "./AutoFilledInput";

interface LicensedBreederStepProps {
  onNext: (data: Record<string, unknown>) => void;
  onSkip: () => void;
  initialData: Record<string, unknown>;
}

export default function LicensedBreederStep({
  onNext,
  onSkip,
  initialData,
}: LicensedBreederStepProps) {
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  
  // Form state
  const [photo, setPhoto] = useState<string | null>(
    (initialData.breederPhoto as string) || null
  );
  const [name, setName] = useState((initialData.breederName as string) || "");
  const [idNumber, setIdNumber] = useState((initialData.breederIdNumber as string) || "");
  const [issuingAuthority, setIssuingAuthority] = useState(
    (initialData.breederIssuingAuthority as string) || ""
  );
  const [givenDate, setGivenDate] = useState(
    initialData.breederGivenDate
      ? new Date(initialData.breederGivenDate as string)
      : new Date()
  );
  const [expirationDate, setExpirationDate] = useState(
    initialData.breederExpirationDate
      ? new Date(initialData.breederExpirationDate as string)
      : new Date()
  );

  const [showGivenDatePicker, setShowGivenDatePicker] = useState(false);
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleNext = () => {
    if (!photo) {
      showAlert({
        title: "Certificate Required",
        message: "Please upload your breeder certificate or skip this step",
        type: "warning",
      });
      return;
    }

    if (!name.trim() || !idNumber.trim() || !issuingAuthority.trim()) {
      showAlert({
        title: "Missing Information",
        message: "Please fill in all required fields or skip this step",
        type: "warning",
      });
      return;
    }

    onNext({
      breederPhoto: photo,
      breederName: name,
      breederIdNumber: idNumber,
      breederIssuingAuthority: issuingAuthority,
      breederGivenDate: givenDate.toISOString(),
      breederExpirationDate: expirationDate.toISOString(),
      breederSkipped: false,
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
        {/* Header Card */}
        <View className="bg-white rounded-3xl p-5 shadow-sm mb-6">
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-2xl bg-amber-100 items-center justify-center">
              <Feather name="award" size={26} color="#D97706" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-xl font-bold text-gray-900">
                Breeder License
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                Optional: Upload your licensed breeder certificate
              </Text>
            </View>
          </View>

          {/* Info Banner */}
          <View className="bg-amber-50 rounded-2xl p-4 mt-4 flex-row items-start">
            <Feather name="info" size={18} color="#D97706" />
            <Text className="text-sm text-amber-800 ml-3 flex-1">
              Having a breeder license helps build trust with potential buyers and shows you're a certified breeder.
            </Text>
          </View>
        </View>

        {/* Document Upload */}
        <View className="mb-6">
          <DocumentUploader
            value={photo}
            onChange={setPhoto}
            label="Upload Certificate"
            placeholder="Take a photo of your breeder certificate"
          />
        </View>

        {/* Certificate Information */}
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
            value={idNumber}
            onChangeText={setIdNumber}
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

        {/* Continue Button */}
        <TouchableOpacity
          className="bg-[#FF6B4A] rounded-2xl py-4 shadow-lg shadow-[#FF6B4A]/30 mb-4"
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <View className="flex-row items-center justify-center">
            <Text className="text-white font-bold text-lg mr-2">Continue</Text>
            <Feather name="arrow-right" size={20} color="white" />
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center mb-4">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="text-gray-400 mx-4 text-sm">or</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Skip Button */}
        <TouchableOpacity
          className="border-2 border-gray-200 rounded-2xl py-4 mb-6"
          onPress={onSkip}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center justify-center">
            <Feather name="skip-forward" size={18} color="#6B7280" />
            <Text className="text-gray-600 font-semibold text-base ml-2">
              Skip for Now
            </Text>
          </View>
        </TouchableOpacity>

        {/* Help Text */}
        <View className="flex-row items-center justify-center px-4">
          <Feather name="clock" size={14} color="#9CA3AF" />
          <Text className="text-xs text-gray-400 ml-2 text-center">
            You can add your breeder license later from your profile
          </Text>
        </View>
        </View>
      </ScrollView>

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
