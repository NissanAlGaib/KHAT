import React from "react";
import { View, Text, Modal, TouchableOpacity, Animated } from "react-native";
import { FileText, X } from "lucide-react-native";

interface ContractPromptProps {
  visible: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function ContractPrompt({
  visible,
  onClose,
  onAccept,
}: ContractPromptProps) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, scaleAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-5">
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
          }}
          className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
        >
          {/* Header with Close Button */}
          <View className="flex-row justify-end pt-4 pr-4">
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
            >
              <X size={18} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View className="items-center px-6 pb-8">
            {/* Icon */}
            <View className="w-20 h-20 rounded-full bg-[#FFF5F3] items-center justify-center mb-4">
              <FileText size={36} color="#FF6B6B" />
            </View>

            {/* Title */}
            <Text className="text-xl font-bold text-center text-gray-900 mb-3">
              CREATE BREEDING CONTRACTS
            </Text>

            {/* Description */}
            <Text className="text-gray-600 text-center text-sm leading-5 mb-6">
              Protect your interests and establish clear agreements with your
              breeding partner. Create a comprehensive contract that covers all
              aspects of the breeding arrangement.
            </Text>

            {/* Yes Button */}
            <TouchableOpacity
              onPress={onAccept}
              className="w-full bg-[#FF6B6B] py-4 rounded-full mb-3"
            >
              <Text className="text-white text-center font-semibold text-base">
                YES
              </Text>
            </TouchableOpacity>

            {/* No Thanks Link */}
            <TouchableOpacity onPress={onClose}>
              <Text className="text-gray-500 text-sm">No Thanks</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
