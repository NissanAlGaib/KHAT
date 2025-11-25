import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { createPet } from "@/services/petService";
import DateTimePickerModal from "react-native-modal-datetime-picker";

interface ValidationErrors {
  [key: string]: string;
}

export default function AddPetScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showSexModal, setShowSexModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<string | null>(null);
  const [showPreferredBreedModal, setShowPreferredBreedModal] = useState(false);

  // Available behavior and attribute options
  const [availableBehaviors, setAvailableBehaviors] = useState([
    "LOYAL",
    "SOCIAL",
    "SNIFF",
    "SLEEPY",
    "CALM",
    "BARK",
    "SLIM",
    "PLAYFUL",
  ]);
  const [availableAttributes, setAvailableAttributes] = useState([
    "BLACK",
    "WHITE",
    "BROWN",
    "SPOTTED",
    "SHORT",
    "CURLY",
    "SLIM",
    "FLOPPY",
  ]);
  const [availablePartnerBehaviors, setAvailablePartnerBehaviors] = useState([
    "LOYAL",
    "SOCIAL",
    "SNIFF",
    "SLEEPY",
    "CALM",
    "BARK",
    "SLIM",
    "PLAYFUL",
  ]);
  const [availablePartnerAttributes, setAvailablePartnerAttributes] = useState([
    "BLACK",
    "WHITE",
    "BROWN",
    "SPOTTED",
    "SHORT",
    "CURLY",
    "SLIM",
    "FLOPPY",
  ]);

  const [formData, setFormData] = useState({
    // Step 1 - Breeding History
    hasBeenBred: false,
    breedingCount: "",
    name: "",
    microchip: "",
    species: "",
    breed: "",
    sex: "",
    birthdate: "",
    height: "",
    weight: "",

    // Step 2 - About
    behaviors: [] as string[],
    behaviorTags: "",
    attributes: [] as string[],
    attributeTags: "",
    description: "",

    // Step 3 - Documents (Rabies)
    rabiesVaccinationRecord: null as any,
    rabiesClinicName: "",
    rabiesVeterinarianName: "",
    rabiesGivenDate: "",
    rabiesExpirationDate: "",

    // Step 3 - Documents (DHPP)
    dhppVaccinationRecord: null as any,
    dhppClinicName: "",
    dhppVeterinarianName: "",
    dhppGivenDate: "",
    dhppExpirationDate: "",

    // Additional vaccinations
    vaccinations: [] as any[],

    // Step 4 - Health Certificate
    healthCertificate: null as any,
    healthClinicName: "",
    healthVeterinarianName: "",
    healthGivenDate: "",
    healthExpirationDate: "",

    // Step 5 - Pet Photos
    petPhotos: [] as any[],

    // Step 6 - Partner Preferences
    preferredBreed: "",
    partnerBehaviors: [] as string[],
    partnerBehaviorTags: "",
    partnerAttributes: [] as string[],
    partnerAttributeTags: "",
    minAge: "",
    maxAge: "",
  });

  const handleNext = () => {
    // Clear previous errors
    setValidationErrors({});

    // Validate current step
    const errors = validateStep(currentStep);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    if (currentStep === 6) {
      setShowConfirmModal(true);
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const validateStep = (step: number): ValidationErrors => {
    const errors: ValidationErrors = {};

    switch (step) {
      case 1: // Basic Information
        if (!formData.name.trim()) {
          errors.name = "Pet name is required";
        }
        if (!formData.species.trim()) {
          errors.species = "Species is required";
        }
        if (!formData.breed.trim()) {
          errors.breed = "Breed is required";
        }
        if (!formData.sex) {
          errors.sex = "Sex is required";
        }
        if (!formData.birthdate) {
          errors.birthdate = "Birthdate is required";
        }
        if (!formData.height.trim()) {
          errors.height = "Height is required";
        } else if (
          isNaN(Number(formData.height)) ||
          Number(formData.height) <= 0
        ) {
          errors.height = "Height must be a valid number";
        }
        if (!formData.weight.trim()) {
          errors.weight = "Weight is required";
        } else if (
          isNaN(Number(formData.weight)) ||
          Number(formData.weight) <= 0
        ) {
          errors.weight = "Weight must be a valid number";
        }
        if (formData.hasBeenBred && !formData.breedingCount.trim()) {
          errors.breedingCount =
            "Breeding count is required when pet has been bred";
        }
        break;

      case 2: // About
        if (formData.behaviors.length === 0) {
          errors.behaviors = "Please select at least one behavior";
        }
        if (formData.attributes.length === 0) {
          errors.attributes = "Please select at least one attribute";
        }
        if (!formData.description.trim()) {
          errors.description = "Description is required";
        } else if (formData.description.length > 200) {
          errors.description = "Description cannot exceed 200 characters";
        }
        break;

      case 3: // Vaccinations
        if (!formData.rabiesVaccinationRecord) {
          errors.rabiesVaccinationRecord =
            "Rabies vaccination record is required";
        }
        if (!formData.rabiesClinicName.trim()) {
          errors.rabiesClinicName =
            "Clinic name is required for Rabies vaccination";
        }
        if (!formData.rabiesVeterinarianName.trim()) {
          errors.rabiesVeterinarianName =
            "Veterinarian name is required for Rabies vaccination";
        }
        if (!formData.rabiesGivenDate) {
          errors.rabiesGivenDate =
            "Given date is required for Rabies vaccination";
        }
        if (!formData.rabiesExpirationDate) {
          errors.rabiesExpirationDate =
            "Expiration date is required for Rabies vaccination";
        }

        if (!formData.dhppVaccinationRecord) {
          errors.dhppVaccinationRecord = "DHPP vaccination record is required";
        }
        if (!formData.dhppClinicName.trim()) {
          errors.dhppClinicName =
            "Clinic name is required for DHPP vaccination";
        }
        if (!formData.dhppVeterinarianName.trim()) {
          errors.dhppVeterinarianName =
            "Veterinarian name is required for DHPP vaccination";
        }
        if (!formData.dhppGivenDate) {
          errors.dhppGivenDate = "Given date is required for DHPP vaccination";
        }
        if (!formData.dhppExpirationDate) {
          errors.dhppExpirationDate =
            "Expiration date is required for DHPP vaccination";
        }
        break;

      case 4: // Health Certificate
        if (!formData.healthCertificate) {
          errors.healthCertificate = "Health certificate is required";
        }
        if (!formData.healthClinicName.trim()) {
          errors.healthClinicName =
            "Clinic name is required for health certificate";
        }
        if (!formData.healthVeterinarianName.trim()) {
          errors.healthVeterinarianName =
            "Veterinarian name is required for health certificate";
        }
        if (!formData.healthGivenDate) {
          errors.healthGivenDate =
            "Given date is required for health certificate";
        }
        if (!formData.healthExpirationDate) {
          errors.healthExpirationDate =
            "Expiration date is required for health certificate";
        }
        break;

      case 5: // Pet Photos
        if (formData.petPhotos.length < 3) {
          errors.petPhotos = "At least 3 pet photos are required";
        }
        break;

      case 6: // Partner Preferences (optional, but validate if filled)
        if (formData.minAge && formData.maxAge) {
          if (Number(formData.minAge) > Number(formData.maxAge)) {
            errors.maxAge =
              "Maximum age must be greater than or equal to minimum age";
          }
        }
        break;
    }

    return errors;
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Skip partner preferences and submit
    handleSubmit();
  };

  const handleSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      // Build RN/Expo-compatible file objects (use `uri`, `name`, `type`) instead
      // of using `fetch(...).blob()`/`File` which aren't available in this environment.
      const rabiesFile = formData.rabiesVaccinationRecord
        ? {
            uri: formData.rabiesVaccinationRecord.uri,
            name: formData.rabiesVaccinationRecord.name || "rabies.pdf",
            type:
              formData.rabiesVaccinationRecord.mimeType || "application/pdf",
          }
        : null;

      const dhppFile = formData.dhppVaccinationRecord
        ? {
            uri: formData.dhppVaccinationRecord.uri,
            name: formData.dhppVaccinationRecord.name || "dhpp.pdf",
            type: formData.dhppVaccinationRecord.mimeType || "application/pdf",
          }
        : null;

      const healthFile = formData.healthCertificate
        ? {
            uri: formData.healthCertificate.uri,
            name: formData.healthCertificate.name || "health.pdf",
            type: formData.healthCertificate.mimeType || "application/pdf",
          }
        : null;

      // Photo objects
      const photoFiles = formData.petPhotos.map((photo) => ({
        uri: photo.uri,
        name: photo.fileName || "photo.jpg",
        type: photo.mimeType || "image/jpeg",
      }));

      // Additional vaccinations
      const additionalVaccinations = formData.vaccinations.map(
        (vaccination) => {
          if (vaccination.vaccinationRecord) {
            return {
              vaccination_type: vaccination.vaccinationType,
              vaccination_record: {
                uri: vaccination.vaccinationRecord.uri,
                name: vaccination.vaccinationRecord.name || "vaccination.pdf",
                type:
                  vaccination.vaccinationRecord.mimeType || "application/pdf",
              },
              clinic_name: vaccination.clinicName,
              veterinarian_name: vaccination.veterinarianName,
              given_date: vaccination.givenDate,
              expiration_date: vaccination.expirationDate,
            };
          }
          return null;
        }
      );

      const petData = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        sex: formData.sex.toLowerCase(),
        birthdate: formData.birthdate,
        microchip: formData.microchip,
        height: formData.height,
        weight: formData.weight,
        has_been_bred: formData.hasBeenBred,
        breeding_count: formData.breedingCount,
        behaviors: formData.behaviors,
        behavior_tags: formData.behaviorTags,
        attributes: formData.attributes,
        attribute_tags: formData.attributeTags,
        description: formData.description,
        rabies_vaccination_record: rabiesFile,
        rabies_clinic_name: formData.rabiesClinicName,
        rabies_veterinarian_name: formData.rabiesVeterinarianName,
        rabies_given_date: formData.rabiesGivenDate,
        rabies_expiration_date: formData.rabiesExpirationDate,
        dhpp_vaccination_record: dhppFile,
        dhpp_clinic_name: formData.dhppClinicName,
        dhpp_veterinarian_name: formData.dhppVeterinarianName,
        dhpp_given_date: formData.dhppGivenDate,
        dhpp_expiration_date: formData.dhppExpirationDate,
        additional_vaccinations: additionalVaccinations.filter(
          (v) => v !== null
        ) as any[],
        health_certificate: healthFile,
        health_clinic_name: formData.healthClinicName,
        health_veterinarian_name: formData.healthVeterinarianName,
        health_given_date: formData.healthGivenDate,
        health_expiration_date: formData.healthExpirationDate,
        pet_photos: photoFiles,
        preferred_breed: formData.preferredBreed,
        partner_behaviors: formData.partnerBehaviors,
        partner_behavior_tags: formData.partnerBehaviorTags,
        partner_attributes: formData.partnerAttributes,
        partner_attribute_tags: formData.partnerAttributeTags,
        min_age: formData.minAge,
        max_age: formData.maxAge,
      };

      await createPet(petData as any);
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Error submitting pet:", error);

      // Handle validation errors from backend
      if (error.response?.data?.errors) {
        const backendErrors: ValidationErrors = {};
        Object.keys(error.response.data.errors).forEach((key) => {
          backendErrors[key] = error.response.data.errors[key][0];
        });
        setValidationErrors(backendErrors);
      }

      Alert.alert(
        "Error",
        error.response?.data?.message ||
          "Failed to register pet. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    router.back();
  };

  const pickDocument = async (field: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Check if it's a vaccination document field
        if (field.startsWith("vaccination_")) {
          const index = parseInt(field.split("_")[1]);
          updateVaccination(index, "vaccinationRecord", result.assets[0]);
        } else {
          setFormData({ ...formData, [field]: result.assets[0] });
        }
      }
    } catch (error) {
      console.error("Error picking document:", error);
    }
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        setFormData({
          ...formData,
          petPhotos: [...formData.petPhotos, ...result.assets],
        });
      }
    } catch (error) {
      console.error("Error picking images:", error);
    }
  };

  const addVaccination = () => {
    setFormData({
      ...formData,
      vaccinations: [
        ...formData.vaccinations,
        {
          vaccinationType: "",
          vaccinationRecord: null,
          clinicName: "",
          veterinarianName: "",
          givenDate: "",
          expirationDate: "",
        },
      ],
    });
  };

  const updateVaccination = (index: number, field: string, value: any) => {
    const updatedVaccinations = [...formData.vaccinations];
    updatedVaccinations[index] = {
      ...updatedVaccinations[index],
      [field]: value,
    };
    setFormData({ ...formData, vaccinations: updatedVaccinations });
  };

  const removeVaccination = (index: number) => {
    const updatedVaccinations = formData.vaccinations.filter(
      (_, i) => i !== index
    );
    setFormData({ ...formData, vaccinations: updatedVaccinations });
  };

  const toggleBehavior = (behavior: string) => {
    const behaviors = formData.behaviors.includes(behavior)
      ? formData.behaviors.filter((b) => b !== behavior)
      : [...formData.behaviors, behavior];
    setFormData({ ...formData, behaviors });
  };

  const addCustomBehavior = () => {
    const customTag = formData.behaviorTags.trim().toUpperCase();
    if (customTag && !availableBehaviors.includes(customTag)) {
      setAvailableBehaviors([...availableBehaviors, customTag]);
      setFormData({
        ...formData,
        behaviors: [...formData.behaviors, customTag],
        behaviorTags: "",
      });
    } else if (customTag && !formData.behaviors.includes(customTag)) {
      setFormData({
        ...formData,
        behaviors: [...formData.behaviors, customTag],
        behaviorTags: "",
      });
    }
  };

  const toggleAttribute = (attribute: string) => {
    const attributes = formData.attributes.includes(attribute)
      ? formData.attributes.filter((a) => a !== attribute)
      : [...formData.attributes, attribute];
    setFormData({ ...formData, attributes });
  };

  const addCustomAttribute = () => {
    const customTag = formData.attributeTags.trim().toUpperCase();
    if (customTag && !availableAttributes.includes(customTag)) {
      setAvailableAttributes([...availableAttributes, customTag]);
      setFormData({
        ...formData,
        attributes: [...formData.attributes, customTag],
        attributeTags: "",
      });
    } else if (customTag && !formData.attributes.includes(customTag)) {
      setFormData({
        ...formData,
        attributes: [...formData.attributes, customTag],
        attributeTags: "",
      });
    }
  };

  const togglePartnerBehavior = (behavior: string) => {
    const partnerBehaviors = formData.partnerBehaviors.includes(behavior)
      ? formData.partnerBehaviors.filter((b) => b !== behavior)
      : [...formData.partnerBehaviors, behavior];
    setFormData({ ...formData, partnerBehaviors });
  };

  const addCustomPartnerBehavior = () => {
    const customTag = formData.partnerBehaviorTags.trim().toUpperCase();
    if (customTag && !availablePartnerBehaviors.includes(customTag)) {
      setAvailablePartnerBehaviors([...availablePartnerBehaviors, customTag]);
      setFormData({
        ...formData,
        partnerBehaviors: [...formData.partnerBehaviors, customTag],
        partnerBehaviorTags: "",
      });
    } else if (customTag && !formData.partnerBehaviors.includes(customTag)) {
      setFormData({
        ...formData,
        partnerBehaviors: [...formData.partnerBehaviors, customTag],
        partnerBehaviorTags: "",
      });
    }
  };

  const togglePartnerAttribute = (attribute: string) => {
    const partnerAttributes = formData.partnerAttributes.includes(attribute)
      ? formData.partnerAttributes.filter((a) => a !== attribute)
      : [...formData.partnerAttributes, attribute];
    setFormData({ ...formData, partnerAttributes });
  };

  const addCustomPartnerAttribute = () => {
    const customTag = formData.partnerAttributeTags.trim().toUpperCase();
    if (customTag && !availablePartnerAttributes.includes(customTag)) {
      setAvailablePartnerAttributes([...availablePartnerAttributes, customTag]);
      setFormData({
        ...formData,
        partnerAttributes: [...formData.partnerAttributes, customTag],
        partnerAttributeTags: "",
      });
    } else if (customTag && !formData.partnerAttributes.includes(customTag)) {
      setFormData({
        ...formData,
        partnerAttributes: [...formData.partnerAttributes, customTag],
        partnerAttributeTags: "",
      });
    }
  };

  const openDatePicker = (field: string) => {
    setDatePickerField(field);
    setShowDatePicker(true);
  };

  const handleDateConfirm = (date: Date) => {
    if (datePickerField) {
      const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD format

      // Check if it's a vaccination date field
      if (datePickerField.startsWith("vaccination_")) {
        const parts = datePickerField.split("_");
        const index = parseInt(parts[1]);
        const field = parts[2]; // givenDate or expirationDate
        updateVaccination(index, field, formattedDate);
      } else {
        setFormData({ ...formData, [datePickerField]: formattedDate });

        // Clear validation error if exists
        if (validationErrors[datePickerField]) {
          setValidationErrors({ ...validationErrors, [datePickerField]: "" });
        }
      }
    }
    setShowDatePicker(false);
    setDatePickerField(null);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
    setDatePickerField(null);
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "dd/mm/yy";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  const renderProgressBar = () => {
    const progress = (currentStep / 6) * 100;
    return (
      <View className="px-6 mb-6">
        <Text className="text-gray-600 text-sm mb-2 text-right">
          {currentStep} of 6
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

  const renderStep1 = () => (
    <View className="px-6 pb-6">
      <Text className="text-lg font-bold text-black mb-2">
        Breeding History
      </Text>
      <Text className="text-sm text-gray-600 mb-4">
        Help us understand your pet's breeding background
      </Text>

      {/* Has Been Bred Checkbox */}
      <TouchableOpacity
        className="flex-row items-center mb-4"
        onPress={() =>
          setFormData({ ...formData, hasBeenBred: !formData.hasBeenBred })
        }
      >
        <View
          className={`w-6 h-6 rounded border-2 ${
            formData.hasBeenBred
              ? "bg-gray-600 border-gray-600"
              : "bg-white border-gray-400"
          } items-center justify-center mr-3`}
        >
          {formData.hasBeenBred && (
            <Feather name="check" size={16} color="white" />
          )}
        </View>
        <Text className="text-base text-black">
          This pet has been bred before
        </Text>
      </TouchableOpacity>

      {/* Breeding Count - Only show if hasBeenBred is true */}
      {formData.hasBeenBred && (
        <View className="mb-4">
          <Text className="text-sm text-gray-700 mb-2">
            Please enter the number of times the pet has been bred.
          </Text>
          <TextInput
            className={`border ${validationErrors.breedingCount ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white`}
            placeholder="Enter"
            value={formData.breedingCount}
            onChangeText={(text) => {
              setFormData({ ...formData, breedingCount: text });
              if (validationErrors.breedingCount) {
                setValidationErrors({ ...validationErrors, breedingCount: "" });
              }
            }}
            keyboardType="numeric"
          />
          {validationErrors.breedingCount && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.breedingCount}
            </Text>
          )}
        </View>
      )}

      {/* Name */}
      <View className="mb-4">
        <Text className="text-base font-semibold text-black mb-2">Name</Text>
        <TextInput
          className={`border ${validationErrors.name ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white`}
          placeholder="Enter name"
          value={formData.name}
          onChangeText={(text) => {
            setFormData({ ...formData, name: text });
            if (validationErrors.name) {
              setValidationErrors({ ...validationErrors, name: "" });
            }
          }}
        />
        {validationErrors.name && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.name}
          </Text>
        )}
      </View>

      {/* Microchip (Optional) */}
      <View className="mb-4">
        <Text className="text-base font-semibold text-black mb-2">
          Microchip (OPTIONAL)
        </Text>
        <TextInput
          className={`border ${validationErrors.microchip ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white`}
          placeholder="Enter Microchip"
          value={formData.microchip}
          onChangeText={(text) => {
            setFormData({ ...formData, microchip: text });
            if (validationErrors.microchip) {
              setValidationErrors({ ...validationErrors, microchip: "" });
            }
          }}
        />
        {validationErrors.microchip && (
          <Text className="text-red-500 text-xs mt-1">
            {validationErrors.microchip}
          </Text>
        )}
      </View>

      {/* Species and Breed Row */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-base font-semibold text-black mb-2">
            Species
          </Text>
          <TouchableOpacity
            className={`border ${validationErrors.species ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white flex-row items-center justify-between`}
            onPress={() => {
              setShowSpeciesModal(true);
              if (validationErrors.species) {
                setValidationErrors({ ...validationErrors, species: "" });
              }
            }}
          >
            <Text className={formData.species ? "text-black" : "text-gray-400"}>
              {formData.species || "choose"}
            </Text>
            <Feather name="chevron-down" size={20} color="gray" />
          </TouchableOpacity>
          {validationErrors.species && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.species}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-black mb-2">Breed</Text>
          <TextInput
            className={`border ${validationErrors.breed ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white`}
            placeholder="Enter breed"
            value={formData.breed}
            onChangeText={(text) => {
              setFormData({ ...formData, breed: text });
              if (validationErrors.breed) {
                setValidationErrors({ ...validationErrors, breed: "" });
              }
            }}
          />
          {validationErrors.breed && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.breed}
            </Text>
          )}
        </View>
      </View>

      {/* Sex and Birthdate Row */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-base font-semibold text-black mb-2">Sex</Text>
          <TouchableOpacity
            className={`border ${validationErrors.sex ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white flex-row items-center justify-between`}
            onPress={() => {
              setShowSexModal(true);
              if (validationErrors.sex) {
                setValidationErrors({ ...validationErrors, sex: "" });
              }
            }}
          >
            <Text className={formData.sex ? "text-black" : "text-gray-400"}>
              {formData.sex || "choose"}
            </Text>
            <Feather name="chevron-down" size={20} color="gray" />
          </TouchableOpacity>
          {validationErrors.sex && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.sex}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-black mb-2">
            Birthdate
          </Text>
          <TouchableOpacity
            className={`border ${validationErrors.birthdate ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white flex-row items-center justify-between`}
            onPress={() => {
              openDatePicker("birthdate");
              if (validationErrors.birthdate) {
                setValidationErrors({ ...validationErrors, birthdate: "" });
              }
            }}
          >
            <Text
              className={formData.birthdate ? "text-black" : "text-gray-400"}
            >
              {formatDateDisplay(formData.birthdate)}
            </Text>
            <Feather name="calendar" size={20} color="gray" />
          </TouchableOpacity>
          {validationErrors.birthdate && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.birthdate}
            </Text>
          )}
        </View>
      </View>

      {/* Height and Weight Row */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-base font-semibold text-black mb-2">
            Height(cm)
          </Text>
          <TextInput
            className={`border ${validationErrors.height ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white`}
            placeholder="Enter Height"
            value={formData.height}
            onChangeText={(text) => {
              setFormData({ ...formData, height: text });
              if (validationErrors.height) {
                setValidationErrors({ ...validationErrors, height: "" });
              }
            }}
            keyboardType="numeric"
          />
          {validationErrors.height && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.height}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-black mb-2">
            Weight (lbs)
          </Text>
          <TextInput
            className={`border ${validationErrors.weight ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white`}
            placeholder="Enter Weight"
            value={formData.weight}
            onChangeText={(text) => {
              setFormData({ ...formData, weight: text });
              if (validationErrors.weight) {
                setValidationErrors({ ...validationErrors, weight: "" });
              }
            }}
            keyboardType="numeric"
          />
          {validationErrors.weight && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.weight}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View className="px-6 pb-6">
      <Text className="text-lg font-bold text-black mb-4">About</Text>

      {/* Behavior */}
      <View className="mb-4">
        <Text className="text-base font-semibold text-black mb-2">
          Behavior:
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {availableBehaviors.map((behavior) => (
            <TouchableOpacity
              key={behavior}
              className={`px-4 py-2 rounded-full border ${
                formData.behaviors.includes(behavior)
                  ? "bg-[#FF6B4A] border-[#FF6B4A]"
                  : "bg-white border-gray-300"
              }`}
              onPress={() => {
                toggleBehavior(behavior);
                if (validationErrors.behaviors) {
                  setValidationErrors({ ...validationErrors, behaviors: "" });
                }
              }}
            >
              <Text
                className={
                  formData.behaviors.includes(behavior)
                    ? "text-white text-xs"
                    : "text-gray-600 text-xs"
                }
              >
                {behavior}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {validationErrors.behaviors && (
          <Text className="text-red-500 text-xs mb-2">
            {validationErrors.behaviors}
          </Text>
        )}
        <Text className="text-xs text-gray-500 mb-2">
          Add tags to describe your pet (e.g., SMALL, BROWN, FRIENDLY)
        </Text>
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 bg-white"
            placeholder="Enter custom tag"
            value={formData.behaviorTags}
            onChangeText={(text) =>
              setFormData({ ...formData, behaviorTags: text })
            }
            onSubmitEditing={addCustomBehavior}
            returnKeyType="done"
          />
          <TouchableOpacity
            className="bg-[#FF6B4A] rounded-lg px-4 py-3 justify-center"
            onPress={addCustomBehavior}
          >
            <Text className="text-white font-semibold">Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Attributes */}
      <View className="mb-4">
        <Text className="text-base font-semibold text-black mb-2">
          Attributes:
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {availableAttributes.map((attribute) => (
            <TouchableOpacity
              key={attribute}
              className={`px-4 py-2 rounded-full border ${
                formData.attributes.includes(attribute)
                  ? "bg-[#FF6B4A] border-[#FF6B4A]"
                  : "bg-white border-gray-300"
              }`}
              onPress={() => {
                toggleAttribute(attribute);
                if (validationErrors.attributes) {
                  setValidationErrors({ ...validationErrors, attributes: "" });
                }
              }}
            >
              <Text
                className={
                  formData.attributes.includes(attribute)
                    ? "text-white text-xs"
                    : "text-gray-600 text-xs"
                }
              >
                {attribute}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {validationErrors.attributes && (
          <Text className="text-red-500 text-xs mb-2">
            {validationErrors.attributes}
          </Text>
        )}
        <Text className="text-xs text-gray-500 mb-2">
          Add tags to describe your pet (e.g., SMALL, BROWN, FRIENDLY)
        </Text>
        <View className="flex-row gap-2">
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 bg-white"
            placeholder="Enter custom tag"
            value={formData.attributeTags}
            onChangeText={(text) =>
              setFormData({ ...formData, attributeTags: text })
            }
            onSubmitEditing={addCustomAttribute}
            returnKeyType="done"
          />
          <TouchableOpacity
            className="bg-[#FF6B4A] rounded-lg px-4 py-3 justify-center"
            onPress={addCustomAttribute}
          >
            <Text className="text-white font-semibold">Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Description */}
      <View className="mb-4">
        <Text className="text-base font-semibold text-black mb-2">
          Description
        </Text>
        <TextInput
          className={`border ${validationErrors.description ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white h-24`}
          placeholder="Enter Description"
          value={formData.description}
          onChangeText={(text) => {
            setFormData({ ...formData, description: text });
            if (validationErrors.description) {
              setValidationErrors({ ...validationErrors, description: "" });
            }
          }}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={200}
        />
        <View className="flex-row justify-between items-center mt-1">
          {validationErrors.description ? (
            <Text className="text-red-500 text-xs">
              {validationErrors.description}
            </Text>
          ) : (
            <View />
          )}
          <Text
            className={`text-xs ${formData.description.length > 200 ? "text-red-500" : "text-gray-400"}`}
          >
            {formData.description.length}/200
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View className="px-6 pb-6">
      <Text className="text-lg font-bold text-black mb-2">Documents</Text>
      <Text className="text-sm text-gray-600 mb-4">
        Upload certificates and photos to verify your pet
      </Text>

      {/* Rabies Section */}
      <View className="mb-6">
        <Text className="text-base font-bold text-black mb-3">Rabies</Text>

        {/* Vaccination Record */}
        <View className="mb-4">
          <TouchableOpacity
            className={`border ${validationErrors.rabiesVaccinationRecord ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-6 bg-gray-50`}
            onPress={() => {
              pickDocument("rabiesVaccinationRecord");
              if (validationErrors.rabiesVaccinationRecord) {
                setValidationErrors({
                  ...validationErrors,
                  rabiesVaccinationRecord: "",
                });
              }
            }}
          >
            <View className="flex-row items-center">
              <Feather name="upload" size={20} color="gray" />
              <Text className="text-gray-600 ml-2">
                {formData.rabiesVaccinationRecord
                  ? formData.rabiesVaccinationRecord.name
                  : "Vaccination Record (Rabis)"}
              </Text>
            </View>
            <Text className="text-gray-500 text-xs mt-2">Choose file</Text>
          </TouchableOpacity>
          {validationErrors.rabiesVaccinationRecord && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.rabiesVaccinationRecord}
            </Text>
          )}
        </View>

        {/* Clinic Name */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-black mb-2">
            Clinic Name
          </Text>
          <TextInput
            className={`border ${validationErrors.rabiesClinicName ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white`}
            placeholder="Enter name"
            value={formData.rabiesClinicName}
            onChangeText={(text) => {
              setFormData({ ...formData, rabiesClinicName: text });
              if (validationErrors.rabiesClinicName) {
                setValidationErrors({
                  ...validationErrors,
                  rabiesClinicName: "",
                });
              }
            }}
          />
          {validationErrors.rabiesClinicName && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.rabiesClinicName}
            </Text>
          )}
        </View>

        {/* Veterinarian's Name */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-black mb-2">
            Veterinarian's Name
          </Text>
          <TextInput
            className={`border ${validationErrors.rabiesVeterinarianName ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white`}
            placeholder="Enter name"
            value={formData.rabiesVeterinarianName}
            onChangeText={(text) => {
              setFormData({ ...formData, rabiesVeterinarianName: text });
              if (validationErrors.rabiesVeterinarianName) {
                setValidationErrors({
                  ...validationErrors,
                  rabiesVeterinarianName: "",
                });
              }
            }}
          />
          {validationErrors.rabiesVeterinarianName && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.rabiesVeterinarianName}
            </Text>
          )}
        </View>

        {/* Given Date and Expiration Date */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-base font-semibold text-black mb-2">
              Given Date
            </Text>
            <TouchableOpacity
              className={`border ${validationErrors.rabiesGivenDate ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white flex-row items-center justify-between`}
              onPress={() => openDatePicker("rabiesGivenDate")}
            >
              <Text
                className={
                  formData.rabiesGivenDate ? "text-black" : "text-gray-400"
                }
              >
                {formatDateDisplay(formData.rabiesGivenDate)}
              </Text>
              <Feather name="calendar" size={20} color="gray" />
            </TouchableOpacity>
            {validationErrors.rabiesGivenDate && (
              <Text className="text-red-500 text-xs mt-1">
                {validationErrors.rabiesGivenDate}
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-black mb-2">
              Expiration Date
            </Text>
            <TouchableOpacity
              className={`border ${validationErrors.rabiesExpirationDate ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white flex-row items-center justify-between`}
              onPress={() => openDatePicker("rabiesExpirationDate")}
            >
              <Text
                className={
                  formData.rabiesExpirationDate ? "text-black" : "text-gray-400"
                }
              >
                {formatDateDisplay(formData.rabiesExpirationDate)}
              </Text>
              <Feather name="calendar" size={20} color="gray" />
            </TouchableOpacity>
            {validationErrors.rabiesExpirationDate && (
              <Text className="text-red-500 text-xs mt-1">
                {validationErrors.rabiesExpirationDate}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* DHPP Section */}
      <View className="mb-6">
        <Text className="text-base font-bold text-black mb-3">
          DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)
        </Text>

        {/* Vaccination Record */}
        <View className="mb-4">
          <TouchableOpacity
            className={`border ${validationErrors.dhppVaccinationRecord ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-6 bg-gray-50`}
            onPress={() => {
              pickDocument("dhppVaccinationRecord");
              if (validationErrors.dhppVaccinationRecord) {
                setValidationErrors({
                  ...validationErrors,
                  dhppVaccinationRecord: "",
                });
              }
            }}
          >
            <View className="flex-row items-center">
              <Feather name="upload" size={20} color="gray" />
              <Text className="text-gray-600 ml-2">
                {formData.dhppVaccinationRecord
                  ? formData.dhppVaccinationRecord.name
                  : "Vaccination Record (DHPP)"}
              </Text>
            </View>
            <Text className="text-gray-500 text-xs mt-2">Choose file</Text>
          </TouchableOpacity>
          {validationErrors.dhppVaccinationRecord && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.dhppVaccinationRecord}
            </Text>
          )}
        </View>

        {/* Clinic Name */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-black mb-2">
            Clinic Name
          </Text>
          <TextInput
            className={`border ${validationErrors.dhppClinicName ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white`}
            placeholder="Enter name"
            value={formData.dhppClinicName}
            onChangeText={(text) => {
              setFormData({ ...formData, dhppClinicName: text });
              if (validationErrors.dhppClinicName) {
                setValidationErrors({
                  ...validationErrors,
                  dhppClinicName: "",
                });
              }
            }}
          />
          {validationErrors.dhppClinicName && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.dhppClinicName}
            </Text>
          )}
        </View>

        {/* Veterinarian's Name */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-black mb-2">
            Veterinarian's Name
          </Text>
          <TextInput
            className={`border ${validationErrors.dhppVeterinarianName ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white`}
            placeholder="Enter name"
            value={formData.dhppVeterinarianName}
            onChangeText={(text) => {
              setFormData({ ...formData, dhppVeterinarianName: text });
              if (validationErrors.dhppVeterinarianName) {
                setValidationErrors({
                  ...validationErrors,
                  dhppVeterinarianName: "",
                });
              }
            }}
          />
          {validationErrors.dhppVeterinarianName && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.dhppVeterinarianName}
            </Text>
          )}
        </View>

        {/* Given Date and Expiration Date */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-base font-semibold text-black mb-2">
              Given Date
            </Text>
            <TouchableOpacity
              className={`border ${validationErrors.dhppGivenDate ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white flex-row items-center justify-between`}
              onPress={() => openDatePicker("dhppGivenDate")}
            >
              <Text
                className={
                  formData.dhppGivenDate ? "text-black" : "text-gray-400"
                }
              >
                {formatDateDisplay(formData.dhppGivenDate)}
              </Text>
              <Feather name="calendar" size={20} color="gray" />
            </TouchableOpacity>
            {validationErrors.dhppGivenDate && (
              <Text className="text-red-500 text-xs mt-1">
                {validationErrors.dhppGivenDate}
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-black mb-2">
              Expiration Date
            </Text>
            <TouchableOpacity
              className={`border ${validationErrors.dhppExpirationDate ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white flex-row items-center justify-between`}
              onPress={() => openDatePicker("dhppExpirationDate")}
            >
              <Text
                className={
                  formData.dhppExpirationDate ? "text-black" : "text-gray-400"
                }
              >
                {formatDateDisplay(formData.dhppExpirationDate)}
              </Text>
              <Feather name="calendar" size={20} color="gray" />
            </TouchableOpacity>
            {validationErrors.dhppExpirationDate && (
              <Text className="text-red-500 text-xs mt-1">
                {validationErrors.dhppExpirationDate}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Additional Vaccinations */}
      {formData.vaccinations.map((vaccination, index) => (
        <View key={index} className="mb-6 border-t border-gray-300 pt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-black">
              Additional Vaccination {index + 1}
            </Text>
            <TouchableOpacity
              onPress={() => removeVaccination(index)}
              className="bg-red-500 rounded-full p-2"
            >
              <Feather name="trash-2" size={16} color="white" />
            </TouchableOpacity>
          </View>

          {/* Vaccination Type */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-black mb-2">
              Vaccination Type/Name
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              placeholder="e.g., Bordetella, Leptospirosis, etc."
              value={vaccination.vaccinationType}
              onChangeText={(text) =>
                updateVaccination(index, "vaccinationType", text)
              }
            />
          </View>

          {/* Vaccination Record */}
          <View className="mb-4">
            <TouchableOpacity
              className="border border-gray-300 rounded-lg px-4 py-6 bg-gray-50"
              onPress={() => {
                pickDocument(`vaccination_${index}`);
              }}
            >
              <View className="flex-row items-center">
                <Feather name="upload" size={20} color="gray" />
                <Text className="text-gray-600 ml-2">
                  {vaccination.vaccinationRecord
                    ? vaccination.vaccinationRecord.name
                    : "Vaccination Record"}
                </Text>
              </View>
              <Text className="text-gray-500 text-xs mt-2">Choose file</Text>
            </TouchableOpacity>
          </View>

          {/* Clinic Name */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-black mb-2">
              Clinic Name
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              placeholder="Enter name"
              value={vaccination.clinicName}
              onChangeText={(text) =>
                updateVaccination(index, "clinicName", text)
              }
            />
          </View>

          {/* Veterinarian's Name */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-black mb-2">
              Veterinarian's Name
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              placeholder="Enter name"
              value={vaccination.veterinarianName}
              onChangeText={(text) =>
                updateVaccination(index, "veterinarianName", text)
              }
            />
          </View>

          {/* Given Date and Expiration Date */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-base font-semibold text-black mb-2">
                Given Date
              </Text>
              <TouchableOpacity
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row items-center justify-between"
                onPress={() => openDatePicker(`vaccination_${index}_givenDate`)}
              >
                <Text
                  className={
                    vaccination.givenDate ? "text-black" : "text-gray-400"
                  }
                >
                  {formatDateDisplay(vaccination.givenDate)}
                </Text>
                <Feather name="calendar" size={20} color="gray" />
              </TouchableOpacity>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-black mb-2">
                Expiration Date
              </Text>
              <TouchableOpacity
                className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row items-center justify-between"
                onPress={() =>
                  openDatePicker(`vaccination_${index}_expirationDate`)
                }
              >
                <Text
                  className={
                    vaccination.expirationDate ? "text-black" : "text-gray-400"
                  }
                >
                  {formatDateDisplay(vaccination.expirationDate)}
                </Text>
                <Feather name="calendar" size={20} color="gray" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {/* Add Vaccination Button */}
      <TouchableOpacity
        className="bg-[#FF6B4A] rounded-lg py-4 mb-4"
        onPress={addVaccination}
      >
        <Text className="text-white text-center font-semibold text-base">
          + Vaccination
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View className="px-6 pb-6">
      <Text className="text-lg font-bold text-black mb-2">Documents</Text>
      <Text className="text-sm text-gray-600 mb-4">
        Upload certificates and photos to verify your pet
      </Text>

      {/* Health Certificate Section */}
      <View className="mb-6">
        {/* Health Certificate Upload */}
        <View className="mb-4">
          <TouchableOpacity
            className={`border ${validationErrors.healthCertificate ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-6 bg-gray-50`}
            onPress={() => {
              pickDocument("healthCertificate");
              if (validationErrors.healthCertificate) {
                setValidationErrors({
                  ...validationErrors,
                  healthCertificate: "",
                });
              }
            }}
          >
            <View className="flex-row items-center">
              <Feather name="upload" size={20} color="gray" />
              <Text className="text-gray-600 ml-2">
                {formData.healthCertificate
                  ? formData.healthCertificate.name
                  : "Health Certificate"}
              </Text>
            </View>
            <Text className="text-gray-500 text-xs mt-2">Choose file</Text>
          </TouchableOpacity>
          {validationErrors.healthCertificate && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.healthCertificate}
            </Text>
          )}
        </View>

        {/* Clinic Name */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-black mb-2">
            Clinic Name
          </Text>
          <TextInput
            className={`border ${validationErrors.healthClinicName ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white`}
            placeholder="Enter name"
            value={formData.healthClinicName}
            onChangeText={(text) => {
              setFormData({ ...formData, healthClinicName: text });
              if (validationErrors.healthClinicName) {
                setValidationErrors({
                  ...validationErrors,
                  healthClinicName: "",
                });
              }
            }}
          />
          {validationErrors.healthClinicName && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.healthClinicName}
            </Text>
          )}
        </View>

        {/* Veterinarian's Name */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-black mb-2">
            Veterinarian's Name
          </Text>
          <TextInput
            className={`border ${validationErrors.healthVeterinarianName ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white`}
            placeholder="Enter name"
            value={formData.healthVeterinarianName}
            onChangeText={(text) => {
              setFormData({ ...formData, healthVeterinarianName: text });
              if (validationErrors.healthVeterinarianName) {
                setValidationErrors({
                  ...validationErrors,
                  healthVeterinarianName: "",
                });
              }
            }}
          />
          {validationErrors.healthVeterinarianName && (
            <Text className="text-red-500 text-xs mt-1">
              {validationErrors.healthVeterinarianName}
            </Text>
          )}
        </View>

        {/* Given Date and Expiration Date */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-base font-semibold text-black mb-2">
              Given Date
            </Text>
            <TouchableOpacity
              className={`border ${validationErrors.healthGivenDate ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white flex-row items-center justify-between`}
              onPress={() => openDatePicker("healthGivenDate")}
            >
              <Text
                className={
                  formData.healthGivenDate ? "text-black" : "text-gray-400"
                }
              >
                {formatDateDisplay(formData.healthGivenDate)}
              </Text>
              <Feather name="calendar" size={20} color="gray" />
            </TouchableOpacity>
            {validationErrors.healthGivenDate && (
              <Text className="text-red-500 text-xs mt-1">
                {validationErrors.healthGivenDate}
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-black mb-2">
              Expiration Date
            </Text>
            <TouchableOpacity
              className={`border ${validationErrors.healthExpirationDate ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white flex-row items-center justify-between`}
              onPress={() => openDatePicker("healthExpirationDate")}
            >
              <Text
                className={
                  formData.healthExpirationDate ? "text-black" : "text-gray-400"
                }
              >
                {formatDateDisplay(formData.healthExpirationDate)}
              </Text>
              <Feather name="calendar" size={20} color="gray" />
            </TouchableOpacity>
            {validationErrors.healthExpirationDate && (
              <Text className="text-red-500 text-xs mt-1">
                {validationErrors.healthExpirationDate}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep5 = () => (
    <View className="px-6 pb-6">
      <Text className="text-lg font-bold text-black mb-2">Pet Photos</Text>
      <Text className="text-sm text-gray-600 mb-1">
        Minimum 3 photos required
      </Text>
      <Text className="text-sm text-gray-600 mb-4">
        (Front, side, whole body picture)
      </Text>

      {/* Upload Photos Area */}
      <TouchableOpacity
        className={`border-2 border-dashed ${validationErrors.petPhotos ? "border-red-500" : "border-gray-300"} rounded-lg py-20 bg-gray-50 items-center justify-center mb-4`}
        onPress={() => {
          pickImages();
          if (validationErrors.petPhotos) {
            setValidationErrors({ ...validationErrors, petPhotos: "" });
          }
        }}
      >
        <View className="items-center">
          <View className="bg-gray-200 rounded-full p-6 mb-4">
            <Feather name="upload" size={40} color="gray" />
          </View>
          <Text className="text-gray-500 text-lg font-semibold">
            Upload Photos
          </Text>
        </View>
      </TouchableOpacity>

      {validationErrors.petPhotos && (
        <Text className="text-red-500 text-xs mb-2">
          {validationErrors.petPhotos}
        </Text>
      )}

      {/* Display selected photos */}
      {formData.petPhotos.length > 0 && (
        <View>
          <Text className="text-sm text-gray-600 mb-2">
            {formData.petPhotos.length} photo
            {formData.petPhotos.length !== 1 ? "s" : ""} selected
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {formData.petPhotos.map((photo, index) => (
              <View key={index} className="w-20 h-20">
                <Image
                  source={{ uri: photo.uri }}
                  className="w-full h-full rounded-lg"
                />
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderStep6 = () => (
    <View className="px-6 pb-6">
      <Text className="text-lg font-bold text-black mb-2">
        Partner Preferences
      </Text>
      <Text className="text-sm text-gray-600 mb-4">
        Tell us what you're looking for in a breeding partner
      </Text>

      {/* Preferred Breed */}
      <View className="mb-4">
        <Text className="text-base font-semibold text-black mb-2">
          Preferred Breed
        </Text>
        <TouchableOpacity
          className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row items-center justify-between"
          onPress={() => setShowPreferredBreedModal(true)}
        >
          <Text
            className={formData.preferredBreed ? "text-black" : "text-gray-400"}
          >
            {formData.preferredBreed || "Select"}
          </Text>
          <Feather name="chevron-down" size={20} color="gray" />
        </TouchableOpacity>
      </View>

      {/* Partner Preferences (Behavior) */}
      <View className="mb-4">
        <Text className="text-base font-semibold text-black mb-2">
          Partner Preferences
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {availablePartnerBehaviors.map((behavior) => (
            <TouchableOpacity
              key={behavior}
              className={`px-4 py-2 rounded-full border ${
                formData.partnerBehaviors.includes(behavior)
                  ? "bg-[#FF6B4A] border-[#FF6B4A]"
                  : "bg-white border-gray-300"
              }`}
              onPress={() => togglePartnerBehavior(behavior)}
            >
              <Text
                className={
                  formData.partnerBehaviors.includes(behavior)
                    ? "text-white text-xs"
                    : "text-gray-600 text-xs"
                }
              >
                {behavior}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text className="text-xs text-gray-500 mb-2">
          Add tags to describe partner preferences (e.g., LOYAL, CALM, PLAYFUL)
        </Text>
        <View className="flex-row items-center gap-2">
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 bg-white"
            placeholder="Enter custom behavior"
            value={formData.partnerBehaviorTags}
            onChangeText={(text) =>
              setFormData({ ...formData, partnerBehaviorTags: text })
            }
            onSubmitEditing={addCustomPartnerBehavior}
          />
          <TouchableOpacity
            className="bg-[#FF6B4A] px-4 py-3 rounded-lg"
            onPress={addCustomPartnerBehavior}
          >
            <Text className="text-white font-semibold">Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Partner Preferences (Attributes) */}
      <View className="mb-4">
        <Text className="text-base font-semibold text-black mb-2">
          Partner Preferences
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {availablePartnerAttributes.map((attribute) => (
            <TouchableOpacity
              key={attribute}
              className={`px-4 py-2 rounded-full border ${
                formData.partnerAttributes.includes(attribute)
                  ? "bg-[#FF6B4A] border-[#FF6B4A]"
                  : "bg-white border-gray-300"
              }`}
              onPress={() => togglePartnerAttribute(attribute)}
            >
              <Text
                className={
                  formData.partnerAttributes.includes(attribute)
                    ? "text-white text-xs"
                    : "text-gray-600 text-xs"
                }
              >
                {attribute}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text className="text-xs text-gray-500 mb-2">
          Add tags to describe partner preferences (e.g., BLACK, CURLY, SHORT)
        </Text>
        <View className="flex-row items-center gap-2">
          <TextInput
            className="flex-1 border border-gray-300 rounded-lg px-4 py-3 bg-white"
            placeholder="Enter custom attribute"
            value={formData.partnerAttributeTags}
            onChangeText={(text) =>
              setFormData({ ...formData, partnerAttributeTags: text })
            }
            onSubmitEditing={addCustomPartnerAttribute}
          />
          <TouchableOpacity
            className="bg-[#FF6B4A] px-4 py-3 rounded-lg"
            onPress={addCustomPartnerAttribute}
          >
            <Text className="text-white font-semibold">Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preferred Age Range */}
      <View className="mb-4">
        <Text className="text-base font-semibold text-black mb-2">
          Preferred Age range
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="text-sm text-gray-600 mb-2">min age</Text>
            <TextInput
              className={`border ${validationErrors.minAge ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white`}
              value={formData.minAge}
              onChangeText={(text) => {
                setFormData({ ...formData, minAge: text });
                if (validationErrors.minAge) {
                  setValidationErrors({ ...validationErrors, minAge: "" });
                }
              }}
              keyboardType="numeric"
            />
            {validationErrors.minAge && (
              <Text className="text-red-500 text-xs mt-1">
                {validationErrors.minAge}
              </Text>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-sm text-gray-600 mb-2">max age</Text>
            <TextInput
              className={`border ${validationErrors.maxAge ? "border-red-500" : "border-gray-300"} rounded-lg px-4 py-3 bg-white`}
              value={formData.maxAge}
              onChangeText={(text) => {
                setFormData({ ...formData, maxAge: text });
                if (validationErrors.maxAge) {
                  setValidationErrors({ ...validationErrors, maxAge: "" });
                }
              }}
              keyboardType="numeric"
            />
            {validationErrors.maxAge && (
              <Text className="text-red-500 text-xs mt-1">
                {validationErrors.maxAge}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FFF5F5]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 pt-4 pb-6 bg-white rounded-b-[35] shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-black ml-4">ADD PET</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mt-6">
        <Text className="text-sm text-gray-600 px-6 mb-2">Basic info</Text>
        {renderProgressBar()}
      </View>

      {/* Form Steps */}
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderStep6()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View className="px-6 py-4 bg-white border-t border-gray-200">
        <View className="flex-row gap-3">
          {currentStep > 1 && (
            <TouchableOpacity
              className="flex-1 bg-[#FF6B4A] rounded-lg py-4"
              onPress={handlePrev}
              disabled={isSubmitting}
            >
              <Text className="text-white text-center font-semibold text-base">
                Prev
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className={`flex-1 ${isSubmitting ? "bg-gray-400" : "bg-[#FF6B4A]"} rounded-lg py-4`}
            onPress={handleNext}
            disabled={isSubmitting}
          >
            <Text className="text-white text-center font-semibold text-base">
              {isSubmitting ? "Submitting..." : "Next"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Skip Option for Step 6 */}
        {currentStep === 6 && (
          <View className="mt-4">
            <View className="flex-row items-center mb-2">
              <View className="flex-1 h-px bg-gray-300" />
              <Text className="text-gray-500 text-sm mx-3">Or do it later</Text>
              <View className="flex-1 h-px bg-gray-300" />
            </View>
            <TouchableOpacity onPress={handleSkip} disabled={isSubmitting}>
              <Text className="text-[#FF6B4A] text-center font-semibold text-base">
                Skip
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <Text className="text-[#FF6B4A] text-xl font-bold text-center mb-2">
              PROCEED TO REGISTER
            </Text>
            <Text className="text-gray-600 text-sm text-center mb-6">
              CONFIRMATION
            </Text>
            <TouchableOpacity
              className="bg-[#FF6B4A] rounded-lg py-4 mb-3"
              onPress={handleSubmit}
            >
              <Text className="text-white text-center font-semibold text-base">
                YES
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
              <Text className="text-gray-500 text-center font-semibold text-base">
                CLOSE
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-8 w-full max-w-sm items-center">
            <View className="bg-green-100 rounded-full p-6 mb-4">
              <Feather name="check" size={48} color="#22C55E" />
            </View>
            <Text className="text-[#FF6B4A] text-2xl font-bold text-center mb-2">
              Registration Complete!
            </Text>
            <Text className="text-gray-600 text-sm text-center mb-6">
              Your pet has been successfully registered
            </Text>
            <TouchableOpacity
              className="bg-[#FF6B4A] rounded-lg py-4 px-8"
              onPress={handleSuccessClose}
            >
              <Text className="text-white text-center font-semibold text-base">
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Species Selection Modal */}
      <Modal
        visible={showSpeciesModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSpeciesModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <Text className="text-[#FF6B4A] text-xl font-bold text-center mb-6">
              Select Species
            </Text>
            {["Dog", "Cat"].map((species) => (
              <TouchableOpacity
                key={species}
                className="border-b border-gray-200 py-4"
                onPress={() => {
                  setFormData({ ...formData, species });
                  setShowSpeciesModal(false);
                }}
              >
                <Text className="text-black text-center text-base font-medium">
                  {species}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="mt-4"
              onPress={() => setShowSpeciesModal(false)}
            >
              <Text className="text-gray-500 text-center font-semibold text-base">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sex Selection Modal */}
      <Modal
        visible={showSexModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSexModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <Text className="text-[#FF6B4A] text-xl font-bold text-center mb-6">
              Select Sex
            </Text>
            {["Male", "Female"].map((sex) => (
              <TouchableOpacity
                key={sex}
                className="border-b border-gray-200 py-4"
                onPress={() => {
                  setFormData({ ...formData, sex });
                  setShowSexModal(false);
                }}
              >
                <Text className="text-black text-center text-base font-medium">
                  {sex}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="mt-4"
              onPress={() => setShowSexModal(false)}
            >
              <Text className="text-gray-500 text-center font-semibold text-base">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={handleDateCancel}
        maximumDate={datePickerField === "birthdate" ? new Date() : undefined}
      />

      {/* Preferred Breed Modal */}
      <Modal
        visible={showPreferredBreedModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPreferredBreedModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <Text className="text-[#FF6B4A] text-xl font-bold text-center mb-6">
              Select Preferred Breed
            </Text>
            <ScrollView className="max-h-96">
              {[
                "Any Breed",
                "Labrador Retriever",
                "German Shepherd",
                "Golden Retriever",
                "French Bulldog",
                "Bulldog",
                "Poodle",
                "Beagle",
                "Rottweiler",
                "German Shorthaired Pointer",
                "Siberian Husky",
                "Dachshund",
                "Doberman Pinscher",
                "Shih Tzu",
                "Boxer",
                "Siamese",
                "Persian",
                "Maine Coon",
                "Ragdoll",
                "British Shorthair",
                "Sphynx",
                "Scottish Fold",
                "Bengal",
              ].map((breed) => (
                <TouchableOpacity
                  key={breed}
                  className="border-b border-gray-200 py-4"
                  onPress={() => {
                    setFormData({ ...formData, preferredBreed: breed });
                    setShowPreferredBreedModal(false);
                  }}
                >
                  <Text className="text-black text-center text-base font-medium">
                    {breed}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              className="mt-4"
              onPress={() => setShowPreferredBreedModal(false)}
            >
              <Text className="text-gray-500 text-center font-semibold text-base">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
