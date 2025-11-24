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

interface ShooterCertificateStepProps {
  onDone: (data: any) => void;
  onSkip: () => void;
  initialData: any;
}

export default function ShooterCertificateStep({
  onDone,
  onSkip,
  initialData,
}: ShooterCertificateStepProps) {
  const [photo, setPhoto] = useState<string | null>(
    initialData.shooterPhoto || null
  );
  const [name, setName] = useState(initialData.shooterName || "");
  const [idNumber, setIdNumber] = useState(initialData.shooterIdNumber || "");
  const [issuingAuthority, setIssuingAuthority] = useState(
    initialData.shooterIssuingAuthority || ""
  );
  const [givenDate, setGivenDate] = useState(
    initialData.shooterGivenDate
      ? new Date(initialData.shooterGivenDate)
      : new Date()
  );
  const [expirationDate, setExpirationDate] = useState(
    initialData.shooterExpirationDate
      ? new Date(initialData.shooterExpirationDate)
      : new Date()
  );

  const [showGivenDatePicker, setShowGivenDatePicker] = useState(false);
  const [showExpirationDatePicker, setShowExpirationDatePicker] =
    useState(false);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      alert("Permission to access camera roll is required!");
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

  const handleDone = () => {
    if (!name || !idNumber || !issuingAuthority) {
      alert("Please fill in all required fields or skip this step");
      return;
    }

    onDone({
      shooterPhoto: photo,
      shooterName: name,
      shooterIdNumber: idNumber,
      shooterIssuingAuthority: issuingAuthority,
      shooterGivenDate: givenDate.toISOString(),
      shooterExpirationDate: expirationDate.toISOString(),
      shooterSkipped: false,
    });
  };

  return (
    <View className="px-6">
      {/* Title Section */}
      <Text className="text-xl font-bold text-black mb-2">
        Shooter Certificate
      </Text>
      <Text className="text-gray-600 mb-4">
        If you are a shooter Upload picture of your certificate of shooter
        licensed
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

      {/* Done Button */}
      <TouchableOpacity
        className="bg-[#FF6B4A] rounded-lg py-4 items-center mb-4"
        onPress={handleDone}
      >
        <Text className="text-white font-bold text-lg">DONE</Text>
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
    </View>
  );
}
