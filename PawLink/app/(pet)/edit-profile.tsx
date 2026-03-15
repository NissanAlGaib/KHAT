import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";

import BubbleBackgroundRe from "@/components/app/BubbleBackground";
import AlertModal from "@/components/core/AlertModal";
import StyledModal from "@/components/core/StyledModal";
import { useAlert } from "@/hooks/useAlert";
import {
  getPet,
  updatePet,
  type PartnerPreferenceData,
  type PetDetails,
  type UpdatePetPayload,
} from "@/services/petService";

const DEFAULT_BEHAVIORS = [
  "LOYAL",
  "SOCIAL",
  "SNIFF",
  "SLEEPY",
  "CALM",
  "BARK",
  "SLIM",
  "PLAYFUL",
];

const DEFAULT_ATTRIBUTES = [
  "BLACK",
  "WHITE",
  "BROWN",
  "SPOTTED",
  "SHORT",
  "CURLY",
  "SLIM",
  "FLOPPY",
];

const BREED_OPTIONS = [
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
];

type ValidationErrors = Partial<Record<string, string>>;

function normalizeTags(values?: string[] | null): string[] {
  if (!Array.isArray(values)) return [];

  const cleaned = values
    .map((value) => String(value || "").trim().toUpperCase())
    .filter(Boolean);

  return Array.from(new Set(cleaned));
}

function mergeUnique(base: string[], additional: string[]): string[] {
  return Array.from(new Set([...base, ...additional]));
}

function getPartnerPreference(pet: PetDetails): PartnerPreferenceData | null {
  if (pet.partner_preferences) return pet.partner_preferences;
  if (Array.isArray(pet.partnerPreferences) && pet.partnerPreferences.length > 0) {
    return pet.partnerPreferences[0] ?? null;
  }
  return null;
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={16} color="#F07F58" />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function FieldInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  numberOfLines,
  error,
  editable = true,
  onPress,
  rightIcon,
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "number-pad" | "decimal-pad";
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  editable?: boolean;
  onPress?: () => void;
  rightIcon?: React.ReactNode;
}) {
  const isPressable = !!onPress;

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isPressable ? (
        <TouchableOpacity
          style={[styles.inputWrap, !editable && styles.inputWrapLocked, !!error && styles.inputWrapError]}
          onPress={onPress}
          activeOpacity={0.85}
        >
          <Text style={[styles.inputText, !value && styles.inputPlaceholder]}>
            {value || placeholder || ""}
          </Text>
          {rightIcon}
        </TouchableOpacity>
      ) : (
        <View style={[styles.inputWrap, !editable && styles.inputWrapLocked, !!error && styles.inputWrapError]}>
          <TextInput
            style={[
              styles.inputText,
              multiline && styles.inputTextMultiline,
              !editable && styles.inputTextLocked,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#AAA3AE"
            keyboardType={keyboardType || "default"}
            editable={editable}
            multiline={multiline}
            numberOfLines={numberOfLines}
            textAlignVertical={multiline ? "top" : "center"}
          />
          {rightIcon}
        </View>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

function LockedField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputWrap, styles.inputWrapLocked]}>
        <Text style={[styles.inputText, styles.inputTextLocked]}>{value || "-"}</Text>
        <View style={styles.lockPill}>
          <Ionicons name="lock-closed-outline" size={12} color="#958D9B" />
          <Text style={styles.lockPillText}>Locked</Text>
        </View>
      </View>
    </View>
  );
}

function TagSelection({
  label,
  options,
  selected,
  customValue,
  onCustomChange,
  onToggle,
  onAddCustom,
  error,
}: {
  label: string;
  options: string[];
  selected: string[];
  customValue: string;
  onCustomChange: (value: string) => void;
  onToggle: (value: string) => void;
  onAddCustom: () => void;
  error?: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={styles.tagsWrap}>
        {options.map((option) => {
          const isSelected = selected.includes(option);

          return (
            <TouchableOpacity
              key={option}
              onPress={() => onToggle(option)}
              activeOpacity={0.85}
              style={[styles.tagChip, isSelected && styles.tagChipSelected]}
            >
              <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.customTagRow}>
        <TextInput
          style={[styles.inputWrap, styles.customTagInput]}
          value={customValue}
          onChangeText={onCustomChange}
          placeholder="Add custom tag..."
          placeholderTextColor="#AAA3AE"
          onSubmitEditing={onAddCustom}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.addTagButton} onPress={onAddCustom} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default function EditPetProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawPetId = (params.id ?? params.petId) as string | undefined;
  const petId = Number(rawPetId);
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pet, setPet] = useState<PetDetails | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPreferredBreedModal, setShowPreferredBreedModal] = useState(false);

  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [microchip, setMicrochip] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [description, setDescription] = useState("");

  const [availableBehaviors, setAvailableBehaviors] = useState(DEFAULT_BEHAVIORS);
  const [availableAttributes, setAvailableAttributes] = useState(DEFAULT_ATTRIBUTES);
  const [availablePartnerBehaviors, setAvailablePartnerBehaviors] = useState(DEFAULT_BEHAVIORS);
  const [availablePartnerAttributes, setAvailablePartnerAttributes] = useState(DEFAULT_ATTRIBUTES);

  const [behaviors, setBehaviors] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<string[]>([]);
  const [behaviorTags, setBehaviorTags] = useState("");
  const [attributeTags, setAttributeTags] = useState("");

  const [preferredBreed, setPreferredBreed] = useState("Any Breed");
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

        const selectedBehaviors = normalizeTags(petData.behaviors);
        const selectedAttributes = normalizeTags(petData.attributes);
        const selectedPartnerBehaviors = normalizeTags(preference?.preferred_behaviors);
        const selectedPartnerAttributes = normalizeTags(preference?.preferred_attributes);

        setPet(petData);
        setName(petData.name || "");
        setBirthdate(petData.birthdate ? new Date(petData.birthdate) : null);
        setMicrochip(petData.microchip_id || "");
        setHeight(String(petData.height ?? ""));
        setWeight(String(petData.weight ?? ""));
        setDescription(petData.description || "");

        setBehaviors(selectedBehaviors);
        setAttributes(selectedAttributes);
        setPartnerBehaviors(selectedPartnerBehaviors);
        setPartnerAttributes(selectedPartnerAttributes);

        setAvailableBehaviors(mergeUnique(DEFAULT_BEHAVIORS, selectedBehaviors));
        setAvailableAttributes(mergeUnique(DEFAULT_ATTRIBUTES, selectedAttributes));
        setAvailablePartnerBehaviors(mergeUnique(DEFAULT_BEHAVIORS, selectedPartnerBehaviors));
        setAvailablePartnerAttributes(mergeUnique(DEFAULT_ATTRIBUTES, selectedPartnerAttributes));

        setPreferredBreed(preference?.preferred_breed || "Any Breed");
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
    return pet.is_available_for_matching
      ? "Available automatically"
      : "Unavailable automatically";
  }, [pet]);

  const toggleTag = (
    values: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
  ) => {
    setter(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    );
  };

  const addCustomTag = ({
    customValue,
    setCustomValue,
    selectedValues,
    setSelectedValues,
    availableValues,
    setAvailableValues,
  }: {
    customValue: string;
    setCustomValue: React.Dispatch<React.SetStateAction<string>>;
    selectedValues: string[];
    setSelectedValues: React.Dispatch<React.SetStateAction<string[]>>;
    availableValues: string[];
    setAvailableValues: React.Dispatch<React.SetStateAction<string[]>>;
  }) => {
    const normalized = customValue.trim().toUpperCase();
    if (!normalized) return;

    if (!availableValues.includes(normalized)) {
      setAvailableValues([...availableValues, normalized]);
    }

    if (!selectedValues.includes(normalized)) {
      setSelectedValues([...selectedValues, normalized]);
    }

    setCustomValue("");
  };

  const validate = () => {
    const nextErrors: ValidationErrors = {};

    if (!name.trim()) nextErrors.name = "Pet name is required";
    if (!birthdate) nextErrors.birthdate = "Birthdate is required";
    if (!height.trim()) nextErrors.height = "Height is required";
    if (!weight.trim()) nextErrors.weight = "Weight is required";
    if (behaviors.length === 0) nextErrors.behaviors = "Please select at least one behavior";
    if (attributes.length === 0) nextErrors.attributes = "Please select at least one attribute";
    if (!description.trim()) nextErrors.description = "Description is required";

    const minAgeNum = minAge.trim().length > 0 ? Number(minAge) : null;
    const maxAgeNum = maxAge.trim().length > 0 ? Number(maxAge) : null;

    if (minAgeNum !== null && (!Number.isFinite(minAgeNum) || minAgeNum < 0)) {
      nextErrors.minAge = "Minimum age must be a valid non-negative number";
    }

    if (maxAgeNum !== null && (!Number.isFinite(maxAgeNum) || maxAgeNum < 0)) {
      nextErrors.maxAge = "Maximum age must be a valid non-negative number";
    }

    if (
      minAgeNum !== null &&
      maxAgeNum !== null &&
      Number.isFinite(minAgeNum) &&
      Number.isFinite(maxAgeNum) &&
      maxAgeNum < minAgeNum
    ) {
      nextErrors.maxAge = "Maximum age must be greater than or equal to minimum age";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (): UpdatePetPayload => ({
    name: name.trim(),
    birthdate: birthdate ? dayjs(birthdate).format("YYYY-MM-DD") : "",
    microchip: microchip.trim() || undefined,
    height: height.trim(),
    weight: weight.trim(),
    behaviors,
    behavior_tags: behaviorTags.trim() || undefined,
    attributes,
    attribute_tags: attributeTags.trim() || undefined,
    description: description.trim(),
    preferred_breed:
      preferredBreed && preferredBreed !== "Any Breed"
        ? preferredBreed
        : undefined,
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
        buttons: [
          {
            text: "OK",
            onPress: () => router.replace(`/(pet)/pet-profile?id=${petId}` as never),
          },
        ],
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
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#FF8B66" />
          <Text style={styles.loadingText}>Loading pet details...</Text>
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

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroHeader}>
          <View style={StyleSheet.absoluteFillObject}>
            <BubbleBackgroundRe
              backgroundColor="#F98D67"
              bubbleColor="rgba(255, 192, 170, 0.32)"
              bigCount={3}
              smallCount={5}
            />
          </View>

          <View style={styles.heroTopRow}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => router.back()}>
              <Feather name="chevron-left" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.heroTitleWrap}>
              <Text style={styles.heroTitle}>Edit Pet Profile</Text>
              <Text style={styles.heroSubtitle}>{pet?.name || "Pet details"}</Text>
            </View>

            <View style={styles.iconSpacer} />
          </View>
        </View>

        <View style={styles.contentSheet}>
          <SectionCard icon="paw-outline" title="Pet Basics">
            <FieldInput
              label="Pet Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter pet name"
              error={errors.name}
            />

            <LockedField label="Species" value={pet?.species || "-"} />
            <LockedField label="Breed" value={pet?.breed || "-"} />
            <LockedField label="Sex" value={pet?.sex || "-"} />

            <FieldInput
              label="Birthdate"
              value={birthdate ? dayjs(birthdate).format("MMM D, YYYY") : ""}
              placeholder="Select birthdate"
              onPress={() => setShowDatePicker(true)}
              rightIcon={<Ionicons name="calendar-outline" size={18} color="#9A93A0" />}
              error={errors.birthdate}
            />

            <FieldInput
              label="Microchip ID"
              value={microchip}
              onChangeText={setMicrochip}
              placeholder="Optional"
            />

            <View style={styles.rowTwoCols}>
              <View style={styles.colItem}>
                <FieldInput
                  label="Height (cm)"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                  placeholder="e.g., 58"
                  error={errors.height}
                />
              </View>
              <View style={styles.colItem}>
                <FieldInput
                  label="Weight (kg)"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholder="e.g., 30"
                  error={errors.weight}
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Matching Availability</Text>
              <Text style={styles.infoText}>{matchingAvailabilityText}</Text>
              <Text style={styles.infoHint}>
                This is automatic and depends on pet status and cooldown.
              </Text>
            </View>
          </SectionCard>

          <SectionCard icon="leaf-outline" title="About">
            <TagSelection
              label="Behaviors"
              options={availableBehaviors}
              selected={behaviors}
              customValue={behaviorTags}
              onCustomChange={setBehaviorTags}
              onToggle={(value) => toggleTag(behaviors, setBehaviors, value)}
              onAddCustom={() =>
                addCustomTag({
                  customValue: behaviorTags,
                  setCustomValue: setBehaviorTags,
                  selectedValues: behaviors,
                  setSelectedValues: setBehaviors,
                  availableValues: availableBehaviors,
                  setAvailableValues: setAvailableBehaviors,
                })
              }
              error={errors.behaviors}
            />

            <TagSelection
              label="Attributes"
              options={availableAttributes}
              selected={attributes}
              customValue={attributeTags}
              onCustomChange={setAttributeTags}
              onToggle={(value) => toggleTag(attributes, setAttributes, value)}
              onAddCustom={() =>
                addCustomTag({
                  customValue: attributeTags,
                  setCustomValue: setAttributeTags,
                  selectedValues: attributes,
                  setSelectedValues: setAttributes,
                  availableValues: availableAttributes,
                  setAvailableValues: setAvailableAttributes,
                })
              }
              error={errors.attributes}
            />

            <FieldInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Tell us about your pet in 200 characters or less"
              multiline
              numberOfLines={4}
              error={errors.description}
            />
          </SectionCard>

          <SectionCard icon="heart-outline" title="Partner Preferences">
            <FieldInput
              label="Preferred Breed"
              value={preferredBreed || "Any Breed"}
              placeholder="Any Breed"
              onPress={() => setShowPreferredBreedModal(true)}
              rightIcon={<Ionicons name="chevron-down" size={18} color="#9A93A0" />}
            />

            <View style={styles.rowTwoCols}>
              <View style={styles.colItem}>
                <FieldInput
                  label="Min Partner Age"
                  value={minAge}
                  onChangeText={setMinAge}
                  keyboardType="number-pad"
                  placeholder="Optional"
                  error={errors.minAge}
                />
              </View>
              <View style={styles.colItem}>
                <FieldInput
                  label="Max Partner Age"
                  value={maxAge}
                  onChangeText={setMaxAge}
                  keyboardType="number-pad"
                  placeholder="Optional"
                  error={errors.maxAge}
                />
              </View>
            </View>

            <TagSelection
              label="Preferred Behaviors"
              options={availablePartnerBehaviors}
              selected={partnerBehaviors}
              customValue={partnerBehaviorTags}
              onCustomChange={setPartnerBehaviorTags}
              onToggle={(value) => toggleTag(partnerBehaviors, setPartnerBehaviors, value)}
              onAddCustom={() =>
                addCustomTag({
                  customValue: partnerBehaviorTags,
                  setCustomValue: setPartnerBehaviorTags,
                  selectedValues: partnerBehaviors,
                  setSelectedValues: setPartnerBehaviors,
                  availableValues: availablePartnerBehaviors,
                  setAvailableValues: setAvailablePartnerBehaviors,
                })
              }
            />

            <TagSelection
              label="Preferred Attributes"
              options={availablePartnerAttributes}
              selected={partnerAttributes}
              customValue={partnerAttributeTags}
              onCustomChange={setPartnerAttributeTags}
              onToggle={(value) => toggleTag(partnerAttributes, setPartnerAttributes, value)}
              onAddCustom={() =>
                addCustomTag({
                  customValue: partnerAttributeTags,
                  setCustomValue: setPartnerAttributeTags,
                  selectedValues: partnerAttributes,
                  setSelectedValues: setPartnerAttributes,
                  availableValues: availablePartnerAttributes,
                  setAvailableValues: setAvailablePartnerAttributes,
                })
              }
            />
          </SectionCard>

          <View style={styles.actionsWrap}>
            <TouchableOpacity
              style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.88}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => router.back()}
              activeOpacity={0.88}
              disabled={saving}
            >
              <Text style={styles.ghostBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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

      <StyledModal
        visible={showPreferredBreedModal}
        onClose={() => setShowPreferredBreedModal(false)}
        title="Select Preferred Breed"
        content={() => (
          <>
            {BREED_OPTIONS.map((breed) => (
              <TouchableOpacity
                key={breed}
                style={styles.modalOption}
                onPress={() => {
                  setPreferredBreed(breed);
                  setShowPreferredBreedModal(false);
                }}
              >
                <Text style={styles.modalOptionText}>{breed}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      />

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6EEEC",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#7B7486",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  heroHeader: {
    height: 184,
    overflow: "hidden",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.26)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconSpacer: {
    width: 34,
    height: 34,
  },
  heroTitleWrap: {
    alignItems: "center",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "700",
    lineHeight: 30,
  },
  heroSubtitle: {
    marginTop: 2,
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
  },
  contentSheet: {
    marginTop: -18,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#F8F1EF",
    paddingTop: 12,
    paddingHorizontal: 12,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEE8E6",
    backgroundColor: "#FFFFFF",
    padding: 12,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF0E8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#2F2A39",
  },
  fieldBlock: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#756E7E",
    marginBottom: 6,
    marginLeft: 2,
    letterSpacing: 0.2,
  },
  inputWrap: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7DFDD",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputWrapLocked: {
    backgroundColor: "#F6F2F1",
  },
  inputWrapError: {
    borderColor: "#F87171",
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: "#3A3347",
    padding: 0,
  },
  inputTextLocked: {
    color: "#6F687A",
  },
  inputTextMultiline: {
    minHeight: 84,
  },
  inputPlaceholder: {
    color: "#AAA3AE",
  },
  lockPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECE8EE",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  lockPillText: {
    marginLeft: 4,
    fontSize: 10,
    color: "#958D9B",
    fontWeight: "700",
  },
  rowTwoCols: {
    flexDirection: "row",
    gap: 8,
  },
  colItem: {
    flex: 1,
  },
  infoBox: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F3DED4",
    backgroundColor: "#FFF7F3",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#C7724D",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoText: {
    marginTop: 2,
    fontSize: 13,
    color: "#6A6175",
    fontWeight: "600",
  },
  infoHint: {
    marginTop: 2,
    fontSize: 11,
    color: "#978F9D",
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagChip: {
    borderRadius: 999,
    backgroundColor: "#F8F3F1",
    borderWidth: 1,
    borderColor: "#E9DFDA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 6,
    marginBottom: 6,
  },
  tagChipSelected: {
    backgroundColor: "#FF8C67",
    borderColor: "#FF8C67",
  },
  tagText: {
    fontSize: 11,
    color: "#7A7381",
    fontWeight: "700",
  },
  tagTextSelected: {
    color: "#FFFFFF",
  },
  customTagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  customTagInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  addTagButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FF8A66",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  errorText: {
    marginTop: 4,
    marginLeft: 2,
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "600",
  },
  actionsWrap: {
    marginTop: 2,
    marginBottom: 8,
  },
  primaryBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: "#FF8A66",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  primaryBtnDisabled: {
    opacity: 0.65,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  ghostBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7DFDD",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtnText: {
    color: "#766F7E",
    fontSize: 14,
    fontWeight: "700",
  },
  modalOption: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0EAE8",
    paddingVertical: 12,
  },
  modalOptionText: {
    color: "#3B3547",
    fontSize: 14,
    fontWeight: "500",
  },
});
