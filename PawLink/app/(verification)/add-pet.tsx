import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

export default function AddPetScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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
    if (currentStep === 6) {
      setShowConfirmModal(true);
    } else {
      setCurrentStep(currentStep + 1);
    }
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

  const handleSubmit = () => {
    setShowConfirmModal(false);
    // TODO: Submit pet data to backend
    console.log("Pet data:", formData);
    setShowSuccessModal(true);
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
        setFormData({ ...formData, [field]: result.assets[0] });
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
          vaccinationRecord: null,
          clinicName: "",
          veterinarianName: "",
          givenDate: "",
          expirationDate: "",
        },
      ],
    });
  };

  const toggleBehavior = (behavior: string) => {
    const behaviors = formData.behaviors.includes(behavior)
      ? formData.behaviors.filter((b) => b !== behavior)
      : [...formData.behaviors, behavior];
    setFormData({ ...formData, behaviors });
  };

  const toggleAttribute = (attribute: string) => {
    const attributes = formData.attributes.includes(attribute)
      ? formData.attributes.filter((a) => a !== attribute)
      : [...formData.attributes, attribute];
    setFormData({ ...formData, attributes });
  };

  const togglePartnerBehavior = (behavior: string) => {
    const partnerBehaviors = formData.partnerBehaviors.includes(behavior)
      ? formData.partnerBehaviors.filter((b) => b !== behavior)
      : [...formData.partnerBehaviors, behavior];
    setFormData({ ...formData, partnerBehaviors });
  };

  const togglePartnerAttribute = (attribute: string) => {
    const partnerAttributes = formData.partnerAttributes.includes(attribute)
      ? formData.partnerAttributes.filter((a) => a !== attribute)
      : [...formData.partnerAttributes, attribute];
    setFormData({ ...formData, partnerAttributes });
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
            className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
            placeholder="Enter"
            value={formData.breedingCount}
            onChangeText={(text) =>
              setFormData({ ...formData, breedingCount: text })
            }
            keyboardType="numeric"
          />
        </View>
      )}

      {/* Name */}
      <View className="mb-4">
        <Text className="text-base font-semibold text-black mb-2">Name</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
          placeholder="Enter name"
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
        />
      </View>

      {/* Microchip (Optional) */}
      <View className="mb-4">
        <Text className="text-base font-semibold text-black mb-2">
          Microchip (OPTIONAL)
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
          placeholder="Enter Microchip"
          value={formData.microchip}
          onChangeText={(text) => setFormData({ ...formData, microchip: text })}
        />
      </View>

      {/* Species and Breed Row */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-base font-semibold text-black mb-2">
            Species
          </Text>
          <View className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row items-center justify-between">
            <Text className="text-gray-400">choose</Text>
            <Feather name="chevron-down" size={20} color="gray" />
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-black mb-2">Breed</Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
            placeholder="Enter breed"
            value={formData.breed}
            onChangeText={(text) => setFormData({ ...formData, breed: text })}
          />
        </View>
      </View>

      {/* Sex and Birthdate Row */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-base font-semibold text-black mb-2">Sex</Text>
          <View className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row items-center justify-between">
            <Text className="text-gray-400">choose</Text>
            <Feather name="chevron-down" size={20} color="gray" />
          </View>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-black mb-2">
            Birthdate
          </Text>
          <View className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row items-center justify-between">
            <Text className="text-gray-400">dd/mm/yy</Text>
            <Feather name="calendar" size={20} color="gray" />
          </View>
        </View>
      </View>

      {/* Height and Weight Row */}
      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Text className="text-base font-semibold text-black mb-2">
            Height(cm)
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
            placeholder="Enter Height"
            value={formData.height}
            onChangeText={(text) => setFormData({ ...formData, height: text })}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-black mb-2">
            Weight (lbs)
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
            placeholder="Enter Weight"
            value={formData.weight}
            onChangeText={(text) => setFormData({ ...formData, weight: text })}
            keyboardType="numeric"
          />
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
          {[
            "LOYAL",
            "SOCIAL",
            "SNIFF",
            "SLEEPY",
            "CALM",
            "BARK",
            "SLIM",
            "PLAYFUL",
          ].map((behavior) => (
            <TouchableOpacity
              key={behavior}
              className={`px-4 py-2 rounded-full border ${
                formData.behaviors.includes(behavior)
                  ? "bg-[#FF6B4A] border-[#FF6B4A]"
                  : "bg-white border-gray-300"
              }`}
              onPress={() => toggleBehavior(behavior)}
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
        <Text className="text-xs text-gray-500 mb-2">
          Add tags to describe your pet (e.g., SMALL, BROWN, FRIENDLY)
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
          placeholder="Enter"
          value={formData.behaviorTags}
          onChangeText={(text) =>
            setFormData({ ...formData, behaviorTags: text })
          }
        />
      </View>

      {/* Attributes */}
      <View className="mb-4">
        <Text className="text-base font-semibold text-black mb-2">
          Attributes:
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {[
            "BLACK",
            "WHITE",
            "BROWN",
            "SPOTTED",
            "SHORT",
            "CURLY",
            "SLIM",
            "FLOPPY",
          ].map((attribute) => (
            <TouchableOpacity
              key={attribute}
              className={`px-4 py-2 rounded-full border ${
                formData.attributes.includes(attribute)
                  ? "bg-[#FF6B4A] border-[#FF6B4A]"
                  : "bg-white border-gray-300"
              }`}
              onPress={() => toggleAttribute(attribute)}
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
        <Text className="text-xs text-gray-500 mb-2">
          Add tags to describe your pet (e.g., SMALL, BROWN, FRIENDLY)
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
          placeholder="Enter"
          value={formData.attributeTags}
          onChangeText={(text) =>
            setFormData({ ...formData, attributeTags: text })
          }
        />
      </View>

      {/* Description */}
      <View className="mb-4">
        <Text className="text-base font-semibold text-black mb-2">
          Description
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 bg-white h-24"
          placeholder="Enter Description"
          value={formData.description}
          onChangeText={(text) =>
            setFormData({ ...formData, description: text })
          }
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text className="text-xs text-gray-400 text-right mt-1">0/200</Text>
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
            className="border border-gray-300 rounded-lg px-4 py-6 bg-gray-50"
            onPress={() => pickDocument("rabiesVaccinationRecord")}
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
        </View>

        {/* Clinic Name */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-black mb-2">
            Clinic Name
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
            placeholder="Enter name"
            value={formData.rabiesClinicName}
            onChangeText={(text) =>
              setFormData({ ...formData, rabiesClinicName: text })
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
            value={formData.rabiesVeterinarianName}
            onChangeText={(text) =>
              setFormData({ ...formData, rabiesVeterinarianName: text })
            }
          />
        </View>

        {/* Given Date and Expiration Date */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-base font-semibold text-black mb-2">
              Given Date
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row items-center justify-between">
              <Text className="text-gray-400">dd/mm/yy</Text>
              <Feather name="calendar" size={20} color="gray" />
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-black mb-2">
              Expiration Date
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row items-center justify-between">
              <Text className="text-gray-400">dd/mm/yy</Text>
              <Feather name="calendar" size={20} color="gray" />
            </View>
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
            className="border border-gray-300 rounded-lg px-4 py-6 bg-gray-50"
            onPress={() => pickDocument("dhppVaccinationRecord")}
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
        </View>

        {/* Clinic Name */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-black mb-2">
            Clinic Name
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
            placeholder="Enter name"
            value={formData.dhppClinicName}
            onChangeText={(text) =>
              setFormData({ ...formData, dhppClinicName: text })
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
            value={formData.dhppVeterinarianName}
            onChangeText={(text) =>
              setFormData({ ...formData, dhppVeterinarianName: text })
            }
          />
        </View>

        {/* Given Date and Expiration Date */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-base font-semibold text-black mb-2">
              Given Date
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row items-center justify-between">
              <Text className="text-gray-400">dd/mm/yy</Text>
              <Feather name="calendar" size={20} color="gray" />
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-black mb-2">
              Expiration Date
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row items-center justify-between">
              <Text className="text-gray-400">dd/mm/yy</Text>
              <Feather name="calendar" size={20} color="gray" />
            </View>
          </View>
        </View>
      </View>

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
            className="border border-gray-300 rounded-lg px-4 py-6 bg-gray-50"
            onPress={() => pickDocument("healthCertificate")}
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
        </View>

        {/* Clinic Name */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-black mb-2">
            Clinic Name
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
            placeholder="Enter name"
            value={formData.healthClinicName}
            onChangeText={(text) =>
              setFormData({ ...formData, healthClinicName: text })
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
            value={formData.healthVeterinarianName}
            onChangeText={(text) =>
              setFormData({ ...formData, healthVeterinarianName: text })
            }
          />
        </View>

        {/* Given Date and Expiration Date */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-base font-semibold text-black mb-2">
              Given Date
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row items-center justify-between">
              <Text className="text-gray-400">dd/mm/yy</Text>
              <Feather name="calendar" size={20} color="gray" />
            </View>
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-black mb-2">
              Expiration Date
            </Text>
            <View className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row items-center justify-between">
              <Text className="text-gray-400">dd/mm/yy</Text>
              <Feather name="calendar" size={20} color="gray" />
            </View>
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
        className="border-2 border-dashed border-gray-300 rounded-lg py-20 bg-gray-50 items-center justify-center mb-4"
        onPress={pickImages}
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

      {/* Display selected photos */}
      {formData.petPhotos.length > 0 && (
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
        <View className="border border-gray-300 rounded-lg px-4 py-3 bg-white flex-row items-center justify-between">
          <Text className="text-gray-400">Select</Text>
          <Feather name="chevron-down" size={20} color="gray" />
        </View>
      </View>

      {/* Partner Preferences (Behavior) */}
      <View className="mb-4">
        <Text className="text-base font-semibold text-black mb-2">
          Partner Preferences
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {[
            "LOYAL",
            "SOCIAL",
            "SNIFF",
            "SLEEPY",
            "CALM",
            "BARK",
            "SLIM",
            "PLAYFUL",
          ].map((behavior) => (
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
          Add tags to describe your pet (e.g., SMALL, BROWN, FRIENDLY)
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
          placeholder="Enter"
          value={formData.partnerBehaviorTags}
          onChangeText={(text) =>
            setFormData({ ...formData, partnerBehaviorTags: text })
          }
        />
      </View>

      {/* Partner Preferences (Attributes) */}
      <View className="mb-4">
        <Text className="text-base font-semibold text-black mb-2">
          Partner Preferences
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {[
            "LOYAL",
            "SOCIAL",
            "SNIFF",
            "SLEEPY",
            "CALM",
            "BARK",
            "SLIM",
            "PLAYFUL",
          ].map((attribute) => (
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
          Add tags to describe your pet (e.g., SMALL, BROWN, FRIENDLY)
        </Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
          placeholder="Enter"
          value={formData.partnerAttributeTags}
          onChangeText={(text) =>
            setFormData({ ...formData, partnerAttributeTags: text })
          }
        />
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
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              value={formData.minAge}
              onChangeText={(text) =>
                setFormData({ ...formData, minAge: text })
              }
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-gray-600 mb-2">max age</Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
              value={formData.maxAge}
              onChangeText={(text) =>
                setFormData({ ...formData, maxAge: text })
              }
              keyboardType="numeric"
            />
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
            >
              <Text className="text-white text-center font-semibold text-base">
                Prev
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            className="flex-1 bg-[#FF6B4A] rounded-lg py-4"
            onPress={handleNext}
          >
            <Text className="text-white text-center font-semibold text-base">
              Next
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
            <TouchableOpacity onPress={handleSkip}>
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
    </SafeAreaView>
  );
}
