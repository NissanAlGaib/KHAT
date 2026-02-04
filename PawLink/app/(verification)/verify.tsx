import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import IdVerificationStep from "@/components/verification/IdVerificationStep";
import LicensedBreederStep from "@/components/verification/LicensedBreederStep";
import ShooterCertificateStep from "@/components/verification/ShooterCertificateStep";
import StepperProgress from "@/components/verification/StepperProgress";
import { submitVerification } from "@/services/verificationService";
import { useSession } from "@/context/AuthContext";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";

export default function VerifyScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleSubmit = async (shooterData?: any) => {
    if (!user?.id) {
      showAlert({
        title: "Error",
        message: "User not authenticated. Please log in again.",
        type: "error",
      });
      return;
    }

    if (!formData.idPhoto) {
      showAlert({
        title: "Error",
        message: "ID document is required.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Merge shooter data if provided
      const finalFormData = shooterData
        ? { ...formData, ...shooterData }
        : formData;

      const hasBreeder =
        !finalFormData.breederSkipped && finalFormData.breederPhoto;
      const hasShooter =
        !finalFormData.shooterSkipped && finalFormData.shooterPhoto;

      // Prepare verification data
      const verificationData = {
        user_id: parseInt(user.id),
        id_document: finalFormData.idPhoto,
        id_number: finalFormData.idNumber,
        id_name: finalFormData.idName,
        id_issue_date: finalFormData.idGivenDate,
        id_expiration_date: finalFormData.idExpirationDate,
        breeder_document: hasBreeder ? finalFormData.breederPhoto : undefined,
        breeder_number: hasBreeder ? finalFormData.breederIdNumber : undefined,
        breeder_name: hasBreeder ? finalFormData.breederName : undefined,
        breeder_issuing_authority: hasBreeder
          ? finalFormData.breederIssuingAuthority
          : undefined,
        breeder_issue_date: hasBreeder
          ? finalFormData.breederGivenDate
          : undefined,
        breeder_expiration_date: hasBreeder
          ? finalFormData.breederExpirationDate
          : undefined,
        shooter_document: hasShooter ? finalFormData.shooterPhoto : undefined,
        shooter_number: hasShooter ? finalFormData.shooterIdNumber : undefined,
        shooter_name: hasShooter ? finalFormData.shooterName : undefined,
        shooter_issuing_authority: hasShooter
          ? finalFormData.shooterIssuingAuthority
          : undefined,
        shooter_issue_date: hasShooter
          ? finalFormData.shooterGivenDate
          : undefined,
        shooter_expiration_date: hasShooter
          ? finalFormData.shooterExpirationDate
          : undefined,
      };

      console.log("Submitting verification data:", {
        user_id: parseInt(user.id),
        id_document: "file",
        id_number: finalFormData.idNumber,
        id_name: finalFormData.idName,
        breeder_document: hasBreeder ? "file" : undefined,
        breeder_number: hasBreeder ? finalFormData.breederIdNumber : undefined,
        shooter_document: hasShooter ? "file" : undefined,
        shooter_number: hasShooter ? finalFormData.shooterIdNumber : undefined,
        shooter_name: hasShooter ? finalFormData.shooterName : undefined,
      });

      const response = await submitVerification(verificationData);

      if (response.success) {
        showAlert({
          title: "Success",
          message:
            "Your verification has been submitted successfully. We'll review it and notify you once it's approved.",
          type: "success",
          buttons: [
            {
              text: "OK",
              onPress: () => router.back(),
              style: "default",
            },
          ],
        });
      } else {
        showAlert({
          title: "Error",
          message: response.message || "Failed to submit verification.",
          type: "error",
        });
      }
    } catch (error: any) {
      console.error("Error submitting verification:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An error occurred while submitting your verification. Please try again.";
      showAlert({
        title: "Error",
        message: errorMessage,
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FFF5F5]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 pt-4 pb-6 bg-white rounded-b-[35] shadow-lg">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
            >
              <Feather name="arrow-left" size={20} color="#374151" />
            </TouchableOpacity>
            <View className="ml-4">
              <Text className="text-2xl font-bold text-gray-900">Verification</Text>
              <Text className="text-sm text-gray-500">Complete all steps to verify</Text>
            </View>
          </View>
          <View className="w-10 h-10 rounded-full bg-[#FF6B4A]/10 items-center justify-center">
            <Feather name="shield" size={20} color="#FF6B4A" />
          </View>
        </View>
      </View>

      {/* Stepper Progress */}
      <View className="mt-6 mb-2">
        <StepperProgress currentStep={currentStep} />
      </View>

      {/* Loading Overlay */}
      {isSubmitting && (
        <View className="absolute inset-0 bg-black/50 z-50 items-center justify-center">
          <View className="bg-white p-6 rounded-2xl items-center">
            <ActivityIndicator size="large" color="#FF6B4A" />
            <Text className="mt-4 text-lg font-semibold">
              Submitting verification...
            </Text>
          </View>
        </View>
      )}

      {/* Form Steps */}
      <View className="flex-1">
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
            onDone={(stepData) => handleSubmit(stepData)}
            onSkip={handleSkip}
            initialData={formData}
          />
        )}
      </View>

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}
