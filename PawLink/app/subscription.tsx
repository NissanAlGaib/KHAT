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
  StyleSheet,
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
import { Colors, Shadows } from "@/constants";
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

// ─── Gradient accents per plan (header strip only) ────────────────
const PLAN_HEADER_GRADIENTS: Record<string, readonly [string, string]> = {
  standard: ["#2563EB", "#60A5FA"] as const,
  premium: ["#D97706", "#FBBF24"] as const,
};

const PLAN_ACCENT: Record<string, string> = {
  standard: "#2563EB",
  premium: "#D97706",
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
    <View style={s.dotsContainer}>
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
          outputRange: [0.25, 1, 0.25],
          extrapolate: "clamp",
        });
        return (
          <RNAnimated.View
            key={i}
            style={{
              width: dotWidth,
              height: 6,
              borderRadius: 3,
              backgroundColor: Colors.primary,
              opacity: dotOpacity,
              marginHorizontal: 3,
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
      <View style={s.sectionPadding}>
        <View style={s.currentPlanCard}>
          <View style={s.currentPlanRow}>
            <View style={s.currentPlanLeft}>
              <View
                style={[
                  s.currentPlanIcon,
                  {
                    backgroundColor: isFreeTier
                      ? Colors.bgTertiary
                      : Colors.warningLight,
                  },
                ]}
              >
                <Feather
                  name={isFreeTier ? "user" : "award"}
                  size={18}
                  color={isFreeTier ? Colors.textMuted : Colors.warning}
                />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={s.currentPlanLabel}>CURRENT PLAN</Text>
                <Text style={s.currentPlanTier}>{tierLabel}</Text>
              </View>
            </View>
            {!isFreeTier && expiresAt ? (
              <View style={s.activeBadge}>
                <Text style={s.activeBadgeText}>Active</Text>
              </View>
            ) : isFreeTier ? (
              <View style={s.freeBadge}>
                <Text style={s.freeBadgeText}>Free Tier</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  // ─── Pending-payment banner ─────────────────────────────────────
  const renderPendingBanner = () => {
    if (!pendingPaymentId) return null;
    return (
      <View style={s.sectionPadding}>
        <View style={s.pendingBanner}>
          <Feather name="clock" size={20} color={Colors.warning} />
          <Text style={s.pendingText}>Payment pending verification</Text>
          <TouchableOpacity
            style={s.pendingVerifyBtn}
            onPress={() => checkPaymentStatus(pendingPaymentId)}
            disabled={checkingPayment}
          >
            {checkingPayment ? (
              <ActivityIndicator color={Colors.warning} size="small" />
            ) : (
              <Text style={s.pendingVerifyText}>Verify</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Billing toggle ─────────────────────────────────────────────
  const renderBillingToggle = () => (
    <View style={s.sectionPadding}>
      <View style={s.toggleContainer}>
        <TouchableOpacity
          style={[
            s.toggleOption,
            billingCycle === "monthly" && s.toggleOptionActive,
          ]}
          onPress={() => setBillingCycle("monthly")}
        >
          <Text
            style={[
              s.toggleText,
              billingCycle === "monthly" && s.toggleTextActive,
            ]}
          >
            Monthly
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.toggleOption,
            s.toggleOptionRight,
            billingCycle === "yearly" && s.toggleOptionActive,
          ]}
          onPress={() => setBillingCycle("yearly")}
        >
          <Text
            style={[
              s.toggleText,
              billingCycle === "yearly" && s.toggleTextActive,
            ]}
          >
            Yearly
          </Text>
          {plans.length > 0 && (
            <View style={s.savingsBadge}>
              <Text style={s.savingsText}>-{getMaxSavingsPercent()}%</Text>
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
    const headerGradient = PLAN_HEADER_GRADIENTS[plan.id] ?? [
      "#6B7280",
      "#9CA3AF",
    ];
    const accent = PLAN_ACCENT[plan.id] ?? Colors.textSecondary;
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
      <View style={{ width: CARD_WIDTH, marginHorizontal: CARD_SPACING / 2 }}>
        <View
          style={[
            s.planCard,
            plan.highlighted && {
              borderColor: PLAN_ACCENT[plan.id] || Colors.borderLight,
              borderWidth: 2,
            },
          ]}
        >
          {/* Gradient header strip */}
          <LinearGradient
            colors={headerGradient as unknown as string[]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.planHeader}
          >
            <View style={s.planHeaderRow}>
              <View style={s.planIconCircle}>
                <Feather name={plan.icon as any} size={18} color="#fff" />
              </View>
              <Text style={s.planHeaderName}>{plan.name}</Text>
            </View>
            {plan.highlighted && !isCurrentPlan && (
              <View style={s.bestValueBadge}>
                <Text style={s.bestValueText}>BEST VALUE</Text>
              </View>
            )}
            {isCurrentPlan && (
              <View style={s.currentBadge}>
                <Text style={s.currentBadgeText}>CURRENT</Text>
              </View>
            )}
          </LinearGradient>

          {/* White body */}
          <View style={s.planBody}>
            {/* Price */}
            <View style={s.priceRow}>
              <Text style={[s.priceAmount, { color: accent }]}>
                {formatPrice(price)}
              </Text>
              <Text style={s.pricePeriod}>
                /{billingCycle === "monthly" ? "mo" : "yr"}
              </Text>
            </View>
            {billingCycle === "yearly" && (
              <Text style={s.priceSaving}>
                {formatPrice(perMonthPrice)}/mo · Save{" "}
                <Text style={{ color: Colors.success }}>
                  {formatPrice(getYearlySavings(plan))}
                </Text>
              </Text>
            )}

            {/* Divider */}
            <View style={s.divider} />

            {/* Features list */}
            <View style={s.featuresList}>
              <Text style={s.featuresLabel}>WHAT'S INCLUDED</Text>
              {plan.features.map((feature, idx) => (
                <View key={idx} style={s.featureRow}>
                  <View
                    style={[s.featureCheck, { backgroundColor: accent + "15" }]}
                  >
                    <Feather name="check" size={13} color={accent} />
                  </View>
                  <Text style={s.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* CTA button */}
            <TouchableOpacity
              style={[
                s.ctaButton,
                isCurrentPlan
                  ? s.ctaButtonDisabled
                  : { backgroundColor: accent },
              ]}
              activeOpacity={0.8}
              onPress={() => !isCurrentPlan && handleSubscribe(plan)}
              disabled={isCurrentPlan || loadingPlan === plan.id}
            >
              {loadingPlan === plan.id ? (
                <ActivityIndicator
                  color={isCurrentPlan ? Colors.textDisabled : "#fff"}
                  size="small"
                />
              ) : (
                <Text
                  style={[
                    s.ctaText,
                    isCurrentPlan
                      ? { color: Colors.textDisabled }
                      : { color: "#fff" },
                  ]}
                >
                  {isCurrentPlan ? "Current Plan" : `Get ${plan.name}`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ─── Loading state ──────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.screen}>
        <SafeAreaView style={s.loadingCenter}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={s.loadingText}>Loading plans...</Text>
        </SafeAreaView>
      </View>
    );
  }

  // ─── Main render ────────────────────────────────────────────────
  return (
    <View style={s.screen}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.bgApp} />

        {/* ── Header ─────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={s.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.headerTitle}>Subscription</Text>
            <Text style={s.headerSubtitle}>
              Choose the plan that fits your needs
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
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
          <View style={s.sectionPadding}>
            <View style={s.freePlanCard}>
              <View style={s.freePlanHeader}>
                <View style={s.freePlanLeft}>
                  <View style={s.freePlanIconCircle}>
                    <Feather
                      name="heart"
                      size={16}
                      color={Colors.textDisabled}
                    />
                  </View>
                  <Text style={s.freePlanTitle}>Free Plan</Text>
                </View>
                <Text style={s.freePlanPrice}>₱0</Text>
              </View>
              <View style={s.freePlanFeatures}>
                {FREE_PLAN_FEATURES.map((f, i) => (
                  <View key={i} style={s.freePlanFeatureRow}>
                    <Feather
                      name="check"
                      size={12}
                      color={Colors.textDisabled}
                    />
                    <Text style={s.freePlanFeatureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* ── Footer info ────────────────────────────────────── */}
          <View style={s.sectionPadding}>
            <View style={s.footerCard}>
              <Feather
                name="shield"
                size={16}
                color={Colors.textDisabled}
                style={{ marginTop: 2 }}
              />
              <Text style={s.footerText}>
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
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgApp,
  },
  loadingCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: 16,
    fontSize: 15,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.bgPrimary,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
    borderRadius: 20,
    backgroundColor: Colors.bgTertiary,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },

  // Sections
  sectionPadding: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  // Current plan
  currentPlanCard: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 16,
    ...Shadows.sm,
  },
  currentPlanRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  currentPlanLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  currentPlanIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  currentPlanLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  currentPlanTier: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.successLight,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.success,
  },
  freeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.bgTertiary,
  },
  freeBadgeText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.textMuted,
  },

  // Pending banner
  pendingBanner: {
    backgroundColor: Colors.warningLight,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  pendingText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    fontWeight: "500",
    color: Colors.warning,
  },
  pendingVerifyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  pendingVerifyText: {
    color: Colors.warning,
    fontSize: 12,
    fontWeight: "700",
  },

  // Billing toggle
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: Colors.bgTertiary,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  toggleOptionRight: {
    flexDirection: "row",
  },
  toggleOptionActive: {
    backgroundColor: Colors.bgPrimary,
    ...Shadows.sm,
  },
  toggleText: {
    fontWeight: "600",
    fontSize: 14,
    color: Colors.textMuted,
  },
  toggleTextActive: {
    color: Colors.textPrimary,
  },
  savingsBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: Colors.successLight,
  },
  savingsText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.success,
  },

  // Plan card
  planCard: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.md,
  },
  planHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  planIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  planHeaderName: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  bestValueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  bestValueText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  currentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  currentBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  planBody: {
    padding: 20,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: "800",
  },
  pricePeriod: {
    fontSize: 15,
    color: Colors.textMuted,
    marginLeft: 4,
  },
  priceSaving: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 16,
  },
  featuresList: {
    marginBottom: 20,
  },
  featuresLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    marginLeft: 12,
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  ctaButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonDisabled: {
    backgroundColor: Colors.bgTertiary,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: "700",
  },

  // Pagination dots
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },

  // Free plan
  freePlanCard: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: 16,
  },
  freePlanHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  freePlanLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  freePlanIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bgTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  freePlanTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textMuted,
  },
  freePlanPrice: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textDisabled,
  },
  freePlanFeatures: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  freePlanFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 6,
  },
  freePlanFeatureText: {
    marginLeft: 6,
    fontSize: 12,
    color: Colors.textMuted,
  },

  // Footer
  footerCard: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  footerText: {
    marginLeft: 12,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textDisabled,
    flex: 1,
  },
});
