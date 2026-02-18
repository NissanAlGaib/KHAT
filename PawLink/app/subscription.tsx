import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  AppState,
  AppStateStatus,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import axiosInstance from "@/config/axiosConfig";
import { useSession } from "@/context/AuthContext";
import {
  SettingsLayout,
  SettingsSection,
  SettingsButton,
} from "@/components/settings";

interface SubscriptionPlan {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlighted?: boolean;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "standard",
    name: "Standard",
    monthlyPrice: 199,
    yearlyPrice: 1990,
    features: [
      "Up to 3 pet profiles",
      "Basic matching algorithm",
      "Standard support",
      "Access to all pets",
      "View shooter profiles",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    monthlyPrice: 499,
    yearlyPrice: 4990,
    features: [
      "Unlimited pet profiles",
      "Advanced AI matching",
      "Priority support",
      "Featured pet listings",
      "Verified badge",
      "Analytics dashboard",
      "Contract templates",
      "Direct shooter booking",
    ],
    highlighted: true,
  },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const { updateUser } = useSession();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [pendingPaymentId, setPendingPaymentId] = useState<number | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const appState = useRef(AppState.currentState);

  const checkPaymentStatus = useCallback(
    async (paymentId: number) => {
      setCheckingPayment(true);
      try {
        const response = await axiosInstance.get(
          `/api/payments/${paymentId}/verify`,
        );

        if (response.data.success && response.data.data?.status === "paid") {
          setPendingPaymentId(null);

          // Refresh user data to get updated subscription tier
          try {
            const userResponse = await axiosInstance.get("/api/user");
            await updateUser(userResponse.data);
          } catch (error) {
            console.error("Error refreshing user data:", error);
          }

          showAlert({
            title: "Payment Successful! 🎉",
            message:
              "Your subscription has been activated. Enjoy your premium features!",
            type: "success",
            buttons: [
              {
                text: "OK",
                onPress: () => router.back(),
              },
            ],
          });
        } else if (response.data.data?.status === "expired") {
          setPendingPaymentId(null);
          showAlert({
            title: "Payment Expired",
            message: "The payment session has expired. Please try again.",
            type: "error",
            buttons: [{ text: "OK" }],
          });
        } else {
          showAlert({
            title: "Payment Pending",
            message:
              "We haven't received your payment yet. If you completed the payment, it may take a moment to process.",
            type: "info",
            buttons: [
              { text: "Check Again" },
              { text: "Cancel", onPress: () => setPendingPaymentId(null) },
            ],
          });
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        showAlert({
          title: "Error",
          message: "Unable to verify payment status. Please try again.",
          type: "error",
          buttons: [{ text: "OK" }],
        });
      } finally {
        setCheckingPayment(false);
      }
    },
    [router, showAlert, updateUser],
  );

  // Check payment status when app comes back to foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        pendingPaymentId
      ) {
        // App has come to the foreground, check payment status
        await checkPaymentStatus(pendingPaymentId);
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );
    return () => {
      subscription.remove();
    };
  }, [pendingPaymentId, checkPaymentStatus]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getYearlySavings = (plan: SubscriptionPlan) => {
    const monthlyTotal = plan.monthlyPrice * 12;
    const savings = monthlyTotal - plan.yearlyPrice;
    return savings;
  };

  const getMaxSavingsPercentage = () => {
    // Calculate the maximum savings percentage across all plans
    let maxSavings = 0;
    SUBSCRIPTION_PLANS.forEach((plan) => {
      const monthlyTotal = plan.monthlyPrice * 12;
      const savingsPercent =
        ((monthlyTotal - plan.yearlyPrice) / monthlyTotal) * 100;
      if (savingsPercent > maxSavings) {
        maxSavings = savingsPercent;
      }
    });
    return Math.round(maxSavings);
  };

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setLoadingPlan(plan.id);

    try {
      const amount =
        billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

      const successUrl = "https://pawlink.app/payment/success";
      const cancelUrl = "https://pawlink.app/payment/cancel";

      const response = await axiosInstance.post("/api/subscriptions/checkout", {
        plan_id: plan.id,
        billing_cycle: billingCycle,
        amount: amount,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      if (response.data.success && response.data.data?.checkout_url) {
        const canOpen = await Linking.canOpenURL(
          response.data.data.checkout_url,
        );
        if (canOpen) {
          const paymentId = response.data.data.payment_id;
          setPendingPaymentId(paymentId);

          await Linking.openURL(response.data.data.checkout_url);
          showAlert({
            title: "Complete Your Payment",
            message:
              "You've been redirected to PayMongo to complete your payment. After paying, return to the app and we'll verify your subscription.",
            type: "info",
            buttons: [
              {
                text: "I've Completed Payment",
                onPress: () => checkPaymentStatus(paymentId),
              },
              { text: "Cancel" },
            ],
          });
        } else {
          throw new Error("Cannot open payment URL");
        }
      } else {
        throw new Error(response.data.message || "Failed to create checkout");
      }
    } catch (error: any) {
      console.error("Subscription error:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "An error occurred";

      showAlert({
        title: "Subscription Error",
        message: errorMessage,
        type: "error",
        buttons: [{ text: "OK" }],
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <SettingsLayout headerTitle="Subscription Plans">
      {/* Pending Payment Banner */}
      {pendingPaymentId && (
        <View className="bg-orange-500 px-4 py-3 flex-row items-center justify-between mb-4 mx-4 rounded-xl shadow-sm">
          <View className="flex-row items-center flex-1">
            <Feather name="clock" size={20} color="#fff" />
            <Text className="text-white font-semibold ml-2">
              Pending Verification
            </Text>
          </View>
          <TouchableOpacity
            className="bg-white px-3 py-1.5 rounded-lg"
            onPress={() => checkPaymentStatus(pendingPaymentId)}
            disabled={checkingPayment}
          >
            {checkingPayment ? (
              <ActivityIndicator color="#ea5b3a" size="small" />
            ) : (
              <Text className="text-orange-600 font-bold text-xs">Verify</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Billing Toggle */}
      <View className="bg-white p-1 rounded-xl mb-6 mx-4 flex-row shadow-sm border border-gray-100">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg items-center ${billingCycle === "monthly" ? "bg-gray-900 shadow-sm" : ""}`}
          onPress={() => setBillingCycle("monthly")}
        >
          <Text
            className={`font-semibold ${billingCycle === "monthly" ? "text-white" : "text-gray-500"}`}
          >
            Monthly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg items-center ${billingCycle === "yearly" ? "bg-orange-600 shadow-sm" : ""}`}
          onPress={() => setBillingCycle("yearly")}
        >
          <View className="flex-row items-center">
            <Text
              className={`font-semibold ${billingCycle === "yearly" ? "text-white" : "text-gray-500"}`}
            >
              Yearly
            </Text>
            {billingCycle !== "yearly" && (
              <View className="ml-2 bg-green-100 px-1.5 py-0.5 rounded text-xs">
                <Text className="text-green-700 text-[10px] font-bold">
                  SAVE {getMaxSavingsPercentage()}%
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Subscription Plans */}
      {SUBSCRIPTION_PLANS.map((plan) => (
        <SettingsSection
          key={plan.id}
          className={plan.highlighted ? "border-2 border-orange-200" : ""}
        >
          <View className="p-5">
            {plan.highlighted && (
              <View className="absolute top-0 right-0 bg-orange-500 px-3 py-1 rounded-bl-xl rounded-tr-xl">
                <Text className="text-white text-xs font-bold">POPULAR</Text>
              </View>
            )}

            <Text className="text-xl font-bold text-gray-900 mb-2">
              {plan.name}
            </Text>

            <View className="flex-row items-baseline mb-1">
              <Text className="text-3xl font-bold text-orange-600">
                {formatPrice(
                  billingCycle === "monthly"
                    ? plan.monthlyPrice
                    : plan.yearlyPrice,
                )}
              </Text>
              <Text className="text-gray-500 ml-1">
                /{billingCycle === "monthly" ? "month" : "year"}
              </Text>
            </View>

            {billingCycle === "yearly" && (
              <Text className="text-green-600 text-sm font-medium mb-4">
                Save {formatPrice(getYearlySavings(plan))} per year
              </Text>
            )}

            <View className="mt-4 mb-6 space-y-3">
              {plan.features.map((feature, index) => (
                <View key={index} className="flex-row items-center mb-2">
                  <Feather
                    name="check"
                    size={18}
                    color={plan.highlighted ? "#ea5b3a" : "#10b981"}
                  />
                  <Text className="text-gray-600 ml-3 text-sm">{feature}</Text>
                </View>
              ))}
            </View>

            <SettingsButton
              title={`Subscribe to ${plan.name}`}
              onPress={() => handleSubscribe(plan)}
              loading={loadingPlan === plan.id}
              variant={plan.highlighted ? "primary" : "outline"}
              className="mx-0 mb-0"
            />
          </View>
        </SettingsSection>
      ))}

      {/* Info Section */}
      <View className="bg-gray-100 p-4 rounded-xl mx-4 flex-row items-start mb-6">
        <Feather name="lock" size={16} color="#666" style={{ marginTop: 2 }} />
        <Text className="text-gray-500 text-xs ml-3 leading-5 flex-1">
          All plans include a 7-day free trial. Cancel anytime. Payments are
          processed securely via PayMongo.
        </Text>
      </View>

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </SettingsLayout>
  );
}
