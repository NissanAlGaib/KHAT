import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  AppState,
  AppStateStatus,
  Linking,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CheckCircle, CreditCard, Info, X } from "lucide-react-native";
import AlertModal from "@/components/core/AlertModal";
import { useAlert } from "@/hooks/useAlert";
import { API_BASE_URL } from "@/config/env";
import { createMatchPayment } from "@/services/matchRequestService";
import { verifyPayment } from "@/services/paymentService";

interface MatchPaymentPromptModalProps {
  visible: boolean;
  requesterPetId: number;
  targetPetId: number;
  amount: number;
  onSuccess: () => Promise<void> | void;
  onDismiss: () => void;
}

export default function MatchPaymentPromptModal({
  visible,
  requesterPetId,
  targetPetId,
  amount,
  onSuccess,
  onDismiss,
}: MatchPaymentPromptModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingPaymentId, setPendingPaymentId] = useState<number | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const appState = useRef(AppState.currentState);
  const pendingRef = useRef<number | null>(null);
  const {
    visible: alertVisible,
    alertOptions,
    showAlert,
    hideAlert,
  } = useAlert();

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
      return;
    }

    scaleAnim.setValue(0);
    setPendingPaymentId(null);
    setPaymentConfirmed(false);
    setIsLoading(false);
    setIsVerifying(false);
  }, [visible, scaleAnim]);

  const successUrl = `${API_BASE_URL}/payment/redirect?status=success`;
  const cancelUrl = `${API_BASE_URL}/payment/redirect?status=cancel`;

  const handleVerify = useCallback(
    async (paymentId: number) => {
      setIsVerifying(true);

      try {
        const result = await verifyPayment(paymentId);

        if (result.success && result.data?.status === "paid") {
          setPaymentConfirmed(true);
          setTimeout(async () => {
            await onSuccess();
          }, 1500);
          return;
        }

        if (result.data?.status === "expired") {
          setPendingPaymentId(null);
          showAlert({
            title: "Payment Expired",
            message:
              "Your payment session has expired. Start a new payment session to continue.",
            type: "warning",
          });
          return;
        }

        showAlert({
          title: "Payment Not Yet Confirmed",
          message:
            "Your payment has not been confirmed yet. Finish payment on PayMongo, then verify again.",
          type: "warning",
        });
      } catch {
        showAlert({
          title: "Error",
          message: "Failed to verify payment. Please try again.",
          type: "error",
        });
      } finally {
        setIsVerifying(false);
      }
    },
    [onSuccess, showAlert],
  );

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
  }, [handleVerify]);

  const handlePay = async () => {
    setIsLoading(true);

    try {
      const result = await createMatchPayment(
        requesterPetId,
        targetPetId,
        successUrl,
        cancelUrl,
      );

      if (!result.success || !result.data) {
        showAlert({
          title: "Payment Error",
          message:
            result.message ||
            "Failed to create payment session. Please try again.",
          type: "error",
        });
        return;
      }

      const { payment_id, checkout_url } = result.data;
      setPendingPaymentId(payment_id);

      const canOpen = await Linking.canOpenURL(checkout_url);
      if (!canOpen) {
        showAlert({
          title: "Error",
          message: "Cannot open payment page. Please try again.",
          type: "error",
        });
        return;
      }

      await Linking.openURL(checkout_url);

      showAlert({
        title: "Complete Your Payment",
        message:
          "You've been redirected to PayMongo. After payment, return to the app and tap Verify Payment.",
        type: "info",
        buttons: [
          {
            text: "Verify Payment",
            onPress: () => handleVerify(payment_id),
          },
          { text: "Later", style: "cancel" },
        ],
      });
    } catch {
      showAlert({
        title: "Error",
        message: "An unexpected error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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
            {paymentConfirmed ? (
              <View className="items-center py-6">
                <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-4">
                  <CheckCircle size={44} color="#10b981" />
                </View>
                <Text className="text-gray-900 font-bold text-xl mb-2">
                  Payment Confirmed!
                </Text>
                <Text className="text-gray-500 text-sm text-center leading-5 mb-1">
                  Your match request fee is confirmed. We are now sending your
                  request.
                </Text>
                <Text className="text-gray-400 text-xs mt-3">
                  Closing automatically...
                </Text>
              </View>
            ) : (
              <>
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center flex-1">
                    <CreditCard size={22} color="#FF6B6B" />
                    <Text
                      className="text-gray-900 font-bold text-lg ml-2 flex-1"
                      numberOfLines={1}
                    >
                      Match Request Fee
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={onDismiss}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={22} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <Text className="text-gray-500 text-sm mb-4 leading-5">
                  Complete payment to unlock this match request for the selected
                  pet.
                </Text>

                <View className="bg-gray-50 rounded-2xl p-5 mb-4 items-center">
                  <Text className="text-gray-400 text-xs uppercase tracking-wider mb-1">
                    Amount Due
                  </Text>
                  <Text className="text-[#FF6B6B] font-bold text-4xl">
                    ₱
                    {amount.toLocaleString("en-PH", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </View>

                <View className="bg-blue-50 rounded-xl p-3 mb-5 flex-row items-start">
                  <Info size={16} color="#3b82f6" style={{ marginTop: 1 }} />
                  <Text className="text-blue-700 text-sm ml-2 flex-1 leading-5">
                    You will be redirected to PayMongo to pay via GCash, card,
                    or other available methods.
                  </Text>
                </View>

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

      <AlertModal
        visible={alertVisible}
        {...alertOptions}
        onClose={hideAlert}
      />
    </>
  );
}
