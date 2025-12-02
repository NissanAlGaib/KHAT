import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { createPet } from "@/services/petService";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import StyledModal from "@/components/core/StyledModal";
import { LinearGradient } from "expo-linear-gradient";

// Interface for validation errors
interface ValidationErrors {
  [key: string]: string;
}

// Get screen dimensions
const { width } = Dimensions.get("window");

// Main component for adding a pet
export default function AddPetScreen() {
  const router = useRouter();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
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

  // Options for behavior and attributes
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

  // Form data state
  const [formData, setFormData] = useState<Record<string, any>>({
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
    behaviors: [] as string[],
    behaviorTags: "",
    attributes: [] as string[],
    attributeTags: "",
    description: "",
    rabiesVaccinationRecord: null as any,
    rabiesClinicName: "",
    rabiesVeterinarianName: "",
    rabiesGivenDate: "",
    rabiesExpirationDate: "",
    dhppVaccinationRecord: null as any,
    dhppClinicName: "",
    dhppVeterinarianName: "",
    dhppGivenDate: "",
    dhppExpirationDate: "",
    vaccinations: [] as any[],
    healthCertificate: null as any,
    healthClinicName: "",
    healthVeterinarianName: "",
    healthGivenDate: "",
    healthExpirationDate: "",
    petPhotos: [] as any[],
    preferredBreed: "",
    partnerBehaviors: [] as string[],
    partnerBehaviorTags: "",
    partnerAttributes: [] as string[],
    partnerAttributeTags: "",
    minAge: "",
    maxAge: "",
  });

  // Handle stepping to the next part of the form
  const handleNext = () => {
    setValidationErrors({});
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

  // Validate fields for the current step
  const validateStep = (step: number): ValidationErrors => {
    const errors: ValidationErrors = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) errors.name = "Pet name is required";
        if (!formData.species.trim()) errors.species = "Species is required";
        if (!formData.breed.trim()) errors.breed = "Breed is required";
        if (!formData.sex) errors.sex = "Sex is required";
        if (!formData.birthdate) errors.birthdate = "Birthdate is required";
        if (!formData.height.trim()) errors.height = "Height is required";
        if (!formData.weight.trim()) errors.weight = "Weight is required";
        break;
      case 2:
        if (formData.behaviors.length === 0)
          errors.behaviors = "Please select at least one behavior";
        if (formData.attributes.length === 0)
          errors.attributes = "Please select at least one attribute";
        if (!formData.description.trim())
          errors.description = "Description is required";
        break;
      case 3:
        if (!formData.rabiesVaccinationRecord)
          errors.rabiesVaccinationRecord =
            "Rabies vaccination record is required";
        if (!formData.rabiesClinicName.trim())
          errors.rabiesClinicName = "Rabies clinic name is required";
        if (!formData.rabiesVeterinarianName.trim())
          errors.rabiesVeterinarianName =
            "Rabies veterinarian name is required";
        if (!formData.rabiesGivenDate)
          errors.rabiesGivenDate = "Rabies given date is required";
        if (!formData.rabiesExpirationDate)
          errors.rabiesExpirationDate = "Rabies expiration date is required";

        if (!formData.dhppVaccinationRecord)
          errors.dhppVaccinationRecord = "DHPP vaccination record is required";
        if (!formData.dhppClinicName.trim())
          errors.dhppClinicName = "DHPP clinic name is required";
        if (!formData.dhppVeterinarianName.trim())
          errors.dhppVeterinarianName = "DHPP veterinarian name is required";
        if (!formData.dhppGivenDate)
          errors.dhppGivenDate = "DHPP given date is required";
        if (!formData.dhppExpirationDate)
          errors.dhppExpirationDate = "DHPP expiration date is required";

        // Validate additional vaccinations if any
        formData.vaccinations.forEach((vac: any, index: number) => {
          if (vac.vaccinationRecord && !vac.vaccinationType?.trim()) {
            errors[`vaccination_${index}_vaccinationType`] =
              "Vaccine name is required";
          }
          if (vac.vaccinationRecord && !vac.clinicName?.trim()) {
            errors[`vaccination_${index}_clinicName`] =
              "Clinic name is required";
          }
          if (vac.vaccinationRecord && !vac.veterinarianName?.trim()) {
            errors[`vaccination_${index}_veterinarianName`] =
              "Veterinarian name is required";
          }
          if (vac.vaccinationRecord && !vac.givenDate) {
            errors[`vaccination_${index}_givenDate`] = "Given date is required";
          }
          if (vac.vaccinationRecord && !vac.expirationDate) {
            errors[`vaccination_${index}_expirationDate`] =
              "Expiration date is required";
          }
        });
        break;
      case 4:
        if (!formData.healthCertificate)
          errors.healthCertificate = "Health certificate is required";
        if (!formData.healthClinicName.trim())
          errors.healthClinicName = "Health clinic name is required";
        if (!formData.healthVeterinarianName.trim())
          errors.healthVeterinarianName =
            "Health veterinarian name is required";
        if (!formData.healthGivenDate)
          errors.healthGivenDate = "Health given date is required";
        if (!formData.healthExpirationDate)
          errors.healthExpirationDate = "Health expiration date is required";
        break;
      case 5:
        if (formData.petPhotos.length < 3)
          errors.petPhotos = "At least 3 pet photos are required";
        break;
    }

    return errors;
  };

  // Handle going back to the previous step
  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      // Helper to convert document picker result to File-like object
      const createFileObject = (doc: any, defaultName: string) => {
        if (!doc) return null;
        return {
          uri: doc.uri,
          name: doc.name || defaultName,
          type: doc.mimeType || "application/pdf",
        } as any;
      };

      // Convert photo assets to File-like objects
      const photoFiles = formData.petPhotos.map(
        (photo: any) =>
          ({
            uri: photo.uri,
            name: photo.fileName || "photo.jpg",
            type: photo.mimeType || "image/jpeg",
          }) as any
      );

      // Convert additional vaccinations with proper field names
      const additionalVaccinations = formData.vaccinations
        .map((vac: any) =>
          vac.vaccinationRecord
            ? {
                vaccination_type: vac.vaccinationType,
                vaccination_record: createFileObject(
                  vac.vaccinationRecord,
                  "vaccination.pdf"
                ),
                clinic_name: vac.clinicName,
                veterinarian_name: vac.veterinarianName,
                given_date: vac.givenDate,
                expiration_date: vac.expirationDate,
              }
            : null
        )
        .filter(Boolean);

      const petData = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        sex: formData.sex.toLowerCase(),
        birthdate: formData.birthdate,
        microchip: formData.microchip || "",
        height: formData.height,
        weight: formData.weight,
        has_been_bred: formData.hasBeenBred,
        breeding_count: formData.breedingCount || "",

        behaviors: formData.behaviors,
        behavior_tags: formData.behaviorTags || "",
        attributes: formData.attributes,
        attribute_tags: formData.attributeTags || "",
        description: formData.description,

        rabies_vaccination_record: createFileObject(
          formData.rabiesVaccinationRecord,
          "rabies.pdf"
        ),
        rabies_clinic_name: formData.rabiesClinicName,
        rabies_veterinarian_name: formData.rabiesVeterinarianName,
        rabies_given_date: formData.rabiesGivenDate,
        rabies_expiration_date: formData.rabiesExpirationDate,

        dhpp_vaccination_record: createFileObject(
          formData.dhppVaccinationRecord,
          "dhpp.pdf"
        ),
        dhpp_clinic_name: formData.dhppClinicName,
        dhpp_veterinarian_name: formData.dhppVeterinarianName,
        dhpp_given_date: formData.dhppGivenDate,
        dhpp_expiration_date: formData.dhppExpirationDate,

        health_certificate: createFileObject(
          formData.healthCertificate,
          "health.pdf"
        ),
        health_clinic_name: formData.healthClinicName,
        health_veterinarian_name: formData.healthVeterinarianName,
        health_given_date: formData.healthGivenDate,
        health_expiration_date: formData.healthExpirationDate,

        pet_photos: photoFiles,
        additional_vaccinations:
          additionalVaccinations.length > 0
            ? additionalVaccinations
            : undefined,

        preferred_breed: formData.preferredBreed || "",
        partner_behaviors:
          formData.partnerBehaviors.length > 0
            ? formData.partnerBehaviors
            : undefined,
        partner_behavior_tags: formData.partnerBehaviorTags || "",
        partner_attributes:
          formData.partnerAttributes.length > 0
            ? formData.partnerAttributes
            : undefined,
        partner_attribute_tags: formData.partnerAttributeTags || "",
        min_age: formData.minAge || "",
        max_age: formData.maxAge || "",
      };

      const result = await createPet(petData as any);
      
      // Check if verification is required
      if (result?.requires_verification) {
        showAlert({
          title: "Verification Required",
          message: result.message || "You must complete identity verification before adding a pet",
          type: "warning",
          buttons: [
            {
              text: "Verify Now",
              onPress: () => {
                router.push("/(verification)/verify");
              },
            },
            { text: "Later" },
          ],
        });
        return;
      }
      
      setShowSuccessModal(true);
    } catch (error: any) {
      console.error("Error submitting pet:", error);
      const backendErrors: ValidationErrors = {};
      if (error.response?.data?.errors) {
        Object.keys(error.response.data.errors).forEach((key) => {
          backendErrors[key] = error.response.data.errors[key][0];
        });
      }
      setValidationErrors(backendErrors);
      showAlert({
        title: "Error",
        message:
          error.response?.data?.message ||
          "Failed to register pet. Please try again.",
        type: "error",
      });
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

  // Functions to manage vaccinations
  const addVaccination = () => {
    setFormData((prev) => ({
      ...prev,
      vaccinations: [
        ...prev.vaccinations,
        {
          vaccinationType: "",
          vaccinationRecord: null,
          clinicName: "",
          veterinarianName: "",
          givenDate: "",
          expirationDate: "",
        },
      ],
    }));
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
      (_: any, i: number) => i !== index
    );
    setFormData({ ...formData, vaccinations: updatedVaccinations });
  };

  // Toggle selection for tags
  const toggleTag = (
    field:
      | "behaviors"
      | "attributes"
      | "partnerBehaviors"
      | "partnerAttributes",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item: string) => item !== value)
        : [...prev[field], value],
    }));
  };

  // Add custom tags
  const addCustomTag = (
    formField:
      | "behaviorTags"
      | "attributeTags"
      | "partnerBehaviorTags"
      | "partnerAttributeTags",
    availableField:
      | "availableBehaviors"
      | "availableAttributes"
      | "availablePartnerBehaviors"
      | "availablePartnerAttributes",
    dataField:
      | "behaviors"
      | "attributes"
      | "partnerBehaviors"
      | "partnerAttributes"
  ) => {
    const newTag = formData[formField].trim().toUpperCase();
    if (newTag) {
      if (availableField === "availableBehaviors") {
        if (!availableBehaviors.includes(newTag))
          setAvailableBehaviors([...availableBehaviors, newTag]);
      } else if (availableField === "availableAttributes") {
        if (!availableAttributes.includes(newTag))
          setAvailableAttributes([...availableAttributes, newTag]);
      } else if (availableField === "availablePartnerBehaviors") {
        if (!availablePartnerBehaviors.includes(newTag))
          setAvailablePartnerBehaviors([...availablePartnerBehaviors, newTag]);
      } else {
        if (!availablePartnerAttributes.includes(newTag))
          setAvailablePartnerAttributes([
            ...availablePartnerAttributes,
            newTag,
          ]);
      }
      if (!formData[dataField].includes(newTag)) {
        setFormData((prev) => ({
          ...prev,
          [dataField]: [...prev[dataField], newTag],
          [formField]: "",
        }));
      }
    }
  };

  // Date picker handlers
  const openDatePicker = (field: string) => {
    setDatePickerField(field);
    setShowDatePicker(true);
  };
  const handleDateConfirm = (date: Date) => {
    if (datePickerField) {
      const formattedDate = date.toISOString().split("T")[0];
      if (datePickerField.startsWith("vaccination_")) {
        const parts = datePickerField.split("_");
        updateVaccination(
          parseInt(parts[1]),
          parts.slice(2).join("_"),
          formattedDate
        );
      } else {
        setFormData({ ...formData, [datePickerField]: formattedDate });
      }
    }
    setShowDatePicker(false);
  };

  // Step titles for progress bar
  const stepTitles = [
    "Pet Info",
    "About",
    "Vaccines",
    "Health Cert.",
    "Photos",
    "Preferences",
  ];

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <LinearGradient
          colors={["#FF6B4A", "#FF9A8B"]}
          style={[styles.progressBar, { width: `${(currentStep / 6) * 100}%` }]}
        />
      </View>
      <View style={styles.progressSteps}>
        {stepTitles.map((title, index) => (
          <View style={styles.step} key={index}>
            <View
              style={[
                styles.stepCircle,
                index + 1 < currentStep && styles.stepCircleCompleted,
                index + 1 === currentStep && styles.stepCircleActive,
              ]}
            >
              {index + 1 < currentStep && (
                <Ionicons name="checkmark" size={14} color="white" />
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                index + 1 === currentStep && styles.stepLabelActive,
              ]}
            >
              {title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep = (step: number) => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Let's get to know your pet</Text>
            <Text style={styles.stepSubtitle}>
              Tell us the basics about your furry friend.
            </Text>

            {renderInput("name", "Pet's Name", "e.g., Buddy")}
            {renderDropdown(
              "species",
              "Species",
              () => setShowSpeciesModal(true),
              "Select Species"
            )}
            {renderInput("breed", "Breed", "e.g., Golden Retriever")}
            <View style={styles.row}>
              {renderDropdown(
                "sex",
                "Sex",
                () => setShowSexModal(true),
                "Select Sex"
              )}
              {renderDatePicker("birthdate", "Birthdate")}
            </View>
            <View style={styles.row}>
              {renderInput("height", "Height (cm)", "e.g., 58", "numeric")}
              {renderInput("weight", "Weight (kg)", "e.g., 30", "numeric")}
            </View>
            {renderInput(
              "microchip",
              "Microchip ID (Optional)",
              "e.g., 123456789"
            )}
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Tell us more</Text>
            <Text style={styles.stepSubtitle}>
              Describe your pet's personality and appearance.
            </Text>

            {renderTagSelection(
              "behaviors",
              "Behaviors",
              availableBehaviors,
              (b) => toggleTag("behaviors", b),
              "behaviorTags",
              () =>
                addCustomTag("behaviorTags", "availableBehaviors", "behaviors")
            )}
            {renderTagSelection(
              "attributes",
              "Attributes",
              availableAttributes,
              (a) => toggleTag("attributes", a),
              "attributeTags",
              () =>
                addCustomTag(
                  "attributeTags",
                  "availableAttributes",
                  "attributes"
                )
            )}
            {renderInput(
              "description",
              "Description",
              "Tell us about your pet in 200 characters or less.",
              "default",
              true
            )}
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Vaccination Records</Text>
            <Text style={styles.stepSubtitle}>
              Please provide the required vaccination documents.
            </Text>

            {renderDocumentUpload(
              "rabiesVaccinationRecord",
              "Rabies Vaccination",
              "rabies"
            )}
            {renderDocumentUpload(
              "dhppVaccinationRecord",
              "DHPP Vaccine",
              "dhpp"
            )}

            {formData.vaccinations.map((_: any, index: number) =>
              renderDocumentUpload(
                `vaccination_${index}`,
                `Additional Vaccine ${index + 1}`,
                `vaccination_${index}`,
                true,
                () => removeVaccination(index),
                `vacc-${index}`
              )
            )}
            <TouchableOpacity style={styles.addButton} onPress={addVaccination}>
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>Add Another Vaccination</Text>
            </TouchableOpacity>
          </View>
        );
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Health Certificate</Text>
            <Text style={styles.stepSubtitle}>
              Upload a valid health certificate for your pet.
            </Text>

            {renderDocumentUpload(
              "healthCertificate",
              "Health Certificate",
              "health"
            )}
          </View>
        );
      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Pet Photos</Text>
            <Text style={styles.stepSubtitle}>
              Upload at least 3 photos of your pet.
            </Text>

            <TouchableOpacity
              style={styles.photoUploadButton}
              onPress={pickImages}
            >
              <Ionicons name="cloud-upload-outline" size={40} color="#FF6B4A" />
              <Text style={styles.photoUploadText}>Tap to upload photos</Text>
            </TouchableOpacity>
            {validationErrors.petPhotos && (
              <Text style={styles.errorText}>{validationErrors.petPhotos}</Text>
            )}

            {formData.petPhotos.length > 0 && (
              <View style={styles.photoGrid}>
                {formData.petPhotos.map((photo: any, index: number) => (
                  <Image
                    key={index}
                    source={{ uri: photo.uri }}
                    style={styles.photoThumbnail}
                  />
                ))}
              </View>
            )}
          </View>
        );
      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Partner Preferences</Text>
            <Text style={styles.stepSubtitle}>
              What are you looking for in a breeding partner for your pet?
            </Text>

            {renderDropdown(
              "preferredBreed",
              "Preferred Breed",
              () => setShowPreferredBreedModal(true),
              "Any Breed"
            )}
            <View style={styles.row}>
              {renderInput("minAge", "Min Partner Age", "e.g., 1", "numeric")}
              {renderInput("maxAge", "Max Partner Age", "e.g., 5", "numeric")}
            </View>

            {renderTagSelection(
              "partnerBehaviors",
              "Preferred Behaviors",
              availablePartnerBehaviors,
              (b) => toggleTag("partnerBehaviors", b),
              "partnerBehaviorTags",
              () =>
                addCustomTag(
                  "partnerBehaviorTags",
                  "availablePartnerBehaviors",
                  "partnerBehaviors"
                )
            )}
            {renderTagSelection(
              "partnerAttributes",
              "Preferred Attributes",
              availablePartnerAttributes,
              (a) => toggleTag("partnerAttributes", a),
              "partnerAttributeTags",
              () =>
                addCustomTag(
                  "partnerAttributeTags",
                  "availablePartnerAttributes",
                  "partnerAttributes"
                )
            )}
          </View>
        );
    }
  };

  const renderInput = (
    field: string,
    label: string,
    placeholder: string,
    keyboardType: "default" | "numeric" = "default",
    multiline = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          validationErrors[field] && styles.inputError,
          multiline && styles.multilineInput,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={
          field.startsWith("vaccination_")
            ? (() => {
                const m = field.match(/^vaccination_(\d+)_(.+)$/);
                if (m) {
                  const idx = parseInt(m[1], 10);
                  const key = m[2];
                  return formData.vaccinations?.[idx]?.[key] ?? "";
                }
                return formData[field] ?? "";
              })()
            : formData[field]
        }
        onChangeText={(text) => {
          if (field.startsWith("vaccination_")) {
            const m = field.match(/^vaccination_(\d+)_(.+)$/);
            if (m) {
              const idx = parseInt(m[1], 10);
              const key = m[2];
              updateVaccination(idx, key, text);
              return;
            }
          }
          setFormData({ ...formData, [field]: text });
        }}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
      />
      {validationErrors[field] && (
        <Text style={styles.errorText}>{validationErrors[field]}</Text>
      )}
    </View>
  );

  const renderDropdown = (
    field: string,
    label: string,
    onPress: () => void,
    placeholder: string
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.input,
          styles.dropdown,
          validationErrors[field] && styles.inputError,
        ]}
        onPress={onPress}
      >
        <Text
          style={[
            styles.dropdownText,
            !formData[field] && styles.dropdownPlaceholder,
          ]}
        >
          {formData[field] || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      {validationErrors[field] && (
        <Text style={styles.errorText}>{validationErrors[field]}</Text>
      )}
    </View>
  );

  const renderDatePicker = (field: string, label: string) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.input,
          styles.dropdown,
          validationErrors[field] && styles.inputError,
        ]}
        onPress={() => openDatePicker(field)}
      >
        <Text
          style={[
            styles.dropdownText,
            !formData[field] && styles.dropdownPlaceholder,
          ]}
        >
          {field.startsWith("vaccination_")
            ? (() => {
                const m = field.match(/^vaccination_(\d+)_(.+)$/);
                if (m) {
                  const idx = parseInt(m[1], 10);
                  const key = m[2];
                  const val = formData.vaccinations?.[idx]?.[key];
                  return val
                    ? new Date(val).toLocaleDateString()
                    : "Select Date";
                }
                return formData[field]
                  ? new Date(formData[field]).toLocaleDateString()
                  : "Select Date";
              })()
            : formData[field]
              ? new Date(formData[field]).toLocaleDateString()
              : "Select Date"}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#666" />
      </TouchableOpacity>
      {validationErrors[field] && (
        <Text style={styles.errorText}>{validationErrors[field]}</Text>
      )}
    </View>
  );

  const renderTagSelection = (
    field: string,
    label: string,
    options: string[],
    onToggle: (tag: string) => void,
    customField: string,
    onAddCustom: () => void
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.tagContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.tag,
              formData[field].includes(option) && styles.tagSelected,
            ]}
            onPress={() => onToggle(option)}
          >
            <Text
              style={[
                styles.tagText,
                formData[field].includes(option) && styles.tagTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.customTagContainer}>
        <TextInput
          style={[styles.input, styles.customTagInput]}
          placeholder="Add custom tag..."
          placeholderTextColor="#999"
          value={formData[customField]}
          onChangeText={(text) =>
            setFormData({ ...formData, [customField]: text })
          }
          onSubmitEditing={onAddCustom}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addTagButton} onPress={onAddCustom}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>
      {validationErrors[field] && (
        <Text style={styles.errorText}>{validationErrors[field]}</Text>
      )}
    </View>
  );

  const renderDocumentUpload = (
    docField: string,
    title: string,
    prefix: string,
    isAdditional = false,
    onRemove?: () => void,
    keyProp?: string | number
  ) => {
    // Helper to convert prefix to proper camelCase field names
    const getFieldName = (fieldSuffix: string) => {
      if (prefix.startsWith("vaccination_")) {
        // For dynamic vaccinations: vaccination_0 -> vaccination_0_clinicName
        return `${prefix}_${fieldSuffix}`;
      }
      // For static fields: rabies -> rabiesClinicName, dhpp -> dhppClinicName, health -> healthClinicName
      return `${prefix}${fieldSuffix.charAt(0).toUpperCase()}${fieldSuffix.slice(1)}`;
    };

    return (
      <View key={keyProp} style={styles.documentSection}>
        <View style={styles.documentHeader}>
          <Text style={styles.documentTitle}>{title}</Text>
          {isAdditional && (
            <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>

        {isAdditional &&
          renderInput(
            `${prefix}_vaccinationType`,
            "Vaccine Name",
            "e.g., Bordetella"
          )}

        <TouchableOpacity
          style={[
            styles.filePicker,
            validationErrors[docField] && styles.inputError,
          ]}
          onPress={() => pickDocument(docField)}
        >
          <Ionicons name="document-attach-outline" size={24} color="#666" />
          <Text style={styles.filePickerText}>
            {docField.startsWith("vaccination_")
              ? (() => {
                  const m = docField.match(/^vaccination_(\d+)$/);
                  if (m) {
                    const idx = parseInt(m[1], 10);
                    return (
                      formData.vaccinations?.[idx]?.vaccinationRecord?.name ||
                      "Upload Document"
                    );
                  }
                  return formData[docField]?.name || "Upload Document";
                })()
              : formData[docField]?.name || "Upload Document"}
          </Text>
        </TouchableOpacity>
        {validationErrors[docField] && (
          <Text style={styles.errorText}>{validationErrors[docField]}</Text>
        )}

        {renderInput(
          getFieldName("clinicName"),
          "Clinic Name",
          "e.g., City Vet Clinic"
        )}
        {renderInput(
          getFieldName("veterinarianName"),
          "Veterinarian's Name",
          "e.g., Dr. Smith"
        )}
        <View style={styles.row}>
          {renderDatePicker(getFieldName("givenDate"), "Date Given")}
          {renderDatePicker(getFieldName("expirationDate"), "Expiry Date")}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <LinearGradient colors={["#FF9A8B", "#FF6B4A"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Your Pet</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      {renderProgressBar()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderStep(currentStep)}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.navButton, styles.prevButton]}
              onPress={handlePrev}
              disabled={isSubmitting}
            >
              <Text style={[styles.navButtonText, styles.prevButtonText]}>
                Back
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              isSubmitting && styles.disabledButton,
            ]}
            onPress={handleNext}
            disabled={isSubmitting}
          >
            <Text style={styles.navButtonText}>
              {isSubmitting
                ? "Submitting..."
                : currentStep === 6
                  ? "Finish"
                  : "Next"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
      <StyledModal
        visible={showSpeciesModal}
        onClose={() => setShowSpeciesModal(false)}
        title="Select Species"
        content={() => (
          <>
            {["Dog", "Cat"].map((species) => (
              <TouchableOpacity
                key={species}
                style={modalStyles.option}
                onPress={() => {
                  setFormData({ ...formData, species });
                  setShowSpeciesModal(false);
                }}
              >
                <Text style={modalStyles.optionText}>{species}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      />

      <StyledModal
        visible={showSexModal}
        onClose={() => setShowSexModal(false)}
        title="Select Sex"
        content={() => (
          <>
            {["Male", "Female"].map((sex) => (
              <TouchableOpacity
                key={sex}
                style={modalStyles.option}
                onPress={() => {
                  setFormData({ ...formData, sex });
                  setShowSexModal(false);
                }}
              >
                <Text style={modalStyles.optionText}>{sex}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      />

      <StyledModal
        visible={showPreferredBreedModal}
        onClose={() => setShowPreferredBreedModal(false)}
        title="Select Preferred Breed"
        content={() => (
          <>
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
                style={modalStyles.option}
                onPress={() => {
                  setFormData({ ...formData, preferredBreed: breed });
                  setShowPreferredBreedModal(false);
                }}
              >
                <Text style={modalStyles.optionText}>{breed}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      />
      <StyledModal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirm Submission"
        content={() => (
          <>
            <Text style={{ textAlign: "center", marginBottom: 12 }}>
              Are you sure you want to submit this pet registration?
            </Text>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: "#6C757D",
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                }}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={{ color: "white" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#FF6B4A",
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                }}
                onPress={handleSubmit}
              >
                <Text style={{ color: "white" }}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      />

      <StyledModal
        visible={showSuccessModal}
        onClose={handleSuccessClose}
        title="Success"
        content={() => (
          <>
            <Text style={{ textAlign: "center", marginBottom: 12 }}>
              Your pet has been registered successfully.
            </Text>
            <View style={{ alignItems: "center" }}>
              <TouchableOpacity
                style={{
                  backgroundColor: "#FF6B4A",
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                }}
                onPress={handleSuccessClose}
              >
                <Text style={{ color: "white" }}>OK</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      />
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
      />

      <AlertModal visible={visible} {...alertOptions} onClose={hideAlert} />
    </SafeAreaView>
  );
}

const modalStyles = StyleSheet.create({
  option: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E9ECEF",
  },
  optionText: {
    fontSize: 18,
    color: "#343A40",
    textAlign: "center",
  },
});
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: { padding: 8 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginTop: -24,
    marginBottom: 16,
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#E9ECEF",
    borderRadius: 4,
  },
  progressBar: { height: "100%", borderRadius: 4 },
  progressSteps: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  step: { alignItems: "center", flex: 1 },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#DEE2E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    borderWidth: 2,
    borderColor: "#DEE2E6",
  },
  stepCircleActive: {
    borderColor: "#FF6B4A",
    backgroundColor: "white",
  },
  stepCircleCompleted: {
    backgroundColor: "#FF6B4A",
    borderColor: "#FF6B4A",
  },
  stepLabel: {
    fontSize: 10,
    color: "#6C757D",
    textAlign: "center",
  },
  stepLabelActive: { color: "#FF6B4A", fontWeight: "bold" },
  scrollView: { flex: 1 },
  scrollViewContent: { paddingBottom: 20 },
  stepContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#343A40",
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 16,
    color: "#6C757D",
    marginBottom: 24,
  },
  inputContainer: { marginBottom: 16 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#CED4DA",
  },
  inputError: { borderColor: "#E74C3C" },
  multilineInput: {
    height: 100,
    paddingTop: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: { fontSize: 16, color: "#343A40" },
  dropdownPlaceholder: { color: "#999" },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#CED4DA",
  },
  tagSelected: {
    backgroundColor: "#FF6B4A",
    borderColor: "#FF6B4A",
  },
  tagText: { color: "#495057", fontWeight: "500" },
  tagTextSelected: { color: "white" },
  customTagContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customTagInput: { flex: 1 },
  addTagButton: {
    backgroundColor: "#FF6B4A",
    borderRadius: 12,
    height: 50,
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  documentSection: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  documentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#343A40",
  },
  removeButton: { padding: 4 },
  filePicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#CED4DA",
    borderStyle: "dashed",
    marginBottom: 16,
  },
  filePickerText: {
    marginLeft: 12,
    color: "#6C757D",
    fontSize: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#28A745",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  addButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  photoUploadButton: {
    height: 150,
    borderRadius: 16,
    backgroundColor: "#FFF4F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFD1C9",
    borderStyle: "dashed",
    marginBottom: 16,
  },
  photoUploadText: {
    marginTop: 8,
    color: "#FF6B4A",
    fontWeight: "bold",
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoThumbnail: {
    width: (width - 48 - 16) / 3, // Adjust for padding and gap
    height: (width - 48 - 16) / 3,
    borderRadius: 12,
  },
  footer: {
    padding: 24,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E9ECEF",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
  },
  navButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  prevButton: { backgroundColor: "#6C757D" },
  nextButton: { backgroundColor: "#FF6B4A" },
  disabledButton: { backgroundColor: "#CED4DA" },
  navButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  prevButtonText: {},
  errorText: {
    color: "#E74C3C",
    fontSize: 12,
    marginTop: 4,
  },
});
