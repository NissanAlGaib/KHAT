import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from "react-native";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import dayjs from "dayjs";
import {
  ContractFormData,
  BreedingContract,
  createContract,
  updateContract,
} from "@/services/contractService";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ContractModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (contract: BreedingContract) => void;
  conversationId: number;
  existingContract?: BreedingContract | null;
}

const TOTAL_STEPS = 3;

export default function ContractModal({
  visible,
  onClose,
  onSuccess,
  conversationId,
  existingContract,
}: ContractModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
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

  // Form state
  const [formData, setFormData] = useState<ContractFormData>({
    // Shooter Agreement
    shooter_name: existingContract?.shooter_name || "",
    shooter_payment: existingContract?.shooter_payment || undefined,
    shooter_location: existingContract?.shooter_location || "",
    shooter_conditions: existingContract?.shooter_conditions || "",
    // Payment & Compensation
    end_contract_date: existingContract?.end_contract_date || "",
    include_monetary_amount: existingContract?.include_monetary_amount || false,
    monetary_amount: existingContract?.monetary_amount || undefined,
    share_offspring: existingContract?.share_offspring || false,
    offspring_split_type: existingContract?.offspring_split_type || undefined,
    offspring_split_value: existingContract?.offspring_split_value || undefined,
    offspring_selection_method:
      existingContract?.offspring_selection_method || undefined,
    include_goods_foods: existingContract?.include_goods_foods || false,
    goods_foods_value: existingContract?.goods_foods_value || undefined,
    collateral_total: existingContract?.collateral_total || 0,
    // Terms & Policies
    pet_care_responsibilities:
      existingContract?.pet_care_responsibilities || "",
    harm_liability_terms: existingContract?.harm_liability_terms || "",
    cancellation_policy: existingContract?.cancellation_policy || "",
    custom_terms: existingContract?.custom_terms || "",
  });

  const updateFormField = (field: keyof ContractFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateConfirm = (date: Date) => {
    updateFormField("end_contract_date", dayjs(date).format("YYYY-MM-DD"));
    setShowDatePicker(false);
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let result;
      if (existingContract) {
        result = await updateContract(existingContract.id, formData);
      } else {
        result = await createContract(conversationId, formData);
      }

      if (result.success && result.data) {
        onSuccess(result.data);
        onClose();
        resetForm();
      } else {
        console.error("Contract submission failed:", result.message);
      }
    } catch (error) {
      console.error("Error submitting contract:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setFormData({
      shooter_name: "",
      shooter_payment: undefined,
      shooter_location: "",
      shooter_conditions: "",
      end_contract_date: "",
      include_monetary_amount: false,
      monetary_amount: undefined,
      share_offspring: false,
      offspring_split_type: undefined,
      offspring_split_value: undefined,
      offspring_selection_method: undefined,
      include_goods_foods: false,
      goods_foods_value: undefined,
      collateral_total: 0,
      pet_care_responsibilities: "",
      harm_liability_terms: "",
      cancellation_policy: "",
      custom_terms: "",
    });
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const collateralPerOwner = (formData.collateral_total || 0) / 2;

  const renderStepIndicator = () => (
    <View className="flex-row justify-center items-center py-3 bg-gray-50">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <View
            className={`w-7 h-7 rounded-full items-center justify-center ${
              step <= currentStep ? "bg-[#FF6B6B]" : "bg-gray-300"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                step <= currentStep ? "text-white" : "text-gray-600"
              }`}
            >
              {step}
            </Text>
          </View>
          {step < 3 && (
            <View
              className={`w-10 h-1 ${
                step < currentStep ? "bg-[#FF6B6B]" : "bg-gray-300"
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
      <Text className="text-base font-semibold text-gray-900 mb-1">
        Optional Shooter Agreement
      </Text>
      <Text className="text-xs text-gray-500 mb-3">
        Add a third-party shooter if applicable
      </Text>

      {/* Shooter Name */}
      <View className="mb-3">
        <Text className="text-xs font-medium text-gray-700 mb-1">
          Shooter Name
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-3 py-2.5 text-sm"
          placeholder="Enter shooter name"
          placeholderTextColor="#9CA3AF"
          value={formData.shooter_name}
          onChangeText={(text) => updateFormField("shooter_name", text)}
        />
      </View>

      {/* Shooter Payment */}
      <View className="mb-3">
        <Text className="text-xs font-medium text-gray-700 mb-1">
          Shooter Payment ($)
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-3 py-2.5 text-sm"
          placeholder="Enter payment amount"
          placeholderTextColor="#9CA3AF"
          value={formData.shooter_payment?.toString() || ""}
          onChangeText={(text) =>
            updateFormField(
              "shooter_payment",
              text ? parseFloat(text) : undefined
            )
          }
          keyboardType="numeric"
        />
      </View>

      {/* Location */}
      <View className="mb-3">
        <Text className="text-xs font-medium text-gray-700 mb-1">Location</Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-3 py-2.5 text-sm"
          placeholder="Enter location"
          placeholderTextColor="#9CA3AF"
          value={formData.shooter_location}
          onChangeText={(text) => updateFormField("shooter_location", text)}
        />
      </View>

      {/* Conditions */}
      <View className="mb-2">
        <Text className="text-xs font-medium text-gray-700 mb-1">
          Conditions
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-3 py-2.5 text-sm min-h-[70px]"
          placeholder="Enter conditions (max 200 characters)"
          placeholderTextColor="#9CA3AF"
          value={formData.shooter_conditions}
          onChangeText={(text) => updateFormField("shooter_conditions", text)}
          multiline
          maxLength={200}
          textAlignVertical="top"
        />
        <Text className="text-xs text-gray-400 text-right mt-1">
          {formData.shooter_conditions?.length || 0}/200
        </Text>
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
      <Text className="text-base font-semibold text-gray-900 mb-1">
        Payment & Compensation
      </Text>
      <Text className="text-xs text-gray-500 mb-3">
        Define the financial terms of the agreement
      </Text>

      {/* End Contract Date */}
      <View className="mb-3">
        <Text className="text-xs font-medium text-gray-700 mb-1">
          End Contract Date
        </Text>
        <TouchableOpacity
          className="bg-gray-100 rounded-xl px-3 py-2.5"
          onPress={() => setShowDatePicker(true)}
        >
          <Text
            className={`text-sm ${
              formData.end_contract_date ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {formData.end_contract_date
              ? dayjs(formData.end_contract_date).format("MMMM D, YYYY")
              : "Select date"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Include Monetary Amount */}
      <TouchableOpacity
        className="flex-row items-center mb-3"
        onPress={() =>
          updateFormField(
            "include_monetary_amount",
            !formData.include_monetary_amount
          )
        }
      >
        <View
          className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
            formData.include_monetary_amount
              ? "bg-[#FF6B6B] border-[#FF6B6B]"
              : "border-gray-300"
          }`}
        >
          {formData.include_monetary_amount && (
            <Text className="text-white text-xs font-bold">✓</Text>
          )}
        </View>
        <Text className="text-sm text-gray-700">Include Monetary Amount</Text>
      </TouchableOpacity>

      {formData.include_monetary_amount && (
        <View className="mb-3 ml-7">
          <TextInput
            className="bg-gray-100 rounded-xl px-3 py-2.5 text-sm"
            placeholder="Enter amount ($)"
            placeholderTextColor="#9CA3AF"
            value={formData.monetary_amount?.toString() || ""}
            onChangeText={(text) =>
              updateFormField(
                "monetary_amount",
                text ? parseFloat(text) : undefined
              )
            }
            keyboardType="numeric"
          />
        </View>
      )}

      {/* Share Offspring */}
      <TouchableOpacity
        className="flex-row items-center mb-3"
        onPress={() =>
          updateFormField("share_offspring", !formData.share_offspring)
        }
      >
        <View
          className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
            formData.share_offspring
              ? "bg-[#FF6B6B] border-[#FF6B6B]"
              : "border-gray-300"
          }`}
        >
          {formData.share_offspring && (
            <Text className="text-white text-xs font-bold">✓</Text>
          )}
        </View>
        <Text className="text-sm text-gray-700">Share Offspring</Text>
      </TouchableOpacity>

      {formData.share_offspring && (
        <View className="mb-3 ml-7">
          {/* Split Type */}
          <Text className="text-xs font-medium text-gray-700 mb-1">
            Split Type
          </Text>
          <View className="flex-row mb-2">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-l-xl border ${
                formData.offspring_split_type === "percentage"
                  ? "bg-[#FF6B6B] border-[#FF6B6B]"
                  : "bg-white border-gray-300"
              }`}
              onPress={() =>
                updateFormField("offspring_split_type", "percentage")
              }
            >
              <Text
                className={`text-center text-xs font-medium ${
                  formData.offspring_split_type === "percentage"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                Percentage
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-r-xl border ${
                formData.offspring_split_type === "specific_number"
                  ? "bg-[#FF6B6B] border-[#FF6B6B]"
                  : "bg-white border-gray-300"
              }`}
              onPress={() =>
                updateFormField("offspring_split_type", "specific_number")
              }
            >
              <Text
                className={`text-center text-xs font-medium ${
                  formData.offspring_split_type === "specific_number"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                Specific #
              </Text>
            </TouchableOpacity>
          </View>

          {/* Split Value */}
          <TextInput
            className="bg-gray-100 rounded-xl px-3 py-2 text-sm mb-2"
            placeholder={
              formData.offspring_split_type === "percentage"
                ? "Enter percentage (e.g., 50)"
                : "Enter number of offspring"
            }
            placeholderTextColor="#9CA3AF"
            value={formData.offspring_split_value?.toString() || ""}
            onChangeText={(text) =>
              updateFormField(
                "offspring_split_value",
                text ? parseInt(text) : undefined
              )
            }
            keyboardType="numeric"
          />

          {/* Selection Method */}
          <Text className="text-xs font-medium text-gray-700 mb-1">
            Selection Method
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              className={`flex-1 py-2 rounded-l-xl border ${
                formData.offspring_selection_method === "first_pick"
                  ? "bg-[#FF6B6B] border-[#FF6B6B]"
                  : "bg-white border-gray-300"
              }`}
              onPress={() =>
                updateFormField("offspring_selection_method", "first_pick")
              }
            >
              <Text
                className={`text-center text-xs font-medium ${
                  formData.offspring_selection_method === "first_pick"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                First Pick
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-2 rounded-r-xl border ${
                formData.offspring_selection_method === "randomized"
                  ? "bg-[#FF6B6B] border-[#FF6B6B]"
                  : "bg-white border-gray-300"
              }`}
              onPress={() =>
                updateFormField("offspring_selection_method", "randomized")
              }
            >
              <Text
                className={`text-center text-xs font-medium ${
                  formData.offspring_selection_method === "randomized"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                Randomized
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Include Goods/Foods */}
      <TouchableOpacity
        className="flex-row items-center mb-3"
        onPress={() =>
          updateFormField("include_goods_foods", !formData.include_goods_foods)
        }
      >
        <View
          className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
            formData.include_goods_foods
              ? "bg-[#FF6B6B] border-[#FF6B6B]"
              : "border-gray-300"
          }`}
        >
          {formData.include_goods_foods && (
            <Text className="text-white text-xs font-bold">✓</Text>
          )}
        </View>
        <Text className="text-sm text-gray-700">Include Goods/Foods</Text>
      </TouchableOpacity>

      {formData.include_goods_foods && (
        <View className="mb-3 ml-7">
          <TextInput
            className="bg-gray-100 rounded-xl px-3 py-2.5 text-sm"
            placeholder="Enter value ($)"
            placeholderTextColor="#9CA3AF"
            value={formData.goods_foods_value?.toString() || ""}
            onChangeText={(text) =>
              updateFormField(
                "goods_foods_value",
                text ? parseFloat(text) : undefined
              )
            }
            keyboardType="numeric"
          />
        </View>
      )}

      {/* Collateral */}
      <View className="mb-3">
        <Text className="text-xs font-medium text-gray-700 mb-1">
          Total Collateral ($)
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-3 py-2.5 text-sm"
          placeholder="Enter total collateral"
          placeholderTextColor="#9CA3AF"
          value={formData.collateral_total?.toString() || ""}
          onChangeText={(text) =>
            updateFormField(
              "collateral_total",
              text ? parseFloat(text) : undefined
            )
          }
          keyboardType="numeric"
        />
      </View>

      {/* Collateral Display */}
      <View className="bg-[#FFF5F3] rounded-xl p-3">
        <View className="flex-row justify-between mb-1">
          <Text className="text-xs text-gray-600">Total Collateral:</Text>
          <Text className="text-xs font-semibold text-gray-900">
            ${formData.collateral_total?.toFixed(2) || "0.00"}
          </Text>
        </View>
        <View className="flex-row justify-between mb-1">
          <Text className="text-xs text-gray-600">{"Each Owner's Share:"}</Text>
          <Text className="text-xs font-semibold text-gray-900">
            ${collateralPerOwner.toFixed(2)}
          </Text>
        </View>
        <Text className="text-xs text-gray-500 mt-1">
          Note: 5% deducted upon completion
        </Text>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
      <Text className="text-base font-semibold text-gray-900 mb-1">
        Terms & Policies
      </Text>
      <Text className="text-xs text-gray-500 mb-3">
        Define the terms and conditions of the agreement
      </Text>

      {/* Pet Care Responsibilities */}
      <View className="mb-3">
        <Text className="text-xs font-medium text-gray-700 mb-1">
          Pet Care Responsibilities
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-3 py-2.5 text-sm min-h-[60px]"
          placeholder="Describe pet care responsibilities..."
          placeholderTextColor="#9CA3AF"
          value={formData.pet_care_responsibilities}
          onChangeText={(text) =>
            updateFormField("pet_care_responsibilities", text)
          }
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
      </View>

      {/* Harm Liability Terms */}
      <View className="mb-3">
        <Text className="text-xs font-medium text-gray-700 mb-1">
          Harm Liability Terms
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-3 py-2.5 text-sm min-h-[60px]"
          placeholder="Describe liability terms..."
          placeholderTextColor="#9CA3AF"
          value={formData.harm_liability_terms}
          onChangeText={(text) => updateFormField("harm_liability_terms", text)}
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
      </View>

      {/* Cancellation Policy */}
      <View className="mb-3">
        <Text className="text-xs font-medium text-gray-700 mb-1">
          Cancellation Policy
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-3 py-2.5 text-sm min-h-[60px]"
          placeholder="Describe cancellation policy..."
          placeholderTextColor="#9CA3AF"
          value={formData.cancellation_policy}
          onChangeText={(text) => updateFormField("cancellation_policy", text)}
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
      </View>

      {/* Custom Terms */}
      <View className="mb-2">
        <Text className="text-xs font-medium text-gray-700 mb-1">
          Custom Terms
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-3 py-2.5 text-sm min-h-[60px]"
          placeholder="Add any custom terms..."
          placeholderTextColor="#9CA3AF"
          value={formData.custom_terms}
          onChangeText={(text) => updateFormField("custom_terms", text)}
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
      </View>
    </ScrollView>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-black/50 justify-center items-center px-4"
      >
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
            maxHeight: SCREEN_HEIGHT * 0.85,
          }}
          className="bg-white rounded-3xl w-full overflow-hidden"
        >
          {/* Header */}
          <View className="bg-[#FF6B6B] px-4 py-4 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={handleClose}
              className="w-8 h-8 rounded-full bg-white/20 items-center justify-center"
            >
              <X size={18} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-semibold">
              {existingContract ? "Edit Contract" : "Create Contract"}
            </Text>
            <View className="w-8" />
          </View>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Step Content */}
          <View style={{ maxHeight: SCREEN_HEIGHT * 0.45 }} className="px-5">
            {renderCurrentStep()}
          </View>

          {/* Navigation Buttons */}
          <View className="flex-row px-5 py-4 border-t border-gray-100">
            {currentStep > 1 && (
              <TouchableOpacity
                onPress={handlePrev}
                className="flex-1 flex-row items-center justify-center py-3 mr-2 border border-[#FF6B6B] rounded-full"
              >
                <ChevronLeft size={18} color="#FF6B6B" />
                <Text className="text-[#FF6B6B] font-semibold ml-1">Prev</Text>
              </TouchableOpacity>
            )}
            {currentStep < TOTAL_STEPS ? (
              <TouchableOpacity
                onPress={handleNext}
                className="flex-1 flex-row items-center justify-center py-3 bg-[#FF6B6B] rounded-full"
              >
                <Text className="text-white font-semibold mr-1">Next</Text>
                <ChevronRight size={18} color="white" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                className={`flex-1 py-3 rounded-full items-center justify-center ${
                  isSubmitting ? "bg-gray-400" : "bg-[#FF6B6B]"
                }`}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">
                    {existingContract ? "Update Contract" : "Submit Contract"}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Date Picker */}
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={() => setShowDatePicker(false)}
          minimumDate={new Date()}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}
