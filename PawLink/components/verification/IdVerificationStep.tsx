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

interface IdVerificationStepProps {
  onNext: (data: any) => void;
  initialData: any;
}

const ID_TYPES = [
  "Driver's License",
  "Passport",
  "National ID",
  "SSS ID",
  "PhilHealth ID",
  "UMID",
  "Voter's ID",
  "PRC ID",
];

export default function IdVerificationStep({
  onNext,
  initialData,
}: IdVerificationStepProps) {
  const [idType, setIdType] = useState(initialData.idType || "");
  const [showIdTypePicker, setShowIdTypePicker] = useState(false);
  const [idPhoto, setIdPhoto] = useState<string | null>(
    initialData.idPhoto || null
  );
  const [name, setName] = useState(initialData.idName || "");
  const [idNumber, setIdNumber] = useState(initialData.idNumber || "");
  const [birthdate, setBirthdate] = useState(
    initialData.idBirthdate ? new Date(initialData.idBirthdate) : new Date()
  );
  const [givenDate, setGivenDate] = useState(
    initialData.idGivenDate ? new Date(initialData.idGivenDate) : new Date()
  );
  const [expirationDate, setExpirationDate] = useState(
    initialData.idExpirationDate
      ? new Date(initialData.idExpirationDate)
      : new Date()
  );

  const [showBirthdatePicker, setShowBirthdatePicker] = useState(false);
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
      setIdPhoto(result.assets[0].uri);
    }
  };

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleNext = () => {
    if (!idType || !name || !idNumber) {
      alert("Please fill in all required fields");
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
    <View className="px-6">
      {/* ID Type Selector */}
      <Text className="text-black font-semibold mb-2">id type</Text>
      <TouchableOpacity
        className="bg-white border border-gray-300 rounded-lg px-4 py-4 mb-4 flex-row justify-between items-center"
        onPress={() => setShowIdTypePicker(!showIdTypePicker)}
      >
        <Text className={idType ? "text-black" : "text-gray-400"}>
          {idType || "Select"}
        </Text>
        <Feather name="chevron-down" size={20} color="gray" />
      </TouchableOpacity>

      {showIdTypePicker && (
        <View className="bg-white border border-gray-300 rounded-lg mb-4 overflow-hidden">
          {ID_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              className="px-4 py-3 border-b border-gray-200"
              onPress={() => {
                setIdType(type);
                setShowIdTypePicker(false);
              }}
            >
              <Text className="text-black">{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Upload Picture Section */}
      <Text className="text-xl font-bold text-black mb-2">Upload Picture</Text>
      <Text className="text-gray-600 mb-4">
        Upload picture of your valid ID and selfie of yourself holding your ID
      </Text>

      <TouchableOpacity
        className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-8 items-center mb-6"
        onPress={pickImage}
      >
        {idPhoto ? (
          <Image
            source={{ uri: idPhoto }}
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

      {/* Birthdate Input */}
      <Text className="text-black font-semibold mb-2">Birthdate</Text>
      <TouchableOpacity
        className="bg-white border border-gray-300 rounded-lg px-4 py-4 mb-4 flex-row justify-between items-center"
        onPress={() => setShowBirthdatePicker(true)}
      >
        <Text className="text-gray-700">{formatDate(birthdate)}</Text>
        <Feather name="calendar" size={20} color="gray" />
      </TouchableOpacity>

      {showBirthdatePicker && (
        <DateTimePicker
          value={birthdate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowBirthdatePicker(Platform.OS === "ios");
            if (selectedDate) {
              setBirthdate(selectedDate);
            }
          }}
        />
      )}

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
        className="bg-[#FF6B4A] rounded-lg py-4 items-center mb-8"
        onPress={handleNext}
      >
        <Text className="text-white font-bold text-lg">Next</Text>
      </TouchableOpacity>
    </View>
  );
}
