import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

interface DocumentUploaderProps {
  value: string | null;
  onChange: (uri: string | null) => void;
  onScanComplete?: (extractedData: Record<string, string>) => void;
  isScanning?: boolean;
  label?: string;
  placeholder?: string;
  aspectRatio?: [number, number];
}

export default function DocumentUploader({
  value,
  onChange,
  onScanComplete,
  isScanning = false,
  label = "Upload Document",
  placeholder = "Take a photo or choose from gallery",
  aspectRatio = [16, 10],
}: DocumentUploaderProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const requestPermission = async (type: "camera" | "library") => {
    if (type === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === "granted";
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === "granted";
    }
  };

  const handleCamera = async () => {
    setModalVisible(false);
    const hasPermission = await requestPermission("camera");
    if (!hasPermission) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: aspectRatio,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  };

  const handleGallery = async () => {
    setModalVisible(false);
    const hasPermission = await requestPermission("library");
    if (!hasPermission) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: aspectRatio,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onChange(result.assets[0].uri);
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <View>
      {/* Label */}
      <Text className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
        {label}
      </Text>

      {/* Upload Area */}
      {!value ? (
        <TouchableOpacity
          className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8"
          onPress={() => setModalVisible(true)}
          activeOpacity={0.7}
        >
          <View className="items-center">
            <View className="w-16 h-16 rounded-full bg-[#FF6B4A]/10 items-center justify-center mb-4">
              <Feather name="upload-cloud" size={28} color="#FF6B4A" />
            </View>
            <Text className="text-base font-semibold text-gray-900 text-center">
              {placeholder}
            </Text>
            <Text className="text-sm text-gray-500 mt-2 text-center">
              JPG, PNG up to 10MB
            </Text>

            {/* Quick Action Buttons */}
            <View className="flex-row mt-6 gap-3">
              <TouchableOpacity
                className="flex-row items-center bg-gray-100 px-4 py-2.5 rounded-full"
                onPress={handleCamera}
              >
                <Feather name="camera" size={16} color="#6B7280" />
                <Text className="text-sm font-medium text-gray-600 ml-2">
                  Camera
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row items-center bg-gray-100 px-4 py-2.5 rounded-full"
                onPress={handleGallery}
              >
                <Feather name="image" size={16} color="#6B7280" />
                <Text className="text-sm font-medium text-gray-600 ml-2">
                  Gallery
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {/* Image Preview */}
          <View className="relative">
            <Image
              source={{ uri: value }}
              className="w-full h-48"
              resizeMode="cover"
            />

            {/* Scanning Overlay */}
            {isScanning && (
              <View className="absolute inset-0 bg-black/60 items-center justify-center">
                <View className="bg-white/95 rounded-2xl px-6 py-4 items-center">
                  <ActivityIndicator size="small" color="#FF6B4A" />
                  <Text className="text-sm font-medium text-gray-900 mt-2">
                    Scanning ID...
                  </Text>
                  <Text className="text-xs text-gray-500 mt-1">
                    Extracting information
                  </Text>
                </View>

                {/* Scan Line Animation would go here */}
                <View className="absolute top-0 left-0 right-0 h-0.5 bg-[#FF6B4A]" />
              </View>
            )}

            {/* Remove Button */}
            {!isScanning && (
              <TouchableOpacity
                className="absolute top-3 right-3 w-8 h-8 bg-black/50 rounded-full items-center justify-center"
                onPress={handleRemove}
              >
                <Feather name="x" size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>

          {/* Status Bar */}
          <View className="p-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              {isScanning ? (
                <>
                  <ActivityIndicator size="small" color="#FF6B4A" />
                  <Text className="text-sm text-gray-600 ml-2">
                    AI is extracting information...
                  </Text>
                </>
              ) : (
                <>
                  <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center">
                    <Feather name="check" size={14} color="#22C55E" />
                  </View>
                  <Text className="text-sm text-gray-600 ml-2">
                    Document uploaded
                  </Text>
                </>
              )}
            </View>
            {!isScanning && (
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => setModalVisible(true)}
              >
                <Feather name="refresh-cw" size={14} color="#FF6B4A" />
                <Text className="text-sm font-medium text-[#FF6B4A] ml-1">
                  Change
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View className="bg-white rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-gray-900 text-center mb-6">
              Upload Document
            </Text>

            <TouchableOpacity
              className="flex-row items-center bg-gray-50 p-4 rounded-2xl mb-3"
              onPress={handleCamera}
            >
              <View className="w-12 h-12 rounded-xl bg-[#FF6B4A]/10 items-center justify-center">
                <Feather name="camera" size={22} color="#FF6B4A" />
              </View>
              <View className="ml-4">
                <Text className="text-base font-semibold text-gray-900">
                  Take Photo
                </Text>
                <Text className="text-sm text-gray-500">
                  Use camera to capture ID
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center bg-gray-50 p-4 rounded-2xl mb-3"
              onPress={handleGallery}
            >
              <View className="w-12 h-12 rounded-xl bg-blue-100 items-center justify-center">
                <Feather name="image" size={22} color="#3B82F6" />
              </View>
              <View className="ml-4">
                <Text className="text-base font-semibold text-gray-900">
                  Choose from Gallery
                </Text>
                <Text className="text-sm text-gray-500">
                  Select existing photo
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-2 py-4"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-base font-semibold text-gray-500 text-center">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
