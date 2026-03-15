import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import {
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  DollarSign,
  Users,
  Info,
  RefreshCw,
  Settings,
  FileText,
} from "lucide-react-native";
import dayjs from "dayjs";
import { BreedingContract } from "@/services/contractService";
import { Payment, PaymentType } from "@/services/paymentService";
import PaymentPromptModal from "@/components/contracts/PaymentPromptModal";
import { API_BASE_URL } from "@/config/env";

interface PaymentsTabProps {
  contract: BreedingContract;
  payments: Payment[];
  currentUserId: number;
  onPaymentSuccess: () => void;
}

interface PaymentCardProps {
  iconElement: React.ReactNode;
  title: string;
  description: string;
  amount: number;
  isPaid: boolean;
  canPay: boolean;
  onPay: () => void;
}

function PaymentCard({
  iconElement,
  title,
  description,
  amount,
  isPaid,
  canPay,
  onPay,
}: PaymentCardProps) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
      <View className="flex-row items-start">
        <View
          className={`w-12 h-12 rounded-full items-center justify-center ${isPaid ? "bg-green-100" : "bg-[#FF6B6B]/10"}`}
        >
          {isPaid ? <CheckCircle size={22} color="#10b981" /> : iconElement}
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-bold text-gray-800 text-base">{title}</Text>
          <Text className="text-xs text-gray-500 mt-0.5">{description}</Text>
          <Text className="text-[#FF6B6B] font-bold text-lg mt-1">
            ₱{amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>

      {isPaid ? (
        <View className="mt-3 bg-green-50 rounded-full py-2.5 flex-row items-center justify-center">
          <CheckCircle size={16} color="#10b981" />
          <Text className="text-green-700 font-bold ml-2 text-sm">Paid</Text>
        </View>
      ) : canPay ? (
        <TouchableOpacity
          onPress={onPay}
          className="mt-3 bg-[#FF6B6B] rounded-full py-3 flex-row items-center justify-center"
        >
          <CreditCard size={16} color="white" />
          <Text className="text-white font-bold ml-2 text-sm">Pay Now</Text>
        </TouchableOpacity>
      ) : (
        <View className="mt-3 bg-gray-100 rounded-full py-2.5 flex-row items-center justify-center">
          <Clock size={16} color="#9CA3AF" />
          <Text className="text-gray-500 font-semibold ml-2 text-sm">
            Awaiting Payment
          </Text>
        </View>
      )}
    </View>
  );
}

export default function ContractPaymentsTab({
  contract,
  payments,
  currentUserId,
  onPaymentSuccess,
}: PaymentsTabProps) {
  const [paymentModalConfig, setPaymentModalConfig] = useState<{
    type: PaymentType;
    amount: number;
    label: string;
    description?: string;
  } | null>(null);

  const isTypePaidByCurrentUser = (type: PaymentType): boolean =>
    payments.some(
      (p) =>
        p.payment_type === type &&
        p.user_id === currentUserId &&
        p.status === "paid",
    );

  const isTypePaidByAny = (type: PaymentType): boolean =>
    payments.some((p) => p.payment_type === type && p.status === "paid");

  const openPaymentModal = (
    type: PaymentType,
    amount: number,
    label: string,
    description?: string,
  ) => setPaymentModalConfig({ type, amount, label, description });

  const handlePaymentSuccess = () => {
    setPaymentModalConfig(null);
    onPaymentSuccess();
  };

  if (contract.status !== "accepted" && contract.status !== "fulfilled") {
    return (
      <View className="items-center justify-center py-16 px-6">
        <CreditCard size={40} color="#9CA3AF" />
        <Text className="text-gray-800 font-bold text-lg mb-2 text-center mt-3">
          Payments Not Available Yet
        </Text>
        <Text className="text-gray-500 text-sm text-center">
          Payments become available once both parties have accepted the
          contract.
        </Text>
      </View>
    );
  }

  return (
    <View className="px-4 pt-3">
      {/* Guide banner */}
      <View className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100">
        <View className="flex-row items-center mb-1">
          <Info size={16} color="#1e40af" />
          <Text className="text-blue-800 font-bold text-sm ml-1.5">
            How Payments Work
          </Text>
        </View>
        <Text className="text-blue-700 text-xs leading-4">
          Payments are processed securely through PayMongo. Collateral is held
          safely and refunded when the contract is fulfilled. All payments are
          tracked here.
        </Text>
      </View>

      {/* Collateral Payment */}
      {!contract.is_shooter && contract.collateral_per_owner > 0 && (
        <PaymentCard
          iconElement={<Shield size={22} color="#FF6B6B" />}
          title="Collateral Deposit"
          description="Security bond — refunded when contract is fulfilled (5% platform fee)"
          amount={contract.collateral_per_owner}
          isPaid={isTypePaidByCurrentUser("collateral")}
          canPay={!isTypePaidByCurrentUser("collateral")}
          onPay={() =>
            openPaymentModal(
              "collateral",
              contract.collateral_per_owner,
              "Pay Collateral",
              `Security bond of ₱${contract.collateral_per_owner.toLocaleString("en-PH", { minimumFractionDigits: 2 })} per owner. Fully refunded when the contract is fulfilled.`,
            )
          }
        />
      )}

      {/* Monetary Compensation */}
      {!contract.is_shooter &&
        contract.include_monetary_amount &&
        contract.monetary_amount && (
          <PaymentCard
            iconElement={<DollarSign size={22} color="#FF6B6B" />}
            title="Monetary Compensation"
            description="Breeding compensation as agreed in the contract"
            amount={contract.monetary_amount}
            isPaid={isTypePaidByAny("monetary_compensation")}
            canPay={!isTypePaidByAny("monetary_compensation")}
            onPay={() =>
              openPaymentModal(
                "monetary_compensation",
                contract.monetary_amount!,
                "Pay Compensation",
                `Breeding compensation as agreed in Contract #${contract.id}.`,
              )
            }
          />
        )}

      {/* Shooter Payment (for owners) */}
      {!contract.is_shooter &&
        contract.shooter_status === "accepted_by_owners" &&
        contract.shooter_payment && (
          <PaymentCard
            iconElement={<Users size={22} color="#FF6B6B" />}
            title="Shooter Fee"
            description={`Service fee for shooter ${contract.shooter?.name ?? contract.shooter_name ?? "confirmed shooter"}`}
            amount={contract.shooter_payment}
            isPaid={isTypePaidByCurrentUser("shooter_payment")}
            canPay={!isTypePaidByCurrentUser("shooter_payment")}
            onPay={() =>
              openPaymentModal(
                "shooter_payment",
                contract.shooter_payment!,
                "Pay Shooter Fee",
                `Service fee for shooter ${contract.shooter?.name ?? contract.shooter_name ?? "confirmed shooter"}.`,
              )
            }
          />
        )}

      {/* Shooter Collateral (for shooter) */}
      {contract.is_shooter &&
        contract.shooter_collateral &&
        contract.shooter_collateral > 0 && (
          <PaymentCard
            iconElement={<Shield size={22} color="#FF6B6B" />}
            title="Shooter Collateral"
            description="Security deposit as shooter — refunded after breeding is complete"
            amount={contract.shooter_collateral}
            isPaid={isTypePaidByCurrentUser("shooter_collateral")}
            canPay={!isTypePaidByCurrentUser("shooter_collateral")}
            onPay={() =>
              openPaymentModal(
                "shooter_collateral",
                contract.shooter_collateral!,
                "Pay Shooter Collateral",
                `Security deposit as shooter for Contract #${contract.id}. Fully refunded after breeding is complete.`,
              )
            }
          />
        )}

      {/* Payment History */}
      {payments.length > 0 && (
        <View className="mt-4">
          <View className="flex-row items-center mb-3">
            <FileText size={18} color="#374151" />
            <Text className="font-bold text-gray-800 text-base ml-1.5">
              Payment History
            </Text>
          </View>
          {payments.map((payment) => {
            const effectiveStatus =
              payment.pool_status === "released"
                ? "released"
                : payment.pool_status === "in_pool" && payment.status === "paid"
                  ? "in_pool"
                  : payment.pool_status === "frozen"
                    ? "frozen"
                    : payment.status;

            const statusIconMap: Record<
              string,
              { iconComponent: React.ReactNode; color: string; label: string }
            > = {
              paid: { iconComponent: <CheckCircle size={18} color="#15803d" />, color: "text-green-700", label: "Paid" },
              released: {
                iconComponent: <CheckCircle size={18} color="#2563eb" />,
                color: "text-blue-700",
                label: "Released",
              },
              in_pool: {
                iconComponent: <Clock size={18} color="#1d4ed8" />,
                color: "text-blue-700",
                label: "Held in Pool",
              },
              frozen: {
                iconComponent: <AlertCircle size={18} color="#1d4ed8" />,
                color: "text-blue-700",
                label: "Frozen",
              },
              pending: {
                iconComponent: <Clock size={18} color="#a16207" />,
                color: "text-yellow-700",
                label: "Pending",
              },
              awaiting_payment: {
                iconComponent: <CreditCard size={18} color="#1d4ed8" />,
                color: "text-blue-700",
                label: "Awaiting",
              },
              failed: { iconComponent: <AlertCircle size={18} color="#dc2626" />, color: "text-red-700", label: "Failed" },
              expired: {
                iconComponent: <Clock size={18} color="#6b7280" />,
                color: "text-gray-500",
                label: "Expired",
              },
              refunded: {
                iconComponent: <RefreshCw size={18} color="#7c3aed" />,
                color: "text-purple-700",
                label: "Refunded",
              },
              processing: {
                iconComponent: <Settings size={18} color="#1d4ed8" />,
                color: "text-blue-700",
                label: "Processing",
              },
            };
            const config = statusIconMap[effectiveStatus] || statusIconMap.pending;

            return (
              <View
                key={payment.id}
                className="bg-gray-50 rounded-xl p-3 mb-2 flex-row items-center"
              >
                <View className="mr-3">{config.iconComponent}</View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-semibold text-sm">
                    {payment.description ||
                      payment.payment_type
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    {payment.paid_at
                      ? dayjs(payment.paid_at).format("MMM D, YYYY h:mm A")
                      : dayjs(payment.created_at).format("MMM D, YYYY")}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-gray-900 font-bold text-sm">
                    ₱{payment.amount.toLocaleString()}
                  </Text>
                  <Text className={`text-xs font-semibold ${config.color}`}>
                    {config.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* No payments yet */}
      {payments.length === 0 &&
        contract.collateral_per_owner <= 0 &&
        !contract.include_monetary_amount && (
          <View className="items-center py-12">
            <DollarSign size={40} color="#9CA3AF" />
            <Text className="text-gray-400 text-sm text-center mt-3">
              No payments required for this contract
            </Text>
          </View>
        )}

      {/* Payment Modal */}
      {paymentModalConfig && (
        <PaymentPromptModal
          visible={paymentModalConfig !== null}
          contractId={contract.id}
          paymentType={paymentModalConfig.type}
          amount={paymentModalConfig.amount}
          label={paymentModalConfig.label}
          description={paymentModalConfig.description}
          onSuccess={handlePaymentSuccess}
          onDismiss={() => setPaymentModalConfig(null)}
        />
      )}
    </View>
  );
}
