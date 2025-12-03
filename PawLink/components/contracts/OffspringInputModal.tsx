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
  Baby,
  Heart,
  Palette,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle,
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
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const addOffspring = () => {
    const newIndex = offspring.length;
    setOffspring([...offspring, { sex: "male", status: "alive" }]);
    setExpandedIndex(newIndex);
  };

  const removeOffspring = (index: number) => {
    setOffspring(offspring.filter((_, i) => i !== index));
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Please grant photo library access to upload images."
      );
      return;
    }

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
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Needed",
        "Please grant camera access to take photos."
      );
      return;
    }

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

  const handleSubmit = async () => {
    if (offspring.length === 0) {
      Alert.alert("Error", "Please add at least one offspring");
      return;
    }

    setIsSubmitting(true);
    try {
      const offspringWithBase64 = await Promise.all(
        offspring.map(async (pup) => {
          if (pup.photo) {
            try {
              const response = await fetch(pup.photo);
              const blob = await response.blob();
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });

              const { photo, ...pupData } = pup;
              return { ...pupData, photo: base64 };
            } catch (error) {
              console.error("Error converting photo to base64:", error);
              const { photo, ...pupData } = pup;
              return pupData;
            }
          }
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
        setBirthDate(new Date());
        setLitterNotes("");
        setOffspring([{ sex: "male", status: "alive" }]);
        setExpandedIndex(0);
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

  const maleCount = offspring.filter((p) => p.sex === "male").length;
  const femaleCount = offspring.filter((p) => p.sex === "female").length;
  const aliveCount = offspring.filter((p) => p.status === "alive").length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl" style={{ maxHeight: '95%', flex: 1 }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-pink-100 items-center justify-center mr-3">
                <Baby size={22} color="#ec4899" />
              </View>
              <View>
                <Text className="text-xl font-bold text-gray-800">Record Offspring</Text>
                <Text className="text-gray-500 text-sm">Add litter details</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Summary Stats */}
          <View className="flex-row px-6 py-3 bg-gray-50 border-b border-gray-100">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-gray-800">{offspring.length}</Text>
              <Text className="text-gray-500 text-xs">Total</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-blue-500">{maleCount}</Text>
              <Text className="text-gray-500 text-xs">Males</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-pink-500">{femaleCount}</Text>
              <Text className="text-gray-500 text-xs">Females</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-green-500">{aliveCount}</Text>
              <Text className="text-gray-500 text-xs">Alive</Text>
            </View>
          </View>

          <ScrollView 
            style={{ flex: 1 }} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            <View className="px-4 py-4">
              {/* Birth Date Card */}
              <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-sm">
                <View className="flex-row items-center mb-3">
                  <Calendar size={18} color="#FF6B6B" />
                  <Text className="text-gray-700 font-semibold ml-2">Birth Date</Text>
                  <Text className="text-red-500 ml-1">*</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="bg-gray-50 rounded-xl p-4 flex-row items-center justify-between"
                >
                  <Text className="text-gray-800 font-medium">
                    {dayjs(birthDate).format("MMMM D, YYYY")}
                  </Text>
                  <Calendar size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Litter Notes Card */}
              <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 shadow-sm">
                <View className="flex-row items-center mb-3">
                  <FileText size={18} color="#FF6B6B" />
                  <Text className="text-gray-700 font-semibold ml-2">Litter Notes</Text>
                  <Text className="text-gray-400 text-sm ml-2">(Optional)</Text>
                </View>
                <TextInput
                  value={litterNotes}
                  onChangeText={setLitterNotes}
                  placeholder="Add any notes about the litter..."
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={3}
                  className="bg-gray-50 rounded-xl p-4 text-gray-800"
                  style={{ textAlignVertical: "top", minHeight: 80 }}
                />
              </View>

              {/* Offspring Section */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <Heart size={18} color="#FF6B6B" />
                    <Text className="text-gray-700 font-semibold ml-2">Offspring Details</Text>
                  </View>
                  <TouchableOpacity
                    onPress={addOffspring}
                    className="bg-[#FF6B6B] px-4 py-2 rounded-full flex-row items-center"
                  >
                    <Plus size={16} color="white" />
                    <Text className="text-white font-semibold ml-1">Add</Text>
                  </TouchableOpacity>
                </View>

                {/* Offspring Cards */}
                {offspring.map((pup, index) => (
                  <OffspringCard
                    key={index}
                    index={index}
                    pup={pup}
                    isExpanded={expandedIndex === index}
                    onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    onUpdate={(field, value) => updateOffspring(index, field, value)}
                    onRemove={() => removeOffspring(index)}
                    onPickImage={() => pickImage(index)}
                    onTakePhoto={() => takePhoto(index)}
                    onRemovePhoto={() => removePhoto(index)}
                    canRemove={offspring.length > 1}
                  />
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <View className="px-4 py-4 border-t border-gray-100 bg-white">
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className="py-4 rounded-full flex-row items-center justify-center"
              style={{ backgroundColor: "#16a34a" }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <CheckCircle size={20} color="white" />
                  <Text className="text-white font-bold text-base ml-2">
                    Record {offspring.length} Offspring
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

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
    </Modal>
  );
}

// Offspring Card Component
interface OffspringCardProps {
  index: number;
  pup: OffspringDataWithPhoto;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (field: keyof OffspringDataWithPhoto, value: any) => void;
  onRemove: () => void;
  onPickImage: () => void;
  onTakePhoto: () => void;
  onRemovePhoto: () => void;
  canRemove: boolean;
}

function OffspringCard({
  index,
  pup,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  onPickImage,
  onTakePhoto,
  onRemovePhoto,
  canRemove,
}: OffspringCardProps) {
  const sexColor = pup.sex === "male" ? "#3b82f6" : "#ec4899";
  const sexBgColor = pup.sex === "male" ? "bg-blue-50" : "bg-pink-50";
  const statusColors: Record<string, { bg: string; text: string }> = {
    alive: { bg: "bg-green-100", text: "text-green-700" },
    died: { bg: "bg-gray-100", text: "text-gray-700" },
    adopted: { bg: "bg-purple-100", text: "text-purple-700" },
  };

  return (
    <View className="bg-white rounded-2xl border border-gray-200 mb-3 overflow-hidden shadow-sm">
      {/* Card Header - Always Visible */}
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center justify-between p-4"
      >
        <View className="flex-row items-center flex-1">
          <View
            className={`w-12 h-12 rounded-full ${sexBgColor} items-center justify-center mr-3`}
          >
            {pup.photo ? (
              <Image
                source={{ uri: pup.photo }}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <Text style={{ color: sexColor }} className="text-xl font-bold">
                {pup.sex === "male" ? "♂" : "♀"}
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-gray-800 font-semibold">
              {pup.name || `Offspring #${index + 1}`}
            </Text>
            <View className="flex-row items-center mt-1">
              <View
                className={`px-2 py-0.5 rounded-full mr-2 ${pup.sex === "male" ? "bg-blue-100" : "bg-pink-100"}`}
              >
                <Text
                  className={`text-xs font-medium ${pup.sex === "male" ? "text-blue-700" : "text-pink-700"}`}
                >
                  {pup.sex === "male" ? "Male" : "Female"}
                </Text>
              </View>
              <View className={`px-2 py-0.5 rounded-full ${statusColors[pup.status].bg}`}>
                <Text className={`text-xs font-medium capitalize ${statusColors[pup.status].text}`}>
                  {pup.status}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <View className="flex-row items-center">
          {canRemove && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="mr-2 p-2"
            >
              <Trash2 size={18} color="#ef4444" />
            </TouchableOpacity>
          )}
          {isExpanded ? (
            <ChevronUp size={20} color="#9ca3af" />
          ) : (
            <ChevronDown size={20} color="#9ca3af" />
          )}
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View className="px-4 pb-4 border-t border-gray-100 pt-4">
          {/* Name Input */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm font-medium mb-2">Name (Optional)</Text>
            <TextInput
              value={pup.name || ""}
              onChangeText={(value) => onUpdate("name", value)}
              placeholder="Enter name..."
              placeholderTextColor="#9ca3af"
              className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800"
            />
          </View>

          {/* Photo Section */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm font-medium mb-2">Photo (Optional)</Text>
            {pup.photo ? (
              <View className="relative">
                <Image
                  source={{ uri: pup.photo }}
                  className="w-full h-40 rounded-xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={onRemovePhoto}
                  className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                >
                  <X size={16} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={onTakePhoto}
                  className="flex-1 bg-gray-50 rounded-xl py-4 flex-row items-center justify-center border border-gray-200"
                >
                  <Camera size={20} color="#666" />
                  <Text className="text-gray-600 font-medium ml-2">Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onPickImage}
                  className="flex-1 bg-gray-50 rounded-xl py-4 flex-row items-center justify-center border border-gray-200"
                >
                  <ImageIcon size={20} color="#666" />
                  <Text className="text-gray-600 font-medium ml-2">Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Sex Selection */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm font-medium mb-2">Sex *</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => onUpdate("sex", "male")}
                className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
                  pup.sex === "male"
                    ? "bg-blue-500"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <Text className="text-lg mr-1">♂</Text>
                <Text
                  className={`font-semibold ${
                    pup.sex === "male" ? "text-white" : "text-gray-600"
                  }`}
                >
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onUpdate("sex", "female")}
                className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
                  pup.sex === "female"
                    ? "bg-pink-500"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <Text className="text-lg mr-1">♀</Text>
                <Text
                  className={`font-semibold ${
                    pup.sex === "female" ? "text-white" : "text-gray-600"
                  }`}
                >
                  Female
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Color Input */}
          <View className="mb-4">
            <View className="flex-row items-center mb-2">
              <Palette size={16} color="#666" />
              <Text className="text-gray-600 text-sm font-medium ml-2">Color/Markings (Optional)</Text>
            </View>
            <TextInput
              value={pup.color || ""}
              onChangeText={(value) => onUpdate("color", value)}
              placeholder="e.g., Black and white spotted"
              placeholderTextColor="#9ca3af"
              className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800"
            />
          </View>

          {/* Status Selection */}
          <View className="mb-4">
            <Text className="text-gray-600 text-sm font-medium mb-2">Status *</Text>
            <View className="flex-row gap-2">
              {[
                { value: "alive", label: "Alive", color: "green" },
                { value: "died", label: "Died", color: "gray" },
                { value: "adopted", label: "Adopted", color: "purple" },
              ].map((status) => (
                <TouchableOpacity
                  key={status.value}
                  onPress={() => onUpdate("status", status.value)}
                  className={`flex-1 py-3 rounded-xl items-center justify-center ${
                    pup.status === status.value
                      ? status.color === "green"
                        ? "bg-green-500"
                        : status.color === "gray"
                        ? "bg-gray-500"
                        : "bg-purple-500"
                      : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <Text
                    className={`font-semibold ${
                      pup.status === status.value ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes Input */}
          <View>
            <Text className="text-gray-600 text-sm font-medium mb-2">Notes (Optional)</Text>
            <TextInput
              value={pup.notes || ""}
              onChangeText={(value) => onUpdate("notes", value)}
              placeholder="Any additional notes..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={2}
              className="bg-gray-50 rounded-xl px-4 py-3 text-gray-800"
              style={{ textAlignVertical: "top", minHeight: 60 }}
            />
          </View>
        </View>
      )}
    </View>
  );
}
