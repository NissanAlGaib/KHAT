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
  Dimensions,
  FlatList,
  Animated as RNAnimated,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "react-native";
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import { API_BASE_URL } from "@/config/env";
import { useSession } from "@/context/AuthContext";
import {
  getSubscriptionPlans,
  createSubscriptionCheckout,
  verifyPayment,
  type SubscriptionPlan,
} from "@/services/subscriptionService";
import axiosInstance from "@/config/axiosConfig";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH * 0.82;
const CARD_SPACING = 12;

// ─── Gradient presets per plan ────────────────────────────────────
const PLAN_GRADIENTS: Record<string, readonly [string, string, string]> = {
  standard: ["#1E3A5F", "#2563EB", "#60A5FA"] as const,
  premium: ["#7C2D12", "#D97706", "#FBBF24"] as const,
};

const GLASS_BG: Record<string, string> = {
  standard: "rgba(255,255,255,0.12)",
  premium: "rgba(255,255,255,0.14)",
};

// ─── Free plan card config ────────────────────────────────────────
const FREE_PLAN_FEATURES = [
  "1 pet profile",
  "3 matches per month",
  "1 AI generation per day",
  "Community support",
];

// ═══════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════
export default function SubscriptionScreen() {
  const router = useRouter();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();
  const { user, updateUser } = useSession();

  // Data state
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  // Billing & payment state
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [pendingPaymentId, setPendingPaymentId] = useState<number | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new RNAnimated.Value(0)).current;
  const appState = useRef(AppState.currentState);

  // ─── Fetch plans from API ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await getSubscriptionPlans();
        if (res.success) {
          setPlans(res.data);
          if (res.current_subscription) {
            setCurrentTier(res.current_subscription.tier);
            setExpiresAt(res.current_subscription.expires_at ?? null);
          }
        }
      } catch (e) {
        console.error("Error fetching subscription plans:", e);
        showAlert({
          title: "Error",
          message: "Could not load subscription plans. Please try again.",
          type: "error",
          buttons: [{ text: "Retry", onPress: () => router.back() }],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Payment verification ───────────────────────────────────────
  const checkPaymentStatus = useCallback(
    async (paymentId: number) => {
      setCheckingPayment(true);
      try {
        const response = await verifyPayment(paymentId);

        if (response.success && response.data?.status === "paid") {
          setPendingPaymentId(null);
          try {
            const userResponse = await axiosInstance.get("/api/user");
            await updateUser(userResponse.data);
          } catch (err) {
            console.error("Error refreshing user data:", err);
          }

          showAlert({
            title: "Welcome Aboard! 🎉",
            message:
              "Your subscription is now active. Enjoy all the premium features!",
            type: "success",
            buttons: [{ text: "Let's Go!", onPress: () => router.back() }],
          });
        } else if (response.data?.status === "expired") {
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
              "We haven't received your payment yet. It may take a moment to process.",
            type: "info",
            buttons: [
              { text: "Check Again" },
              { text: "Cancel", onPress: () => setPendingPaymentId(null) },
            ],
          });
        }
      } catch (error) {
        console.error("Error checking payment:", error);
        showAlert({
          title: "Error",
          message: "Unable to verify payment. Please try again.",
          type: "error",
          buttons: [{ text: "OK" }],
        });
      } finally {
        setCheckingPayment(false);
      }
    },
    [router, showAlert, updateUser],
  );

  // Auto-check on app foreground
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active" &&
        pendingPaymentId
      ) {
        await checkPaymentStatus(pendingPaymentId);
      }
      appState.current = nextAppState;
    };
    const sub = AppState.addEventListener("change", handleAppStateChange);
    return () => sub.remove();
  }, [pendingPaymentId, checkPaymentStatus]);

  // ─── Helpers ─────────────────────────────────────────────────────
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(price);

  const getYearlySavings = (plan: SubscriptionPlan) =>
    plan.monthly_price * 12 - plan.yearly_price;

  const getMaxSavingsPercent = () => {
    let max = 0;
    plans.forEach((p) => {
      const pct =
        ((p.monthly_price * 12 - p.yearly_price) / (p.monthly_price * 12)) *
        100;
      if (pct > max) max = pct;
    });
    return Math.round(max);
  };

  // ─── Subscribe handler ──────────────────────────────────────────
  const handleSubscribe = async (plan: SubscriptionPlan) => {
    setLoadingPlan(plan.id);
    try {
      const amount =
        billingCycle === "monthly" ? plan.monthly_price : plan.yearly_price;
      const successUrl = `${API_BASE_URL}/payment/redirect?status=success`;
      const cancelUrl = `${API_BASE_URL}/payment/redirect?status=cancel`;

      const res = await createSubscriptionCheckout({
        plan_id: plan.id,
        billing_cycle: billingCycle,
        amount,
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      if (res.success && res.data?.checkout_url) {
        const canOpen = await Linking.canOpenURL(res.data.checkout_url);
        if (canOpen) {
          const paymentId = res.data.payment_id;
          setPendingPaymentId(paymentId);
          await Linking.openURL(res.data.checkout_url);
          showAlert({
            title: "Complete Your Payment",
            message:
              "You've been redirected to PayMongo. Return here after paying to verify your subscription.",
            type: "info",
            buttons: [
              {
                text: "I've Paid",
                onPress: () => checkPaymentStatus(paymentId),
              },
              { text: "Cancel" },
            ],
          });
        } else {
          throw new Error("Cannot open payment URL");
        }
      } else {
        throw new Error(res.message || "Failed to create checkout");
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message || error.message || "An error occurred";
      showAlert({
        title: "Subscription Error",
        message: msg,
        type: "error",
        buttons: [{ text: "OK" }],
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  // ─── Pagination dot component ───────────────────────────────────
  const renderDots = () => (
    <View className="flex-row justify-center items-center mt-5 mb-2">
      {plans.map((_, i) => {
        const inputRange = [
          (i - 1) * (CARD_WIDTH + CARD_SPACING),
          i * (CARD_WIDTH + CARD_SPACING),
          (i + 1) * (CARD_WIDTH + CARD_SPACING),
        ];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: "clamp",
        });
        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });
        return (
          <RNAnimated.View
            key={i}
            style={{
              width: dotWidth,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#fff",
              opacity: dotOpacity,
              marginHorizontal: 4,
            }}
          />
        );
      })}
    </View>
  );

  // ─── Current-plan badge ─────────────────────────────────────────
  const renderCurrentPlanBadge = () => {
    const tierLabel =
      currentTier.charAt(0).toUpperCase() + currentTier.slice(1);
    const isFreeTier = currentTier === "free";

    return (
      <View className="mx-5 mb-4">
        <View
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: isFreeTier
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.12)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.15)",
          }}
        >
          <View className="px-4 py-3.5 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View
                className="rounded-full items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: isFreeTier
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(251,191,36,0.25)",
                }}
              >
                <Feather
                  name={isFreeTier ? "user" : "award"}
                  size={18}
                  color={isFreeTier ? "rgba(255,255,255,0.7)" : "#FBBF24"}
                />
              </View>
              <View className="ml-3 flex-1">
                <Text
                  className="text-xs font-medium"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  CURRENT PLAN
                </Text>
                <Text className="text-white text-base font-bold">
                  {tierLabel}
                </Text>
              </View>
            </View>
            {!isFreeTier && expiresAt && (
              <View
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: "rgba(34,197,94,0.2)" }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: "#4ADE80" }}
                >
                  Active
                </Text>
              </View>
            )}
            {isFreeTier && (
              <View
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Free Tier
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ─── Pending-payment banner ─────────────────────────────────────
  const renderPendingBanner = () => {
    if (!pendingPaymentId) return null;
    return (
      <View className="mx-5 mb-4">
        <View
          className="rounded-2xl overflow-hidden flex-row items-center px-4 py-3"
          style={{
            backgroundColor: "rgba(251,146,60,0.2)",
            borderWidth: 1,
            borderColor: "rgba(251,146,60,0.3)",
          }}
        >
          <Feather name="clock" size={20} color="#FB923C" />
          <Text
            className="flex-1 ml-3 text-sm font-medium"
            style={{ color: "#FDBA74" }}
          >
            Payment pending verification
          </Text>
          <TouchableOpacity
            className="px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            onPress={() => checkPaymentStatus(pendingPaymentId)}
            disabled={checkingPayment}
          >
            {checkingPayment ? (
              <ActivityIndicator color="#FDBA74" size="small" />
            ) : (
              <Text className="text-white text-xs font-bold">Verify</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Billing toggle ─────────────────────────────────────────────
  const renderBillingToggle = () => (
    <View className="mx-5 mb-5">
      <View
        className="flex-row rounded-2xl p-1"
        style={{
          backgroundColor: "rgba(255,255,255,0.1)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <TouchableOpacity
          className="flex-1 py-3 rounded-xl items-center"
          style={
            billingCycle === "monthly"
              ? {
                  backgroundColor: "rgba(255,255,255,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.2)",
                }
              : {}
          }
          onPress={() => setBillingCycle("monthly")}
        >
          <Text
            className="font-semibold text-sm"
            style={{
              color:
                billingCycle === "monthly" ? "#fff" : "rgba(255,255,255,0.5)",
            }}
          >
            Monthly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 py-3 rounded-xl items-center flex-row justify-center"
          style={
            billingCycle === "yearly"
              ? {
                  backgroundColor: "rgba(255,255,255,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.2)",
                }
              : {}
          }
          onPress={() => setBillingCycle("yearly")}
        >
          <Text
            className="font-semibold text-sm"
            style={{
              color:
                billingCycle === "yearly" ? "#fff" : "rgba(255,255,255,0.5)",
            }}
          >
            Yearly
          </Text>
          {plans.length > 0 && (
            <View
              className="ml-2 px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(34,197,94,0.25)" }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{ color: "#4ADE80" }}
              >
                -{getMaxSavingsPercent()}%
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Single plan card ───────────────────────────────────────────
  const renderPlanCard = ({
    item: plan,
    index,
  }: {
    item: SubscriptionPlan;
    index: number;
  }) => {
    const gradientColors = PLAN_GRADIENTS[plan.id] ?? [
      "#374151",
      "#6B7280",
      "#9CA3AF",
    ];
    const glassBg = GLASS_BG[plan.id] ?? "rgba(255,255,255,0.1)";
    const isCurrentPlan =
      currentTier === plan.id ||
      (currentTier === "basic" && plan.id === "standard");
    const price =
      billingCycle === "monthly" ? plan.monthly_price : plan.yearly_price;
    const perMonthPrice =
      billingCycle === "yearly"
        ? Math.round(plan.yearly_price / 12)
        : plan.monthly_price;

    return (
      <View
        style={{
          width: CARD_WIDTH,
          marginHorizontal: CARD_SPACING / 2,
        }}
      >
        <LinearGradient
          colors={gradientColors as unknown as string[]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-3xl overflow-hidden"
          style={{
            borderWidth: plan.highlighted ? 2 : 1,
            borderColor: plan.highlighted
              ? "rgba(251,191,36,0.4)"
              : "rgba(255,255,255,0.15)",
          }}
        >
          {/* Header area */}
          <View className="px-5 pt-5 pb-3">
            {/* Plan badge row */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View
                  className="rounded-full items-center justify-center mr-2.5"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: glassBg,
                  }}
                >
                  <Feather name={plan.icon as any} size={18} color="#fff" />
                </View>
                <Text className="text-white text-xl font-bold">
                  {plan.name}
                </Text>
              </View>
              {plan.highlighted && !isCurrentPlan && (
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(251,191,36,0.25)" }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: "#FCD34D" }}
                  >
                    BEST VALUE
                  </Text>
                </View>
              )}
              {isCurrentPlan && (
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(34,197,94,0.25)" }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: "#4ADE80" }}
                  >
                    CURRENT
                  </Text>
                </View>
              )}
            </View>

            {/* Price */}
            <View className="mb-1">
              <View className="flex-row items-end">
                <Text className="text-white text-4xl font-extrabold">
                  {formatPrice(price)}
                </Text>
                <Text
                  className="text-base ml-1 mb-1"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  /{billingCycle === "monthly" ? "mo" : "yr"}
                </Text>
              </View>
              {billingCycle === "yearly" && (
                <Text
                  className="text-sm mt-0.5"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {formatPrice(perMonthPrice)}/mo · Save{" "}
                  <Text style={{ color: "#4ADE80" }}>
                    {formatPrice(getYearlySavings(plan))}
                  </Text>
                </Text>
              )}
            </View>
          </View>

          {/* Divider */}
          <View
            className="mx-5"
            style={{
              height: 1,
              backgroundColor: "rgba(255,255,255,0.1)",
            }}
          />

          {/* Features list — glass effect */}
          <View
            className="mx-4 mt-4 mb-4 rounded-2xl px-4 py-4"
            style={{
              backgroundColor: glassBg,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text
              className="text-xs font-semibold mb-3 tracking-wider"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              WHAT'S INCLUDED
            </Text>
            {plan.features.map((feature, idx) => (
              <View key={idx} className="flex-row items-center mb-2.5">
                <View
                  className="rounded-full items-center justify-center"
                  style={{
                    width: 22,
                    height: 22,
                    backgroundColor: "rgba(255,255,255,0.12)",
                  }}
                >
                  <Feather name="check" size={13} color="#fff" />
                </View>
                <Text
                  className="ml-3 text-sm flex-1"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  {feature}
                </Text>
              </View>
            ))}
          </View>

          {/* CTA button */}
          <View className="px-5 pb-5">
            <TouchableOpacity
              className="rounded-xl py-3.5 items-center justify-center"
              style={{
                backgroundColor: isCurrentPlan
                  ? "rgba(255,255,255,0.15)"
                  : "#fff",
              }}
              activeOpacity={0.8}
              onPress={() => !isCurrentPlan && handleSubscribe(plan)}
              disabled={isCurrentPlan || loadingPlan === plan.id}
            >
              {loadingPlan === plan.id ? (
                <ActivityIndicator
                  color={isCurrentPlan ? "#fff" : gradientColors[1]}
                  size="small"
                />
              ) : (
                <Text
                  className="text-base font-bold"
                  style={{
                    color: isCurrentPlan
                      ? "rgba(255,255,255,0.5)"
                      : gradientColors[1],
                  }}
                >
                  {isCurrentPlan ? "Current Plan" : `Get ${plan.name}`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  };

  // ─── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <LinearGradient
        colors={["#0F172A", "#1E293B", "#334155"]}
        className="flex-1 items-center justify-center"
      >
        <SafeAreaView className="flex-1 items-center justify-center">
          <ActivityIndicator color="#fff" size="large" />
          <Text className="text-white mt-4 text-base">Loading plans...</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // ─── Main render ────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={["#0F172A", "#1E293B", "#334155"]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1" edges={["top"]}>
        <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

        {/* ── Header ─────────────────────────────────────────── */}
        <View className="px-5 pt-2 pb-4 flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={22} color="white" />
          </TouchableOpacity>
          <View className="flex-1 ml-3">
            <Text className="text-white text-xl font-bold">Subscription</Text>
            <Text
              className="text-xs mt-0.5"
              style={{ color: "rgba(255,255,255,0.5)" }}
            >
              Choose the plan that fits your needs
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Current plan badge ─────────────────────────────── */}
          {renderCurrentPlanBadge()}

          {/* ── Pending payment banner ─────────────────────────── */}
          {renderPendingBanner()}

          {/* ── Billing toggle ─────────────────────────────────── */}
          {renderBillingToggle()}

          {/* ── Plan cards carousel ────────────────────────────── */}
          <RNAnimated.FlatList
            ref={flatListRef}
            data={plans}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled={false}
            snapToInterval={CARD_WIDTH + CARD_SPACING}
            snapToAlignment="center"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal:
                (SCREEN_WIDTH - CARD_WIDTH) / 2 - CARD_SPACING / 2,
            }}
            renderItem={renderPlanCard}
            onScroll={RNAnimated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false },
            )}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING),
              );
              setActiveIndex(idx);
            }}
          />

          {/* ── Pagination dots ────────────────────────────────── */}
          {plans.length > 1 && renderDots()}

          {/* ── Free plan section ──────────────────────────────── */}
          <View className="mx-5 mt-6">
            <View
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <View className="px-5 py-4">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center">
                    <View
                      className="rounded-full items-center justify-center mr-2.5"
                      style={{
                        width: 32,
                        height: 32,
                        backgroundColor: "rgba(255,255,255,0.08)",
                      }}
                    >
                      <Feather
                        name="heart"
                        size={16}
                        color="rgba(255,255,255,0.4)"
                      />
                    </View>
                    <Text
                      className="text-base font-semibold"
                      style={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      Free Plan
                    </Text>
                  </View>
                  <Text
                    className="text-lg font-bold"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    ₱0
                  </Text>
                </View>
                <View className="flex-row flex-wrap">
                  {FREE_PLAN_FEATURES.map((f, i) => (
                    <View key={i} className="flex-row items-center mr-4 mb-1.5">
                      <Feather
                        name="check"
                        size={12}
                        color="rgba(255,255,255,0.3)"
                      />
                      <Text
                        className="ml-1.5 text-xs"
                        style={{ color: "rgba(255,255,255,0.4)" }}
                      >
                        {f}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>

          {/* ── Footer info ────────────────────────────────────── */}
          <View className="mx-5 mt-5">
            <View
              className="rounded-2xl overflow-hidden flex-row items-start px-4 py-3.5"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
              }}
            >
              <Feather
                name="shield"
                size={16}
                color="rgba(255,255,255,0.3)"
                style={{ marginTop: 2 }}
              />
              <Text
                className="ml-3 text-xs leading-5 flex-1"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                Payments are processed securely via PayMongo. Cancel anytime
                from your account settings.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </LinearGradient>
  );
}
