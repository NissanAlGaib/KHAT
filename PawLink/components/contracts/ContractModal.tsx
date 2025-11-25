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
    <View className="flex-row justify-center items-center py-4">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <View
            className={`w-8 h-8 rounded-full items-center justify-center ${
              step <= currentStep ? "bg-[#FF6B6B]" : "bg-gray-300"
            }`}
          >
            <Text
              className={`font-semibold ${
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
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-lg font-semibold text-gray-900 mb-2">
        Optional Shooter Agreement
      </Text>
      <Text className="text-sm text-gray-500 mb-4">
        Add a third-party shooter if applicable
      </Text>

      {/* Shooter Name */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Shooter Name
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base"
          placeholder="Enter shooter name"
          value={formData.shooter_name}
          onChangeText={(text) => updateFormField("shooter_name", text)}
        />
      </View>

      {/* Shooter Payment */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Shooter Payment ($)
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base"
          placeholder="Enter payment amount"
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
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">Location</Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base"
          placeholder="Enter location"
          value={formData.shooter_location}
          onChangeText={(text) => updateFormField("shooter_location", text)}
        />
      </View>

      {/* Conditions */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Conditions
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base min-h-[100px]"
          placeholder="Enter conditions (max 200 characters)"
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
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-lg font-semibold text-gray-900 mb-2">
        Payment & Compensation
      </Text>
      <Text className="text-sm text-gray-500 mb-4">
        Define the financial terms of the agreement
      </Text>

      {/* End Contract Date */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          End Contract Date
        </Text>
        <TouchableOpacity
          className="bg-gray-100 rounded-xl px-4 py-3"
          onPress={() => setShowDatePicker(true)}
        >
          <Text
            className={`text-base ${
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
        className="flex-row items-center mb-4"
        onPress={() =>
          updateFormField(
            "include_monetary_amount",
            !formData.include_monetary_amount
          )
        }
      >
        <View
          className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
            formData.include_monetary_amount
              ? "bg-[#FF6B6B] border-[#FF6B6B]"
              : "border-gray-300"
          }`}
        >
          {formData.include_monetary_amount && (
            <Text className="text-white text-xs font-bold">✓</Text>
          )}
        </View>
        <Text className="text-base text-gray-700">Include Monetary Amount</Text>
      </TouchableOpacity>

      {formData.include_monetary_amount && (
        <View className="mb-4 ml-9">
          <TextInput
            className="bg-gray-100 rounded-xl px-4 py-3 text-base"
            placeholder="Enter amount ($)"
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
        className="flex-row items-center mb-4"
        onPress={() =>
          updateFormField("share_offspring", !formData.share_offspring)
        }
      >
        <View
          className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
            formData.share_offspring
              ? "bg-[#FF6B6B] border-[#FF6B6B]"
              : "border-gray-300"
          }`}
        >
          {formData.share_offspring && (
            <Text className="text-white text-xs font-bold">✓</Text>
          )}
        </View>
        <Text className="text-base text-gray-700">Share Offspring</Text>
      </TouchableOpacity>

      {formData.share_offspring && (
        <View className="mb-4 ml-9">
          {/* Split Type */}
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Split Type
          </Text>
          <View className="flex-row mb-3">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-l-xl border ${
                formData.offspring_split_type === "percentage"
                  ? "bg-[#FF6B6B] border-[#FF6B6B]"
                  : "bg-white border-gray-300"
              }`}
              onPress={() =>
                updateFormField("offspring_split_type", "percentage")
              }
            >
              <Text
                className={`text-center font-medium ${
                  formData.offspring_split_type === "percentage"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                Percentage Split
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-r-xl border ${
                formData.offspring_split_type === "specific_number"
                  ? "bg-[#FF6B6B] border-[#FF6B6B]"
                  : "bg-white border-gray-300"
              }`}
              onPress={() =>
                updateFormField("offspring_split_type", "specific_number")
              }
            >
              <Text
                className={`text-center font-medium ${
                  formData.offspring_split_type === "specific_number"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                Specific Number
              </Text>
            </TouchableOpacity>
          </View>

          {/* Split Value */}
          <TextInput
            className="bg-gray-100 rounded-xl px-4 py-3 text-base mb-3"
            placeholder={
              formData.offspring_split_type === "percentage"
                ? "Enter percentage (e.g., 50)"
                : "Enter number of offspring"
            }
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
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Selection Method
          </Text>
          <View className="flex-row">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-l-xl border ${
                formData.offspring_selection_method === "first_pick"
                  ? "bg-[#FF6B6B] border-[#FF6B6B]"
                  : "bg-white border-gray-300"
              }`}
              onPress={() =>
                updateFormField("offspring_selection_method", "first_pick")
              }
            >
              <Text
                className={`text-center font-medium ${
                  formData.offspring_selection_method === "first_pick"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                First Pick
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-r-xl border ${
                formData.offspring_selection_method === "randomized"
                  ? "bg-[#FF6B6B] border-[#FF6B6B]"
                  : "bg-white border-gray-300"
              }`}
              onPress={() =>
                updateFormField("offspring_selection_method", "randomized")
              }
            >
              <Text
                className={`text-center font-medium ${
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
        className="flex-row items-center mb-4"
        onPress={() =>
          updateFormField("include_goods_foods", !formData.include_goods_foods)
        }
      >
        <View
          className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
            formData.include_goods_foods
              ? "bg-[#FF6B6B] border-[#FF6B6B]"
              : "border-gray-300"
          }`}
        >
          {formData.include_goods_foods && (
            <Text className="text-white text-xs font-bold">✓</Text>
          )}
        </View>
        <Text className="text-base text-gray-700">Include Goods/Foods</Text>
      </TouchableOpacity>

      {formData.include_goods_foods && (
        <View className="mb-4 ml-9">
          <TextInput
            className="bg-gray-100 rounded-xl px-4 py-3 text-base"
            placeholder="Enter value ($)"
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
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Total Collateral ($)
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base"
          placeholder="Enter total collateral"
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
      <View className="bg-[#FFF5F3] rounded-xl p-4 mb-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">Total Collateral:</Text>
          <Text className="font-semibold text-gray-900">
            ${formData.collateral_total?.toFixed(2) || "0.00"}
          </Text>
        </View>
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-600">{"Each Owner's Share:"}</Text>
          <Text className="font-semibold text-gray-900">
            ${collateralPerOwner.toFixed(2)}
          </Text>
        </View>
        <Text className="text-xs text-gray-500 mt-2">
          Note: 5% of collateral will be deducted to the app upon contract
          completion
        </Text>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <Text className="text-lg font-semibold text-gray-900 mb-2">
        Terms & Policies
      </Text>
      <Text className="text-sm text-gray-500 mb-4">
        Define the terms and conditions of the agreement
      </Text>

      {/* Pet Care Responsibilities */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Pet Care Responsibilities
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base min-h-[80px]"
          placeholder="Describe pet care responsibilities..."
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
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Harm Liability Terms
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base min-h-[80px]"
          placeholder="Describe liability terms..."
          value={formData.harm_liability_terms}
          onChangeText={(text) => updateFormField("harm_liability_terms", text)}
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
      </View>

      {/* Cancellation Policy */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Cancellation Policy
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base min-h-[80px]"
          placeholder="Describe cancellation policy..."
          value={formData.cancellation_policy}
          onChangeText={(text) => updateFormField("cancellation_policy", text)}
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
      </View>

      {/* Custom Terms */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          Custom Terms
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base min-h-[80px]"
          placeholder="Add any custom terms..."
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
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white"
      >
        {/* Header */}
        <View className="bg-[#FF6B6B] px-4 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={handleClose}>
              <X size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-white text-lg font-semibold">
              {existingContract ? "Edit Contract" : "Create Contract"}
            </Text>
            <View className="w-6" />
          </View>
        </View>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Step Content */}
        <View className="flex-1 px-6">{renderCurrentStep()}</View>

        {/* Navigation Buttons */}
        <View className="flex-row px-6 py-4 border-t border-gray-200">
          {currentStep > 1 && (
            <TouchableOpacity
              onPress={handlePrev}
              className="flex-1 flex-row items-center justify-center py-4 mr-2 border border-[#FF6B6B] rounded-full"
            >
              <ChevronLeft size={20} color="#FF6B6B" />
              <Text className="text-[#FF6B6B] font-semibold ml-1">Prev</Text>
            </TouchableOpacity>
          )}
          {currentStep < TOTAL_STEPS ? (
            <TouchableOpacity
              onPress={handleNext}
              className="flex-1 flex-row items-center justify-center py-4 bg-[#FF6B6B] rounded-full"
            >
              <Text className="text-white font-semibold mr-1">Next</Text>
              <ChevronRight size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 py-4 rounded-full items-center justify-center ${
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
