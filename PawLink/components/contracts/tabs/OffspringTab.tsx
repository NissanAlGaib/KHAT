import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import {
  Baby,
  Plus,
  Trash2,
  Users,
  Shuffle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  User,
  Award,
} from "lucide-react-native";
import dayjs from "dayjs";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  BreedingContract,
  LitterData,
  Offspring,
  OffspringData,
  OffspringInputData,
  AllocationSummaryData,
  OffspringAllocation,
  getOffspring,
  storeOffspring,
  allocateOffspring,
  autoAllocateOffspring,
  getOffspringAllocationSummary,
  completeMatch,
} from "@/services/contractService";

interface OffspringTabProps {
  contract: BreedingContract;
  onContractUpdated: () => void;
}

type SubView = "record" | "allocate" | "complete";

export default function ContractOffspringTab({ contract, onContractUpdated }: OffspringTabProps) {
  const [activeView, setActiveView] = useState<SubView>("record");
  const [isLoading, setIsLoading] = useState(false);
  const [litterData, setLitterData] = useState<LitterData | null>(null);
  const [allocationData, setAllocationData] = useState<AllocationSummaryData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recording form state
  const [birthDate, setBirthDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [litterNotes, setLitterNotes] = useState("");
  const [offspring, setOffspring] = useState<OffspringData[]>([
    { sex: "male", color: "", status: "alive" },
  ]);

  // Allocation state
  const [manualAllocations, setManualAllocations] = useState<Record<number, number | null>>({});

  const { visible: alertVisible, alertOptions, showAlert, hideAlert } = useAlert();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [litter, allocSummary] = await Promise.all([
        getOffspring(contract.id),
        getOffspringAllocationSummary(contract.id).then(r => r.data || null).catch(() => null),
      ]);
      setLitterData(litter);
      if (allocSummary) setAllocationData(allocSummary);
      // Auto-switch view based on state
      if (litter && litter.offspring.length > 0) {
        if (allocSummary?.is_fully_allocated) {
          setActiveView("complete");
        } else {
          setActiveView("allocate");
        }
      }
    } catch (error) {
      console.error("Error fetching offspring data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [contract.id]);

  useEffect(() => {
    if (contract.breeding_status === "completed" && contract.has_offspring) {
      fetchData();
    }
  }, [contract.breeding_status, contract.has_offspring, fetchData]);

  // ─── Not Available Guard ───
  if (contract.breeding_status !== "completed" || !contract.has_offspring) {
    return (
      <View className="items-center justify-center py-16 px-6">
        <Text className="text-4xl mb-3">🐾</Text>
        <Text className="text-gray-800 font-bold text-lg mb-2 text-center">Offspring Not Available</Text>
        <Text className="text-gray-500 text-sm text-center">
          {contract.breeding_status === "completed" && !contract.has_offspring
            ? "No offspring were reported for this breeding."
            : "Breeding must be marked as complete with offspring before you can record them."}
        </Text>
      </View>
    );
  }

  // ─── Add/Remove Offspring Row ───
  const addOffspring = () => setOffspring(prev => [...prev, { sex: "male", color: "", status: "alive" }]);
  const removeOffspring = (index: number) => setOffspring(prev => prev.filter((_, i) => i !== index));
  const updateOffspring = (index: number, field: keyof OffspringData, value: any) => {
    setOffspring(prev => prev.map((o, i) => i === index ? { ...o, [field]: value } : o));
  };

  // ─── Submit Litter ───
  const handleSubmitLitter = async () => {
    if (offspring.length === 0) {
      showAlert({ title: "Required", message: "Please add at least one offspring", type: "error" });
      return;
    }

    setIsSubmitting(true);
    try {
      const data: OffspringInputData = {
        birth_date: birthDate,
        notes: litterNotes || undefined,
        offspring: offspring,
      };
      const result = await storeOffspring(contract.id, data);
      if (result.success) {
        showAlert({ title: "Litter Recorded! 🐾", message: `${offspring.length} offspring have been recorded.`, type: "success" });
        fetchData();
        onContractUpdated();
      } else {
        showAlert({ title: "Error", message: result.message || "Failed to record offspring", type: "error" });
      }
    } catch (error) {
      showAlert({ title: "Error", message: "Failed to record offspring", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Auto Allocate ───
  const handleAutoAllocate = async () => {
    showAlert({
      title: "Auto-Allocate 🎲",
      message: "This will distribute offspring based on the contract's split terms. Continue?",
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Auto-Allocate",
          style: "default",
          onPress: async () => {
            hideAlert();
        setIsSubmitting(true);
        try {
          const result = await autoAllocateOffspring(contract.id);
          if (result.success) {
            showAlert({ title: "Allocated! 🎉", message: "Offspring have been distributed.", type: "success" });
            fetchData();
          } else {
            showAlert({ title: "Error", message: result.message || "Failed to auto-allocate", type: "error" });
          }
        } catch (error) {
          showAlert({ title: "Error", message: "Failed to auto-allocate", type: "error" });
        } finally {
          setIsSubmitting(false);
        }
          },
        },
      ],
    });
  };

  // ─── Manual Allocate ───
  const handleManualAllocate = async () => {
    const allocations: OffspringAllocation[] = Object.entries(manualAllocations)
      .filter(([_, ownerId]) => ownerId !== null)
      .map(([offspringId, ownerId]) => ({
        offspring_id: Number(offspringId),
        assigned_to: ownerId!,
      }));

    if (allocations.length === 0) {
      showAlert({ title: "No Changes", message: "Please assign at least one offspring to an owner.", type: "warning" });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await allocateOffspring(contract.id, allocations);
      if (result.success) {
        showAlert({ title: "Saved! ✅", message: "Offspring allocations updated.", type: "success" });
        setManualAllocations({});
        fetchData();
      } else {
        showAlert({ title: "Error", message: result.message || "Failed to allocate", type: "error" });
      }
    } catch (error) {
      showAlert({ title: "Error", message: "Failed to allocate offspring", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Complete Match ───
  const handleCompleteMatch = () => {
    showAlert({
      title: "Complete Match? 🏁",
      message: "This will archive the conversation and finalize the breeding contract. This action cannot be undone.",
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete Match",
          style: "default",
          onPress: async () => {
            hideAlert();
        setIsSubmitting(true);
        try {
          const result = await completeMatch(contract.id);
          if (result.success) {
            showAlert({ title: "Match Complete! 🎉🎊", message: "The breeding match has been completed successfully!", type: "success" });
            onContractUpdated();
          } else {
            showAlert({ title: "Error", message: result.message || "Failed to complete match", type: "error" });
          }
        } catch (error) {
          showAlert({ title: "Error", message: "Failed to complete match", type: "error" });
        } finally {
          setIsSubmitting(false);
        }
          },
        },
      ],
    });
  };

  if (isLoading) {
    return (
      <View className="items-center py-12">
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text className="text-gray-500 text-sm mt-2">Loading offspring data...</Text>
      </View>
    );
  }

  const hasLitter = litterData && litterData.offspring.length > 0;

  return (
    <View className="px-4 pt-3">
      {/* View Switcher (only show if litter exists) */}
      {hasLitter && (
        <View className="flex-row bg-gray-100 rounded-full p-1 mb-4">
          <TouchableOpacity
            onPress={() => setActiveView("record")}
            className={`flex-1 py-2 rounded-full ${activeView === "record" ? "bg-white" : ""}`}
          >
            <Text className={`text-center font-semibold text-xs ${activeView === "record" ? "text-[#FF6B6B]" : "text-gray-500"}`}>
              🐾 Litter
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveView("allocate")}
            className={`flex-1 py-2 rounded-full ${activeView === "allocate" ? "bg-white" : ""}`}
          >
            <Text className={`text-center font-semibold text-xs ${activeView === "allocate" ? "text-[#FF6B6B]" : "text-gray-500"}`}>
              👥 Allocate
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveView("complete")}
            className={`flex-1 py-2 rounded-full ${activeView === "complete" ? "bg-white" : ""}`}
          >
            <Text className={`text-center font-semibold text-xs ${activeView === "complete" ? "text-[#FF6B6B]" : "text-gray-500"}`}>
              🏁 Complete
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ═══════ RECORD VIEW ═══════ */}
      {activeView === "record" && (
        <>
          {hasLitter ? (
            /* Show existing litter */
            <View>
              <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
                <View className="flex-row items-center mb-3">
                  <Baby size={18} color="#FF6B6B" />
                  <Text className="font-bold text-gray-800 ml-2">Litter Details</Text>
                </View>
                <View className="flex-row flex-wrap">
                  <InfoChip label="Born" value={dayjs(litterData!.birth_date).format("MMM D, YYYY")} />
                  <InfoChip label="Total" value={`${litterData!.statistics.total_offspring}`} />
                  <InfoChip label="Alive" value={`${litterData!.statistics.alive_offspring}`} color="#16a34a" />
                  {litterData!.statistics.died_offspring > 0 && (
                    <InfoChip label="Died" value={`${litterData!.statistics.died_offspring}`} color="#ef4444" />
                  )}
                  <InfoChip label="Males" value={`${litterData!.statistics.male_count}`} color="#3b82f6" />
                  <InfoChip label="Females" value={`${litterData!.statistics.female_count}`} color="#ec4899" />
                </View>
              </View>

              {litterData!.offspring.map((o, i) => (
                <OffspringCard key={o.offspring_id} offspring={o} index={i} />
              ))}
            </View>
          ) : contract.can_input_offspring ? (
            /* Recording Form */
            <View>
              <View className="bg-blue-50 rounded-xl p-3 mb-4 border border-blue-100">
                <Text className="text-blue-800 text-sm">
                  🐾 Record the litter details below. You can add multiple offspring.
                </Text>
              </View>

              {/* Birth Date */}
              <View className="mb-4">
                <Text className="font-bold text-gray-800 text-sm mb-1">📅 Birth Date</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className="bg-gray-100 rounded-xl px-4 py-3"
                >
                  <Text className="text-base text-gray-800">{dayjs(birthDate).format("MMMM D, YYYY")}</Text>
                </TouchableOpacity>
                <DateTimePickerModal
                  isVisible={showDatePicker}
                  mode="date"
                  maximumDate={new Date()}
                  date={new Date(birthDate)}
                  onConfirm={(date) => {
                    setBirthDate(dayjs(date).format("YYYY-MM-DD"));
                    setShowDatePicker(false);
                  }}
                  onCancel={() => setShowDatePicker(false)}
                />
              </View>

              {/* Offspring List */}
              {offspring.map((o, index) => (
                <View key={index} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="font-bold text-gray-800">🐾 Pup #{index + 1}</Text>
                    {offspring.length > 1 && (
                      <TouchableOpacity onPress={() => removeOffspring(index)} className="p-1">
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Name */}
                  <View className="mb-3">
                    <Text className="text-gray-600 text-xs mb-1">Name (Optional)</Text>
                    <TextInput
                      className="bg-gray-100 rounded-lg px-3 py-2 text-sm"
                      placeholder="e.g., Lucky"
                      placeholderTextColor="#9CA3AF"
                      value={o.name || ""}
                      onChangeText={(v) => updateOffspring(index, "name", v)}
                    />
                  </View>

                  {/* Sex */}
                  <View className="mb-3">
                    <Text className="text-gray-600 text-xs mb-1">Sex *</Text>
                    <View className="flex-row">
                      <TouchableOpacity
                        onPress={() => updateOffspring(index, "sex", "male")}
                        className={`flex-1 py-2.5 rounded-l-xl border-2 ${
                          o.sex === "male" ? "bg-blue-500 border-blue-500" : "bg-white border-gray-200"
                        }`}
                      >
                        <Text className={`text-center font-semibold text-sm ${o.sex === "male" ? "text-white" : "text-gray-600"}`}>
                          ♂️ Male
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => updateOffspring(index, "sex", "female")}
                        className={`flex-1 py-2.5 rounded-r-xl border-2 border-l-0 ${
                          o.sex === "female" ? "bg-pink-500 border-pink-500" : "bg-white border-gray-200"
                        }`}
                      >
                        <Text className={`text-center font-semibold text-sm ${o.sex === "female" ? "text-white" : "text-gray-600"}`}>
                          ♀️ Female
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Color */}
                  <View className="mb-3">
                    <Text className="text-gray-600 text-xs mb-1">Color/Markings (Optional)</Text>
                    <TextInput
                      className="bg-gray-100 rounded-lg px-3 py-2 text-sm"
                      placeholder="e.g., Brown with white spots"
                      placeholderTextColor="#9CA3AF"
                      value={o.color || ""}
                      onChangeText={(v) => updateOffspring(index, "color", v)}
                    />
                  </View>

                  {/* Status */}
                  <View>
                    <Text className="text-gray-600 text-xs mb-1">Status</Text>
                    <View className="flex-row">
                      {(["alive", "died", "adopted"] as const).map((status) => (
                        <TouchableOpacity
                          key={status}
                          onPress={() => updateOffspring(index, "status", status)}
                          className={`flex-1 py-2 rounded-lg mr-1 border-2 ${
                            o.status === status
                              ? status === "alive" ? "bg-green-500 border-green-500"
                              : status === "died" ? "bg-red-400 border-red-400"
                              : "bg-orange-400 border-orange-400"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <Text className={`text-center text-xs font-semibold ${o.status === status ? "text-white" : "text-gray-600"}`}>
                            {status === "alive" ? "✅ Alive" : status === "died" ? "💔 Died" : "🏠 Adopted"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              ))}

              {/* Add Button */}
              <TouchableOpacity
                onPress={addOffspring}
                className="border-2 border-dashed border-gray-300 rounded-2xl py-4 items-center mb-4"
              >
                <Plus size={20} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm mt-1">Add Another Pup</Text>
              </TouchableOpacity>

              {/* Notes */}
              <View className="mb-4">
                <Text className="font-semibold text-gray-700 text-sm mb-1">Notes (Optional)</Text>
                <TextInput
                  className="bg-gray-100 rounded-xl px-4 py-3 text-base"
                  placeholder="Any notes about the litter..."
                  placeholderTextColor="#9CA3AF"
                  value={litterNotes}
                  onChangeText={setLitterNotes}
                  multiline
                />
              </View>

              {/* Submit */}
              <TouchableOpacity
                onPress={handleSubmitLitter}
                disabled={isSubmitting}
                className={`py-4 rounded-full items-center ${isSubmitting ? "bg-gray-400" : "bg-[#FF6B6B]"}`}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold">Record Litter 🐾</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View className="items-center py-12 px-6">
              <Text className="text-4xl mb-3">⏳</Text>
              <Text className="text-gray-500 text-sm text-center">
                Waiting for the {contract.shooter_user_id ? "shooter" : "sire pet owner"} to record the litter.
              </Text>
            </View>
          )}
        </>
      )}

      {/* ═══════ ALLOCATE VIEW ═══════ */}
      {activeView === "allocate" && hasLitter && (
        <View>
          {/* Allocation Summary */}
          {allocationData && (
            <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
              <Text className="font-bold text-gray-800 text-sm mb-3">📊 Allocation Summary</Text>

              <View className="bg-gray-50 rounded-xl p-3 mb-3">
                <Text className="text-gray-500 text-xs mb-1">Split Method</Text>
                <Text className="text-gray-800 font-semibold text-sm">
                  {allocationData.allocation_method.split_type === "percentage"
                    ? `${allocationData.allocation_method.split_value}% / ${100 - allocationData.allocation_method.split_value}%`
                    : `${allocationData.allocation_method.split_value} specific`}
                  {" · "}
                  {allocationData.allocation_method.selection_method_label}
                </Text>
              </View>

              <View className="flex-row">
                <View className="flex-1 bg-blue-50 rounded-xl p-3 mr-2">
                  <Text className="text-blue-800 text-xs font-semibold mb-1">🐕 Sire Owner</Text>
                  <Text className="text-blue-900 font-bold">
                    {allocationData.expected_allocation.sire_owner.current_count} / {allocationData.expected_allocation.sire_owner.expected_count}
                  </Text>
                  <Text className="text-blue-700 text-xs">{allocationData.expected_allocation.sire_owner.name}</Text>
                </View>
                <View className="flex-1 bg-pink-50 rounded-xl p-3">
                  <Text className="text-pink-800 text-xs font-semibold mb-1">🐕‍🦺 Dam Owner</Text>
                  <Text className="text-pink-900 font-bold">
                    {allocationData.expected_allocation.dam_owner.current_count} / {allocationData.expected_allocation.dam_owner.expected_count}
                  </Text>
                  <Text className="text-pink-700 text-xs">{allocationData.expected_allocation.dam_owner.name}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Auto-allocate button */}
          {contract.can_input_offspring && allocationData && !allocationData.is_fully_allocated && (
            <TouchableOpacity
              onPress={handleAutoAllocate}
              disabled={isSubmitting}
              className="bg-purple-500 py-3.5 rounded-2xl flex-row items-center justify-center mb-4"
            >
              <Shuffle size={18} color="white" />
              <Text className="text-white font-bold ml-2">Auto-Allocate Based on Terms 🎲</Text>
            </TouchableOpacity>
          )}

          {/* Offspring allocation cards */}
          {(allocationData?.offspring || litterData?.offspring || []).map((o, i) => {
            const sireOwner = allocationData?.expected_allocation.sire_owner;
            const damOwner = allocationData?.expected_allocation.dam_owner;
            const currentAssignment = manualAllocations[o.offspring_id] ?? o.assigned_to?.id ?? null;

            return (
              <View key={o.offspring_id} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Text className="text-lg mr-2">{o.sex === "male" ? "♂️" : "♀️"}</Text>
                    <View>
                      <Text className="font-bold text-gray-800 text-sm">{o.name || `Pup #${i + 1}`}</Text>
                      {o.color && <Text className="text-gray-500 text-xs">{o.color}</Text>}
                    </View>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${
                    o.allocation_status === "assigned" ? "bg-green-100" :
                    o.allocation_status === "transferred" ? "bg-blue-100" : "bg-gray-100"
                  }`}>
                    <Text className={`text-xs font-semibold ${
                      o.allocation_status === "assigned" ? "text-green-700" :
                      o.allocation_status === "transferred" ? "text-blue-700" : "text-gray-600"
                    }`}>
                      {o.allocation_status === "assigned" ? "✅ Assigned" :
                       o.allocation_status === "transferred" ? "📦 Transferred" : "⏳ Unassigned"}
                    </Text>
                  </View>
                </View>

                {/* Manual assignment buttons */}
                {contract.can_input_offspring && o.allocation_status === "unassigned" && sireOwner && damOwner && (
                  <View className="flex-row mt-2">
                    <TouchableOpacity
                      onPress={() => setManualAllocations(prev => ({ ...prev, [o.offspring_id]: sireOwner.id }))}
                      className={`flex-1 py-2 rounded-l-xl border-2 ${
                        currentAssignment === sireOwner.id ? "bg-blue-500 border-blue-500" : "bg-white border-gray-200"
                      }`}
                    >
                      <Text className={`text-center text-xs font-semibold ${currentAssignment === sireOwner.id ? "text-white" : "text-gray-600"}`}>
                        🐕 {sireOwner.name.split(" ")[0]}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setManualAllocations(prev => ({ ...prev, [o.offspring_id]: damOwner.id }))}
                      className={`flex-1 py-2 rounded-r-xl border-2 border-l-0 ${
                        currentAssignment === damOwner.id ? "bg-pink-500 border-pink-500" : "bg-white border-gray-200"
                      }`}
                    >
                      <Text className={`text-center text-xs font-semibold ${currentAssignment === damOwner.id ? "text-white" : "text-gray-600"}`}>
                        🐕‍🦺 {damOwner.name.split(" ")[0]}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Already assigned info */}
                {o.assigned_to && o.allocation_status !== "unassigned" && (
                  <View className="flex-row items-center mt-2 bg-gray-50 rounded-lg p-2">
                    <User size={14} color="#6B7280" />
                    <Text className="text-gray-600 text-xs ml-1">Assigned to {o.assigned_to.name}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Save manual allocations */}
          {contract.can_input_offspring && Object.keys(manualAllocations).length > 0 && (
            <TouchableOpacity
              onPress={handleManualAllocate}
              disabled={isSubmitting}
              className={`py-4 rounded-full items-center mb-4 ${isSubmitting ? "bg-gray-400" : "bg-[#FF6B6B]"}`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold">Save Allocations ✅</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ═══════ COMPLETE VIEW ═══════ */}
      {activeView === "complete" && (
        <View>
          {allocationData?.is_fully_allocated ? (
            <View className="items-center py-6">
              <View className="bg-green-50 rounded-2xl p-6 w-full border border-green-200 items-center mb-4">
                <Text className="text-5xl mb-3">🎉</Text>
                <Text className="font-bold text-green-800 text-lg text-center">All Offspring Allocated!</Text>
                <Text className="text-green-600 text-sm text-center mt-2">
                  All {allocationData.statistics.total_alive} alive offspring have been assigned to their owners.
                </Text>
              </View>

              {/* Final summary */}
              <View className="bg-white rounded-2xl p-4 w-full border border-gray-100 mb-6">
                <Text className="font-bold text-gray-800 text-sm mb-3">📋 Final Summary</Text>
                <View className="flex-row justify-between py-2 border-b border-gray-50">
                  <Text className="text-gray-500 text-sm">Sire Owner receives</Text>
                  <Text className="font-bold text-blue-600">{allocationData.expected_allocation.sire_owner.current_count} pup(s)</Text>
                </View>
                <View className="flex-row justify-between py-2 border-b border-gray-50">
                  <Text className="text-gray-500 text-sm">Dam Owner receives</Text>
                  <Text className="font-bold text-pink-600">{allocationData.expected_allocation.dam_owner.current_count} pup(s)</Text>
                </View>
                <View className="flex-row justify-between py-2">
                  <Text className="text-gray-500 text-sm">Total Alive</Text>
                  <Text className="font-bold text-gray-800">{allocationData.statistics.total_alive}</Text>
                </View>
              </View>

              {allocationData.can_complete_match && (
                <TouchableOpacity
                  onPress={handleCompleteMatch}
                  disabled={isSubmitting}
                  className={`w-full py-4 rounded-full items-center ${isSubmitting ? "bg-gray-400" : "bg-[#FF6B6B]"}`}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold text-base">Complete Match 🏁🎊</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View className="items-center py-12 px-6">
              <Text className="text-4xl mb-3">⏳</Text>
              <Text className="text-gray-800 font-bold text-lg mb-2">Not Ready Yet</Text>
              <Text className="text-gray-500 text-sm text-center">
                All offspring must be allocated before the match can be completed. Go to the Allocate tab to assign offspring.
              </Text>
            </View>
          )}
        </View>
      )}

      <AlertModal visible={alertVisible} {...alertOptions} onClose={hideAlert} />
    </View>
  );
}

// ─── Helper Components ───

function InfoChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <View className="bg-gray-100 rounded-lg px-3 py-1.5 mr-2 mb-2">
      <Text className="text-gray-500 text-xs">{label}</Text>
      <Text className="font-bold text-sm" style={color ? { color } : undefined}>{value}</Text>
    </View>
  );
}

function OffspringCard({ offspring, index }: { offspring: Offspring; index: number }) {
  return (
    <View className="bg-white rounded-xl p-3 mb-2 border border-gray-100 flex-row items-center">
      <Text className="text-xl mr-3">{offspring.sex === "male" ? "♂️" : "♀️"}</Text>
      <View className="flex-1">
        <Text className="font-bold text-gray-800 text-sm">{offspring.name || `Pup #${index + 1}`}</Text>
        <View className="flex-row items-center">
          {offspring.color && <Text className="text-gray-500 text-xs mr-2">{offspring.color}</Text>}
          <View className={`px-1.5 py-0.5 rounded ${
            offspring.status === "alive" ? "bg-green-100" :
            offspring.status === "died" ? "bg-red-100" : "bg-orange-100"
          }`}>
            <Text className={`text-xs ${
              offspring.status === "alive" ? "text-green-700" :
              offspring.status === "died" ? "text-red-700" : "text-orange-700"
            }`}>
              {offspring.status}
            </Text>
          </View>
        </View>
      </View>
      {offspring.assigned_to && (
        <View className="bg-gray-50 rounded-lg px-2 py-1">
          <Text className="text-gray-500 text-xs">→ {offspring.assigned_to.name.split(" ")[0]}</Text>
        </View>
      )}
    </View>
  );
}
