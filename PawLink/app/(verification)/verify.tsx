import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import IdVerificationStep from "@/components/verification/IdVerificationStep";
import LicensedBreederStep from "@/components/verification/LicensedBreederStep";
import ShooterCertificateStep from "@/components/verification/ShooterCertificateStep";

export default function VerifyScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 - ID
    idType: "",
    idPhoto: null,
    idName: "",
    idNumber: "",
    idBirthdate: "",
    idGivenDate: "",
    idExpirationDate: "",
    // Step 2 - Licensed Breeder
    breederPhoto: null,
    breederName: "",
    breederIdNumber: "",
    breederIssuingAuthority: "",
    breederGivenDate: "",
    breederExpirationDate: "",
    breederSkipped: false,
    // Step 3 - Shooter Certificate
    shooterPhoto: null,
    shooterName: "",
    shooterIdNumber: "",
    shooterIssuingAuthority: "",
    shooterGivenDate: "",
    shooterExpirationDate: "",
    shooterSkipped: false,
  });

  const handleNext = (stepData: any) => {
    setFormData({ ...formData, ...stepData });
    setCurrentStep(currentStep + 1);
  };

  const handleSkip = () => {
    if (currentStep === 2) {
      setFormData({ ...formData, breederSkipped: true });
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setFormData({ ...formData, shooterSkipped: true });
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    // TODO: Submit verification data to backend
    console.log("Verification data:", formData);
    router.back();
  };

  const renderProgressBar = () => {
    const progress = (currentStep / 3) * 100;
    return (
      <View className="px-6 mb-6">
        <Text className="text-gray-600 text-sm mb-2 text-right">
          {currentStep} of 3
        </Text>
        <View className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
          <View
            className="h-full bg-[#FF6B4A]"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFF5F5]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 pt-4 pb-6 bg-white rounded-b-[35] shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-black ml-4">VERIFY</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mt-6">{renderProgressBar()}</View>

      {/* Form Steps */}
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {currentStep === 1 && (
          <IdVerificationStep onNext={handleNext} initialData={formData} />
        )}
        {currentStep === 2 && (
          <LicensedBreederStep
            onNext={handleNext}
            onSkip={handleSkip}
            initialData={formData}
          />
        )}
        {currentStep === 3 && (
          <ShooterCertificateStep
            onDone={handleSubmit}
            onSkip={handleSkip}
            initialData={formData}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
