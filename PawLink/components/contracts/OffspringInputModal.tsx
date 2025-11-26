import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Camera,
  Image as ImageIcon,
} from "lucide-react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as ImagePicker from "expo-image-picker";
import dayjs from "dayjs";
import {
  BreedingContract,
  storeOffspring,
  OffspringData,
} from "@/services/contractService";

interface OffspringDataWithPhoto extends OffspringData {
  photo?: string;
}

interface OffspringInputModalProps {
  visible: boolean;
  onClose: () => void;
  contract: BreedingContract;
  onSuccess: (contract: BreedingContract) => void;
}

export default function OffspringInputModal({
  visible,
  onClose,
  contract,
  onSuccess,
}: OffspringInputModalProps) {
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [litterNotes, setLitterNotes] = useState("");
  const [offspring, setOffspring] = useState<OffspringDataWithPhoto[]>([
    { sex: "male", status: "alive" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addOffspring = () => {
    setOffspring([...offspring, { sex: "male", status: "alive" }]);
  };

  const removeOffspring = (index: number) => {
    setOffspring(offspring.filter((_, i) => i !== index));
  };

  const updateOffspring = (
    index: number,
    field: keyof OffspringDataWithPhoto,
    value: any
  ) => {
    const updated = [...offspring];
    updated[index] = { ...updated[index], [field]: value };
    setOffspring(updated);
  };

  const pickImage = async (index: number) => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Please grant photo library access to upload images."
      );
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateOffspring(index, "photo", result.assets[0].uri);
    }
  };

  const takePhoto = async (index: number) => {
    // Request permission
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Please grant camera access to take photos."
      );
      return;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateOffspring(index, "photo", result.assets[0].uri);
    }
  };

  const removePhoto = (index: number) => {
    updateOffspring(index, "photo", undefined);
  };

  const showImageOptions = (index: number) => {
    Alert.alert("Add Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: () => takePhoto(index),
      },
      {
        text: "Choose from Gallery",
        onPress: () => pickImage(index),
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  const handleSubmit = async () => {
    // Validation
    if (offspring.length === 0) {
      Alert.alert("Error", "Please add at least one offspring");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert photo URIs to base64
      const offspringWithBase64 = await Promise.all(
        offspring.map(async (pup) => {
          if (pup.photo) {
            try {
              // Fetch the image and convert to base64
              const response = await fetch(pup.photo);
              const blob = await response.blob();
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });

              // Return pup data with base64 photo, removing the photo field
              const { photo, ...pupData } = pup;
              return { ...pupData, photo: base64 };
            } catch (error) {
              console.error("Error converting photo to base64:", error);
              // Return without photo if conversion fails
              const { photo, ...pupData } = pup;
              return pupData;
            }
          }
          // Return without photo field if no photo
          const { photo, ...pupData } = pup;
          return pupData;
        })
      );

      const result = await storeOffspring(contract.id, {
        birth_date: dayjs(birthDate).format("YYYY-MM-DD"),
        notes: litterNotes || undefined,
        offspring: offspringWithBase64,
      });

      if (result.success && result.data) {
        Alert.alert("Success", "Offspring recorded successfully!");
        onSuccess(result.data.contract);
        onClose();
        // Reset form
        setBirthDate(new Date());
        setLitterNotes("");
        setOffspring([{ sex: "male", status: "alive" }]);
      } else {
        Alert.alert("Error", result.message || "Failed to record offspring");
      }
    } catch (error) {
      console.error("Error recording offspring:", error);
      Alert.alert("Error", "Failed to record offspring");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-[#FF6B6B] px-4 py-3 flex-row items-center justify-between">
          <Text className="text-white font-semibold text-lg">
            Record Offspring
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          {/* Birth Date */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Birth Date <Text className="text-red-500">*</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className="border border-gray-300 rounded-lg p-3 flex-row items-center justify-between"
            >
              <Text className="text-gray-800">
                {dayjs(birthDate).format("MMMM D, YYYY")}
              </Text>
              <Calendar size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Litter Notes */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Litter Notes (Optional)
            </Text>
            <TextInput
              value={litterNotes}
              onChangeText={setLitterNotes}
              placeholder="Add any notes about the litter..."
              multiline
              numberOfLines={3}
              className="border border-gray-300 rounded-lg p-3 text-gray-800"
              style={{ textAlignVertical: "top" }}
            />
          </View>

          {/* Offspring List */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-700 font-medium">
                Offspring ({offspring.length})
              </Text>
              <TouchableOpacity
                onPress={addOffspring}
                className="bg-[#FF6B6B] px-3 py-2 rounded-lg flex-row items-center"
              >
                <Plus size={16} color="white" />
                <Text className="text-white font-medium ml-1">Add</Text>
              </TouchableOpacity>
            </View>

            {offspring.map((pup, index) => (
              <View
                key={index}
                className="border border-gray-300 rounded-lg p-3 mb-3"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-700 font-medium">
                    Puppy #{index + 1}
                  </Text>
                  {offspring.length > 1 && (
                    <TouchableOpacity onPress={() => removeOffspring(index)}>
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Name */}
                <TextInput
                  value={pup.name || ""}
                  onChangeText={(value) =>
                    updateOffspring(index, "name", value)
                  }
                  placeholder="Name (optional)"
                  className="border border-gray-300 rounded-lg p-2 mb-2 text-gray-800"
                />

                {/* Photo */}
                <View className="mb-2">
                  <Text className="text-gray-600 text-sm mb-1">Photo</Text>
                  {pup.photo ? (
                    <View className="relative">
                      <Image
                        source={{ uri: pup.photo }}
                        className="w-full h-48 rounded-lg"
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                      >
                        <X size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => showImageOptions(index)}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 items-center justify-center"
                      style={{ height: 120 }}
                    >
                      <ImageIcon size={32} color="#9ca3af" />
                      <Text className="text-gray-500 text-sm mt-2">
                        Add Photo
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Sex */}
                <View className="mb-2">
                  <Text className="text-gray-600 text-sm mb-1">Sex *</Text>
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => updateOffspring(index, "sex", "male")}
                      className={`flex-1 py-2 rounded-lg mr-2 ${
                        pup.sex === "male"
                          ? "bg-blue-500"
                          : "border border-gray-300"
                      }`}
                    >
                      <Text
                        className={`text-center font-medium ${
                          pup.sex === "male" ? "text-white" : "text-gray-700"
                        }`}
                      >
                        Male
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => updateOffspring(index, "sex", "female")}
                      className={`flex-1 py-2 rounded-lg ${
                        pup.sex === "female"
                          ? "bg-pink-500"
                          : "border border-gray-300"
                      }`}
                    >
                      <Text
                        className={`text-center font-medium ${
                          pup.sex === "female" ? "text-white" : "text-gray-700"
                        }`}
                      >
                        Female
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Color */}
                <TextInput
                  value={pup.color || ""}
                  onChangeText={(value) =>
                    updateOffspring(index, "color", value)
                  }
                  placeholder="Color/Markings (optional)"
                  className="border border-gray-300 rounded-lg p-2 mb-2 text-gray-800"
                />

                {/* Status */}
                <View className="mb-2">
                  <Text className="text-gray-600 text-sm mb-1">Status</Text>
                  <View className="flex-row flex-wrap">
                    <TouchableOpacity
                      onPress={() => updateOffspring(index, "status", "alive")}
                      className={`px-3 py-2 rounded-lg mr-2 mb-2 ${
                        pup.status === "alive"
                          ? "bg-green-500"
                          : "border border-gray-300"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          pup.status === "alive"
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        Alive
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => updateOffspring(index, "status", "died")}
                      className={`px-3 py-2 rounded-lg mr-2 mb-2 ${
                        pup.status === "died"
                          ? "bg-gray-600"
                          : "border border-gray-300"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          pup.status === "died" ? "text-white" : "text-gray-700"
                        }`}
                      >
                        Died
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        updateOffspring(index, "status", "adopted")
                      }
                      className={`px-3 py-2 rounded-lg mb-2 ${
                        pup.status === "adopted"
                          ? "bg-purple-500"
                          : "border border-gray-300"
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          pup.status === "adopted"
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        Adopted
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Notes */}
                <TextInput
                  value={pup.notes || ""}
                  onChangeText={(value) =>
                    updateOffspring(index, "notes", value)
                  }
                  placeholder="Notes (optional)"
                  multiline
                  numberOfLines={2}
                  className="border border-gray-300 rounded-lg p-2 text-gray-800"
                  style={{ textAlignVertical: "top" }}
                />
              </View>
            ))}
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View className="px-4 py-3 border-t border-gray-200">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={{ backgroundColor: "#16a34a" }}
            className="py-3 rounded-full flex-row items-center justify-center"
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Record Offspring
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Date Picker Modal */}
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          date={birthDate}
          onConfirm={(date) => {
            setBirthDate(date);
            setShowDatePicker(false);
          }}
          onCancel={() => setShowDatePicker(false)}
          maximumDate={new Date()}
        />
      </View>
    </Modal>
  );
}
