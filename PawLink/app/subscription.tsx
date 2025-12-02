import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  StyleSheet,
  AppState,
  AppStateStatus,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import axiosInstance from "@/config/axiosConfig";
import { useSession } from "@/context/AuthContext";

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
    "monthly"
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
          `/api/payments/${paymentId}/verify`
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
    [router, showAlert, updateUser]
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
      handleAppStateChange
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

      // PayMongo requires HTTPS URLs for success/cancel redirects
      // For mobile apps, we use placeholder URLs since the actual redirect
      // happens in a browser and we verify payment status via API
      const successUrl = "https://pawlink.app/payment/success";
      const cancelUrl = "https://pawlink.app/payment/cancel";

      // Create a checkout session via the backend
      const response = await axiosInstance.post("/api/subscriptions/checkout", {
        plan_id: plan.id,
        billing_cycle: billingCycle,
        amount: amount,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      if (response.data.success && response.data.data?.checkout_url) {
        // Open the PayMongo checkout URL in the browser
        const canOpen = await Linking.canOpenURL(
          response.data.data.checkout_url
        );
        if (canOpen) {
          // Store the payment ID for status checking
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

      // Extract error message from response
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
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Pending Payment Banner */}
      {pendingPaymentId && (
        <View style={styles.pendingBanner}>
          <View style={styles.pendingBannerContent}>
            <Feather name="clock" size={20} color="#fff" />
            <Text style={styles.pendingBannerText}>
              Payment pending verification
            </Text>
          </View>
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={() => checkPaymentStatus(pendingPaymentId)}
            disabled={checkingPayment}
          >
            {checkingPayment ? (
              <ActivityIndicator color="#ea5b3a" size="small" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify Payment</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Billing Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              billingCycle === "monthly" && styles.toggleButtonActive,
            ]}
            onPress={() => setBillingCycle("monthly")}
          >
            <Text
              style={[
                styles.toggleText,
                billingCycle === "monthly" && styles.toggleTextActive,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              billingCycle === "yearly" && styles.toggleButtonActive,
            ]}
            onPress={() => setBillingCycle("yearly")}
          >
            <Text
              style={[
                styles.toggleText,
                billingCycle === "yearly" && styles.toggleTextActive,
              ]}
            >
              Yearly
            </Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>
                Save up to {getMaxSavingsPercentage()}%
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Subscription Plans */}
        {SUBSCRIPTION_PLANS.map((plan) => (
          <View
            key={plan.id}
            style={[
              styles.planCard,
              plan.highlighted && styles.planCardHighlighted,
            ]}
          >
            {plan.highlighted && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
            )}

            <Text style={styles.planName}>{plan.name}</Text>

            <View style={styles.priceContainer}>
              <Text style={styles.priceAmount}>
                {formatPrice(
                  billingCycle === "monthly"
                    ? plan.monthlyPrice
                    : plan.yearlyPrice
                )}
              </Text>
              <Text style={styles.pricePeriod}>
                /{billingCycle === "monthly" ? "month" : "year"}
              </Text>
            </View>

            {billingCycle === "yearly" && (
              <Text style={styles.savingsText}>
                Save {formatPrice(getYearlySavings(plan))} per year
              </Text>
            )}

            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Feather
                    name="check-circle"
                    size={18}
                    color={plan.highlighted ? "#ea5b3a" : "#10b981"}
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.subscribeButton,
                plan.highlighted && styles.subscribeButtonHighlighted,
              ]}
              onPress={() => handleSubscribe(plan)}
              disabled={loadingPlan !== null}
            >
              {loadingPlan === plan.id ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.subscribeButtonText}>
                  Subscribe to {plan.name}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ))}

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Feather name="info" size={20} color="#666" />
          <Text style={styles.infoText}>
            All plans include a 7-day free trial. Cancel anytime. Payments are
            processed securely via PayMongo.
          </Text>
        </View>
      </ScrollView>

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5F5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "white",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    position: "relative",
  },
  toggleButtonActive: {
    backgroundColor: "#ea5b3a",
  },
  toggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  toggleTextActive: {
    color: "white",
  },
  saveBadge: {
    position: "absolute",
    top: -8,
    right: 4,
    backgroundColor: "#10b981",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  saveBadgeText: {
    fontSize: 10,
    color: "white",
    fontWeight: "bold",
  },
  planCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  planCardHighlighted: {
    borderColor: "#ea5b3a",
    shadowColor: "#ea5b3a",
    shadowOpacity: 0.2,
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: 20,
    backgroundColor: "#ea5b3a",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  planName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ea5b3a",
  },
  pricePeriod: {
    fontSize: 16,
    color: "#666",
    marginLeft: 4,
  },
  savingsText: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "600",
    marginBottom: 16,
  },
  featuresContainer: {
    marginTop: 16,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  featureText: {
    fontSize: 15,
    color: "#444",
    marginLeft: 12,
  },
  subscribeButton: {
    backgroundColor: "#333",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  subscribeButtonHighlighted: {
    backgroundColor: "#ea5b3a",
  },
  subscribeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginLeft: 12,
    lineHeight: 20,
  },
  pendingBanner: {
    backgroundColor: "#ea5b3a",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pendingBannerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pendingBannerText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  verifyButton: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  verifyButtonText: {
    color: "#ea5b3a",
    fontSize: 14,
    fontWeight: "bold",
  },
});
