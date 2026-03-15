import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from "react-native";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import {
  FileText,
  DollarSign,
  Shield,
  Calendar,
  Check,
  X,
  Edit,
  Clock,
  UserCheck,
  CreditCard,
  Baby,
  Shuffle,
  MousePointer,
  ShoppingBag,
  User,
  AlertTriangle,
  Send,
  CheckCircle,
  XCircle,
  Award,
} from "lucide-react-native";
import dayjs from "dayjs";
import {
  BreedingContract,
  acceptContract,
  rejectContract,
  cancelContract,
  acceptShooterRequest,
  declineShooterRequest,
} from "@/services/contractService";

type IconComponent = React.ComponentType<{ size: number; color: string }>;

interface OverviewTabProps {
  contract: BreedingContract;
  onContractUpdate: (contract: BreedingContract) => void;
  onEdit: () => void;
}

// ─── Info Row ───
function InfoRow({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string;
  Icon?: IconComponent;
}) {
  return (
    <View className="flex-row justify-between items-center py-2.5 border-b border-gray-50">
      <View className="flex-row items-center">
        {Icon && <Icon size={13} color="#9CA3AF" />}
        <Text className={`text-gray-500 text-sm ${Icon ? "ml-1.5" : ""}`}>
          {label}
        </Text>
      </View>
      <Text
        className="text-gray-900 font-semibold text-sm text-right flex-1 ml-4"
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Section Card ───
function SectionCard({
  title,
  Icon,
  iconColor = "#FF6B6B",
  children,
  noPadding = false,
}: {
  title: string;
  Icon: IconComponent;
  iconColor?: string;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <View className="bg-white rounded-2xl mx-4 mt-3 border border-gray-100">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <View
          className="w-7 h-7 rounded-lg items-center justify-center"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <Icon size={15} color={iconColor} />
        </View>
        <Text className="font-bold text-gray-800 text-base ml-2.5">
          {title}
        </Text>
      </View>
      <View className={noPadding ? "" : "px-4 pb-4"}>{children}</View>
    </View>
  );
}

export default function ContractOverviewTab({
  contract,
  onContractUpdate,
  onEdit,
}: OverviewTabProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isAcceptingShooter, setIsAcceptingShooter] = useState(false);
  const [isDecliningShooter, setIsDecliningShooter] = useState(false);
  const {
    visible: alertVisible,
    alertOptions,
    showAlert,
    hideAlert,
  } = useAlert();

  const collateralPerOwner = contract.collateral_total / 2;
  const hasCurrentUserAcceptedShooter =
    contract.current_user_accepted_shooter ?? false;
  const bothOwnersAccepted =
    contract.owner1_accepted_shooter && contract.owner2_accepted_shooter;

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const result = await acceptContract(contract.id);
      if (result.success && result.data) {
        onContractUpdate(result.data);
        showAlert({
          title: "Contract Accepted!",
          message:
            "Both parties have agreed to the terms. The contract is now active!",
          type: "success",
        });
      }
    } catch (error) {
      console.error("Error accepting contract:", error);
    } finally {
      setIsAccepting(false);
    }
  };

  const handleReject = async () => {
    showAlert({
      title: "Reject Contract?",
      message:
        "This will end the match. Are you sure you want to reject this contract?",
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          onPress: async () => {
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
          },
        },
      ],
    });
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

  const openCancelModal = () => {
    if (isCancelling) return;
    setCancellationReason("");
    setCancelModalVisible(true);
  };

  const closeCancelModal = () => {
    if (isCancelling) return;
    setCancelModalVisible(false);
  };

  const handleConfirmCancelContract = async () => {
    const reason = cancellationReason.trim();

    if (reason.length < 10) {
      showAlert({
        title: "Reason Required",
        message: "Please provide at least 10 characters for the cancellation reason.",
        type: "warning",
      });
      return;
    }

    setIsCancelling(true);
    try {
      const result = await cancelContract(contract.id, reason);

      if (result.success && result.data) {
        onContractUpdate(result.data);
        setCancelModalVisible(false);
        showAlert({
          title: "Contract Cancelled",
          message:
            result.message ||
            "The contract has been cancelled and the conversation archived.",
          type: "success",
        });
      } else {
        showAlert({
          title: "Unable to Cancel",
          message: result.message || "Failed to cancel contract",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error cancelling contract:", error);
      showAlert({
        title: "Error",
        message: "Failed to cancel contract",
        type: "error",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <View className="pb-4">
      {/* Status Message */}
      {contract.status === "pending_review" && (
        <View className="mx-4 mt-3">
          {contract.can_accept ? (
            <View className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
              <View className="flex-row items-center mb-1">
                <Clock size={18} color="#92400e" />
                <Text className="text-yellow-800 font-bold text-base ml-2">
                  Awaiting Your Response
                </Text>
              </View>
              <Text className="text-yellow-700 text-sm mb-4">
                Your breeding partner has sent you this contract. Review the
                terms below and accept or reject.
              </Text>
              <View className="flex-row">
                <TouchableOpacity
                  onPress={handleAccept}
                  disabled={isAccepting || isRejecting}
                  className="flex-1 bg-green-500 py-3 rounded-full flex-row items-center justify-center mr-2"
                >
                  {isAccepting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <>
                      <Check size={18} color="white" />
                      <Text className="text-white font-bold ml-2">Accept</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onEdit}
                  disabled={isAccepting || isRejecting}
                  className="flex-1 border-2 border-[#FF6B6B] py-3 rounded-full flex-row items-center justify-center mr-2"
                >
                  <Edit size={16} color="#FF6B6B" />
                  <Text className="text-[#FF6B6B] font-bold ml-1">Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleReject}
                  disabled={isAccepting || isRejecting}
                  className="flex-1 border-2 border-red-400 py-3 rounded-full flex-row items-center justify-center"
                >
                  {isRejecting ? (
                    <ActivityIndicator color="#ef4444" size="small" />
                  ) : (
                    <>
                      <X size={16} color="#ef4444" />
                      <Text className="text-red-500 font-bold ml-1">
                        Reject
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
              <View className="flex-row items-center mb-1">
                <Send size={16} color="#1e40af" />
                <Text className="text-blue-800 font-bold text-base ml-2">
                  Contract Sent
                </Text>
              </View>
              <Text className="text-blue-700 text-sm">
                Waiting for your breeding partner to review and respond to the
                contract.
              </Text>
            </View>
          )}
        </View>
      )}

      {contract.status === "accepted" && (
        <View className="mx-4 mt-3 bg-green-50 rounded-2xl p-4 border border-green-200">
          <View className="flex-row items-center mb-1">
            <CheckCircle size={18} color="#166534" />
            <Text className="text-green-800 font-bold text-base ml-2">
              Contract Active
            </Text>
          </View>
          <Text className="text-green-700 text-sm">
            Accepted on {dayjs(contract.accepted_at).format("MMMM D, YYYY")}.
            Both parties have agreed to the terms.
          </Text>
        </View>
      )}

      {contract.status === "rejected" && (
        <View className="mx-4 mt-3 bg-red-50 rounded-2xl p-4 border border-red-200">
          <View className="flex-row items-center mb-1">
            <XCircle size={18} color="#991b1b" />
            <Text className="text-red-800 font-bold text-base ml-2">
              Contract Rejected
            </Text>
          </View>
          <Text className="text-red-700 text-sm">
            Rejected on {dayjs(contract.rejected_at).format("MMMM D, YYYY")}.
            The match has ended.
          </Text>
        </View>
      )}

      {contract.status === "fulfilled" && (
        <View className="mx-4 mt-3 bg-purple-50 rounded-2xl p-4 border border-purple-200">
          <View className="flex-row items-center mb-1">
            <Award size={18} color="#6b21a8" />
            <Text className="text-purple-800 font-bold text-base ml-2">
              Match Completed
            </Text>
          </View>
          <Text className="text-purple-700 text-sm">
            This breeding contract has been fulfilled and archived
            {contract.breeding_completed_at &&
              ` on ${dayjs(contract.breeding_completed_at).format("MMMM D, YYYY")}`}
            .
          </Text>
        </View>
      )}

      {contract.status === "cancelled" && (
        <View className="mx-4 mt-3 bg-gray-50 rounded-2xl p-4 border border-gray-300">
          <View className="flex-row items-center mb-1">
            <XCircle size={18} color="#374151" />
            <Text className="text-gray-800 font-bold text-base ml-2">
              Contract Cancelled
            </Text>
          </View>
          <Text className="text-gray-700 text-sm">
            This contract was cancelled
            {contract.cancelled_at
              ? ` on ${dayjs(contract.cancelled_at).format("MMMM D, YYYY")}`
              : ""}
            .
          </Text>
          {contract.cancellation_reason && (
            <Text className="text-gray-600 text-xs mt-2">
              Reason: {contract.cancellation_reason}
            </Text>
          )}
        </View>
      )}

      {/* ─── Contract Terms (grouped card) ─── */}
      <SectionCard title="Contract Terms" Icon={FileText} iconColor="#FF6B6B">
        {/* Compensation subsection */}
        <View className="mb-1">
          <View className="flex-row items-center mb-1">
            <DollarSign size={13} color="#6B7280" />
            <Text className="text-gray-500 text-xs font-semibold ml-1 uppercase tracking-wide">
              Compensation
            </Text>
          </View>
          {contract.include_monetary_amount && contract.monetary_amount && (
            <InfoRow
              Icon={CreditCard}
              label="Money Payment"
              value={`₱${contract.monetary_amount.toLocaleString()}`}
            />
          )}
          {contract.share_offspring && (
            <>
              <InfoRow
                Icon={Baby}
                label="Offspring Split"
                value={`${contract.offspring_split_value}${contract.offspring_split_type === "percentage" ? "%" : " puppies"} (${contract.offspring_split_type === "percentage" ? "Percentage" : "Specific Number"})`}
              />
              <InfoRow
                Icon={
                  contract.offspring_selection_method === "first_pick"
                    ? MousePointer
                    : Shuffle
                }
                label="Selection Method"
                value={
                  contract.offspring_selection_method === "first_pick"
                    ? "First Pick"
                    : "Randomized"
                }
              />
            </>
          )}
          {contract.include_goods_foods && contract.goods_foods_value && (
            <InfoRow
              Icon={ShoppingBag}
              label="Goods/Food Value"
              value={`₱${contract.goods_foods_value.toLocaleString()}`}
            />
          )}
          {!contract.include_monetary_amount &&
            !contract.share_offspring &&
            !contract.include_goods_foods && (
              <Text className="text-gray-400 text-sm italic py-1">
                No compensation terms set
              </Text>
            )}
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-100 my-3" />

        {/* Protection subsection */}
        <View>
          <View className="flex-row items-center mb-1">
            <Shield size={13} color="#6B7280" />
            <Text className="text-gray-500 text-xs font-semibold ml-1 uppercase tracking-wide">
              Protection
            </Text>
          </View>
          {contract.end_contract_date && (
            <InfoRow
              Icon={Calendar}
              label="End Date"
              value={dayjs(contract.end_contract_date).format("MMMM D, YYYY")}
            />
          )}
          <InfoRow
            label="Total Collateral"
            value={`₱${contract.collateral_total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
          />
          <InfoRow
            label="Each Owner Pays"
            value={`₱${collateralPerOwner.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
          />
        </View>
      </SectionCard>

      {/* Shooter Section */}
      {(contract.shooter_name ||
        contract.shooter_payment ||
        contract.is_shooter) && (
        <SectionCard title="Shooter Agreement" Icon={User} iconColor="#6366f1">
          <InfoRow
            label="Name"
            value={contract.shooter_name || "Any verified shooter"}
          />
          {contract.shooter_payment && (
            <InfoRow
              label="Payment"
              value={`₱${contract.shooter_payment.toLocaleString()}`}
            />
          )}
          {contract.shooter_location && (
            <InfoRow label="Location" value={contract.shooter_location} />
          )}
          {contract.shooter_conditions && (
            <View className="mt-2 pt-2 border-t border-gray-100">
              <Text className="text-gray-500 text-xs mb-1">Conditions:</Text>
              <Text className="text-gray-700 text-sm">
                {contract.shooter_conditions}
              </Text>
            </View>
          )}

          {/* Shooter status */}
          {contract.shooter_status &&
            contract.shooter_status !== "none" &&
            contract.shooter_status !== "pending" && (
              <View className="mt-3 pt-3 border-t border-gray-100">
                {contract.shooter_status === "accepted_by_shooter" && (
                  <View className="bg-yellow-50 rounded-xl p-3">
                    <View className="flex-row items-center mb-2">
                      <Clock size={16} color="#f59e0b" />
                      <Text className="text-yellow-800 font-bold ml-2">
                        Shooter Applied
                      </Text>
                    </View>
                    {contract.shooter && (
                      <Text className="text-yellow-700 text-sm mb-2">
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
                          Owner 1 {contract.owner1_accepted_shooter ? "" : ""}
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
                          Owner 2 {contract.owner2_accepted_shooter ? "" : ""}
                        </Text>
                      </View>
                    </View>

                    {/* Shooter action buttons */}
                    {!contract.is_shooter &&
                      !bothOwnersAccepted &&
                      !hasCurrentUserAcceptedShooter && (
                        <View className="flex-row mt-3">
                          <TouchableOpacity
                            onPress={handleAcceptShooter}
                            disabled={isAcceptingShooter || isDecliningShooter}
                            className="flex-1 bg-green-500 py-2.5 rounded-full flex-row items-center justify-center mr-2"
                          >
                            {isAcceptingShooter ? (
                              <ActivityIndicator color="white" size="small" />
                            ) : (
                              <>
                                <Check size={16} color="white" />
                                <Text className="text-white font-bold ml-1 text-sm">
                                  Accept
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={handleDeclineShooter}
                            disabled={isAcceptingShooter || isDecliningShooter}
                            className="flex-1 border-2 border-red-400 py-2.5 rounded-full flex-row items-center justify-center"
                          >
                            {isDecliningShooter ? (
                              <ActivityIndicator color="#ef4444" size="small" />
                            ) : (
                              <>
                                <X size={16} color="#ef4444" />
                                <Text className="text-red-500 font-bold ml-1 text-sm">
                                  Decline
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      )}

                    {hasCurrentUserAcceptedShooter && !bothOwnersAccepted && (
                      <View className="bg-blue-50 rounded-lg p-2 mt-3 flex-row items-center">
                        <Clock size={14} color="#3b82f6" />
                        <Text className="text-blue-700 text-xs ml-2">
                          You&apos;ve accepted. Waiting for the other owner.
                        </Text>
                      </View>
                    )}

                    {contract.is_shooter && (
                      <View className="bg-blue-50 rounded-lg p-2 mt-3 flex-row items-center">
                        <Clock size={14} color="#3b82f6" />
                        <Text className="text-blue-700 text-xs ml-2">
                          Waiting for both owners to confirm.
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {contract.shooter_status === "accepted_by_owners" && (
                  <View className="bg-green-50 rounded-xl p-3">
                    <View className="flex-row items-center mb-1">
                      <Check size={16} color="#10b981" />
                      <Text className="text-green-800 font-bold ml-2">
                        Shooter Confirmed
                      </Text>
                    </View>
                    {contract.shooter && (
                      <Text className="text-green-700 text-sm">
                        {contract.shooter.name} is your confirmed shooter
                      </Text>
                    )}
                  </View>
                )}

                {contract.shooter_status === "declined" && (
                  <View className="bg-red-50 rounded-xl p-3 flex-row items-center">
                    <X size={16} color="#ef4444" />
                    <Text className="text-red-700 text-sm ml-2">
                      Shooter request was declined
                    </Text>
                  </View>
                )}
              </View>
            )}
        </SectionCard>
      )}

      {/* Custom Terms */}
      {contract.custom_terms && (
        <SectionCard title="Custom Terms" Icon={Edit} iconColor="#f59e0b">
          <Text className="text-gray-700 text-sm">{contract.custom_terms}</Text>
        </SectionCard>
      )}

      {/* Standard Policies */}
      <SectionCard
        title="Standard Policies"
        Icon={AlertTriangle}
        iconColor="#6B7280"
      >
        <View className="mb-3">
          <Text className="text-gray-700 font-semibold text-xs mb-1">
            Responsibility Policy
          </Text>
          <Text className="text-gray-500 text-xs leading-4">
            If a pet causes any incident, its owner is responsible for all
            medical expenses including anti-rabies shots and treatments.
          </Text>
        </View>
        <View>
          <Text className="text-gray-700 font-semibold text-xs mb-1">
            Cancellation Policy
          </Text>
          <Text className="text-gray-500 text-xs leading-4">
            Both parties must agree to cancel. No response within 3 days =
            auto-cancel. Breach may result in collateral forfeiture.
          </Text>
        </View>
      </SectionCard>

      {/* Actions for accepted contracts */}
      {contract.status === "accepted" && (
        <View className="mx-4 mt-4">
          {contract.can_edit && !contract.can_shooter_edit && (
            <TouchableOpacity
              onPress={onEdit}
              className="bg-[#FF6B6B] py-3.5 rounded-full flex-row items-center justify-center"
            >
              <Edit size={18} color="white" />
              <Text className="text-white font-bold ml-2">Edit Contract</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={openCancelModal}
            disabled={isCancelling}
            className={`py-3.5 rounded-full flex-row items-center justify-center border-2 border-red-400 ${
              contract.can_edit && !contract.can_shooter_edit ? "mt-3" : ""
            }`}
          >
            {isCancelling ? (
              <ActivityIndicator color="#ef4444" size="small" />
            ) : (
              <>
                <X size={18} color="#ef4444" />
                <Text className="text-red-500 font-bold ml-2">
                  Cancel Contract
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Footer */}
      <View className="mx-4 mt-4">
        <Text className="text-gray-400 text-xs text-center">
          {contract.is_creator
            ? "You created this contract"
            : "Contract from partner"}{" "}
          • {dayjs(contract.created_at).format("MMM D, YYYY h:mm A")}
        </Text>
      </View>

      <AlertModal
        visible={alertVisible}
        {...alertOptions}
        onClose={hideAlert}
      />

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCancelModal}
      >
        <View className="flex-1 bg-black/50 justify-center px-5">
          <View className="bg-white rounded-3xl p-5">
            <Text className="text-xl font-baloo text-text-primary mb-2">
              Cancel Contract
            </Text>
            <Text className="text-text-muted text-sm mb-3">
              Tell your partner why this match is being cancelled.
            </Text>

            <TextInput
              value={cancellationReason}
              onChangeText={setCancellationReason}
              placeholder="Enter cancellation reason"
              multiline
              numberOfLines={4}
              maxLength={1000}
              textAlignVertical="top"
              editable={!isCancelling}
              className="border border-gray-200 rounded-2xl p-3 text-gray-800 min-h-[110px]"
            />

            <Text className="text-xs text-gray-400 mt-2 text-right">
              {cancellationReason.trim().length}/1000 (min 10)
            </Text>

            <View className="flex-row mt-4 gap-3">
              <TouchableOpacity
                onPress={closeCancelModal}
                disabled={isCancelling}
                className="flex-1 bg-bg-muted py-3 rounded-full"
              >
                <Text className="text-center font-mulish-bold text-text-secondary">
                  Keep Contract
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmCancelContract}
                disabled={isCancelling || cancellationReason.trim().length < 10}
                className={`flex-1 py-3 rounded-full ${
                  isCancelling || cancellationReason.trim().length < 10
                    ? "bg-gray-400"
                    : "bg-error"
                }`}
              >
                {isCancelling ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-center font-mulish-bold text-white">
                    Cancel Contract
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
