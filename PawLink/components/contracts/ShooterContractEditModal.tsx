import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ScrollView,
} from "react-native";
import { X, DollarSign, Shield } from "lucide-react-native";
import { BreedingContract } from "@/services/contractService";

interface ShooterContractEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (contract: BreedingContract) => void;
  contract: BreedingContract;
  onSubmit: (
    payment: number,
    collateral: number
  ) => Promise<{ success: boolean; message: string; data?: BreedingContract }>;
}

export default function ShooterContractEditModal({
  visible,
  onClose,
  onSuccess,
  contract,
  onSubmit,
}: ShooterContractEditModalProps) {
  const [shooterPayment, setShooterPayment] = useState(
    contract.shooter_payment?.toString() || ""
  );
  const [shooterCollateral, setShooterCollateral] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  // Track the contract id to detect when we switch to a different contract
  const [lastContractId, setLastContractId] = React.useState<number | null>(null);

  // Initialize shooter_payment value for when we open with a new contract
  const initialShooterPayment = contract.shooter_payment?.toString() || "";

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
      // Reset form only when modal opens with a different contract
      if (contract.id !== lastContractId) {
        setShooterPayment(initialShooterPayment);
        setShooterCollateral("");
        setError("");
        setLastContractId(contract.id);
      }
    } else {
      scaleAnim.setValue(0);
      // Reset tracked contract id when modal closes
      setLastContractId(null);
    }
  }, [visible, scaleAnim, contract.id, lastContractId, initialShooterPayment]);

  const handleSubmit = async () => {
    setError("");

    const payment = parseFloat(shooterPayment);
    const collateral = parseFloat(shooterCollateral);

    // Validation
    if (!shooterPayment || isNaN(payment) || payment < 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    if (!shooterCollateral || isNaN(collateral) || collateral <= 0) {
      setError("Collateral is required for safety of both users");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit(payment, collateral);
      if (result.success && result.data) {
        onSuccess(result.data);
        onClose();
      } else {
        setError(result.message || "Failed to update contract");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <Animated.View
            style={{ transform: [{ scale: scaleAnim }] }}
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden"
          >
            {/* Header */}
            <View className="bg-[#FF6B6B] px-6 py-4 flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <DollarSign size={24} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Edit Your Offer
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
              >
                <X size={20} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="px-6 py-4"
              showsVerticalScrollIndicator={false}
            >
              {/* Info Box */}
              <View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                <Text className="text-blue-900 font-semibold text-sm mb-1">
                  💡 Why Collateral?
                </Text>
                <Text className="text-blue-800 text-xs leading-5">
                  To ensure the safety and trust of both pet owners, you must
                  provide collateral when updating your payment terms. This
                  protects all parties involved in the breeding agreement.
                </Text>
              </View>

              {/* Shooter Payment */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-900 mb-1">
                  Your Payment Offer *
                </Text>
                <Text className="text-xs text-gray-500 mb-2">
                  How much will you charge for this service?
                </Text>
                <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                  <DollarSign size={20} color="#6B7280" />
                  <TextInput
                    className="flex-1 ml-2 text-base text-gray-900"
                    placeholder="Enter amount"
                    placeholderTextColor="#9CA3AF"
                    value={shooterPayment}
                    onChangeText={setShooterPayment}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Shooter Collateral */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-900 mb-1">
                  Security Collateral *
                </Text>
                <Text className="text-xs text-gray-500 mb-2">
                  Required to protect both pet owners
                </Text>
                <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
                  <Shield size={20} color="#6B7280" />
                  <TextInput
                    className="flex-1 ml-2 text-base text-gray-900"
                    placeholder="Enter collateral amount"
                    placeholderTextColor="#9CA3AF"
                    value={shooterCollateral}
                    onChangeText={setShooterCollateral}
                    keyboardType="numeric"
                  />
                </View>
                <Text className="text-xs text-gray-500 mt-1">
                  This amount will be held as security and returned upon
                  successful completion
                </Text>
              </View>

              {/* Error Message */}
              {error && (
                <View className="bg-red-50 rounded-xl p-3 mb-4 border border-red-200">
                  <Text className="text-red-800 text-sm">{error}</Text>
                </View>
              )}

              {/* Summary */}
              <View className="bg-gray-50 rounded-xl p-4 mb-4">
                <Text className="text-gray-600 text-xs font-semibold mb-2">
                  Summary
                </Text>
                <View className="flex-row justify-between mb-1">
                  <Text className="text-gray-600 text-sm">Your Payment:</Text>
                  <Text className="text-gray-900 text-sm font-semibold">
                    ${parseFloat(shooterPayment || "0").toFixed(2)}
                  </Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-600 text-sm">Collateral:</Text>
                  <Text className="text-gray-900 text-sm font-semibold">
                    ${parseFloat(shooterCollateral || "0").toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row space-x-3 mb-2">
                <TouchableOpacity
                  onPress={onClose}
                  className="flex-1 border border-gray-300 py-3 rounded-full"
                  disabled={isSubmitting}
                >
                  <Text className="text-gray-700 text-center font-semibold">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 bg-[#FF6B6B] py-3 rounded-full flex-row items-center justify-center"
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white text-center font-semibold">
                      Update & Submit
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
