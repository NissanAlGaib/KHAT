import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";

interface LicensedBreederStepProps {
  onNext: (data: any) => void;
  onSkip: () => void;
  initialData: any;
}

export default function LicensedBreederStep({
  onNext,
  onSkip,
  initialData,
}: LicensedBreederStepProps) {
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const [photo, setPhoto] = useState<string | null>(
    initialData.breederPhoto || null
  );
  const [name, setName] = useState(initialData.breederName || "");
  const [idNumber, setIdNumber] = useState(initialData.breederIdNumber || "");
  const [issuingAuthority, setIssuingAuthority] = useState(
    initialData.breederIssuingAuthority || ""
  );
  const [givenDate, setGivenDate] = useState(
    initialData.breederGivenDate
      ? new Date(initialData.breederGivenDate)
      : new Date()
  );
  const [expirationDate, setExpirationDate] = useState(
    initialData.breederExpirationDate
      ? new Date(initialData.breederExpirationDate)
      : new Date()
  );

  const [showGivenDatePicker, setShowGivenDatePicker] = useState(false);
  const [showExpirationDatePicker, setShowExpirationDatePicker] =
    useState(false);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      showAlert({
        title: "Permission Required",
        message: "Permission to access camera roll is required!",
        type: "warning",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleNext = () => {
    if (!name || !idNumber || !issuingAuthority) {
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
    <View className="px-6">
      {/* Title Section */}
      <Text className="text-xl font-bold text-black mb-2">
        Licensed Breeder
      </Text>
      <Text className="text-gray-600 mb-4">
        If your a licensed breeder Upload picture of your certificate of
        licensed breeder
      </Text>

      {/* Upload Picture Section */}
      <TouchableOpacity
        className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-8 items-center mb-6"
        onPress={pickImage}
      >
        {photo ? (
          <Image
            source={{ uri: photo }}
            className="w-full h-40 rounded-lg"
            resizeMode="cover"
          />
        ) : (
          <>
            <Feather name="upload" size={40} color="#9CA3AF" />
            <Text className="text-gray-500 font-semibold mt-2">
              Upload Photos
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Name Input */}
      <Text className="text-black font-semibold mb-2">Name</Text>
      <TextInput
        className="bg-white border border-gray-300 rounded-lg px-4 py-4 mb-4"
        placeholder="Enter name"
        value={name}
        onChangeText={setName}
      />

      {/* ID Number Input */}
      <Text className="text-black font-semibold mb-2">ID number</Text>
      <TextInput
        className="bg-white border border-gray-300 rounded-lg px-4 py-4 mb-4"
        placeholder="Enter Id number"
        value={idNumber}
        onChangeText={setIdNumber}
      />

      {/* Issuing Authority Input */}
      <Text className="text-black font-semibold mb-2">Issuine Authority</Text>
      <TextInput
        className="bg-white border border-gray-300 rounded-lg px-4 py-4 mb-4"
        placeholder="Enter name"
        value={issuingAuthority}
        onChangeText={setIssuingAuthority}
      />

      {/* Given Date and Expiration Date Row */}
      <View className="flex-row gap-4 mb-6">
        {/* Given Date */}
        <View className="flex-1">
          <Text className="text-black font-semibold mb-2">Given Date</Text>
          <TouchableOpacity
            className="bg-white border border-gray-300 rounded-lg px-4 py-4 flex-row justify-between items-center"
            onPress={() => setShowGivenDatePicker(true)}
          >
            <Text className="text-gray-700 text-sm">
              {formatDate(givenDate)}
            </Text>
            <Feather name="calendar" size={20} color="gray" />
          </TouchableOpacity>

          {showGivenDatePicker && (
            <DateTimePicker
              value={givenDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event, selectedDate) => {
                setShowGivenDatePicker(Platform.OS === "ios");
                if (selectedDate) {
                  setGivenDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        {/* Expiration Date */}
        <View className="flex-1">
          <Text className="text-black font-semibold mb-2">Expiration Date</Text>
          <TouchableOpacity
            className="bg-white border border-gray-300 rounded-lg px-4 py-4 flex-row justify-between items-center"
            onPress={() => setShowExpirationDatePicker(true)}
          >
            <Text className="text-gray-700 text-sm">
              {formatDate(expirationDate)}
            </Text>
            <Feather name="calendar" size={20} color="gray" />
          </TouchableOpacity>

          {showExpirationDatePicker && (
            <DateTimePicker
              value={expirationDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
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

      {/* Next Button */}
      <TouchableOpacity
        className="bg-[#FF6B4A] rounded-lg py-4 items-center mb-4"
        onPress={handleNext}
      >
        <Text className="text-white font-bold text-lg">NEXT</Text>
      </TouchableOpacity>

      {/* Or do it later text */}
      <View className="flex-row items-center mb-4">
        <View className="flex-1 h-px bg-gray-300" />
        <Text className="text-gray-500 mx-4">Or do it later</Text>
        <View className="flex-1 h-px bg-gray-300" />
      </View>

      {/* Skip Button */}
      <TouchableOpacity className="items-center mb-8" onPress={onSkip}>
        <Text className="text-[#FF6B4A] font-bold text-lg">Skip</Text>
      </TouchableOpacity>

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </View>
  );
}
