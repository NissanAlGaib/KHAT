import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { createPet, initializeVaccinationCards } from "@/services/petService";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import StyledModal from "@/components/core/StyledModal";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, BorderRadius, Spacing, Shadows, Gradients } from "@/constants";
import VaccinationCardComponent from "@/components/pet/VaccinationCard";
import AddShotModal from "@/components/pet/AddShotModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Dog breeds list for autocomplete
const DOG_BREEDS = [
  "Labrador Retriever", "German Shepherd", "Golden Retriever", "French Bulldog",
  "Bulldog", "Poodle", "Beagle", "Rottweiler", "German Shorthaired Pointer",
  "Siberian Husky", "Dachshund", "Doberman Pinscher", "Shih Tzu", "Boxer",
  "Great Dane", "Yorkshire Terrier", "Australian Shepherd", "Cavalier King Charles Spaniel",
  "Miniature Schnauzer", "Pembroke Welsh Corgi", "Pomeranian", "Boston Terrier",
  "Havanese", "Bernese Mountain Dog", "Maltese", "English Springer Spaniel",
  "Shetland Sheepdog", "Brittany", "Cocker Spaniel", "Border Collie",
  "Aspin", "Askal", "Mixed Breed",
];

const CAT_BREEDS = [
  "Siamese", "Persian", "Maine Coon", "Ragdoll", "British Shorthair",
  "Sphynx", "Scottish Fold", "Bengal", "Abyssinian", "Russian Blue",
  "Norwegian Forest Cat", "Birman", "Oriental Shorthair", "Devon Rex",
  "American Shorthair", "Exotic Shorthair", "Burmese", "Himalayan",
  "Puspin", "Mixed Breed",
];

interface ValidationErrors {
  [key: string]: string;
}

export default function AddPetScreen() {
  const router = useRouter();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Modal states
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showSexModal, setShowSexModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerField, setDatePickerField] = useState<string | null>(null);
  const [showBreedSearch, setShowBreedSearch] = useState(false);
  const [breedSearchQuery, setBreedSearchQuery] = useState("");
  
  // Form data
  const [formData, setFormData] = useState<Record<string, any>>({
    // Step 1 - Pet Info
    name: "",
    species: "",
    breed: "",
    sex: "",
    birthdate: "",
    height: "",
    weight: "",
    microchip: "",
    // Step 2 - About
    behaviors: [] as string[],
    attributes: [] as string[],
    description: "",
    // Step 3 - Health Certificate
    healthCertificate: null as any,
    healthClinicName: "",
    healthVeterinarianName: "",
    healthGivenDate: "",
    healthExpirationDate: "",
    // Step 4 - Photos
    petPhotos: [] as any[],
    primaryPhotoIndex: 0,
    // Step 5 - Preferences
    preferredBreed: "",
    partnerBehaviors: [] as string[],
    partnerAttributes: [] as string[],
    minAge: "",
    maxAge: "",
  });

  // Behavior and attribute options
  const behaviorOptions = [
    { label: "Playful", icon: "football-outline" },
    { label: "Calm", icon: "leaf-outline" },
    { label: "Loyal", icon: "heart-outline" },
    { label: "Social", icon: "people-outline" },
    { label: "Protective", icon: "shield-outline" },
    { label: "Energetic", icon: "flash-outline" },
    { label: "Gentle", icon: "flower-outline" },
    { label: "Independent", icon: "walk-outline" },
  ];

  const attributeOptions = [
    { label: "Short Coat", icon: "cut-outline" },
    { label: "Long Coat", icon: "brush-outline" },
    { label: "Curly", icon: "sync-outline" },
    { label: "Spotted", icon: "ellipse-outline" },
    { label: "Solid Color", icon: "square-outline" },
    { label: "Large", icon: "resize-outline" },
    { label: "Small", icon: "contract-outline" },
    { label: "Athletic", icon: "barbell-outline" },
  ];

  const stepTitles = [
    { title: "Pet Info", icon: "paw" },
    { title: "About", icon: "heart" },
    { title: "Health", icon: "medkit" },
    { title: "Photos", icon: "camera" },
    { title: "Preferences", icon: "options" },
  ];

  const getFilteredBreeds = () => {
    const breeds = formData.species === "Cat" ? CAT_BREEDS : DOG_BREEDS;
    if (!breedSearchQuery) return breeds;
    return breeds.filter(breed =>
      breed.toLowerCase().includes(breedSearchQuery.toLowerCase())
    );
  };

  const validateStep = (step: number): ValidationErrors => {
    const errors: ValidationErrors = {};

    switch (step) {
      case 1:
        if (!formData.name.trim()) errors.name = "Pet name is required";
        if (!formData.species) errors.species = "Species is required";
        if (!formData.breed.trim()) errors.breed = "Breed is required";
        if (!formData.sex) errors.sex = "Sex is required";
        if (!formData.birthdate) errors.birthdate = "Birthdate is required";
        if (!formData.height.trim()) errors.height = "Height is required";
        if (!formData.weight.trim()) errors.weight = "Weight is required";
        break;
      case 2:
        if (formData.behaviors.length === 0) errors.behaviors = "Select at least one behavior";
        if (formData.attributes.length === 0) errors.attributes = "Select at least one attribute";
        if (!formData.description.trim()) errors.description = "Description is required";
        break;
      case 3:
        if (!formData.healthCertificate) errors.healthCertificate = "Health certificate is required";
        if (!formData.healthClinicName.trim()) errors.healthClinicName = "Clinic name is required";
        if (!formData.healthVeterinarianName.trim()) errors.healthVeterinarianName = "Veterinarian name is required";
        if (!formData.healthGivenDate) errors.healthGivenDate = "Date given is required";
        if (!formData.healthExpirationDate) errors.healthExpirationDate = "Expiration date is required";
        break;
      case 4:
        if (formData.petPhotos.length < 3) errors.petPhotos = "At least 3 photos are required";
        break;
    }

    return errors;
  };

  const handleNext = () => {
    setValidationErrors({});
    const errors = validateStep(currentStep);

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    if (currentStep === 5) {
      handleSubmit();
    } else {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const photoFiles = formData.petPhotos.map((photo: any) => ({
        uri: photo.uri,
        name: photo.fileName || "photo.jpg",
        type: photo.mimeType || "image/jpeg",
      }));

      // Reorder photos so primary is first
      const reorderedPhotos = [
        photoFiles[formData.primaryPhotoIndex],
        ...photoFiles.filter((_: any, i: number) => i !== formData.primaryPhotoIndex),
      ];

      const petData = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        sex: formData.sex.toLowerCase(),
        birthdate: formData.birthdate,
        microchip: formData.microchip || "",
        height: formData.height,
        weight: formData.weight,
        has_been_bred: false,
        behaviors: formData.behaviors,
        attributes: formData.attributes,
        description: formData.description,
        health_certificate: {
          uri: formData.healthCertificate.uri,
          name: formData.healthCertificate.name || "health.pdf",
          type: formData.healthCertificate.mimeType || "application/pdf",
        },
        health_clinic_name: formData.healthClinicName,
        health_veterinarian_name: formData.healthVeterinarianName,
        health_given_date: formData.healthGivenDate,
        health_expiration_date: formData.healthExpirationDate,
        pet_photos: reorderedPhotos,
        // Preferences
        preferred_breed: formData.preferredBreed || "",
        partner_behaviors: formData.partnerBehaviors,
        partner_attributes: formData.partnerAttributes,
        min_age: formData.minAge || "",
        max_age: formData.maxAge || "",
        // Placeholder vaccinations (will be added via cards later)
        rabies_vaccination_record: { uri: "", name: "", type: "" },
        rabies_clinic_name: "TBD",
        rabies_veterinarian_name: "TBD",
        rabies_given_date: new Date().toISOString().split("T")[0],
        rabies_expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        dhpp_vaccination_record: { uri: "", name: "", type: "" },
        dhpp_clinic_name: "TBD",
        dhpp_veterinarian_name: "TBD",
        dhpp_given_date: new Date().toISOString().split("T")[0],
        dhpp_expiration_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      };

      const result = await createPet(petData as any);

      if (result?.requires_verification) {
        showAlert({
          title: "Verification Required",
          message: result.message || "Complete identity verification before adding a pet",
          type: "warning",
          buttons: [
            { text: "Verify Now", onPress: () => router.push("/(verification)/verify") },
            { text: "Later" },
          ],
        });
        return;
      }

      // Initialize vaccination cards for the new pet
      if (result?.pet?.pet_id) {
        try {
          await initializeVaccinationCards(result.pet.pet_id);
        } catch (e) {
          console.log("Failed to initialize vaccination cards:", e);
        }
      }

      showAlert({
        title: "Success!",
        message: "Your pet has been registered. You can now add vaccination records from the pet profile.",
        type: "success",
        buttons: [
          { text: "Done", onPress: () => router.back() },
        ],
      });
    } catch (error: any) {
      console.error("Error submitting pet:", error);
      showAlert({
        title: "Error",
        message: error.response?.data?.message || "Failed to register pet. Please try again.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pickDocument = async (field: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });
      if (!result.canceled && result.assets?.length > 0) {
        setFormData({ ...formData, [field]: result.assets[0] });
        setValidationErrors((prev) => ({ ...prev, [field]: "" }));
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
        quality: 0.8,
        selectionLimit: 10 - formData.petPhotos.length,
      });

      if (!result.canceled) {
        setFormData({
          ...formData,
          petPhotos: [...formData.petPhotos, ...result.assets],
        });
        setValidationErrors((prev) => ({ ...prev, petPhotos: "" }));
      }
    } catch (error) {
      console.error("Error picking images:", error);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = formData.petPhotos.filter((_: any, i: number) => i !== index);
    let newPrimaryIndex = formData.primaryPhotoIndex;
    if (index === formData.primaryPhotoIndex) {
      newPrimaryIndex = 0;
    } else if (index < formData.primaryPhotoIndex) {
      newPrimaryIndex = formData.primaryPhotoIndex - 1;
    }
    setFormData({
      ...formData,
      petPhotos: newPhotos,
      primaryPhotoIndex: Math.max(0, Math.min(newPrimaryIndex, newPhotos.length - 1)),
    });
  };

  const setPrimaryPhoto = (index: number) => {
    setFormData({ ...formData, primaryPhotoIndex: index });
  };

  const toggleSelection = (field: "behaviors" | "attributes" | "partnerBehaviors" | "partnerAttributes", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v: string) => v !== value)
        : [...prev[field], value],
    }));
  };

  const openDatePicker = (field: string) => {
    setDatePickerField(field);
    setShowDatePicker(true);
  };

  const handleDateConfirm = (date: Date) => {
    if (datePickerField) {
      setFormData({
        ...formData,
        [datePickerField]: date.toISOString().split("T")[0],
      });
      setValidationErrors((prev) => ({ ...prev, [datePickerField]: "" }));
    }
    setShowDatePicker(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Render Progress Header
  const renderProgressHeader = () => (
    <View style={styles.progressHeader}>
      {stepTitles.map((step, index) => (
        <View key={index} style={styles.progressStep}>
          <View
            style={[
              styles.progressDot,
              index + 1 < currentStep && styles.progressDotCompleted,
              index + 1 === currentStep && styles.progressDotActive,
            ]}
          >
            {index + 1 < currentStep ? (
              <Ionicons name="checkmark" size={14} color={Colors.white} />
            ) : (
              <Ionicons
                name={step.icon as any}
                size={14}
                color={index + 1 === currentStep ? Colors.white : Colors.textMuted}
              />
            )}
          </View>
          <Text
            style={[
              styles.progressLabel,
              index + 1 === currentStep && styles.progressLabelActive,
            ]}
          >
            {step.title}
          </Text>
          {index < stepTitles.length - 1 && (
            <View
              style={[
                styles.progressLine,
                index + 1 < currentStep && styles.progressLineCompleted,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  // Render Step 1 - Pet Info
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>
      <Text style={styles.stepSubtitle}>Tell us about your furry friend</Text>

      {/* Pet Name */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Pet's Name *</Text>
        <TextInput
          style={[styles.input, validationErrors.name && styles.inputError]}
          placeholder="e.g., Buddy"
          placeholderTextColor={Colors.textMuted}
          value={formData.name}
          onChangeText={(text) => {
            setFormData({ ...formData, name: text });
            setValidationErrors((prev) => ({ ...prev, name: "" }));
          }}
        />
        {validationErrors.name && <Text style={styles.errorText}>{validationErrors.name}</Text>}
      </View>

      {/* Species Selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Species *</Text>
        <View style={styles.speciesRow}>
          {["Dog", "Cat"].map((species) => (
            <TouchableOpacity
              key={species}
              style={[
                styles.speciesCard,
                formData.species === species && styles.speciesCardActive,
                validationErrors.species && styles.inputError,
              ]}
              onPress={() => {
                setFormData({ ...formData, species, breed: "" });
                setValidationErrors((prev) => ({ ...prev, species: "" }));
              }}
            >
              <MaterialCommunityIcons
                name={species === "Dog" ? "dog" : "cat"}
                size={40}
                color={formData.species === species ? Colors.white : Colors.primary}
              />
              <Text
                style={[
                  styles.speciesLabel,
                  formData.species === species && styles.speciesLabelActive,
                ]}
              >
                {species}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {validationErrors.species && <Text style={styles.errorText}>{validationErrors.species}</Text>}
      </View>

      {/* Breed with Search */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Breed *</Text>
        <TouchableOpacity
          style={[styles.selectInput, validationErrors.breed && styles.inputError]}
          onPress={() => formData.species && setShowBreedSearch(true)}
          disabled={!formData.species}
        >
          <Ionicons name="search-outline" size={20} color={Colors.textMuted} />
          <Text style={[styles.selectText, !formData.breed && styles.placeholder]}>
            {formData.breed || (formData.species ? "Search breed..." : "Select species first")}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.helperText}>
          Can't find your breed? Type it manually or select "Mixed Breed"
        </Text>
        {validationErrors.breed && <Text style={styles.errorText}>{validationErrors.breed}</Text>}
      </View>

      {/* Sex Selector */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sex *</Text>
        <View style={styles.sexRow}>
          {["Male", "Female"].map((sex) => (
            <TouchableOpacity
              key={sex}
              style={[
                styles.sexCard,
                formData.sex === sex && styles.sexCardActive,
                formData.sex === sex && (sex === "Male" ? styles.maleActive : styles.femaleActive),
              ]}
              onPress={() => {
                setFormData({ ...formData, sex });
                setValidationErrors((prev) => ({ ...prev, sex: "" }));
              }}
            >
              <Ionicons
                name={sex === "Male" ? "male" : "female"}
                size={24}
                color={formData.sex === sex ? Colors.white : (sex === "Male" ? "#0284C7" : "#BE123C")}
              />
              <Text
                style={[
                  styles.sexLabel,
                  formData.sex === sex && styles.sexLabelActive,
                ]}
              >
                {sex}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {validationErrors.sex && <Text style={styles.errorText}>{validationErrors.sex}</Text>}
      </View>

      {/* Birthdate */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Birthdate *</Text>
        <TouchableOpacity
          style={[styles.selectInput, validationErrors.birthdate && styles.inputError]}
          onPress={() => openDatePicker("birthdate")}
        >
          <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />
          <Text style={[styles.selectText, !formData.birthdate && styles.placeholder]}>
            {formData.birthdate ? formatDate(formData.birthdate) : "Select birthdate"}
          </Text>
        </TouchableOpacity>
        {validationErrors.birthdate && <Text style={styles.errorText}>{validationErrors.birthdate}</Text>}
      </View>

      {/* Height & Weight Row */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Height (cm) *</Text>
          <TextInput
            style={[styles.input, validationErrors.height && styles.inputError]}
            placeholder="e.g., 58"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={formData.height}
            onChangeText={(text) => {
              setFormData({ ...formData, height: text });
              setValidationErrors((prev) => ({ ...prev, height: "" }));
            }}
          />
          {validationErrors.height && <Text style={styles.errorText}>{validationErrors.height}</Text>}
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Weight (kg) *</Text>
          <TextInput
            style={[styles.input, validationErrors.weight && styles.inputError]}
            placeholder="e.g., 25"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={formData.weight}
            onChangeText={(text) => {
              setFormData({ ...formData, weight: text });
              setValidationErrors((prev) => ({ ...prev, weight: "" }));
            }}
          />
          {validationErrors.weight && <Text style={styles.errorText}>{validationErrors.weight}</Text>}
        </View>
      </View>

      {/* Microchip (Optional) */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>
          Microchip ID <Text style={styles.optional}>(Optional)</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 123456789012345"
          placeholderTextColor={Colors.textMuted}
          value={formData.microchip}
          onChangeText={(text) => setFormData({ ...formData, microchip: text })}
        />
      </View>
    </View>
  );

  // Render Step 2 - About
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personality & Traits</Text>
      <Text style={styles.stepSubtitle}>Help others get to know your pet</Text>

      {/* Behaviors */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Behaviors *</Text>
        <View style={styles.tagGrid}>
          {behaviorOptions.map((behavior) => (
            <TouchableOpacity
              key={behavior.label}
              style={[
                styles.tagButton,
                formData.behaviors.includes(behavior.label) && styles.tagButtonActive,
              ]}
              onPress={() => toggleSelection("behaviors", behavior.label)}
            >
              <Ionicons
                name={behavior.icon as any}
                size={18}
                color={formData.behaviors.includes(behavior.label) ? Colors.white : Colors.primary}
              />
              <Text
                style={[
                  styles.tagButtonText,
                  formData.behaviors.includes(behavior.label) && styles.tagButtonTextActive,
                ]}
              >
                {behavior.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {validationErrors.behaviors && <Text style={styles.errorText}>{validationErrors.behaviors}</Text>}
      </View>

      {/* Attributes */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Physical Attributes *</Text>
        <View style={styles.tagGrid}>
          {attributeOptions.map((attr) => (
            <TouchableOpacity
              key={attr.label}
              style={[
                styles.tagButton,
                formData.attributes.includes(attr.label) && styles.tagButtonActive,
              ]}
              onPress={() => toggleSelection("attributes", attr.label)}
            >
              <Ionicons
                name={attr.icon as any}
                size={18}
                color={formData.attributes.includes(attr.label) ? Colors.white : Colors.primary}
              />
              <Text
                style={[
                  styles.tagButtonText,
                  formData.attributes.includes(attr.label) && styles.tagButtonTextActive,
                ]}
              >
                {attr.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {validationErrors.attributes && <Text style={styles.errorText}>{validationErrors.attributes}</Text>}
      </View>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea, validationErrors.description && styles.inputError]}
          placeholder="Tell us about your pet's personality, quirks, and what makes them special..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={formData.description}
          onChangeText={(text) => {
            if (text.length <= 200) {
              setFormData({ ...formData, description: text });
              setValidationErrors((prev) => ({ ...prev, description: "" }));
            }
          }}
        />
        <Text style={styles.charCount}>{formData.description.length}/200</Text>
        {validationErrors.description && <Text style={styles.errorText}>{validationErrors.description}</Text>}
      </View>
    </View>
  );

  // Render Step 3 - Health Certificate
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Health Certificate</Text>
      <Text style={styles.stepSubtitle}>Upload your pet's health documentation</Text>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={24} color={Colors.info} />
        <Text style={styles.infoCardText}>
          Vaccination records will be added through the card-based system after registration.
          For now, upload your pet's general health certificate.
        </Text>
      </View>

      {/* Health Certificate Upload */}
      <View style={styles.uploadSection}>
        <View style={styles.uploadHeader}>
          <Ionicons name="document-text-outline" size={24} color={Colors.primary} />
          <Text style={styles.uploadTitle}>Health Certificate</Text>
        </View>

        <TouchableOpacity
          style={[styles.uploadBox, validationErrors.healthCertificate && styles.inputError]}
          onPress={() => pickDocument("healthCertificate")}
        >
          {formData.healthCertificate ? (
            <View style={styles.uploadedFile}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
              <Text style={styles.uploadedFileName} numberOfLines={1}>
                {formData.healthCertificate.name}
              </Text>
              <TouchableOpacity onPress={() => setFormData({ ...formData, healthCertificate: null })}>
                <Ionicons name="close-circle" size={24} color={Colors.error} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.uploadText}>Tap to upload document</Text>
              <Text style={styles.uploadHint}>JPG, PNG, or PDF (max 20MB)</Text>
            </>
          )}
        </TouchableOpacity>
        {validationErrors.healthCertificate && (
          <Text style={styles.errorText}>{validationErrors.healthCertificate}</Text>
        )}

        {/* Clinic Details */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Clinic Name *</Text>
          <TextInput
            style={[styles.input, validationErrors.healthClinicName && styles.inputError]}
            placeholder="e.g., City Veterinary Clinic"
            placeholderTextColor={Colors.textMuted}
            value={formData.healthClinicName}
            onChangeText={(text) => {
              setFormData({ ...formData, healthClinicName: text });
              setValidationErrors((prev) => ({ ...prev, healthClinicName: "" }));
            }}
          />
          {validationErrors.healthClinicName && (
            <Text style={styles.errorText}>{validationErrors.healthClinicName}</Text>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Veterinarian Name *</Text>
          <TextInput
            style={[styles.input, validationErrors.healthVeterinarianName && styles.inputError]}
            placeholder="e.g., Dr. Juan dela Cruz"
            placeholderTextColor={Colors.textMuted}
            value={formData.healthVeterinarianName}
            onChangeText={(text) => {
              setFormData({ ...formData, healthVeterinarianName: text });
              setValidationErrors((prev) => ({ ...prev, healthVeterinarianName: "" }));
            }}
          />
          {validationErrors.healthVeterinarianName && (
            <Text style={styles.errorText}>{validationErrors.healthVeterinarianName}</Text>
          )}
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Date Issued *</Text>
            <TouchableOpacity
              style={[styles.selectInput, validationErrors.healthGivenDate && styles.inputError]}
              onPress={() => openDatePicker("healthGivenDate")}
            >
              <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
              <Text style={[styles.selectText, styles.smallText, !formData.healthGivenDate && styles.placeholder]}>
                {formData.healthGivenDate ? formatDate(formData.healthGivenDate) : "Select"}
              </Text>
            </TouchableOpacity>
            {validationErrors.healthGivenDate && (
              <Text style={styles.errorText}>{validationErrors.healthGivenDate}</Text>
            )}
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Expiration *</Text>
            <TouchableOpacity
              style={[styles.selectInput, validationErrors.healthExpirationDate && styles.inputError]}
              onPress={() => openDatePicker("healthExpirationDate")}
            >
              <Ionicons name="calendar-outline" size={18} color={Colors.textMuted} />
              <Text style={[styles.selectText, styles.smallText, !formData.healthExpirationDate && styles.placeholder]}>
                {formData.healthExpirationDate ? formatDate(formData.healthExpirationDate) : "Select"}
              </Text>
            </TouchableOpacity>
            {validationErrors.healthExpirationDate && (
              <Text style={styles.errorText}>{validationErrors.healthExpirationDate}</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  // Render Step 4 - Photos
  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Pet Photos</Text>
      <Text style={styles.stepSubtitle}>Show off your pet's best angles</Text>

      <TouchableOpacity style={styles.photoUploadBox} onPress={pickImages}>
        <LinearGradient
          colors={[Colors.primary + "20", Colors.primaryLight + "10"]}
          style={styles.photoUploadGradient}
        >
          <Ionicons name="camera-outline" size={48} color={Colors.primary} />
          <Text style={styles.photoUploadText}>Tap to add photos</Text>
          <Text style={styles.photoUploadHint}>
            {formData.petPhotos.length}/10 photos ({Math.max(0, 3 - formData.petPhotos.length)} more required)
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      {validationErrors.petPhotos && <Text style={styles.errorText}>{validationErrors.petPhotos}</Text>}

      {formData.petPhotos.length > 0 && (
        <View style={styles.photoGrid}>
          {formData.petPhotos.map((photo: any, index: number) => (
            <View key={index} style={styles.photoItem}>
              <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
              <TouchableOpacity
                style={styles.removePhotoBtn}
                onPress={() => removePhoto(index)}
              >
                <Ionicons name="close-circle" size={24} color={Colors.error} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryBadge,
                  formData.primaryPhotoIndex === index && styles.primaryBadgeActive,
                ]}
                onPress={() => setPrimaryPhoto(index)}
              >
                <Ionicons
                  name={formData.primaryPhotoIndex === index ? "star" : "star-outline"}
                  size={16}
                  color={formData.primaryPhotoIndex === index ? Colors.warning : Colors.white}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.helperText}>
        Tap the star to set your pet's primary profile photo
      </Text>
    </View>
  );

  // Render Step 5 - Preferences
  const renderStep5 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Partner Preferences</Text>
      <Text style={styles.stepSubtitle}>What are you looking for in a breeding partner?</Text>

      <View style={styles.optionalBanner}>
        <Ionicons name="sparkles-outline" size={20} color={Colors.warning} />
        <Text style={styles.optionalBannerText}>All preferences are optional</Text>
      </View>

      {/* Preferred Breed */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Preferred Breed</Text>
        <TouchableOpacity
          style={styles.selectInput}
          onPress={() => formData.species && setShowBreedSearch(true)}
        >
          <Text style={[styles.selectText, !formData.preferredBreed && styles.placeholder]}>
            {formData.preferredBreed || "Any breed"}
          </Text>
          <Ionicons name="chevron-down" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Age Range */}
      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Min Age (years)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 1"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={formData.minAge}
            onChangeText={(text) => setFormData({ ...formData, minAge: text })}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>Max Age (years)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={formData.maxAge}
            onChangeText={(text) => setFormData({ ...formData, maxAge: text })}
          />
        </View>
      </View>

      {/* Preferred Behaviors */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Preferred Behaviors</Text>
        <View style={styles.tagGrid}>
          {behaviorOptions.map((behavior) => (
            <TouchableOpacity
              key={behavior.label}
              style={[
                styles.tagButton,
                styles.tagButtonSmall,
                formData.partnerBehaviors.includes(behavior.label) && styles.tagButtonActive,
              ]}
              onPress={() => toggleSelection("partnerBehaviors", behavior.label)}
            >
              <Text
                style={[
                  styles.tagButtonText,
                  styles.tagButtonTextSmall,
                  formData.partnerBehaviors.includes(behavior.label) && styles.tagButtonTextActive,
                ]}
              >
                {behavior.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preferred Attributes */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Preferred Attributes</Text>
        <View style={styles.tagGrid}>
          {attributeOptions.map((attr) => (
            <TouchableOpacity
              key={attr.label}
              style={[
                styles.tagButton,
                styles.tagButtonSmall,
                formData.partnerAttributes.includes(attr.label) && styles.tagButtonActive,
              ]}
              onPress={() => toggleSelection("partnerAttributes", attr.label)}
            >
              <Text
                style={[
                  styles.tagButtonText,
                  styles.tagButtonTextSmall,
                  formData.partnerAttributes.includes(attr.label) && styles.tagButtonTextActive,
                ]}
              >
                {attr.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <LinearGradient colors={[...Gradients.header]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Pet</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Progress */}
      {renderProgressHeader()}

      {/* Form Content */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={handlePrev}
            disabled={isSubmitting}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, isSubmitting && styles.disabledBtn]}
          onPress={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.nextBtnText}>
                {currentStep === 5 ? "Submit" : "Continue"}
              </Text>
              <Ionicons
                name={currentStep === 5 ? "checkmark" : "arrow-forward"}
                size={20}
                color={Colors.white}
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Breed Search Modal */}
      <StyledModal
        visible={showBreedSearch}
        onClose={() => {
          setShowBreedSearch(false);
          setBreedSearchQuery("");
        }}
        title={`Select ${formData.species} Breed`}
        content={() => (
          <View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search breeds..."
              placeholderTextColor={Colors.textMuted}
              value={breedSearchQuery}
              onChangeText={setBreedSearchQuery}
              autoFocus
            />
            <ScrollView style={{ maxHeight: 300 }}>
              {getFilteredBreeds().map((breed) => (
                <TouchableOpacity
                  key={breed}
                  style={styles.breedOption}
                  onPress={() => {
                    setFormData({ ...formData, breed });
                    setShowBreedSearch(false);
                    setBreedSearchQuery("");
                    setValidationErrors((prev) => ({ ...prev, breed: "" }));
                  }}
                >
                  <Text style={styles.breedOptionText}>{breed}</Text>
                  {formData.breed === breed && (
                    <Ionicons name="checkmark" size={20} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      />

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
        maximumDate={datePickerField === "birthdate" || datePickerField === "healthGivenDate" ? new Date() : undefined}
      />

      <AlertModal visible={visible} {...alertOptions} onClose={hideAlert} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.white,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.bgPrimary,
    marginTop: -Spacing.md,
    borderTopLeftRadius: BorderRadius["2xl"],
    borderTopRightRadius: BorderRadius["2xl"],
  },
  progressStep: {
    alignItems: "center",
    flex: 1,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgTertiary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  progressDotCompleted: {
    backgroundColor: Colors.success,
  },
  progressLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: "center",
  },
  progressLabelActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  progressLine: {
    position: "absolute",
    top: 16,
    left: "60%",
    width: "80%",
    height: 2,
    backgroundColor: Colors.bgTertiary,
  },
  progressLineCompleted: {
    backgroundColor: Colors.success,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing["3xl"],
  },
  stepContent: {
    padding: Spacing.xl,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  optional: {
    fontWeight: "400",
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  inputError: {
    borderColor: Colors.error,
  },
  textArea: {
    height: 100,
    paddingTop: Spacing.md,
  },
  selectInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  smallText: {
    fontSize: 14,
  },
  placeholder: {
    color: Colors.textMuted,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  speciesRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  speciesCard: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xl,
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  speciesCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  speciesLabel: {
    marginTop: Spacing.sm,
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  speciesLabelActive: {
    color: Colors.white,
  },
  sexRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  sexCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  sexCardActive: {
    borderWidth: 2,
  },
  maleActive: {
    backgroundColor: "#E0F2FE",
    borderColor: "#0284C7",
  },
  femaleActive: {
    backgroundColor: "#FFE4E6",
    borderColor: "#BE123C",
  },
  sexLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  sexLabelActive: {
    color: Colors.white,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    fontStyle: "italic",
  },
  charCount: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "right",
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tagButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: Spacing.xs,
  },
  tagButtonSmall: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  tagButtonActive: {
    backgroundColor: Colors.primary,
  },
  tagButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.primary,
  },
  tagButtonTextSmall: {
    fontSize: 12,
  },
  tagButtonTextActive: {
    color: Colors.white,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: Colors.infoLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
    alignItems: "flex-start",
  },
  infoCardText: {
    flex: 1,
    fontSize: 13,
    color: Colors.info,
    lineHeight: 18,
  },
  uploadSection: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  uploadHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  uploadBox: {
    borderWidth: 2,
    borderColor: Colors.borderLight,
    borderStyle: "dashed",
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xl,
    alignItems: "center",
    backgroundColor: Colors.bgSecondary,
    marginBottom: Spacing.lg,
  },
  uploadedFile: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  uploadedFileName: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  uploadHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  photoUploadBox: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  photoUploadGradient: {
    paddingVertical: Spacing["3xl"],
    alignItems: "center",
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  photoUploadText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
    marginTop: Spacing.sm,
  },
  photoUploadHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  photoItem: {
    width: (SCREEN_WIDTH - Spacing.xl * 2 - Spacing.sm * 2) / 3,
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  photoThumb: {
    width: "100%",
    height: "100%",
  },
  removePhotoBtn: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  primaryBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 4,
  },
  primaryBadgeActive: {
    backgroundColor: Colors.primary,
  },
  optionalBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warningLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  optionalBannerText: {
    fontSize: 13,
    color: Colors.warning,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.md,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgTertiary,
    gap: Spacing.xs,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary,
    gap: Spacing.sm,
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.white,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  searchInput: {
    backgroundColor: Colors.bgTertiary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  breedOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  breedOptionText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
});
