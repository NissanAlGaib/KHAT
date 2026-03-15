import React, { useEffect, useMemo, useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import { Ionicons } from "@expo/vector-icons";

import AlertModal from "@/components/core/AlertModal";
import {
  SettingsLayout,
  SettingsSection,
  SettingsInput,
  SettingsButton,
} from "@/components/settings";
import { useAlert } from "@/hooks/useAlert";
import {
  getPet,
  updatePet,
  type PartnerPreferenceData,
  type PetDetails,
  type UpdatePetPayload,
} from "@/services/petService";

const AVAILABLE_BEHAVIORS = [
  "LOYAL",
  "SOCIAL",
  "SNIFF",
  "SLEEPY",
  "CALM",
  "BARK",
  "SLIM",
  "PLAYFUL",
];

const AVAILABLE_ATTRIBUTES = [
  "BLACK",
  "WHITE",
  "BROWN",
  "SPOTTED",
  "SHORT",
  "CURLY",
  "SLIM",
  "FLOPPY",
];

type ValidationErrors = Partial<Record<string, string>>;

function normalizeTextList(values?: string[] | null) {
  return Array.isArray(values)
    ? values.map((value) => String(value).trim()).filter(Boolean)
    : [];
}

function getPartnerPreference(pet: PetDetails): PartnerPreferenceData | null {
  if (pet.partner_preferences) return pet.partner_preferences;
  if (Array.isArray(pet.partnerPreferences) && pet.partnerPreferences.length > 0) {
    return pet.partnerPreferences[0] ?? null;
  }
  return null;
}

function SelectionChips({
  options,
  selected,
  onToggle,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2 px-4 pb-4">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <TouchableOpacity
            key={option}
            onPress={() => onToggle(option)}
            activeOpacity={0.85}
            className={`px-3 py-2 rounded-full border ${isSelected ? "bg-[#FF6B4A] border-[#FF6B4A]" : "bg-white border-[#E7E2DF]"}`}
          >
            <Text className={`text-xs font-semibold ${isSelected ? "text-white" : "text-[#7A7382]"}`}>
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <View className="mx-4 mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">{label}</Text>
      <View className="h-12 rounded-xl border border-gray-200 bg-[#F7F5F4] px-3 flex-row items-center justify-between">
        <Text className="text-base text-[#544F5B]">{value}</Text>
        <View className="flex-row items-center">
          <Ionicons name="lock-closed-outline" size={14} color="#9A93A0" />
          <Text className="text-xs text-[#9A93A0] ml-1">Locked</Text>
        </View>
      </View>
    </View>
  );
}

export default function EditPetProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const petId = Number(params.petId);
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pet, setPet] = useState<PetDetails | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [name, setName] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [microchip, setMicrochip] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [hasBeenBred, setHasBeenBred] = useState(false);
  const [breedingCount, setBreedingCount] = useState("");
  const [description, setDescription] = useState("");
  const [behaviors, setBehaviors] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<string[]>([]);
  const [behaviorTags, setBehaviorTags] = useState("");
  const [attributeTags, setAttributeTags] = useState("");
  const [preferredBreed, setPreferredBreed] = useState("");
  const [partnerBehaviors, setPartnerBehaviors] = useState<string[]>([]);
  const [partnerAttributes, setPartnerAttributes] = useState<string[]>([]);
  const [partnerBehaviorTags, setPartnerBehaviorTags] = useState("");
  const [partnerAttributeTags, setPartnerAttributeTags] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");

  useEffect(() => {
    if (!petId || Number.isNaN(petId)) {
      showAlert({
        title: "Error",
        message: "Missing pet ID.",
        type: "error",
        buttons: [{ text: "OK", onPress: () => router.back() }],
      });
      return;
    }

    const loadPet = async () => {
      try {
        setLoading(true);
        const petData = (await getPet(petId)) as PetDetails;
        const preference = getPartnerPreference(petData);

        setPet(petData);
        setName(petData.name || "");
        setSex((petData.sex || "male") as "male" | "female");
        setBirthdate(petData.birthdate ? new Date(petData.birthdate) : null);
        setMicrochip(petData.microchip_id || "");
        setHeight(String(petData.height ?? ""));
        setWeight(String(petData.weight ?? ""));
        setHasBeenBred(!!petData.has_been_bred);
        setBreedingCount(String(petData.breeding_count ?? ""));
        setDescription(petData.description || "");
        setBehaviors(normalizeTextList(petData.behaviors));
        setAttributes(normalizeTextList(petData.attributes));
        setPreferredBreed(preference?.preferred_breed || "");
        setPartnerBehaviors(normalizeTextList(preference?.preferred_behaviors));
        setPartnerAttributes(normalizeTextList(preference?.preferred_attributes));
        setMinAge(preference?.min_age != null ? String(preference.min_age) : "");
        setMaxAge(preference?.max_age != null ? String(preference.max_age) : "");
      } catch (error: any) {
        showAlert({
          title: "Error",
          message: error.response?.data?.message || "Failed to load pet profile.",
          type: "error",
          buttons: [{ text: "OK", onPress: () => router.back() }],
        });
      } finally {
        setLoading(false);
      }
    };

    loadPet();
  }, [petId, router, showAlert]);

  const matchingAvailabilityText = useMemo(() => {
    if (!pet) return "Unknown";
    if (pet.is_on_cooldown) return "Unavailable while on cooldown";
    return pet.is_available_for_matching ? "Available automatically" : "Unavailable automatically";
  }, [pet]);

  const toggleValue = (
    currentValues: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) => {
    setter(
      currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value],
    );
  };

  const validate = () => {
    const nextErrors: ValidationErrors = {};

    if (!name.trim()) nextErrors.name = "Pet name is required";
    if (!birthdate) nextErrors.birthdate = "Birthdate is required";
    if (!height.trim()) nextErrors.height = "Height is required";
    if (!weight.trim()) nextErrors.weight = "Weight is required";
    if (behaviors.length === 0) nextErrors.behaviors = "Select at least one behavior";
    if (attributes.length === 0) nextErrors.attributes = "Select at least one attribute";
    if (!description.trim()) nextErrors.description = "Description is required";
    if (hasBeenBred && !breedingCount.trim()) nextErrors.breedingCount = "Breeding count is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): UpdatePetPayload => ({
    name: name.trim(),
    sex,
    birthdate: birthdate ? dayjs(birthdate).format("YYYY-MM-DD") : "",
    microchip: microchip.trim() || undefined,
    height: height.trim(),
    weight: weight.trim(),
    has_been_bred: hasBeenBred,
    breeding_count: hasBeenBred ? breedingCount.trim() : undefined,
    behaviors,
    behavior_tags: behaviorTags.trim() || undefined,
    attributes,
    attribute_tags: attributeTags.trim() || undefined,
    description: description.trim(),
    preferred_breed: preferredBreed.trim() || undefined,
    partner_behaviors: partnerBehaviors.length > 0 ? partnerBehaviors : undefined,
    partner_behavior_tags: partnerBehaviorTags.trim() || undefined,
    partner_attributes: partnerAttributes.length > 0 ? partnerAttributes : undefined,
    partner_attribute_tags: partnerAttributeTags.trim() || undefined,
    min_age: minAge.trim() || undefined,
    max_age: maxAge.trim() || undefined,
  });

  const performSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      await updatePet(petId, buildPayload());
      showAlert({
        title: "Success",
        message: "Pet profile updated successfully.",
        type: "success",
        buttons: [{ text: "OK", onPress: () => router.replace(`/(pet)/pet-profile?petId=${petId}` as never) }],
      });
    } catch (error: any) {
      showAlert({
        title: "Error",
        message: error.response?.data?.message || "Failed to update pet profile.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (!validate()) return;

    showAlert({
      title: "Save Changes?",
      message: "Update this pet profile with your current edits?",
      type: "info",
      buttons: [
        { text: "Cancel", style: "cancel" },
        { text: "Save", onPress: performSave },
      ],
    });
  };

  if (loading) {
    return (
      <SettingsLayout headerTitle="Edit Pet Profile" scrollable={false}>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base text-[#7C7685]">Loading pet profile...</Text>
        </View>
        <AlertModal
          visible={visible}
          title={alertOptions.title}
          message={alertOptions.message}
          type={alertOptions.type}
          buttons={alertOptions.buttons}
          onClose={hideAlert}
        />
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout headerTitle="Edit Pet Profile">
      <View className="pt-4 pb-8">
        <SettingsSection title="Pet Basics">
          <SettingsInput
            label="Pet Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter pet name"
            error={errors.name}
          />

          <LockedField label="Species" value={pet?.species || "-"} />
          <LockedField label="Breed" value={pet?.breed || "-"} />

          <View className="mx-4 mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">Sex</Text>
            <View className="flex-row gap-3">
              {(["male", "female"] as const).map((value) => {
                const selected = sex === value;
                return (
                  <TouchableOpacity
                    key={value}
                    className={`flex-1 h-12 rounded-xl border items-center justify-center ${selected ? "bg-[#FF6B4A] border-[#FF6B4A]" : "bg-white border-gray-200"}`}
                    onPress={() => setSex(value)}
                    activeOpacity={0.85}
                  >
                    <Text className={`text-sm font-semibold ${selected ? "text-white" : "text-[#605A67]"}`}>
                      {value === "male" ? "Male" : "Female"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.85}>
            <SettingsInput
              label="Birthdate"
              value={birthdate ? dayjs(birthdate).format("MMM D, YYYY") : ""}
              editable={false}
              placeholder="Select birthdate"
              error={errors.birthdate}
              rightIcon={<Ionicons name="calendar-outline" size={18} color="#9CA3AF" />}
            />
          </TouchableOpacity>

          <SettingsInput
            label="Microchip ID"
            value={microchip}
            onChangeText={setMicrochip}
            placeholder="Optional"
          />

          <SettingsInput
            label="Height"
            value={height}
            onChangeText={setHeight}
            keyboardType="decimal-pad"
            placeholder="cm"
            error={errors.height}
          />

          <SettingsInput
            label="Weight"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            placeholder="kg"
            error={errors.weight}
          />

          <View className="mx-4 mb-4 rounded-xl border border-[#EDE7E4] bg-[#FFF8F5] px-4 py-3">
            <Text className="text-xs font-semibold uppercase tracking-wide text-[#A27867]">
              Matching Availability
            </Text>
            <Text className="mt-1 text-sm text-[#6E6678]">{matchingAvailabilityText}</Text>
            <Text className="mt-1 text-xs text-[#9B94A0]">
              Availability is automatic and depends on pet status and cooldown.
            </Text>
          </View>
        </SettingsSection>

        <SettingsSection title="Breeding History">
          <View className="mx-4 mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1.5 ml-1">Has Been Bred</Text>
            <View className="flex-row gap-3">
              {[
                { label: "No", value: false },
                { label: "Yes", value: true },
              ].map((item) => {
                const selected = hasBeenBred === item.value;
                return (
                  <TouchableOpacity
                    key={item.label}
                    className={`flex-1 h-12 rounded-xl border items-center justify-center ${selected ? "bg-[#FF6B4A] border-[#FF6B4A]" : "bg-white border-gray-200"}`}
                    onPress={() => setHasBeenBred(item.value)}
                    activeOpacity={0.85}
                  >
                    <Text className={`text-sm font-semibold ${selected ? "text-white" : "text-[#605A67]"}`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {hasBeenBred ? (
            <SettingsInput
              label="Breeding Count"
              value={breedingCount}
              onChangeText={setBreedingCount}
              keyboardType="number-pad"
              placeholder="How many times"
              error={errors.breedingCount}
            />
          ) : null}
        </SettingsSection>

        <SettingsSection title="About">
          <SelectionChips
            options={AVAILABLE_BEHAVIORS}
            selected={behaviors}
            onToggle={(value) => toggleValue(behaviors, setBehaviors, value)}
          />
          {errors.behaviors ? <Text className="text-red-500 text-xs mt-[-8] mb-3 ml-5">{errors.behaviors}</Text> : null}

          <SettingsInput
            label="Additional Behavior Tags"
            value={behaviorTags}
            onChangeText={setBehaviorTags}
            placeholder="Comma-separated custom behaviors"
          />

          <SelectionChips
            options={AVAILABLE_ATTRIBUTES}
            selected={attributes}
            onToggle={(value) => toggleValue(attributes, setAttributes, value)}
          />
          {errors.attributes ? <Text className="text-red-500 text-xs mt-[-8] mb-3 ml-5">{errors.attributes}</Text> : null}

          <SettingsInput
            label="Additional Attribute Tags"
            value={attributeTags}
            onChangeText={setAttributeTags}
            placeholder="Comma-separated custom attributes"
          />

          <SettingsInput
            label="About"
            value={description}
            onChangeText={setDescription}
            placeholder="Tell people about your pet"
            multiline
            numberOfLines={4}
            className="mb-4"
            style={{ height: Platform.OS === "ios" ? 96 : undefined, textAlignVertical: "top", paddingTop: 12 }}
            error={errors.description}
          />
        </SettingsSection>

        <SettingsSection title="Partner Preferences">
          <SettingsInput
            label="Preferred Breed"
            value={preferredBreed}
            onChangeText={setPreferredBreed}
            placeholder="Optional"
          />

          <SelectionChips
            options={AVAILABLE_BEHAVIORS}
            selected={partnerBehaviors}
            onToggle={(value) => toggleValue(partnerBehaviors, setPartnerBehaviors, value)}
          />

          <SettingsInput
            label="Additional Preferred Behaviors"
            value={partnerBehaviorTags}
            onChangeText={setPartnerBehaviorTags}
            placeholder="Comma-separated"
          />

          <SelectionChips
            options={AVAILABLE_ATTRIBUTES}
            selected={partnerAttributes}
            onToggle={(value) => toggleValue(partnerAttributes, setPartnerAttributes, value)}
          />

          <SettingsInput
            label="Additional Preferred Attributes"
            value={partnerAttributeTags}
            onChangeText={setPartnerAttributeTags}
            placeholder="Comma-separated"
          />

          <SettingsInput
            label="Minimum Preferred Age (months)"
            value={minAge}
            onChangeText={setMinAge}
            keyboardType="number-pad"
            placeholder="Optional"
          />

          <SettingsInput
            label="Maximum Preferred Age (months)"
            value={maxAge}
            onChangeText={setMaxAge}
            keyboardType="number-pad"
            placeholder="Optional"
          />
        </SettingsSection>

        <View className="mt-2">
          <SettingsButton title="Save Changes" onPress={handleSave} loading={saving} />
          <SettingsButton title="Cancel" onPress={() => router.back()} variant="outline" />
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={birthdate || new Date(2020, 0, 1)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={new Date()}
          onChange={(_, selectedDate) => {
            if (Platform.OS !== "ios") {
              setShowDatePicker(false);
            }
            if (selectedDate) {
              setBirthdate(selectedDate);
            }
          }}
        />
      )}

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </SettingsLayout>
  );
}