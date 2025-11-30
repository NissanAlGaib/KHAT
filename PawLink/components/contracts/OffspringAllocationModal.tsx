import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import {
  X,
  Check,
  Shuffle,
  User,
  Users,
  ChevronRight,
  Award,
  RefreshCw,
  Archive,
} from "lucide-react-native";
import {
  BreedingContract,
  getOffspringAllocationSummary,
  allocateOffspring,
  autoAllocateOffspring,
  completeMatch,
  AllocationSummaryData,
  Offspring,
  OffspringAllocation,
} from "@/services/contractService";

interface OffspringAllocationModalProps {
  visible: boolean;
  onClose: () => void;
  contract: BreedingContract;
  onSuccess: (contract: BreedingContract) => void;
  onMatchCompleted?: () => void;
}

export default function OffspringAllocationModal({
  visible,
  onClose,
  contract,
  onSuccess,
  onMatchCompleted,
}: OffspringAllocationModalProps) {
  const [loading, setLoading] = useState(true);
  const [allocationData, setAllocationData] =
    useState<AllocationSummaryData | null>(null);
  const [selectedAllocations, setSelectedAllocations] = useState<
    Record<number, number | null>
  >({});
  const [isAllocating, setIsAllocating] = useState(false);
  const [isAutoAllocating, setIsAutoAllocating] = useState(false);
  const [isCompletingMatch, setIsCompletingMatch] = useState(false);

  const fetchAllocationData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOffspringAllocationSummary(contract.id);
      setAllocationData(data);

      // Initialize selected allocations from current state
      if (data?.offspring) {
        const initial: Record<number, number | null> = {};
        data.offspring.forEach((o) => {
          initial[o.offspring_id] = o.assigned_to?.id || null;
        });
        setSelectedAllocations(initial);
      }
    } catch (error) {
      console.error("Error fetching allocation data:", error);
    } finally {
      setLoading(false);
    }
  }, [contract.id]);

  useEffect(() => {
    if (visible) {
      fetchAllocationData();
    }
  }, [visible, fetchAllocationData]);

  const handleSelectOwner = (offspringId: number, ownerId: number) => {
    setSelectedAllocations((prev) => ({
      ...prev,
      [offspringId]: ownerId,
    }));
  };

  const handleManualAllocate = async () => {
    if (!allocationData) return;

    // Prepare allocations from selected state
    const allocations: OffspringAllocation[] = [];
    let order = 1;

    // Filter only alive offspring that have been allocated
    allocationData.offspring
      .filter((o) => o.status === "alive" && selectedAllocations[o.offspring_id])
      .forEach((offspring) => {
        const assignedTo = selectedAllocations[offspring.offspring_id];
        if (assignedTo) {
          allocations.push({
            offspring_id: offspring.offspring_id,
            assigned_to: assignedTo,
            selection_order: order++,
          });
        }
      });

    if (allocations.length === 0) {
      Alert.alert("Error", "Please select an owner for at least one offspring");
      return;
    }

    setIsAllocating(true);
    try {
      const result = await allocateOffspring(contract.id, allocations);
      if (result.success) {
        Alert.alert("Success", "Offspring allocated successfully!");
        fetchAllocationData();
      } else {
        Alert.alert("Error", result.message || "Failed to allocate offspring");
      }
    } catch (error) {
      console.error("Error allocating offspring:", error);
      Alert.alert("Error", "Failed to allocate offspring");
    } finally {
      setIsAllocating(false);
    }
  };

  const handleAutoAllocate = async () => {
    Alert.alert(
      "Auto-Allocate Offspring",
      allocationData?.allocation_method.selection_method === "randomized"
        ? "This will randomly assign offspring to each owner based on the contract split."
        : "This will allocate offspring using the first-pick method where the dam (female pet) owner picks first.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Proceed",
          onPress: async () => {
            setIsAutoAllocating(true);
            try {
              const result = await autoAllocateOffspring(contract.id);
              if (result.success) {
                Alert.alert(
                  "Success",
                  `Offspring auto-allocated!\n\n` +
                    `Dam owner receives: ${result.data?.allocation_summary.dam_owner_receives}\n` +
                    `Sire owner receives: ${result.data?.allocation_summary.sire_owner_receives}`
                );
                fetchAllocationData();
              } else {
                Alert.alert(
                  "Error",
                  result.message || "Failed to auto-allocate offspring"
                );
              }
            } catch (error) {
              console.error("Error auto-allocating:", error);
              Alert.alert("Error", "Failed to auto-allocate offspring");
            } finally {
              setIsAutoAllocating(false);
            }
          },
        },
      ]
    );
  };

  const handleCompleteMatch = async () => {
    Alert.alert(
      "Complete Match",
      "This will mark the breeding contract as fulfilled and archive the conversation. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Complete & Archive",
          style: "destructive",
          onPress: async () => {
            setIsCompletingMatch(true);
            try {
              const result = await completeMatch(contract.id);
              if (result.success) {
                Alert.alert(
                  "Match Completed!",
                  "The breeding match has been successfully completed and the conversation has been archived.",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        onClose();
                        onMatchCompleted?.();
                      },
                    },
                  ]
                );
              } else {
                Alert.alert(
                  "Error",
                  result.message || "Failed to complete match"
                );
              }
            } catch (error) {
              console.error("Error completing match:", error);
              Alert.alert("Error", "Failed to complete match");
            } finally {
              setIsCompletingMatch(false);
            }
          },
        },
      ]
    );
  };

  const renderOffspringCard = (offspring: Offspring) => {
    const isAlive = offspring.status === "alive";
    const damOwnerId = allocationData?.expected_allocation.dam_owner.id;
    const sireOwnerId = allocationData?.expected_allocation.sire_owner.id;
    const currentSelection = selectedAllocations[offspring.offspring_id];

    return (
      <View
        key={offspring.offspring_id}
        className={`border rounded-xl p-3 mb-3 ${
          offspring.status === "died"
            ? "border-gray-300 bg-gray-50"
            : offspring.status === "adopted"
            ? "border-purple-300 bg-purple-50"
            : "border-gray-200 bg-white"
        }`}
      >
        <View className="flex-row items-center mb-2">
          {/* Offspring Photo/Avatar */}
          <View
            className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
              offspring.sex === "male" ? "bg-blue-100" : "bg-pink-100"
            }`}
          >
            {offspring.photo_url ? (
              <Image
                source={{ uri: offspring.photo_url }}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <Text
                className={`text-lg font-bold ${
                  offspring.sex === "male" ? "text-blue-600" : "text-pink-600"
                }`}
              >
                {offspring.sex === "male" ? "♂" : "♀"}
              </Text>
            )}
          </View>

          {/* Offspring Info */}
          <View className="flex-1">
            <Text className="text-gray-800 font-medium">
              {offspring.name || `Puppy #${offspring.offspring_id}`}
            </Text>
            <View className="flex-row items-center">
              <Text
                className={`text-sm ${
                  offspring.sex === "male" ? "text-blue-600" : "text-pink-600"
                }`}
              >
                {offspring.sex === "male" ? "Male" : "Female"}
              </Text>
              {offspring.color && (
                <Text className="text-gray-500 text-sm ml-2">
                  • {offspring.color}
                </Text>
              )}
            </View>
          </View>

          {/* Status Badge */}
          <View
            className={`px-2 py-1 rounded-full ${
              offspring.status === "alive"
                ? "bg-green-100"
                : offspring.status === "adopted"
                ? "bg-purple-100"
                : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                offspring.status === "alive"
                  ? "text-green-700"
                  : offspring.status === "adopted"
                  ? "text-purple-700"
                  : "text-gray-600"
              }`}
            >
              {offspring.status.charAt(0).toUpperCase() +
                offspring.status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Allocation Buttons - Only for alive offspring */}
        {isAlive && damOwnerId && sireOwnerId && (
          <View className="mt-2">
            <Text className="text-gray-600 text-xs mb-2">Assign to:</Text>
            <View className="flex-row space-x-2">
              {/* Dam Owner Button */}
              <TouchableOpacity
                onPress={() =>
                  handleSelectOwner(offspring.offspring_id, damOwnerId)
                }
                className={`flex-1 py-2 px-3 rounded-lg flex-row items-center justify-center mr-2 ${
                  currentSelection === damOwnerId
                    ? "bg-pink-500"
                    : "border border-pink-300"
                }`}
              >
                <User
                  size={14}
                  color={currentSelection === damOwnerId ? "white" : "#ec4899"}
                />
                <Text
                  className={`ml-1 text-sm font-medium ${
                    currentSelection === damOwnerId
                      ? "text-white"
                      : "text-pink-600"
                  }`}
                  numberOfLines={1}
                >
                  {allocationData?.expected_allocation.dam_owner.name?.split(
                    " "
                  )[0] || "Dam Owner"}
                </Text>
              </TouchableOpacity>

              {/* Sire Owner Button */}
              <TouchableOpacity
                onPress={() =>
                  handleSelectOwner(offspring.offspring_id, sireOwnerId)
                }
                className={`flex-1 py-2 px-3 rounded-lg flex-row items-center justify-center ${
                  currentSelection === sireOwnerId
                    ? "bg-blue-500"
                    : "border border-blue-300"
                }`}
              >
                <User
                  size={14}
                  color={currentSelection === sireOwnerId ? "white" : "#3b82f6"}
                />
                <Text
                  className={`ml-1 text-sm font-medium ${
                    currentSelection === sireOwnerId
                      ? "text-white"
                      : "text-blue-600"
                  }`}
                  numberOfLines={1}
                >
                  {allocationData?.expected_allocation.sire_owner.name?.split(
                    " "
                  )[0] || "Sire Owner"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Allocation Status for already assigned */}
        {offspring.allocation_status === "assigned" && offspring.assigned_to && (
          <View className="mt-2 bg-green-50 rounded-lg p-2 flex-row items-center">
            <Check size={14} color="#10b981" />
            <Text className="text-green-700 text-sm ml-1">
              Assigned to {offspring.assigned_to.name}
            </Text>
            {offspring.selection_order && (
              <Text className="text-green-600 text-xs ml-auto">
                Pick #{offspring.selection_order}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false}>
        <View className="flex-1 bg-white items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text className="text-gray-500 mt-4">Loading allocation data...</Text>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-[#FF6B6B] px-4 py-3 flex-row items-center justify-between">
          <Text className="text-white font-semibold text-lg">
            Offspring Allocation
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4 py-4">
          {allocationData ? (
            <>
              {/* Allocation Method Info */}
              <View className="bg-blue-50 rounded-xl p-4 mb-4">
                <View className="flex-row items-center mb-2">
                  {allocationData.allocation_method.selection_method ===
                  "randomized" ? (
                    <Shuffle size={20} color="#3b82f6" />
                  ) : (
                    <Award size={20} color="#3b82f6" />
                  )}
                  <Text className="text-blue-900 font-semibold ml-2">
                    {allocationData.allocation_method.selection_method_label}
                  </Text>
                </View>
                <Text className="text-blue-700 text-sm">
                  {allocationData.allocation_method.split_type === "percentage"
                    ? `Dam owner receives ${allocationData.allocation_method.split_value}% of offspring`
                    : `Dam owner receives ${allocationData.allocation_method.split_value} specific offspring`}
                </Text>
              </View>

              {/* Statistics Summary */}
              <View className="bg-gray-50 rounded-xl p-4 mb-4">
                <Text className="text-gray-800 font-semibold mb-3">
                  Litter Statistics
                </Text>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-600">Total Alive:</Text>
                  <Text className="text-gray-800 font-medium">
                    {allocationData.statistics.total_alive}
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-600">Males / Females:</Text>
                  <Text className="text-gray-800 font-medium">
                    {allocationData.statistics.male_count} /{" "}
                    {allocationData.statistics.female_count}
                  </Text>
                </View>
                {allocationData.statistics.total_died > 0 && (
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Died:</Text>
                    <Text className="text-gray-500">
                      {allocationData.statistics.total_died}
                    </Text>
                  </View>
                )}
              </View>

              {/* Expected Allocation */}
              <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                <Text className="text-gray-800 font-semibold mb-3">
                  Allocation Breakdown
                </Text>

                {/* Dam Owner */}
                <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-pink-100 items-center justify-center">
                      <User size={16} color="#ec4899" />
                    </View>
                    <View className="ml-2">
                      <Text className="text-gray-800 font-medium">
                        {allocationData.expected_allocation.dam_owner.name}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        Dam ({allocationData.parents.dam.name}) Owner
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-pink-600 font-bold text-lg">
                      {allocationData.expected_allocation.dam_owner.current_count}{" "}
                      / {allocationData.expected_allocation.dam_owner.expected_count}
                    </Text>
                    <Text className="text-gray-500 text-xs">assigned</Text>
                  </View>
                </View>

                {/* Sire Owner */}
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center">
                      <User size={16} color="#3b82f6" />
                    </View>
                    <View className="ml-2">
                      <Text className="text-gray-800 font-medium">
                        {allocationData.expected_allocation.sire_owner.name}
                      </Text>
                      <Text className="text-gray-500 text-xs">
                        Sire ({allocationData.parents.sire.name}) Owner
                      </Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-blue-600 font-bold text-lg">
                      {allocationData.expected_allocation.sire_owner.current_count}{" "}
                      / {allocationData.expected_allocation.sire_owner.expected_count}
                    </Text>
                    <Text className="text-gray-500 text-xs">assigned</Text>
                  </View>
                </View>
              </View>

              {/* Auto-Allocate Button */}
              {!allocationData.is_fully_allocated && (
                <TouchableOpacity
                  onPress={handleAutoAllocate}
                  disabled={isAutoAllocating}
                  className="bg-purple-500 py-3 rounded-full flex-row items-center justify-center mb-4"
                >
                  {isAutoAllocating ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      {allocationData.allocation_method.selection_method ===
                      "randomized" ? (
                        <Shuffle size={18} color="white" />
                      ) : (
                        <Award size={18} color="white" />
                      )}
                      <Text className="text-white font-semibold ml-2">
                        Auto-Allocate (
                        {allocationData.allocation_method.selection_method ===
                        "randomized"
                          ? "Random"
                          : "First Pick"}
                        )
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Offspring List */}
              <View className="mb-4">
                <Text className="text-gray-800 font-semibold mb-3">
                  Offspring ({allocationData.offspring.length})
                </Text>
                {allocationData.offspring.map(renderOffspringCard)}
              </View>

              {/* Manual Allocate Button */}
              {!allocationData.is_fully_allocated && (
                <TouchableOpacity
                  onPress={handleManualAllocate}
                  disabled={isAllocating}
                  className="bg-[#FF6B6B] py-3 rounded-full flex-row items-center justify-center mb-4"
                >
                  {isAllocating ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Check size={18} color="white" />
                      <Text className="text-white font-semibold ml-2">
                        Save Manual Allocations
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Complete Match Button */}
              {allocationData.can_complete_match && (
                <View className="mt-2 mb-6">
                  <View className="bg-green-50 rounded-lg p-3 mb-3">
                    <View className="flex-row items-center">
                      <Check size={16} color="#10b981" />
                      <Text className="text-green-800 font-medium ml-2">
                        All offspring have been allocated!
                      </Text>
                    </View>
                    <Text className="text-green-700 text-sm mt-1">
                      You can now complete the match and archive the
                      conversation.
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleCompleteMatch}
                    disabled={isCompletingMatch}
                    className="bg-green-600 py-3 rounded-full flex-row items-center justify-center"
                  >
                    {isCompletingMatch ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Archive size={18} color="white" />
                        <Text className="text-white font-semibold ml-2">
                          Complete Match & Archive
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <View className="items-center justify-center py-10">
              <Text className="text-gray-500">
                No allocation data available
              </Text>
              <TouchableOpacity
                onPress={fetchAllocationData}
                className="mt-4 flex-row items-center"
              >
                <RefreshCw size={16} color="#FF6B6B" />
                <Text className="text-[#FF6B6B] ml-2">Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
