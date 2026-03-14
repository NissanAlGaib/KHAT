import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Baby,
  Package,
  Users,
  Shield,
  Calendar,
  Check,
  HelpCircle,
  FileText,
  Sparkles,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import dayjs from "dayjs";
import {
  ContractFormData,
  BreedingContract,
  createContract,
  updateContract,
  getContract,
} from "@/services/contractService";
import { getShooters, ShooterProfile } from "@/services/matchService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const TOTAL_STEPS = 5;

const STEP_META = [
  {
    title: "Compensation Type",
    subtitle: "What's the deal?",
    description:
      "Choose how you and your breeding partner will compensate each other.",
    icon: DollarSign,
  },
  {
    title: "Compensation Details",
    subtitle: "Let's talk numbers",
    description:
      "Set the specific amounts and terms for your agreed compensation.",
    icon: FileText,
  },
  {
    title: "Shooter (Optional)",
    subtitle: "Need a helping hand?",
    description:
      "A shooter is a professional who assists with the breeding process. Skip this if not needed!",
    icon: Users,
  },
  {
    title: "Collateral & Timeline",
    subtitle: "Stay protected",
    description:
      "Set security deposits and contract dates to protect both parties.",
    icon: Shield,
  },
  {
    title: "Review & Submit",
    subtitle: "Almost there!",
    description:
      "Review your contract details before sending it to your breeding partner.",
    icon: Check,
  },
];

interface TooltipProps {
  text: string;
  visible: boolean;
}

function Tooltip({ text, visible }: TooltipProps) {
  if (!visible) return null;
  return (
    <View className="bg-[#FF6B6B]/10 border border-[#FF6B6B]/20 rounded-xl p-3 mb-3">
      <View className="flex-row items-start">
        <HelpCircle size={14} color="#FF6B6B" />
        <Text className="text-xs text-gray-600 ml-2 flex-1">{text}</Text>
      </View>
    </View>
  );
}

export default function CreateContractScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const conversationId = params.conversationId as string;
  const contractId = params.contractId as string | undefined;
  const isEditing = !!contractId;

  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [existingContract, setExistingContract] =
    useState<BreedingContract | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [availableShooters, setAvailableShooters] = useState<ShooterProfile[]>(
    [],
  );
  const [loadingShooters, setLoadingShooters] = useState(false);
  const [showShooterSuggestions, setShowShooterSuggestions] = useState(false);
  const [shooterSelectionError, setShooterSelectionError] = useState<
    string | null
  >(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Form state
  const [formData, setFormData] = useState<ContractFormData>({
    shooter_name: "",
    shooter_user_id: undefined,
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
    custom_terms: "",
  });

  // Tooltip states
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // Fetch existing contract if editing
  useEffect(() => {
    if (isEditing && conversationId) {
      const fetchExisting = async () => {
        const data = await getContract(parseInt(conversationId));
        if (data) {
          setExistingContract(data);
          setFormData({
            shooter_name: data.shooter_name || "",
            shooter_user_id: data.shooter_user_id || undefined,
            shooter_payment: data.shooter_payment || undefined,
            shooter_location: data.shooter_location || "",
            shooter_conditions: data.shooter_conditions || "",
            end_contract_date: data.end_contract_date || "",
            include_monetary_amount: data.include_monetary_amount || false,
            monetary_amount: data.monetary_amount || undefined,
            share_offspring: data.share_offspring || false,
            offspring_split_type: data.offspring_split_type || undefined,
            offspring_split_value: data.offspring_split_value || undefined,
            offspring_selection_method:
              data.offspring_selection_method || undefined,
            include_goods_foods: data.include_goods_foods || false,
            goods_foods_value: data.goods_foods_value || undefined,
            collateral_total: data.collateral_total || 0,
            custom_terms: data.custom_terms || "",
          });
        }
        setLoading(false);
      };
      fetchExisting();
    }
  }, [isEditing, conversationId]);

  // Load verified shooter list for selection/autocomplete.
  useEffect(() => {
    let mounted = true;

    const fetchShooters = async () => {
      setLoadingShooters(true);
      try {
        const shooters = await getShooters();
        if (mounted) {
          setAvailableShooters(shooters);
        }
      } finally {
        if (mounted) {
          setLoadingShooters(false);
        }
      }
    };

    fetchShooters();

    return () => {
      mounted = false;
    };
  }, []);

  // Animate progress bar
  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (currentStep + 1) / TOTAL_STEPS,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [currentStep, progressAnim]);

  const animateStepTransition = (
    direction: "next" | "prev",
    callback: () => void,
  ) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const updateFormField = (field: keyof ContractFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateConfirm = (date: Date) => {
    updateFormField("end_contract_date", dayjs(date).format("YYYY-MM-DD"));
    setShowDatePicker(false);
  };

  const normalizedShooterName = useMemo(
    () => (formData.shooter_name || "").trim().toLowerCase(),
    [formData.shooter_name],
  );

  const filteredShooters = useMemo(() => {
    if (!normalizedShooterName) {
      return availableShooters.slice(0, 8);
    }

    return availableShooters
      .filter((shooter) =>
        shooter.name.toLowerCase().includes(normalizedShooterName),
      )
      .slice(0, 8);
  }, [availableShooters, normalizedShooterName]);

  const exactNameMatches = useMemo(() => {
    if (!normalizedShooterName) return [];
    return availableShooters.filter(
      (shooter) => shooter.name.trim().toLowerCase() === normalizedShooterName,
    );
  }, [availableShooters, normalizedShooterName]);

  const getInitials = (name: string) =>
    name
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");

  const selectShooter = (shooter: ShooterProfile) => {
    updateFormField("shooter_user_id", shooter.id);
    updateFormField("shooter_name", shooter.name);
    setShowShooterSuggestions(false);
    setShooterSelectionError(null);
  };

  const resolveShooterSelection = () => {
    const typedName = (formData.shooter_name || "").trim();

    if (!typedName) {
      updateFormField("shooter_user_id", undefined);
      setShooterSelectionError(null);
      return true;
    }

    if (formData.shooter_user_id) {
      const selectedShooter = availableShooters.find(
        (shooter) => shooter.id === formData.shooter_user_id,
      );

      if (selectedShooter) {
        if (typedName !== selectedShooter.name) {
          updateFormField("shooter_name", selectedShooter.name);
        }
        setShooterSelectionError(null);
        return true;
      }
    }

    if (availableShooters.length === 0) {
      setShooterSelectionError(
        "Unable to validate shooter names right now. Please try again in a moment.",
      );
      return false;
    }

    if (exactNameMatches.length === 1) {
      const matchedShooter = exactNameMatches[0];
      updateFormField("shooter_user_id", matchedShooter.id);
      updateFormField("shooter_name", matchedShooter.name);
      setShooterSelectionError(null);
      return true;
    }

    if (exactNameMatches.length > 1) {
      setShowShooterSuggestions(true);
      setShooterSelectionError(
        "Multiple verified shooters share this name. Select one below.",
      );
      return false;
    }

    setShowShooterSuggestions(true);
    setShooterSelectionError(
      "No verified shooter found with that exact name. Select from the list or leave it blank.",
    );
    return false;
  };

  const handleNext = () => {
    if (currentStep === 2 && !resolveShooterSelection()) {
      return;
    }

    if (currentStep < TOTAL_STEPS - 1) {
      animateStepTransition("next", () => setCurrentStep(currentStep + 1));
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      animateStepTransition("prev", () => setCurrentStep(currentStep - 1));
    }
  };

  const handleSubmit = async () => {
    if (!resolveShooterSelection()) {
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (existingContract) {
        result = await updateContract(existingContract.id, formData);
      } else {
        result = await createContract(parseInt(conversationId), formData);
      }

      if (result.success && result.data) {
        router.back();
      } else {
        console.error("Contract submission failed:", result.message);
      }
    } catch (error) {
      console.error("Error submitting contract:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const collateralPerOwner = (Number(formData.collateral_total) || 0) / 2;

  // ─── Compensation type card ───
  const CompensationOption = ({
    icon,
    emoji,
    label,
    description,
    active,
    onPress,
  }: {
    icon: React.ReactNode;
    label: string;
    description: string;
    active: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`rounded-2xl p-4 mb-3 border-2 ${
        active ? "border-[#FF6B6B] bg-[#FFF5F3]" : "border-gray-200 bg-white"
      }`}
    >
      <View className="flex-row items-center">
        <View
          className={`w-12 h-12 rounded-full items-center justify-center ${
            active ? "bg-[#FF6B6B]/20" : "bg-gray-100"
          }`}
        >
          {icon}
        </View>
        <View className="flex-1 ml-3">
          <Text
            className={`font-bold text-base ${active ? "text-[#FF6B6B]" : "text-gray-800"}`}
          >
            {label}
          </Text>
          <Text className="text-xs text-gray-500 mt-0.5">{description}</Text>
        </View>
        <View
          className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
            active ? "border-[#FF6B6B] bg-[#FF6B6B]" : "border-gray-300"
          }`}
        >
          {active && <Check size={14} color="white" />}
        </View>
      </View>
    </TouchableOpacity>
  );

  // ─── Step 1: Compensation Type ───
  const renderStep1 = () => (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text className="text-sm text-gray-500 mb-4">
        Select one or more ways you&apos;d like to be compensated. You can
        combine them!
      </Text>

      <CompensationOption
        icon={<DollarSign size={20} color="#FF6B6B" />}
        label="Money"
        description="One party pays the other a fixed amount"
        active={formData.include_monetary_amount || false}
        onPress={() =>
          updateFormField(
            "include_monetary_amount",
            !formData.include_monetary_amount,
          )
        }
      />

      <CompensationOption
        icon={<Baby size={20} color="#FF6B6B" />}
        label="Share Offspring"
        description="Split the puppies/kittens between both parties"
        active={formData.share_offspring || false}
        onPress={() =>
          updateFormField("share_offspring", !formData.share_offspring)
        }
      />

      <CompensationOption
        icon={<Package size={20} color="#FF6B6B" />}
        label="Goods & Food"
        description="Provide pet food, supplies, or other items"
        active={formData.include_goods_foods || false}
        onPress={() =>
          updateFormField("include_goods_foods", !formData.include_goods_foods)
        }
      />

      {!formData.include_monetary_amount &&
        !formData.share_offspring &&
        !formData.include_goods_foods && (
          <View className="bg-yellow-50 rounded-xl p-4 mt-2 border border-yellow-200">
            <Text className="text-yellow-800 text-sm text-center">
              Select at least one compensation type to proceed
            </Text>
          </View>
        )}
    </ScrollView>
  );

  // ─── Step 2: Compensation Details ───
  const renderStep2 = () => (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* Monetary Amount */}
      {formData.include_monetary_amount && (
        <View className="mb-5">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-full bg-[#FF6B6B]/10 items-center justify-center">
              <DollarSign size={16} color="#FF6B6B" />
            </View>
            <Text className="font-bold text-gray-800 ml-2 text-base">
              Money Payment
            </Text>
            <TouchableOpacity
              onPress={() =>
                setShowTooltip(showTooltip === "money" ? null : "money")
              }
              className="ml-2"
            >
              <HelpCircle size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <Tooltip
            text="This is the amount one party will pay the other. For example, the male dog owner might pay the female dog owner a stud fee."
            visible={showTooltip === "money"}
          />
          <Text className="text-xs text-gray-500 mb-2">
            How much will be paid?
          </Text>
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Text className="text-gray-500 font-bold mr-2">₱</Text>
            <TextInput
              className="flex-1 text-base text-gray-900"
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              value={formData.monetary_amount?.toString() || ""}
              onChangeText={(text) =>
                updateFormField(
                  "monetary_amount",
                  text ? parseFloat(text) : undefined,
                )
              }
              keyboardType="numeric"
            />
          </View>
        </View>
      )}

      {/* Offspring Sharing */}
      {formData.share_offspring && (
        <View className="mb-5">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-full bg-[#FF6B6B]/10 items-center justify-center">
              <Baby size={16} color="#FF6B6B" />
            </View>
            <Text className="font-bold text-gray-800 ml-2 text-base">
              Offspring Sharing
            </Text>
            <TouchableOpacity
              onPress={() =>
                setShowTooltip(showTooltip === "offspring" ? null : "offspring")
              }
              className="ml-2"
            >
              <HelpCircle size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <Tooltip
            text="Decide how to divide the litter between both owners. 'Percentage' means each owner gets a % of the total. 'Specific number' means a fixed count goes to each."
            visible={showTooltip === "offspring"}
          />

          <Text className="text-xs text-gray-500 mb-2">How to split?</Text>
          <View className="flex-row mb-3">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-l-2xl border-2 ${
                formData.offspring_split_type === "percentage"
                  ? "bg-[#FF6B6B] border-[#FF6B6B]"
                  : "bg-white border-gray-200"
              }`}
              onPress={() =>
                updateFormField("offspring_split_type", "percentage")
              }
            >
              <Text
                className={`text-center font-semibold text-sm ${
                  formData.offspring_split_type === "percentage"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                Percentage
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-r-2xl border-2 border-l-0 ${
                formData.offspring_split_type === "specific_number"
                  ? "bg-[#FF6B6B] border-[#FF6B6B]"
                  : "bg-white border-gray-200"
              }`}
              onPress={() =>
                updateFormField("offspring_split_type", "specific_number")
              }
            >
              <Text
                className={`text-center font-semibold text-sm ${
                  formData.offspring_split_type === "specific_number"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                🔢 Specific #
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            className="bg-gray-100 rounded-xl px-4 py-3 text-base mb-3"
            placeholder={
              formData.offspring_split_type === "percentage"
                ? "e.g. 50 (means 50% each)"
                : "e.g. 3 (puppies for you)"
            }
            placeholderTextColor="#9CA3AF"
            value={formData.offspring_split_value?.toString() || ""}
            onChangeText={(text) =>
              updateFormField(
                "offspring_split_value",
                text ? parseInt(text) : undefined,
              )
            }
            keyboardType="numeric"
          />

          <Text className="text-xs text-gray-500 mb-2">Who picks first?</Text>
          <View className="flex-row mb-2">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-l-2xl border-2 ${
                formData.offspring_selection_method === "first_pick"
                  ? "bg-[#FF6B6B] border-[#FF6B6B]"
                  : "bg-white border-gray-200"
              }`}
              onPress={() =>
                updateFormField("offspring_selection_method", "first_pick")
              }
            >
              <Text
                className={`text-center font-semibold text-sm ${
                  formData.offspring_selection_method === "first_pick"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                👆 First Pick
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-r-2xl border-2 border-l-0 ${
                formData.offspring_selection_method === "randomized"
                  ? "bg-[#FF6B6B] border-[#FF6B6B]"
                  : "bg-white border-gray-200"
              }`}
              onPress={() =>
                updateFormField("offspring_selection_method", "randomized")
              }
            >
              <Text
                className={`text-center font-semibold text-sm ${
                  formData.offspring_selection_method === "randomized"
                    ? "text-white"
                    : "text-gray-700"
                }`}
              >
                Randomized
              </Text>
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-gray-400 mt-1">
            First Pick = female (dam) owner chooses first. Randomized = fair
            random distribution.
          </Text>
        </View>
      )}

      {/* Goods & Food */}
      {formData.include_goods_foods && (
        <View className="mb-5">
          <View className="flex-row items-center mb-3">
            <View className="w-8 h-8 rounded-full bg-[#FF6B6B]/10 items-center justify-center">
              <Package size={16} color="#FF6B6B" />
            </View>
            <Text className="font-bold text-gray-800 ml-2 text-base">
              Goods & Food Value
            </Text>
            <TouchableOpacity
              onPress={() =>
                setShowTooltip(showTooltip === "goods" ? null : "goods")
              }
              className="ml-2"
            >
              <HelpCircle size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          <Tooltip
            text="Estimate the total value of pet supplies, food, or other items being exchanged as part of the deal."
            visible={showTooltip === "goods"}
          />
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Text className="text-gray-500 font-bold mr-2">₱</Text>
            <TextInput
              className="flex-1 text-base text-gray-900"
              placeholder="Estimated value"
              placeholderTextColor="#9CA3AF"
              value={formData.goods_foods_value?.toString() || ""}
              onChangeText={(text) =>
                updateFormField(
                  "goods_foods_value",
                  text ? parseFloat(text) : undefined,
                )
              }
              keyboardType="numeric"
            />
          </View>
        </View>
      )}

      {!formData.include_monetary_amount &&
        !formData.share_offspring &&
        !formData.include_goods_foods && (
          <View className="items-center justify-center py-12">
            <HelpCircle size={40} color="#9CA3AF" />
            <Text className="text-gray-400 text-center">
              Go back to Step 1 and select at least one compensation type
            </Text>
          </View>
        )}
    </ScrollView>
  );

  // ─── Step 3: Shooter (Optional) ───
  const renderStep3 = () => (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100">
        <View className="flex-row items-center mb-2">
          <HelpCircle size={18} color="#a16207" />
          <Text className="text-blue-800 font-bold text-sm">
            What&apos;s a Shooter?
          </Text>
        </View>
        <Text className="text-blue-700 text-xs leading-5">
          A shooter is a verified professional who assists with the breeding
          process. If you add a payment amount, your selected shooter will be
          invited after acceptance. If none is selected, the offer is open to
          verified shooters.
        </Text>
      </View>

      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-1">
          Preferred Shooter
        </Text>
        <Text className="text-xs text-gray-400 mb-2">
          Search and select a verified shooter. Leave blank to accept any
          verified shooter.
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base"
          placeholder="Search shooter name"
          placeholderTextColor="#9CA3AF"
          value={formData.shooter_name || ""}
          onFocus={() => setShowShooterSuggestions(true)}
          onChangeText={(text) => {
            updateFormField("shooter_name", text);
            updateFormField("shooter_user_id", undefined);
            setShooterSelectionError(null);
            setShowShooterSuggestions(true);
          }}
        />

        {!!formData.shooter_user_id && (
          <View className="mt-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <Text className="text-emerald-700 text-xs font-semibold">
              Selected verified shooter
            </Text>
          </View>
        )}

        {shooterSelectionError && (
          <Text className="text-red-600 text-xs mt-2">
            {shooterSelectionError}
          </Text>
        )}

        {loadingShooters ? (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color="#FF6B6B" />
            <Text className="text-xs text-gray-400 mt-2">
              Loading verified shooters...
            </Text>
          </View>
        ) : (
          showShooterSuggestions && (
            <View className="mt-2 border border-gray-200 rounded-xl bg-white overflow-hidden">
              {filteredShooters.length === 0 ? (
                <Text className="text-xs text-gray-400 px-3 py-3">
                  No matching verified shooters
                </Text>
              ) : (
                filteredShooters.map((shooter) => {
                  const isSelected = formData.shooter_user_id === shooter.id;

                  return (
                    <TouchableOpacity
                      key={shooter.id}
                      onPress={() => selectShooter(shooter)}
                      className={`px-3 py-3 border-b border-gray-100 flex-row items-center ${
                        isSelected ? "bg-emerald-50" : "bg-white"
                      }`}
                    >
                      {shooter.profile_image ? (
                        <Image
                          source={{ uri: shooter.profile_image }}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                          <Text className="text-xs font-semibold text-gray-600">
                            {getInitials(shooter.name) || "S"}
                          </Text>
                        </View>
                      )}

                      <View className="ml-3 flex-1">
                        <Text className="text-sm font-semibold text-gray-800">
                          {shooter.name}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {(shooter.experience_years ?? 0).toString()} yrs exp •{" "}
                          {shooter.rating
                            ? `${shooter.rating.toFixed(1)} rating`
                            : "No ratings yet"}
                        </Text>
                      </View>

                      {isSelected && (
                        <View className="bg-emerald-500 rounded-full px-2 py-1">
                          <Text className="text-[10px] font-semibold text-white">
                            Selected
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )
        )}

        {normalizedShooterName &&
          !formData.shooter_user_id &&
          exactNameMatches.length > 1 && (
            <View className="mt-3 p-3 rounded-xl border border-amber-200 bg-amber-50">
              <Text className="text-amber-800 text-xs font-semibold mb-2">
                Exact name matches found. Please choose one:
              </Text>
              {exactNameMatches.map((match) => (
                <TouchableOpacity
                  key={`exact-${match.id}`}
                  onPress={() => selectShooter(match)}
                  className="py-2"
                >
                  <Text className="text-amber-900 text-sm">{match.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
      </View>

      <View className="mb-4">
        <View className="flex-row items-center mb-1">
          <Text className="text-sm font-semibold text-gray-700">
            Shooter Payment
          </Text>
          <View className="bg-[#FF6B6B] rounded-full px-2 py-0.5 ml-2">
            <Text className="text-white text-[10px] font-bold">
              REQUIRED TO POST
            </Text>
          </View>
        </View>
        <Text className="text-xs text-gray-400 mb-2">
          This is how much both owners will pay the shooter
        </Text>
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Text className="text-gray-500 font-bold mr-2">₱</Text>
          <TextInput
            className="flex-1 text-base text-gray-900"
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            value={formData.shooter_payment?.toString() || ""}
            onChangeText={(text) =>
              updateFormField(
                "shooter_payment",
                text ? parseFloat(text) : undefined,
              )
            }
            keyboardType="numeric"
          />
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-1">
          Breeding Location
        </Text>
        <Text className="text-xs text-gray-400 mb-2">
          Where will the breeding take place?
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base"
          placeholder="e.g. Manila, Quezon City"
          placeholderTextColor="#9CA3AF"
          value={formData.shooter_location}
          onChangeText={(text) => updateFormField("shooter_location", text)}
        />
      </View>

      <View className="mb-4">
        <Text className="text-sm font-semibold text-gray-700 mb-1">
          Conditions for Shooter
        </Text>
        <Text className="text-xs text-gray-400 mb-2">
          Any specific requirements?
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base min-h-[80px]"
          placeholder="e.g. Must have experience with Bulldogs..."
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

      <TouchableOpacity
        onPress={() => {
          updateFormField("shooter_name", "");
          updateFormField("shooter_user_id", undefined);
          updateFormField("shooter_payment", undefined);
          updateFormField("shooter_location", "");
          updateFormField("shooter_conditions", "");
          setShooterSelectionError(null);
          setShowShooterSuggestions(false);
          handleNext();
        }}
        className="bg-gray-100 rounded-full py-3 items-center"
      >
        <Text className="text-gray-500 font-semibold">
          Skip — I don&apos;t need a shooter
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // ─── Step 4: Collateral & Timeline ───
  const renderStep4 = () => (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* End Date */}
      <View className="mb-5">
        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 rounded-full bg-[#FF6B6B]/10 items-center justify-center">
            <Calendar size={16} color="#FF6B6B" />
          </View>
          <Text className="font-bold text-gray-800 ml-2 text-base">
            Contract End Date
          </Text>
        </View>
        <Text className="text-xs text-gray-500 mb-2">
          When should this contract expire? This gives both parties a clear
          timeline.
        </Text>
        <TouchableOpacity
          className="bg-gray-100 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
          onPress={() => setShowDatePicker(true)}
        >
          <Text
            className={`text-base ${formData.end_contract_date ? "text-gray-900" : "text-gray-400"}`}
          >
            {formData.end_contract_date
              ? dayjs(formData.end_contract_date).format("MMMM D, YYYY")
              : "Pick a date"}
          </Text>
          <Calendar size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Collateral */}
      <View className="mb-5">
        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 rounded-full bg-[#FF6B6B]/10 items-center justify-center">
            <Shield size={16} color="#FF6B6B" />
          </View>
          <Text className="font-bold text-gray-800 ml-2 text-base">
            Security Collateral
          </Text>
          <TouchableOpacity
            onPress={() =>
              setShowTooltip(showTooltip === "collateral" ? null : "collateral")
            }
            className="ml-2"
          >
            <HelpCircle size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
        <Tooltip
          text="Collateral is a security deposit that both parties pay upfront. It protects against contract violations. The total is split equally — each owner pays half. It's fully refunded when the contract is fulfilled!"
          visible={showTooltip === "collateral"}
        />
        <Text className="text-xs text-gray-500 mb-2">
          Total collateral amount (split equally between both owners)
        </Text>
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Text className="text-gray-500 font-bold mr-2">₱</Text>
          <TextInput
            className="flex-1 text-base text-gray-900"
            placeholder="0.00"
            placeholderTextColor="#9CA3AF"
            value={formData.collateral_total?.toString() || ""}
            onChangeText={(text) => {
              const value = text ? parseFloat(text) : 0;
              updateFormField("collateral_total", isNaN(value) ? 0 : value);
            }}
            keyboardType="numeric"
          />
        </View>

        {/* Collateral breakdown */}
        {(formData.collateral_total ?? 0) > 0 && (
          <View className="bg-[#FFF5F3] rounded-xl p-4 mt-3 border border-[#FF6B6B]/10">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 text-sm">Total Collateral:</Text>
              <Text className="text-gray-900 font-bold text-sm">
                ₱
                {(Number(formData.collateral_total) || 0).toLocaleString(
                  "en-PH",
                  { minimumFractionDigits: 2 },
                )}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600 text-sm">Each Owner Pays:</Text>
              <Text className="text-[#FF6B6B] font-bold text-sm">
                ₱
                {collateralPerOwner.toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </View>
            <View className="border-t border-[#FF6B6B]/10 pt-2 mt-1">
              <Text className="text-xs text-gray-500">
                Fully refundable upon contract completion (5% platform fee
                deducted)
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Custom Terms */}
      <View className="mb-4">
        <View className="flex-row items-center mb-2">
          <View className="w-8 h-8 rounded-full bg-[#FF6B6B]/10 items-center justify-center">
            <FileText size={16} color="#FF6B6B" />
          </View>
          <Text className="font-bold text-gray-800 ml-2 text-base">
            Custom Terms (Optional)
          </Text>
        </View>
        <Text className="text-xs text-gray-500 mb-2">
          Add any additional agreements or conditions not covered above
        </Text>
        <TextInput
          className="bg-gray-100 rounded-xl px-4 py-3 text-base min-h-[100px]"
          placeholder="e.g. Both parties agree to share vet costs equally..."
          placeholderTextColor="#9CA3AF"
          value={formData.custom_terms}
          onChangeText={(text) => updateFormField("custom_terms", text)}
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
        <Text className="text-xs text-gray-400 text-right mt-1">
          {formData.custom_terms?.length || 0}/1000
        </Text>
      </View>
    </ScrollView>
  );

  // ─── Step 5: Review ───
  const renderStep5 = () => (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* Compensation Summary */}
      <View className="bg-white rounded-2xl border-2 border-gray-100 p-4 mb-4">
        <Text className="font-bold text-gray-800 text-base mb-3">
          Compensation
        </Text>
        {formData.include_monetary_amount && (
          <View className="flex-row justify-between mb-2 pb-2 border-b border-gray-50">
            <Text className="text-gray-500 text-sm">Money Payment</Text>
            <Text className="text-gray-900 font-semibold text-sm">
              ₱{formData.monetary_amount?.toLocaleString() || "0"}
            </Text>
          </View>
        )}
        {formData.share_offspring && (
          <>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500 text-sm">Offspring Split</Text>
              <Text className="text-gray-900 font-semibold text-sm">
                {formData.offspring_split_value}
                {formData.offspring_split_type === "percentage"
                  ? "%"
                  : " puppies"}
              </Text>
            </View>
            <View className="flex-row justify-between mb-2 pb-2 border-b border-gray-50">
              <Text className="text-gray-500 text-sm">Selection Method</Text>
              <Text className="text-gray-900 font-semibold text-sm">
                {formData.offspring_selection_method === "first_pick"
                  ? "👆 First Pick"
                  : "Randomized"}
              </Text>
            </View>
          </>
        )}
        {formData.include_goods_foods && (
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500 text-sm">Goods/Food Value</Text>
            <Text className="text-gray-900 font-semibold text-sm">
              ₱{formData.goods_foods_value?.toLocaleString() || "0"}
            </Text>
          </View>
        )}
        {!formData.include_monetary_amount &&
          !formData.share_offspring &&
          !formData.include_goods_foods && (
            <Text className="text-gray-400 text-sm italic">
              No compensation selected
            </Text>
          )}
      </View>

      {/* Shooter Summary */}
      {(formData.shooter_payment || formData.shooter_name) && (
        <View className="bg-white rounded-2xl border-2 border-gray-100 p-4 mb-4">
          <Text className="font-bold text-gray-800 text-base mb-3">
            Shooter
          </Text>
          {formData.shooter_name ? (
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500 text-sm">Preferred Shooter</Text>
              <Text className="text-gray-900 font-semibold text-sm">
                {formData.shooter_name}
              </Text>
            </View>
          ) : null}
          {formData.shooter_payment ? (
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500 text-sm">Payment</Text>
              <Text className="text-gray-900 font-semibold text-sm">
                ₱{formData.shooter_payment.toLocaleString()}
              </Text>
            </View>
          ) : null}
          {formData.shooter_location ? (
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-500 text-sm">Location</Text>
              <Text className="text-gray-900 font-semibold text-sm">
                {formData.shooter_location}
              </Text>
            </View>
          ) : null}
          {formData.shooter_conditions ? (
            <View className="mt-2 pt-2 border-t border-gray-100">
              <Text className="text-gray-500 text-xs mb-1">Conditions:</Text>
              <Text className="text-gray-700 text-sm">
                {formData.shooter_conditions}
              </Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Protection Summary */}
      <View className="bg-white rounded-2xl border-2 border-gray-100 p-4 mb-4">
        <Text className="font-bold text-gray-800 text-base mb-3">
          Protection
        </Text>
        {formData.end_contract_date ? (
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-500 text-sm">End Date</Text>
            <Text className="text-gray-900 font-semibold text-sm">
              {dayjs(formData.end_contract_date).format("MMMM D, YYYY")}
            </Text>
          </View>
        ) : null}
        <View className="flex-row justify-between mb-2">
          <Text className="text-gray-500 text-sm">Total Collateral</Text>
          <Text className="text-gray-900 font-semibold text-sm">
            ₱
            {(Number(formData.collateral_total) || 0).toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-gray-500 text-sm">Each Owner</Text>
          <Text className="text-[#FF6B6B] font-semibold text-sm">
            ₱
            {collateralPerOwner.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </Text>
        </View>
      </View>

      {/* Custom Terms */}
      {formData.custom_terms ? (
        <View className="bg-white rounded-2xl border-2 border-gray-100 p-4 mb-4">
          <Text className="font-bold text-gray-800 text-base mb-2">
            Custom Terms
          </Text>
          <Text className="text-gray-700 text-sm">{formData.custom_terms}</Text>
        </View>
      ) : null}

      {/* Standard Policies */}
      <View className="bg-gray-50 rounded-2xl p-4 mb-4">
        <Text className="font-bold text-gray-700 text-sm mb-3">
          Standard Policies (Auto-included)
        </Text>
        <View className="mb-3">
          <Text className="text-gray-600 font-semibold text-xs mb-1">
            Responsibility Policy
          </Text>
          <Text className="text-gray-500 text-xs leading-4">
            If a pet causes any incident, its owner is responsible for all
            related medical expenses including anti-rabies shots and treatments.
          </Text>
        </View>
        <View>
          <Text className="text-gray-600 font-semibold text-xs mb-1">
            Cancellation Policy
          </Text>
          <Text className="text-gray-500 text-xs leading-4">
            Both parties must agree to cancel. No response within 3 days =
            auto-cancel. Breach may result in collateral forfeiture.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      case 3:
        return renderStep4();
      case 4:
        return renderStep5();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B6B" />
      </SafeAreaView>
    );
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">
            {isEditing ? "Edit Contract" : "Create Contract"}
          </Text>
          <Text className="text-xs text-gray-500">
            Step {currentStep + 1} of {TOTAL_STEPS}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mx-4 mb-2">
        <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <Animated.View
            style={{ width: progressWidth }}
            className="h-full bg-[#FF6B6B] rounded-full"
          />
        </View>
        {/* Step dots */}
        <View className="flex-row justify-between mt-2">
          {STEP_META.map((step, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                if (i <= currentStep) {
                  animateStepTransition(i < currentStep ? "prev" : "next", () =>
                    setCurrentStep(i),
                  );
                }
              }}
              className="items-center"
              style={{ width: SCREEN_WIDTH / TOTAL_STEPS - 16 }}
            >
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  i < currentStep
                    ? "bg-[#FF6B6B]"
                    : i === currentStep
                      ? "bg-[#FF6B6B]/20 border-2 border-[#FF6B6B]"
                      : "bg-gray-100"
                }`}
              >
                {i < currentStep ? (
                  <Check size={14} color="white" />
                ) : (
                  <Text
                    className={`text-xs font-bold ${i === currentStep ? "text-[#FF6B6B]" : "text-gray-400"}`}
                  >
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text
                className={`text-[9px] mt-1 text-center ${
                  i <= currentStep
                    ? "text-[#FF6B6B] font-semibold"
                    : "text-gray-400"
                }`}
                numberOfLines={1}
              >
                {step.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Step Header */}
      <View className="px-5 py-4 bg-[#FFF5F3] mx-4 rounded-2xl mb-3">
        <Text className="text-xl font-bold text-gray-900">
          {STEP_META[currentStep].subtitle}
        </Text>
        <Text className="text-sm text-gray-600 mt-1">
          {STEP_META[currentStep].description}
        </Text>
      </View>

      {/* Step Content */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View
          style={{ flex: 1, opacity: fadeAnim, paddingHorizontal: 20 }}
        >
          {renderCurrentStep()}
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Navigation Buttons */}
      <View className="px-5 py-4 bg-white border-t border-gray-100">
        <View className="flex-row">
          {currentStep > 0 && (
            <TouchableOpacity
              onPress={handlePrev}
              className="flex-1 flex-row items-center justify-center py-3.5 mr-3 border-2 border-[#FF6B6B] rounded-full"
            >
              <ChevronLeft size={18} color="#FF6B6B" />
              <Text className="text-[#FF6B6B] font-bold ml-1">Back</Text>
            </TouchableOpacity>
          )}
          {currentStep < TOTAL_STEPS - 1 ? (
            <TouchableOpacity
              onPress={handleNext}
              className="flex-1 flex-row items-center justify-center py-3.5 bg-[#FF6B6B] rounded-full"
            >
              <Text className="text-white font-bold mr-1">Continue</Text>
              <ChevronRight size={18} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 flex-row items-center justify-center py-3.5 rounded-full ${
                isSubmitting ? "bg-gray-400" : "bg-[#FF6B6B]"
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Sparkles size={18} color="white" />
                  <Text className="text-white font-bold ml-2">
                    {isEditing ? "Update Contract" : "Send Contract"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Date Picker */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={() => setShowDatePicker(false)}
        minimumDate={new Date()}
      />
    </SafeAreaView>
  );
}
