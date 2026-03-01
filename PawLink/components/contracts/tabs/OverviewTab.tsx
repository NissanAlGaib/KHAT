import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import {
  FileText,
  DollarSign,
  Users,
  Shield,
  Calendar,
  Check,
  X,
  Edit,
  Clock,
  UserCheck,
} from "lucide-react-native";
import dayjs from "dayjs";
import {
  BreedingContract,
  acceptContract,
  rejectContract,
  acceptShooterRequest,
  declineShooterRequest,
} from "@/services/contractService";

interface OverviewTabProps {
  contract: BreedingContract;
  onContractUpdate: (contract: BreedingContract) => void;
  onEdit: () => void;
}

// ─── Info Row ───
function InfoRow({
  label,
  value,
  emoji,
}: {
  label: string;
  value: string;
  emoji?: string;
}) {
  return (
    <View className="flex-row justify-between items-center py-2 border-b border-gray-50">
      <Text className="text-gray-500 text-sm">
        {emoji ? `${emoji} ` : ""}
        {label}
      </Text>
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
  emoji,
  children,
}: {
  title: string;
  emoji: string;
  children: React.ReactNode;
}) {
  return (
    <View className="bg-white rounded-2xl mx-4 mt-3 p-4 border border-gray-100">
      <Text className="font-bold text-gray-800 text-base mb-3">
        {emoji} {title}
      </Text>
      {children}
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
          title: "Contract Accepted! 🎉",
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

  return (
    <View className="pb-4">
      {/* Status Message */}
      {contract.status === "pending_review" && (
        <View className="mx-4 mt-3">
          {contract.can_accept ? (
            <View className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
              <Text className="text-yellow-800 font-bold text-base mb-1">
                ⏳ Awaiting Your Response
              </Text>
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
              <Text className="text-blue-800 font-bold text-base mb-1">
                📤 Contract Sent
              </Text>
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
          <Text className="text-green-800 font-bold text-base mb-1">
            ✅ Contract Active
          </Text>
          <Text className="text-green-700 text-sm">
            Accepted on {dayjs(contract.accepted_at).format("MMMM D, YYYY")}.
            Both parties have agreed to the terms.
          </Text>
        </View>
      )}

      {contract.status === "rejected" && (
        <View className="mx-4 mt-3 bg-red-50 rounded-2xl p-4 border border-red-200">
          <Text className="text-red-800 font-bold text-base mb-1">
            ❌ Contract Rejected
          </Text>
          <Text className="text-red-700 text-sm">
            Rejected on {dayjs(contract.rejected_at).format("MMMM D, YYYY")}.
            The match has ended.
          </Text>
        </View>
      )}

      {contract.status === "fulfilled" && (
        <View className="mx-4 mt-3 bg-purple-50 rounded-2xl p-4 border border-purple-200">
          <Text className="text-purple-800 font-bold text-base mb-1">
            🎉 Match Completed
          </Text>
          <Text className="text-purple-700 text-sm">
            This breeding contract has been fulfilled and archived
            {contract.breeding_completed_at &&
              ` on ${dayjs(contract.breeding_completed_at).format("MMMM D, YYYY")}`}
            .
          </Text>
        </View>
      )}

      {/* Compensation Section */}
      <SectionCard title="Compensation" emoji="💰">
        {contract.include_monetary_amount && contract.monetary_amount && (
          <InfoRow
            label="Money Payment"
            value={`₱${contract.monetary_amount.toLocaleString()}`}
          />
        )}
        {contract.share_offspring && (
          <>
            <InfoRow
              label="Offspring Split"
              value={`${contract.offspring_split_value}${contract.offspring_split_type === "percentage" ? "%" : " puppies"} (${contract.offspring_split_type === "percentage" ? "Percentage" : "Specific Number"})`}
            />
            <InfoRow
              label="Selection Method"
              value={
                contract.offspring_selection_method === "first_pick"
                  ? "👆 First Pick"
                  : "🎲 Randomized"
              }
            />
          </>
        )}
        {contract.include_goods_foods && contract.goods_foods_value && (
          <InfoRow
            label="Goods/Food Value"
            value={`₱${contract.goods_foods_value.toLocaleString()}`}
          />
        )}
        {!contract.include_monetary_amount &&
          !contract.share_offspring &&
          !contract.include_goods_foods && (
            <Text className="text-gray-400 text-sm italic">
              No compensation terms set
            </Text>
          )}
      </SectionCard>

      {/* Collateral & Timeline */}
      <SectionCard title="Protection" emoji="🛡️">
        {contract.end_contract_date && (
          <InfoRow
            label="End Date"
            value={dayjs(contract.end_contract_date).format("MMMM D, YYYY")}
            emoji="📅"
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
      </SectionCard>

      {/* Shooter Section */}
      {(contract.shooter_name ||
        contract.shooter_payment ||
        contract.is_shooter) && (
        <SectionCard title="Shooter Agreement" emoji="👤">
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
                        ⏳ Shooter Applied
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
                          Owner 1 {contract.owner1_accepted_shooter ? "✓" : ""}
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
                          Owner 2 {contract.owner2_accepted_shooter ? "✓" : ""}
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
                          You've accepted. Waiting for the other owner.
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
                        ✅ Shooter Confirmed
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
        <SectionCard title="Custom Terms" emoji="📝">
          <Text className="text-gray-700 text-sm">{contract.custom_terms}</Text>
        </SectionCard>
      )}

      {/* Standard Policies */}
      <SectionCard title="Standard Policies" emoji="📋">
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

      {/* Edit Button for accepted contracts */}
      {contract.status === "accepted" &&
        contract.can_edit &&
        !contract.can_shooter_edit && (
          <View className="mx-4 mt-4">
            <TouchableOpacity
              onPress={onEdit}
              className="bg-[#FF6B6B] py-3.5 rounded-full flex-row items-center justify-center"
            >
              <Edit size={18} color="white" />
              <Text className="text-white font-bold ml-2">Edit Contract</Text>
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
    </View>
  );
}
