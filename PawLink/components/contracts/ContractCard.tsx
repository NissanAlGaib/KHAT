import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Edit,
  DollarSign,
  Users,
  Shield,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Baby,
} from "lucide-react-native";
import dayjs from "dayjs";
import {
  BreedingContract,
  acceptContract,
  rejectContract,
  acceptShooterRequest,
  declineShooterRequest,
  updateShooterTerms,
  completeBreeding,
} from "@/services/contractService";
import {
  ShooterContractEditModal,
  OffspringInputModal,
} from "@/components/contracts";

interface ContractCardProps {
  contract: BreedingContract;
  onContractUpdate: (contract: BreedingContract) => void;
  onEdit: () => void;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const CollapsibleSection = ({
  title,
  icon,
  children,
  defaultExpanded = false,
}: CollapsibleSectionProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View className="mb-3">
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between py-2"
      >
        <View className="flex-row items-center">
          {icon}
          <Text className="text-gray-800 font-medium ml-2">{title}</Text>
        </View>
        {expanded ? (
          <ChevronUp size={20} color="#666" />
        ) : (
          <ChevronDown size={20} color="#666" />
        )}
      </TouchableOpacity>
      {expanded && <View className="mt-2">{children}</View>}
    </View>
  );
};

const StatusBadge = ({ status }: { status: BreedingContract["status"] }) => {
  const statusStyles = {
    draft: { bg: "bg-gray-200", text: "text-gray-700", label: "Draft" },
    pending_review: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Pending Review",
    },
    accepted: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Accepted",
    },
    rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected" },
  };

  const style = statusStyles[status];

  return (
    <View className={`${style.bg} px-3 py-1 rounded-full`}>
      <Text className={`${style.text} text-xs font-semibold`}>
        {style.label}
      </Text>
    </View>
  );
};

export default function ContractCard({
  contract,
  onContractUpdate,
  onEdit,
}: ContractCardProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isAcceptingShooter, setIsAcceptingShooter] = useState(false);
  const [isDecliningShooter, setIsDecliningShooter] = useState(false);
  const [showShooterEditModal, setShowShooterEditModal] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [showBreedingNotes, setShowBreedingNotes] = useState(false);
  const [breedingNotes, setBreedingNotes] = useState("");
  const [showOffspringModal, setShowOffspringModal] = useState(false);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const result = await acceptContract(contract.id);
      if (result.success && result.data) {
        onContractUpdate(result.data);
      }
    } catch (error) {
      console.error("Error accepting contract:", error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const result = await rejectContract(contract.id);
      if (result.success && result.data) {
        onContractUpdate(result.data);
      }
    } catch (error) {
      console.error("Error rejecting contract:", error);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleAcceptShooter = async () => {
    setIsAcceptingShooter(true);
    try {
      const result = await acceptShooterRequest(contract.id);
      if (result.success && result.data) {
        onContractUpdate(result.data);
      }
    } catch (error) {
      console.error("Error accepting shooter:", error);
    } finally {
      setIsAcceptingShooter(false);
    }
  };

  const handleDeclineShooter = async () => {
    setIsDecliningShooter(true);
    try {
      const result = await declineShooterRequest(contract.id);
      if (result.success && result.data) {
        onContractUpdate(result.data);
      }
    } catch (error) {
      console.error("Error declining shooter:", error);
    } finally {
      setIsDecliningShooter(false);
    }
  };

  const handleShooterEditSubmit = async (
    payment: number,
    collateral: number
  ) => {
    return await updateShooterTerms(contract.id, payment, collateral);
  };

  const handleShooterEditSuccess = (updatedContract: BreedingContract) => {
    onContractUpdate(updatedContract);
    setShowShooterEditModal(false);
  };

  const handleMarkBreedingComplete = async (hasOffspring: boolean) => {
    const status = hasOffspring ? "completed" : "failed";
    const statusText = hasOffspring ? "successful" : "failed";

    Alert.alert(
      `Mark Breeding as ${hasOffspring ? "Complete" : "Failed"}`,
      `Are you sure the breeding was ${statusText}${hasOffspring ? " with offspring" : ""}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Confirm",
          onPress: async () => {
            setIsMarkingComplete(true);
            try {
              const result = await completeBreeding(contract.id, {
                breeding_status: status,
                has_offspring: hasOffspring,
                breeding_notes: breedingNotes || undefined,
              });

              if (result.success && result.data) {
                onContractUpdate(result.data);
                setBreedingNotes("");
                setShowBreedingNotes(false);

                if (hasOffspring) {
                  Alert.alert(
                    "Success",
                    "Breeding marked as complete! You can now input offspring details."
                  );
                }
              } else {
                Alert.alert(
                  "Error",
                  result.message || "Failed to update breeding status"
                );
              }
            } catch (error) {
              console.error("Error marking breeding complete:", error);
              Alert.alert("Error", "Failed to mark breeding complete");
            } finally {
              setIsMarkingComplete(false);
            }
          },
        },
      ]
    );
  };

  const collateralPerOwner = contract.collateral_total / 2;

  // Determine if current user has already accepted the shooter
  const hasCurrentUserAcceptedShooter =
    contract.current_user_accepted_shooter ?? false;
  const bothOwnersAccepted =
    contract.owner1_accepted_shooter && contract.owner2_accepted_shooter;

  return (
    <View className="bg-white rounded-2xl mx-4 my-2 shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <View className="bg-[#FF6B6B] px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <FileText size={20} color="white" />
          <Text className="text-white font-semibold ml-2 text-base">
            Breeding Contract
          </Text>
        </View>
        <StatusBadge status={contract.status} />
      </View>

      {/* Content */}
      <View className="px-4 py-3">
        {/* Shooter Agreement Section - Show if shooter details exist OR if current user is the shooter */}
        {(contract.shooter_name ||
          contract.is_shooter ||
          contract.shooter_payment) && (
          <CollapsibleSection
            title="Shooter Agreement"
            icon={<Users size={18} color="#FF6B6B" />}
            defaultExpanded={
              contract.shooter_status === "accepted_by_shooter" ||
              contract.status === "accepted" ||
              contract.is_shooter === true
            }
          >
            <View className="bg-gray-50 rounded-xl p-3">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500 text-sm">Name:</Text>
                <Text className="text-gray-800 text-sm font-medium">
                  {contract.shooter_name || "Any verified shooter"}
                </Text>
              </View>
              {contract.shooter_payment && (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500 text-sm">Payment:</Text>
                  <Text className="text-gray-800 text-sm font-medium">
                    ₱{contract.shooter_payment.toLocaleString()}
                  </Text>
                </View>
              )}
              {contract.shooter_location && (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500 text-sm">Location:</Text>
                  <Text className="text-gray-800 text-sm font-medium">
                    {contract.shooter_location}
                  </Text>
                </View>
              )}
              {contract.shooter_conditions && (
                <View className="mt-2">
                  <Text className="text-gray-500 text-sm mb-1">
                    Conditions:
                  </Text>
                  <Text className="text-gray-800 text-sm">
                    {contract.shooter_conditions}
                  </Text>
                </View>
              )}
              {contract.shooter_collateral &&
                contract.shooter_collateral > 0 && (
                  <View className="flex-row justify-between mb-2 mt-2">
                    <Text className="text-gray-500 text-sm">Collateral:</Text>
                    <Text className="text-gray-800 text-sm font-medium">
                      ₱{contract.shooter_collateral.toLocaleString()}
                    </Text>
                  </View>
                )}

              {/* Shooter Status */}
              {contract.shooter_status &&
                contract.shooter_status !== "none" &&
                contract.shooter_status !== "pending" && (
                  <View className="mt-3 pt-3 border-t border-gray-200">
                    {contract.shooter_status === "accepted_by_shooter" && (
                      <View className="bg-yellow-50 rounded-lg p-3">
                        <View className="flex-row items-center mb-2">
                          <Clock size={16} color="#f59e0b" />
                          <Text className="text-yellow-800 font-semibold ml-2">
                            Shooter Accepted
                          </Text>
                        </View>
                        {contract.shooter && (
                          <Text className="text-yellow-800 text-sm mb-2">
                            {contract.shooter.name} has accepted this offer
                          </Text>
                        )}
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <UserCheck
                              size={14}
                              color={
                                contract.owner1_accepted_shooter
                                  ? "#10b981"
                                  : "#9CA3AF"
                              }
                            />
                            <Text
                              className={`text-xs ml-1 ${contract.owner1_accepted_shooter ? "text-green-700" : "text-gray-500"}`}
                            >
                              Owner 1{" "}
                              {contract.owner1_accepted_shooter ? "✓" : ""}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <UserCheck
                              size={14}
                              color={
                                contract.owner2_accepted_shooter
                                  ? "#10b981"
                                  : "#9CA3AF"
                              }
                            />
                            <Text
                              className={`text-xs ml-1 ${contract.owner2_accepted_shooter ? "text-green-700" : "text-gray-500"}`}
                            >
                              Owner 2{" "}
                              {contract.owner2_accepted_shooter ? "✓" : ""}
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {contract.shooter_status === "accepted_by_owners" && (
                      <View className="bg-green-50 rounded-lg p-3">
                        <View className="flex-row items-center mb-2">
                          <Check size={16} color="#10b981" />
                          <Text className="text-green-800 font-semibold ml-2">
                            Shooter Confirmed
                          </Text>
                        </View>
                        {contract.shooter && (
                          <Text className="text-green-700 text-sm mb-2">
                            {contract.shooter.name} is your confirmed shooter
                          </Text>
                        )}
                        {contract.shooter_collateral &&
                          contract.shooter_collateral > 0 && (
                            <View className="bg-white rounded-lg p-2 mt-1">
                              <View className="flex-row justify-between">
                                <Text className="text-gray-600 text-xs">
                                  Collateral Provided:
                                </Text>
                                <Text className="text-green-700 text-xs font-semibold">
                                  ₱
                                  {contract.shooter_collateral.toLocaleString()}
                                </Text>
                              </View>
                            </View>
                          )}
                      </View>
                    )}

                    {contract.shooter_status === "declined" && (
                      <View className="bg-red-50 rounded-lg p-3 flex-row items-center">
                        <X size={16} color="#ef4444" />
                        <Text className="text-red-800 text-sm ml-2">
                          Shooter request was declined
                        </Text>
                      </View>
                    )}
                  </View>
                )}
            </View>
          </CollapsibleSection>
        )}

        {/* Payment & Compensation Section */}
        <CollapsibleSection
          title="Payment & Compensation"
          icon={<DollarSign size={18} color="#FF6B6B" />}
          defaultExpanded={true}
        >
          <View className="bg-gray-50 rounded-xl p-3">
            {contract.end_contract_date && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500 text-sm">End Date:</Text>
                <Text className="text-gray-800 text-sm font-medium">
                  {dayjs(contract.end_contract_date).format("MMMM D, YYYY")}
                </Text>
              </View>
            )}
            {contract.include_monetary_amount && contract.monetary_amount && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500 text-sm">Monetary Amount:</Text>
                <Text className="text-gray-800 text-sm font-medium">
                  ₱{contract.monetary_amount}
                </Text>
              </View>
            )}
            {contract.share_offspring && (
              <>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500 text-sm">
                    Offspring Split:
                  </Text>
                  <Text className="text-gray-800 text-sm font-medium">
                    {contract.offspring_split_value}
                    {contract.offspring_split_type === "percentage"
                      ? "%"
                      : ""}{" "}
                    (
                    {contract.offspring_split_type === "percentage"
                      ? "Percentage"
                      : "Specific Number"}
                    )
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500 text-sm">Selection:</Text>
                  <Text className="text-gray-800 text-sm font-medium">
                    {contract.offspring_selection_method === "first_pick"
                      ? "First Pick"
                      : "Randomized"}
                  </Text>
                </View>
              </>
            )}
            {contract.include_goods_foods && contract.goods_foods_value && (
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-500 text-sm">
                  Goods/Foods Value:
                </Text>
                <Text className="text-gray-800 text-sm font-medium">
                  ₱{contract.goods_foods_value}
                </Text>
              </View>
            )}
            <View className="border-t border-gray-200 mt-2 pt-2">
              <View className="flex-row justify-between mb-1">
                <Text className="text-gray-500 text-sm">Total Collateral:</Text>
                <Text className="text-gray-800 text-sm font-semibold">
                  ₱{contract.collateral_total}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-500 text-sm">Each Owner:</Text>
                <Text className="text-gray-800 text-sm font-medium">
                  ₱{collateralPerOwner.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </CollapsibleSection>

        {/* Terms & Policies Section */}
        {(contract.pet_care_responsibilities ||
          contract.harm_liability_terms ||
          contract.cancellation_policy ||
          contract.custom_terms) && (
          <CollapsibleSection
            title="Terms & Policies"
            icon={<Shield size={18} color="#FF6B6B" />}
            defaultExpanded={contract.status === "accepted"}
          >
            <View className="bg-gray-50 rounded-xl p-3">
              {contract.pet_care_responsibilities && (
                <View className="mb-3">
                  <Text className="text-gray-500 text-xs font-medium mb-1">
                    Pet Care Responsibilities:
                  </Text>
                  <Text className="text-gray-800 text-sm">
                    {contract.pet_care_responsibilities}
                  </Text>
                </View>
              )}
              {contract.harm_liability_terms && (
                <View className="mb-3">
                  <Text className="text-gray-500 text-xs font-medium mb-1">
                    Harm Liability:
                  </Text>
                  <Text className="text-gray-800 text-sm">
                    {contract.harm_liability_terms}
                  </Text>
                </View>
              )}
              {contract.cancellation_policy && (
                <View className="mb-3">
                  <Text className="text-gray-500 text-xs font-medium mb-1">
                    Cancellation Policy:
                  </Text>
                  <Text className="text-gray-800 text-sm">
                    {contract.cancellation_policy}
                  </Text>
                </View>
              )}
              {contract.custom_terms && (
                <View>
                  <Text className="text-gray-500 text-xs font-medium mb-1">
                    Custom Terms:
                  </Text>
                  <Text className="text-gray-800 text-sm">
                    {contract.custom_terms}
                  </Text>
                </View>
              )}
            </View>
          </CollapsibleSection>
        )}

        {/* Status Messages */}
        {contract.status === "accepted" && (
          <View className="mb-3">
            <View className="bg-green-50 rounded-xl p-3 flex-row items-center">
              <Check size={18} color="#10b981" />
              <Text className="text-green-800 text-sm ml-2">
                Contract accepted on{" "}
                {dayjs(contract.accepted_at).format("MMMM D, YYYY")}
              </Text>
            </View>

            {/* Edit button for accepted contracts (owners) */}
            {contract.can_edit && !contract.can_shooter_edit && (
              <TouchableOpacity
                onPress={onEdit}
                className="mt-3 bg-[#FF6B6B] py-3 rounded-full flex-row items-center justify-center"
              >
                <Edit size={18} color="white" />
                <Text className="text-white font-semibold ml-2">
                  Edit Contract
                </Text>
              </TouchableOpacity>
            )}

            {/* Edit button for shooter */}
            {contract.can_shooter_edit && (
              <TouchableOpacity
                onPress={() => setShowShooterEditModal(true)}
                className="mt-3 bg-[#FF6B6B] py-3 rounded-full flex-row items-center justify-center"
              >
                <Edit size={18} color="white" />
                <Text className="text-white font-semibold ml-2">
                  Edit Payment & Collateral
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {contract.status === "rejected" && (
          <View className="bg-red-50 rounded-xl p-3 flex-row items-center mb-3">
            <X size={18} color="#ef4444" />
            <Text className="text-red-800 text-sm ml-2">
              Contract rejected on{" "}
              {dayjs(contract.rejected_at).format("MMMM D, YYYY")}. Match ended.
            </Text>
          </View>
        )}

        {/* Shooter Request Action Buttons - Only show when contract is accepted and shooter has accepted */}
        {contract.status === "accepted" &&
          contract.shooter_status === "accepted_by_shooter" && (
            <View className="mb-3">
              {!bothOwnersAccepted && (
                <View className="bg-yellow-50 rounded-xl p-4 mb-3">
                  <View className="flex-row items-center mb-2">
                    <Users size={20} color="#f59e0b" />
                    <Text className="text-yellow-900 font-bold text-base ml-2">
                      Shooter Agreement Pending
                    </Text>
                  </View>
                  {contract.shooter && (
                    <View className="mb-3">
                      <Text className="text-yellow-800 text-sm mb-2">
                        {contract.shooter.name} has submitted their payment and
                        collateral terms. Both owners must approve to confirm.
                      </Text>
                      {/* Show submitted terms */}
                      <View className="bg-white rounded-lg p-3 mt-2">
                        <Text className="text-gray-700 font-semibold text-sm mb-2">
                          Submitted Terms:
                        </Text>
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-gray-600 text-sm">
                            Payment:
                          </Text>
                          <Text className="text-gray-900 text-sm font-semibold">
                            ₱{contract.shooter_payment?.toLocaleString()}
                          </Text>
                        </View>
                        {contract.shooter_collateral &&
                          contract.shooter_collateral > 0 && (
                            <View className="flex-row justify-between">
                              <Text className="text-gray-600 text-sm">
                                Collateral:
                              </Text>
                              <Text className="text-gray-900 text-sm font-semibold">
                                ₱{contract.shooter_collateral.toLocaleString()}
                              </Text>
                            </View>
                          )}
                      </View>
                    </View>
                  )}

                  {!hasCurrentUserAcceptedShooter ? (
                    // Show action buttons if current user hasn't accepted yet
                    <View className="flex-row space-x-2">
                      <TouchableOpacity
                        onPress={handleAcceptShooter}
                        disabled={isAcceptingShooter || isDecliningShooter}
                        className="flex-1 bg-[#10b981] py-3 rounded-full flex-row items-center justify-center mr-2"
                      >
                        {isAcceptingShooter ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <>
                            <Check size={18} color="white" />
                            <Text className="text-white font-semibold ml-1">
                              Accept Shooter
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleDeclineShooter}
                        disabled={isAcceptingShooter || isDecliningShooter}
                        className="flex-1 border border-red-500 py-3 rounded-full flex-row items-center justify-center"
                      >
                        {isDecliningShooter ? (
                          <ActivityIndicator color="#ef4444" size="small" />
                        ) : (
                          <>
                            <X size={18} color="#ef4444" />
                            <Text className="text-red-500 font-semibold ml-1">
                              Decline
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    // Show waiting message if current user has already accepted
                    <View className="bg-blue-50 rounded-lg p-3 flex-row items-center">
                      <Clock size={18} color="#3b82f6" />
                      <Text className="text-blue-800 text-sm ml-2">
                        You've accepted the shooter. Waiting for the other owner
                        to confirm.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

        {/* Breeding Completion Section */}
        {contract.status === "accepted" &&
          contract.can_mark_breeding_complete &&
          (!contract.breeding_status ||
            contract.breeding_status === "pending" ||
            contract.breeding_status === "in_progress") && (
            <View className="mt-3 border-t border-gray-200 pt-3">
              <View className="bg-blue-50 rounded-lg p-3 mb-3">
                <Text className="text-blue-900 font-semibold mb-1">
                  Mark Breeding Status
                </Text>
                <Text className="text-blue-700 text-sm">
                  {contract.is_shooter
                    ? "As the shooter, you can mark the breeding completion status."
                    : "As the male pet owner, you can mark the breeding completion status."}
                </Text>
              </View>

              {/* Optional Notes */}
              <TouchableOpacity
                onPress={() => setShowBreedingNotes(!showBreedingNotes)}
                className="mb-2"
              >
                <Text className="text-gray-600 text-sm">
                  {showBreedingNotes ? "Hide" : "Add"} notes (optional)
                </Text>
              </TouchableOpacity>

              {showBreedingNotes && (
                <TextInput
                  value={breedingNotes}
                  onChangeText={setBreedingNotes}
                  placeholder="Add any notes about the breeding..."
                  multiline
                  numberOfLines={3}
                  className="border border-gray-300 rounded-lg p-3 mb-3 text-gray-800"
                  style={{ textAlignVertical: "top" }}
                />
              )}

              <View>
                <TouchableOpacity
                  onPress={() => handleMarkBreedingComplete(true)}
                  disabled={isMarkingComplete}
                  style={{ backgroundColor: "#16a34a" }}
                  className="py-3 rounded-full flex-row items-center justify-center"
                >
                  {isMarkingComplete ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <CheckCircle size={18} color="white" />
                      <Text className="text-white font-semibold ml-1">
                        Complete (With Offspring)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleMarkBreedingComplete(false)}
                  disabled={isMarkingComplete}
                  className="border border-red-500 py-3 rounded-full flex-row items-center justify-center mt-2"
                >
                  {isMarkingComplete ? (
                    <ActivityIndicator color="#ef4444" size="small" />
                  ) : (
                    <>
                      <XCircle size={18} color="#ef4444" />
                      <Text className="text-red-500 font-semibold ml-1">
                        Failed/No Offspring
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

        {/* Breeding Status Display */}
        {contract.status === "accepted" && contract.breeding_status && (
          <View className="mt-3 border-t border-gray-200 pt-3">
            {contract.breeding_status === "completed" && (
              <View className="bg-green-50 rounded-lg p-3">
                <View className="flex-row items-center mb-1">
                  <CheckCircle size={16} color="#10b981" />
                  <Text className="text-green-800 font-semibold ml-2">
                    Breeding Complete
                  </Text>
                </View>
                <Text className="text-green-700 text-sm">
                  Marked as{" "}
                  {contract.has_offspring
                    ? "successful with offspring"
                    : "complete without offspring"}
                  {contract.breeding_completed_at &&
                    ` on ${dayjs(contract.breeding_completed_at).format(
                      "MMM D, YYYY"
                    )}`}
                </Text>
                {contract.breeding_notes && (
                  <Text className="text-green-600 text-sm mt-2 italic">
                    Note: {contract.breeding_notes}
                  </Text>
                )}

                {/* Add Offspring Button */}
                {contract.has_offspring && contract.can_input_offspring && (
                  <TouchableOpacity
                    onPress={() => setShowOffspringModal(true)}
                    style={{ backgroundColor: "#16a34a" }}
                    className="mt-3 py-2 rounded-full flex-row items-center justify-center"
                  >
                    <Baby size={16} color="white" />
                    <Text className="text-white font-semibold ml-1">
                      Add Offspring Details
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            {contract.breeding_status === "failed" && (
              <View className="bg-red-50 rounded-lg p-3">
                <View className="flex-row items-center mb-1">
                  <XCircle size={16} color="#ef4444" />
                  <Text className="text-red-800 font-semibold ml-2">
                    Breeding Failed
                  </Text>
                </View>
                <Text className="text-red-700 text-sm">
                  Marked as failed
                  {contract.breeding_completed_at &&
                    ` on ${dayjs(contract.breeding_completed_at).format(
                      "MMM D, YYYY"
                    )}`}
                </Text>
                {contract.breeding_notes && (
                  <Text className="text-red-600 text-sm mt-2 italic">
                    Note: {contract.breeding_notes}
                  </Text>
                )}
              </View>
            )}
            {contract.breeding_status === "in_progress" && (
              <View className="bg-yellow-50 rounded-lg p-3">
                <View className="flex-row items-center">
                  <Clock size={16} color="#f59e0b" />
                  <Text className="text-yellow-800 font-semibold ml-2">
                    Breeding In Progress
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        {contract.status === "pending_review" && (
          <View className="mt-3">
            {contract.can_accept && (
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={handleAccept}
                  disabled={isAccepting || isRejecting}
                  className="flex-1 bg-[#10b981] py-3 rounded-full flex-row items-center justify-center mr-2"
                >
                  {isAccepting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Check size={18} color="white" />
                      <Text className="text-white font-semibold ml-1">
                        Accept
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {contract.can_edit && (
                  <TouchableOpacity
                    onPress={onEdit}
                    disabled={isAccepting || isRejecting}
                    className="flex-1 border border-[#FF6B6B] py-3 rounded-full flex-row items-center justify-center mr-2"
                  >
                    <Edit size={18} color="#FF6B6B" />
                    <Text className="text-[#FF6B6B] font-semibold ml-1">
                      Edit
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleReject}
                  disabled={isAccepting || isRejecting}
                  className="flex-1 border border-red-500 py-3 rounded-full flex-row items-center justify-center"
                >
                  {isRejecting ? (
                    <ActivityIndicator color="#ef4444" size="small" />
                  ) : (
                    <>
                      <X size={18} color="#ef4444" />
                      <Text className="text-red-500 font-semibold ml-1">
                        Reject
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {!contract.can_accept && !contract.can_edit && (
              <View className="bg-blue-50 rounded-xl p-3">
                <Text className="text-blue-800 text-sm text-center">
                  Waiting for the other party to respond to your contract
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Footer */}
      <View className="border-t border-gray-100 px-4 py-2 bg-gray-50">
        <Text className="text-gray-400 text-xs text-center">
          {contract.is_creator
            ? "You created this contract"
            : "Contract from partner"}
          {" • "}
          {dayjs(contract.created_at).format("MMM D, YYYY h:mm A")}
        </Text>
      </View>

      {/* Shooter Edit Modal */}
      <ShooterContractEditModal
        visible={showShooterEditModal}
        onClose={() => setShowShooterEditModal(false)}
        onSuccess={handleShooterEditSuccess}
        contract={contract}
        onSubmit={handleShooterEditSubmit}
      />

      {/* Offspring Input Modal */}
      <OffspringInputModal
        visible={showOffspringModal}
        onClose={() => setShowOffspringModal(false)}
        contract={contract}
        onSuccess={onContractUpdate}
      />
    </View>
  );
}
