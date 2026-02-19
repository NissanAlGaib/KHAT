import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  AppState,
  AppStateStatus,
} from "react-native";
import { X, CreditCard, CheckCircle, Info } from "lucide-react-native";
import {
  createCheckout,
  verifyPayment,
  PaymentType,
} from "@/services/paymentService";
import { API_BASE_URL } from "@/config/env";

interface PaymentPromptModalProps {
  visible: boolean;
  contractId: number;
  paymentType: PaymentType;
  amount: number;
  label: string;
  description?: string;
  onSuccess: () => void;
  onDismiss: () => void;
}

export default function PaymentPromptModal({
  visible,
  contractId,
  paymentType,
  amount,
  label,
  description,
  onSuccess,
  onDismiss,
}: PaymentPromptModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState<number | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const appState = useRef(AppState.currentState);
  const pendingRef = useRef<number | null>(null);

  // Keep ref in sync so the AppState callback sees the latest value
  useEffect(() => {
    pendingRef.current = pendingPaymentId;
  }, [pendingPaymentId]);

  useEffect(() => {
    if (visible) {
      setPaymentConfirmed(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      scaleAnim.setValue(0);
      setPendingPaymentId(null);
      setPaymentConfirmed(false);
      setIsLoading(false);
      setIsVerifying(false);
    }
  }, [visible]);

  // Auto-verify when user returns to the app after paying
  useEffect(() => {
    const sub = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === "active" &&
          pendingRef.current !== null
        ) {
          handleVerify(pendingRef.current);
        }
        appState.current = nextState;
      },
    );
    return () => sub.remove();
  }, []);

  // Build redirect URLs that go through the backend → deep-link back
  const successUrl = `${API_BASE_URL}/payment/redirect?status=success`;
  const cancelUrl = `${API_BASE_URL}/payment/redirect?status=cancel`;

  const handlePay = async () => {
    setIsLoading(true);
    try {
      const result = await createCheckout({
        contract_id: contractId,
        payment_type: paymentType,
        amount,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      if (!result.success || !result.data) {
        Alert.alert(
          "Payment Error",
          result.message ||
            "Failed to create payment session. Please try again.",
        );
        return;
      }

      const { payment_id, checkout_url } = result.data;
      setPendingPaymentId(payment_id);

      const canOpen = await Linking.canOpenURL(checkout_url);
      if (!canOpen) {
        Alert.alert("Error", "Cannot open payment page. Please try again.");
        return;
      }

      await Linking.openURL(checkout_url);

      Alert.alert(
        "Complete Your Payment",
        "You've been redirected to PayMongo. After completing your payment, return to the app and tap 'Verify Payment'.",
        [
          {
            text: "Verify Payment",
            onPress: () => handleVerify(payment_id),
          },
          { text: "Later", style: "cancel" },
        ],
      );
    } catch {
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (paymentId: number) => {
    setIsVerifying(true);
    try {
      const result = await verifyPayment(paymentId);

      if (result.success && result.data?.status === "paid") {
        setPaymentConfirmed(true);
        // Auto-dismiss after showing success for 2 seconds
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        Alert.alert(
          "Payment Not Yet Confirmed",
          "Your payment hasn't been confirmed yet. Please complete the payment on PayMongo and try verifying again.",
          [{ text: "OK" }],
        );
      }
    } catch {
      Alert.alert("Error", "Failed to verify payment. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <Animated.View
          style={{ transform: [{ scale: scaleAnim }] }}
          className="bg-white rounded-t-3xl px-6 pt-6 pb-8"
        >
          {/* Payment Confirmed State */}
          {paymentConfirmed ? (
            <View className="items-center py-6">
              <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-4">
                <CheckCircle size={44} color="#10b981" />
              </View>
              <Text className="text-gray-900 font-bold text-xl mb-2">
                Payment Confirmed!
              </Text>
              <Text className="text-gray-500 text-sm text-center leading-5 mb-1">
                Your {label.toLowerCase()} has been received and deposited into
                the contract pool.
              </Text>
              <Text className="text-gray-400 text-xs mt-3">
                Closing automatically…
              </Text>
            </View>
          ) : (
            <>
              {/* Header */}
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center flex-1">
                  <CreditCard size={22} color="#FF6B6B" />
                  <Text
                    className="text-gray-900 font-bold text-lg ml-2 flex-1"
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onDismiss}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={22} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              {/* Description */}
              {description && (
                <Text className="text-gray-500 text-sm mb-4 leading-5">
                  {description}
                </Text>
              )}

              {/* Amount Display */}
              <View className="bg-gray-50 rounded-2xl p-5 mb-4 items-center">
                <Text className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                  Amount Due
                </Text>
                <Text className="text-[#FF6B6B] font-bold text-4xl">
                  ₱
                  {amount.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </Text>
              </View>

              {/* Info Banner */}
              <View className="bg-blue-50 rounded-xl p-3 mb-5 flex-row items-start">
                <Info size={16} color="#3b82f6" style={{ marginTop: 1 }} />
                <Text className="text-blue-700 text-sm ml-2 flex-1 leading-5">
                  You will be redirected to PayMongo to pay via GCash, card, or
                  other available methods. Funds are held securely in the
                  contract pool.
                </Text>
              </View>

              {/* Verify button — shown once a checkout was opened */}
              {pendingPaymentId !== null && (
                <TouchableOpacity
                  onPress={() => handleVerify(pendingPaymentId)}
                  disabled={isVerifying || isLoading}
                  className="border border-[#FF6B6B] py-3 rounded-full flex-row items-center justify-center mb-3"
                >
                  {isVerifying ? (
                    <ActivityIndicator color="#FF6B6B" size="small" />
                  ) : (
                    <>
                      <CheckCircle size={18} color="#FF6B6B" />
                      <Text className="text-[#FF6B6B] font-semibold ml-2">
                        Verify Payment
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Pay Now button */}
              <TouchableOpacity
                onPress={handlePay}
                disabled={isLoading || isVerifying}
                className="bg-[#FF6B6B] py-3 rounded-full flex-row items-center justify-center mb-3"
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <CreditCard size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">
                      {pendingPaymentId !== null
                        ? "Pay Again"
                        : "Pay Now via PayMongo"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Dismiss */}
              <TouchableOpacity
                onPress={onDismiss}
                className="py-2 items-center"
              >
                <Text className="text-gray-400 text-sm">Maybe Later</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
