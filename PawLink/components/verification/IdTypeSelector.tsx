import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";

interface IdType {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  description?: string;
}

interface IdTypeSelectorProps {
  value: string;
  onSelect: (idType: string) => void;
  placeholder?: string;
}

const ID_TYPES: IdType[] = [
  {
    id: "drivers_license",
    label: "Driver's License",
    icon: "truck",
    description: "LTO-issued driver's license",
  },
  {
    id: "national_id",
    label: "Philippine National ID",
    icon: "credit-card",
    description: "PhilSys National ID",
  },
  {
    id: "umid",
    label: "UMID",
    icon: "user",
    description: "Unified Multi-Purpose ID",
  },
  {
    id: "sss_id",
    label: "SSS ID",
    icon: "shield",
    description: "Social Security System ID",
  },
  {
    id: "philhealth_id",
    label: "PhilHealth ID",
    icon: "heart",
    description: "Philippine Health Insurance ID",
  },
  {
    id: "prc_id",
    label: "PRC ID",
    icon: "award",
    description: "Professional Regulation Commission ID",
  },
];

export default function IdTypeSelector({
  value,
  onSelect,
  placeholder = "Select ID Type",
}: IdTypeSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedType = ID_TYPES.find((type) => type.id === value || type.label === value);

  const handleSelect = (idType: IdType) => {
    onSelect(idType.label);
    setModalVisible(false);
  };

  return (
    <>
      {/* Selector Button */}
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View
              className={`w-12 h-12 rounded-xl items-center justify-center ${
                selectedType ? "bg-[#FF6B4A]/10" : "bg-gray-100"
              }`}
            >
              <Feather
                name={selectedType?.icon || "file"}
                size={22}
                color={selectedType ? "#FF6B4A" : "#9CA3AF"}
              />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                ID Type
              </Text>
              <Text
                className={`text-base font-semibold mt-0.5 ${
                  selectedType ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {selectedType?.label || placeholder}
              </Text>
            </View>
          </View>
          <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
            <Feather name="chevron-down" size={18} color="#6B7280" />
          </View>
        </View>
      </TouchableOpacity>

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[80%]">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between p-5 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-900">
                Select ID Type
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
              >
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* ID Type List */}
            <ScrollView
              className="p-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <Text className="text-sm text-gray-500 mb-4 px-1">
                Select a valid Philippine government-issued ID for verification
              </Text>

              {ID_TYPES.map((idType) => {
                const isSelected = selectedType?.id === idType.id;
                return (
                  <TouchableOpacity
                    key={idType.id}
                    className={`flex-row items-center p-4 rounded-2xl mb-2 ${
                      isSelected
                        ? "bg-[#FF6B4A]/10 border-2 border-[#FF6B4A]"
                        : "bg-gray-50 border-2 border-transparent"
                    }`}
                    onPress={() => handleSelect(idType)}
                    activeOpacity={0.7}
                  >
                    <View
                      className={`w-12 h-12 rounded-xl items-center justify-center ${
                        isSelected ? "bg-[#FF6B4A]" : "bg-white"
                      }`}
                    >
                      <Feather
                        name={idType.icon}
                        size={22}
                        color={isSelected ? "white" : "#6B7280"}
                      />
                    </View>
                    <View className="ml-4 flex-1">
                      <Text
                        className={`text-base font-semibold ${
                          isSelected ? "text-[#FF6B4A]" : "text-gray-900"
                        }`}
                      >
                        {idType.label}
                      </Text>
                      {idType.description && (
                        <Text className="text-sm text-gray-500 mt-0.5">
                          {idType.description}
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <View className="w-6 h-6 rounded-full bg-[#FF6B4A] items-center justify-center">
                        <Feather name="check" size={14} color="white" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
