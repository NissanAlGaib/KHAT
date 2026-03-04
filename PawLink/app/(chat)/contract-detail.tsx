import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  FileText,
  CreditCard,
  ClipboardList,
  Heart,
  Baby,
  ChevronRight,
  CheckCircle,
  Edit,
  Clock,
  XCircle,
  Award,
  DollarSign,
  Handshake,
  Activity,
  Star,
} from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import {
  BreedingContract,
  getContract,
  getOffspring,
  getOffspringAllocationSummary,
  AllocationSummaryData,
} from "@/services/contractService";
import { getContractPayments, Payment } from "@/services/paymentService";
import { useSession } from "@/context/AuthContext";
import { ReviewModal } from "@/components/reviews";
import {
  submitBreederReview,
  submitShooterReview,
  submitBreederReviewAsShooter,
  getReviewStatus,
} from "@/services/reviewService";
import type { ReviewStatus } from "@/types/Review";

// Tab components
import ContractOverviewTab from "@/components/contracts/tabs/OverviewTab";
import ContractPaymentsTab from "@/components/contracts/tabs/PaymentsTab";
import ContractReportsTab from "@/components/contracts/tabs/ReportsTab";
import ContractBreedingTab from "@/components/contracts/tabs/BreedingTab";
import ContractOffspringTab from "@/components/contracts/tabs/OffspringTab";

type TabId = "overview" | "payments" | "reports" | "breeding" | "offspring";

type IconComponent = React.ComponentType<{ size: number; color: string }>;

interface TabConfig {
  id: TabId;
  label: string;
  Icon: IconComponent;
}

const ALL_TABS: TabConfig[] = [
  { id: "overview", label: "Overview", Icon: FileText },
  { id: "payments", label: "Payments", Icon: CreditCard },
  { id: "reports", label: "Reports", Icon: ClipboardList },
  { id: "breeding", label: "Breeding", Icon: Heart },
  { id: "offspring", label: "Offspring", Icon: Baby },
];

// ─── Simplified 5-stage lifecycle ──────────────────────────
interface LifecycleStage {
  id: string;
  label: string;
  Icon: IconComponent;
  description: string;
  isComplete: (ctx: StageContext) => boolean;
  isActive: (ctx: StageContext) => boolean;
  tab: TabId;
}

interface StageContext {
  c: BreedingContract;
  payments: Payment[];
  userId: number;
  hasOffspring: boolean;
  allocationData: AllocationSummaryData | null;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: "create",
    label: "Create",
    Icon: Edit,
    description: "Draft your breeding agreement",
    isComplete: (ctx) => ctx.c.status !== "draft",
    isActive: (ctx) =>
      ctx.c.status === "draft" || ctx.c.status === "pending_review",
    tab: "overview",
  },
  {
    id: "accept",
    label: "Accept",
    Icon: Handshake,
    description: "Both parties agree to the terms",
    isComplete: (ctx) =>
      ctx.c.status === "accepted" || ctx.c.status === "fulfilled",
    isActive: (ctx) => ctx.c.status === "pending_review",
    tab: "overview",
  },
  {
    id: "pay_collateral",
    label: "Payment",
    Icon: DollarSign,
    description: "Pay your security deposit",
    isComplete: (ctx) => {
      if (!ctx.c.collateral_per_owner || ctx.c.collateral_per_owner <= 0)
        return true;
      return ctx.payments.some(
        (p) =>
          p.payment_type === "collateral" &&
          p.user_id === ctx.userId &&
          p.status === "paid",
      );
    },
    isActive: (ctx) => ctx.c.status === "accepted",
    tab: "payments",
  },
  {
    id: "breeding_progress",
    label: "Breeding",
    Icon: Activity,
    description: "Submit reports & mark breeding outcome",
    isComplete: (ctx) =>
      ctx.c.breeding_status === "completed" ||
      ctx.c.breeding_status === "failed",
    isActive: (ctx) =>
      ctx.c.status === "accepted" &&
      (!ctx.c.breeding_status ||
        ctx.c.breeding_status === "pending" ||
        ctx.c.breeding_status === "in_progress"),
    tab: "breeding",
  },
  {
    id: "complete",
    label: "Complete",
    Icon: Award,
    description: "Finalize match",
    isComplete: (ctx) => ctx.c.status === "fulfilled",
    isActive: (ctx) =>
      ctx.c.breeding_status === "completed" ||
      ctx.c.breeding_status === "failed",
    tab: "breeding",
  },
];

// ─── Phase-gated tab visibility ────────────────────────────
function getVisibleTabs(contract: BreedingContract): TabId[] {
  const status = contract.status;
  const breeding = contract.breeding_status;

  // Phase 1: Negotiation
  if (
    status === "draft" ||
    status === "pending_review" ||
    status === "rejected"
  ) {
    return ["overview"];
  }

  // Phase 3: Post-Breeding (breeding completed/failed or fulfilled)
  if (
    breeding === "completed" ||
    breeding === "failed" ||
    status === "fulfilled"
  ) {
    return ["overview", "payments", "reports", "breeding", "offspring"];
  }

  // Phase 2: Active Breeding (accepted, breeding pending/in_progress)
  return ["overview", "payments", "reports", "breeding"];
}

export default function ContractDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const conversationId = params.conversationId as string;

  const { user } = useSession();
  const currentUserId = Number(user?.id ?? 0);

  const [contract, setContract] = useState<BreedingContract | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [contractPayments, setContractPayments] = useState<Payment[]>([]);
  const [hasOffspringRecorded, setHasOffspringRecorded] = useState(false);
  const [allocationSummary, setAllocationSummary] =
    useState<AllocationSummaryData | null>(null);
  const [hasAutoSelectedTab, setHasAutoSelectedTab] = useState(false);

  // ─── Review modal state ──────────────────────────────
  const [showBreederReview, setShowBreederReview] = useState(false);
  const [showShooterReview, setShowShooterReview] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  // Track whether we just completed a match (triggers auto-pop)
  const justCompleted = useRef(false);

  const fetchAll = useCallback(async () => {
    try {
      const contractData = await getContract(parseInt(conversationId));
      if (contractData) {
        setContract(contractData);

        // Fetch payments
        if (
          contractData.status === "accepted" ||
          contractData.status === "fulfilled"
        ) {
          const payResult = await getContractPayments(contractData.id);
          if (payResult.success && payResult.data) {
            setContractPayments(payResult.data);
          }
        }

        // Check offspring
        if (
          contractData.breeding_status === "completed" &&
          contractData.has_offspring
        ) {
          const offspring = await getOffspring(contractData.id);
          setHasOffspringRecorded(
            offspring !== null && offspring.offspring.length > 0,
          );
        }

        // Fetch allocation summary
        if (
          contractData.status === "fulfilled" &&
          contractData.has_offspring &&
          contractData.share_offspring
        ) {
          const allocResult = await getOffspringAllocationSummary(
            contractData.id,
          );
          if (allocResult.success && allocResult.data) {
            setAllocationSummary(allocResult.data);
          }
        }

        // Fetch review status for completed matches
        if (
          contractData.status === "fulfilled" &&
          contractData.match_request_id
        ) {
          try {
            const status = await getReviewStatus(contractData.match_request_id);
            setReviewStatus(status);
          } catch {
            // silent – review status is non-critical
          }
        }
      }
    } catch (error) {
      console.error("Error fetching contract data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Poll every 10s
  useEffect(() => {
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const handleContractUpdate = (updated: BreedingContract) => {
    setContract(updated);
    fetchAll();
  };

  // ─── Review handlers ─────────────────────────────────
  /**
   * Called by BreedingTab / OffspringTab when match is marked complete.
   * Instead of immediately navigating away, we auto-pop the review modal.
   */
  const handleMatchCompleted = useCallback(() => {
    justCompleted.current = true;
    // Re-fetch to get updated contract status + review status
    fetchAll();
  }, [fetchAll]);

  // Auto-pop breeder review modal right after match completes
  useEffect(() => {
    if (
      justCompleted.current &&
      contract?.status === "fulfilled"
    ) {
      justCompleted.current = false;
      // If we have review status and already reviewed, skip
      if (reviewStatus?.breeder_reviewed) {
        router.back();
        return;
      }
      // Show review modal regardless of whether reviewStatus loaded
      // (migrations may not be run yet — modal handles errors on submit)
      setShowBreederReview(true);
    }
  }, [contract?.status, reviewStatus, router]);

  const handleBreederReviewSubmit = useCallback(
    async (data: { ratings: Record<string, number>; comment?: string }) => {
      if (!contract?.match_request_id) return;
      setReviewSubmitting(true);
      try {
        if (contract.is_shooter) {
          // Shooter reviewing a breeder
          await submitBreederReviewAsShooter(contract.id, {
            subject_id: contract.partner_id!,
            ratings: data.ratings,
            comment: data.comment,
          });
        } else {
          // Breeder reviewing the other breeder
          await submitBreederReview(contract.match_request_id, {
            ratings: data.ratings,
            comment: data.comment,
          });
        }
        setShowBreederReview(false);
        // Refresh review status
        const status = await getReviewStatus(contract.match_request_id);
        setReviewStatus(status);

        // If there's a shooter to review and we haven't yet, pop that modal next
        if (
          status.has_shooter &&
          !status.shooter_reviewed &&
          !contract.is_shooter
        ) {
          setTimeout(() => setShowShooterReview(true), 400);
        } else {
          Alert.alert("Thank you!", "Your review has been submitted.");
        }
      } catch (err: any) {
        Alert.alert(
          "Error",
          err?.response?.data?.message || "Failed to submit review.",
        );
      } finally {
        setReviewSubmitting(false);
      }
    },
    [contract],
  );

  const handleShooterReviewSubmit = useCallback(
    async (data: { ratings: Record<string, number>; comment?: string }) => {
      if (!contract) return;
      setReviewSubmitting(true);
      try {
        await submitShooterReview(contract.id, {
          ratings: data.ratings,
          comment: data.comment,
        });
        setShowShooterReview(false);
        // Refresh review status
        if (contract.match_request_id) {
          const status = await getReviewStatus(contract.match_request_id);
          setReviewStatus(status);
        }
        Alert.alert("Thank you!", "Your shooter review has been submitted.");
      } catch (err: any) {
        Alert.alert(
          "Error",
          err?.response?.data?.message || "Failed to submit review.",
        );
      } finally {
        setReviewSubmitting(false);
      }
    },
    [contract],
  );

  const handleReviewSkip = useCallback(
    (type: "breeder" | "shooter") => {
      if (type === "breeder") {
        setShowBreederReview(false);
        // If there's a shooter to review, prompt that next
        if (
          reviewStatus?.has_shooter &&
          !reviewStatus?.shooter_reviewed &&
          !contract?.is_shooter
        ) {
          setTimeout(() => setShowShooterReview(true), 400);
        }
      } else {
        setShowShooterReview(false);
      }
    },
    [reviewStatus, contract],
  );

  // ─── Computed stage context ────────────────────────────
  const stageCtx: StageContext | null = contract
    ? {
        c: contract,
        payments: contractPayments,
        userId: currentUserId,
        hasOffspring: hasOffspringRecorded,
        allocationData: allocationSummary,
      }
    : null;

  // Find current step index and next action
  const { completedCount, nextAction } = useMemo(() => {
    if (!stageCtx)
      return { completedCount: 0, nextAction: null as LifecycleStage | null };

    let completed = 0;
    let next: LifecycleStage | null = null;

    for (const stage of LIFECYCLE_STAGES) {
      if (stage.isComplete(stageCtx)) {
        completed++;
      } else if (!next && stage.isActive(stageCtx)) {
        next = stage;
      }
    }
    return { completedCount: completed, nextAction: next };
  }, [stageCtx]);

  // Visible tabs based on contract phase
  const visibleTabs = useMemo(
    () => (contract ? getVisibleTabs(contract) : ["overview" as TabId]),
    [contract],
  );

  const filteredTabs = ALL_TABS.filter((t) => visibleTabs.includes(t.id));

  // Auto-select the most relevant tab on first load
  useEffect(() => {
    if (contract && !hasAutoSelectedTab && nextAction) {
      const targetTab = nextAction.tab;
      if (visibleTabs.includes(targetTab)) {
        setActiveTab(targetTab);
      }
      setHasAutoSelectedTab(true);
    }
  }, [contract, hasAutoSelectedTab, nextAction, visibleTabs]);

  // Ensure active tab is still visible after phase change
  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0] || "overview");
    }
  }, [visibleTabs, activeTab]);

  // Check if both parties have paid collateral
  const bothCollateralPaid = useMemo(() => {
    if (!contract) return false;
    if (!contract.collateral_per_owner || contract.collateral_per_owner <= 0)
      return true;
    const paidCollateral = contractPayments.filter(
      (p) => p.payment_type === "collateral" && p.status === "paid",
    );
    return paidCollateral.length >= 2;
  }, [contract, contractPayments]);

  const currentUserPaidCollateral = useMemo(() => {
    if (!contract) return false;
    if (!contract.collateral_per_owner || contract.collateral_per_owner <= 0)
      return true;
    return contractPayments.some(
      (p) =>
        p.payment_type === "collateral" &&
        p.user_id === currentUserId &&
        p.status === "paid",
    );
  }, [contract, contractPayments, currentUserId]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text className="text-gray-500 mt-3">Loading contract...</Text>
      </SafeAreaView>
    );
  }

  if (!contract) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <FileText size={48} color="#D1D5DB" />
        <Text className="text-gray-500 mt-3">No contract found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-[#FF6B6B] px-6 py-2 rounded-full"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Status badge
  const statusMapping: Record<
    string,
    {
      bg: string;
      text: string;
      label: string;
      Icon: IconComponent;
      iconColor: string;
    }
  > = {
    draft: {
      bg: "bg-gray-200",
      text: "text-gray-700",
      label: "Draft",
      Icon: Edit,
      iconColor: "#374151",
    },
    pending_review: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Pending",
      Icon: Clock,
      iconColor: "#92400e",
    },
    accepted: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Active",
      Icon: CheckCircle,
      iconColor: "#166534",
    },
    rejected: {
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Rejected",
      Icon: XCircle,
      iconColor: "#991b1b",
    },
    fulfilled: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      label: "Completed",
      Icon: Award,
      iconColor: "#6b21a8",
    },
  };
  const badgeConfig = statusMapping[contract.status] || statusMapping.draft;
  const BadgeIcon = badgeConfig.Icon;

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA]" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 bg-white flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">
              Breeding Contract
            </Text>
            <Text className="text-xs text-gray-500">
              Created {dayjs(contract.created_at).format("MMM D, YYYY")}
            </Text>
          </View>
        </View>
        <View
          className={`${badgeConfig.bg} px-3 py-1 rounded-full flex-row items-center`}
        >
          <BadgeIcon size={12} color={badgeConfig.iconColor} />
          <Text className={`${badgeConfig.text} text-xs font-bold ml-1`}>
            {badgeConfig.label}
          </Text>
        </View>
      </View>

      {/* ─── Compact Stepper ─── */}
      {contract.status !== "rejected" && stageCtx && (
        <View className="bg-white px-4 pt-3 pb-2 border-b border-gray-100">
          {/* Progress bar */}
          <View className="flex-row items-center mb-2">
            <View className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full bg-[#FF6B6B] rounded-full"
                style={{
                  width: `${(completedCount / LIFECYCLE_STAGES.length) * 100}%`,
                }}
              />
            </View>
            <Text className="text-xs text-gray-400 ml-2 font-medium">
              {completedCount}/{LIFECYCLE_STAGES.length}
            </Text>
          </View>

          {/* Stage dots */}
          <View className="flex-row items-center justify-between">
            {LIFECYCLE_STAGES.map((stage, i) => {
              const isComplete = stage.isComplete(stageCtx);
              const isActive = stage.isActive(stageCtx) && !isComplete;
              const isNext = nextAction?.id === stage.id;
              const StageIcon = stage.Icon;

              return (
                <TouchableOpacity
                  key={stage.id}
                  onPress={() => {
                    if (visibleTabs.includes(stage.tab))
                      setActiveTab(stage.tab);
                  }}
                  className="items-center"
                  style={{ flex: 1 }}
                >
                  <View
                    className={`w-7 h-7 rounded-full items-center justify-center ${
                      isComplete
                        ? "bg-green-100"
                        : isNext
                          ? "bg-[#FF6B6B]"
                          : isActive
                            ? "bg-[#FF6B6B]/10"
                            : "bg-gray-100"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle size={14} color="#10b981" />
                    ) : (
                      <StageIcon
                        size={13}
                        color={
                          isNext ? "white" : isActive ? "#FF6B6B" : "#9CA3AF"
                        }
                      />
                    )}
                  </View>
                  <Text
                    className={`text-[9px] mt-0.5 text-center ${
                      isComplete
                        ? "text-green-600"
                        : isNext
                          ? "text-[#FF6B6B] font-bold"
                          : "text-gray-400"
                    }`}
                    numberOfLines={1}
                  >
                    {stage.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Next action hint — compact inline version */}
          {nextAction && contract.status !== "fulfilled" && (
            <TouchableOpacity
              onPress={() => {
                if (visibleTabs.includes(nextAction.tab))
                  setActiveTab(nextAction.tab);
              }}
              className="mt-2 bg-[#FFF0EE] rounded-xl px-3 py-2 flex-row items-center"
            >
              <nextAction.Icon size={14} color="#FF6B6B" />
              <Text className="text-[#FF6B6B] text-xs font-semibold flex-1 ml-2">
                Next: {nextAction.description}
              </Text>
              <ChevronRight size={14} color="#FF6B6B" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ─── Phase-gated Tab Bar ─── */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          {filteredTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className={`px-4 py-3 mr-1 border-b-2 ${
                activeTab === tab.id ? "border-[#FF6B6B]" : "border-transparent"
              }`}
            >
              <View className="flex-row items-center">
                <tab.Icon
                  size={14}
                  color={activeTab === tab.id ? "#FF6B6B" : "#9CA3AF"}
                />
                <Text
                  className={`text-sm font-semibold ml-1.5 ${
                    activeTab === tab.id ? "text-[#FF6B6B]" : "text-gray-500"
                  }`}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FF6B6B"
          />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {activeTab === "overview" && (
          <ContractOverviewTab
            contract={contract}
            onContractUpdate={handleContractUpdate}
            onEdit={() =>
              router.push({
                pathname: "/(chat)/create-contract" as any,
                params: { conversationId, contractId: String(contract.id) },
              })
            }
          />
        )}
        {activeTab === "payments" && (
          <ContractPaymentsTab
            contract={contract}
            payments={contractPayments}
            currentUserId={currentUserId}
            onPaymentSuccess={() => fetchAll()}
          />
        )}
        {activeTab === "reports" && (
          <ContractReportsTab
            contract={contract}
            collateralPaid={currentUserPaidCollateral}
          />
        )}
        {activeTab === "breeding" && (
          <ContractBreedingTab
            contract={contract}
            onContractUpdate={handleContractUpdate}
            bothCollateralPaid={bothCollateralPaid}
            onMatchCompleted={handleMatchCompleted}
          />
        )}
        {activeTab === "offspring" && (
          <ContractOffspringTab
            contract={contract}
            hasOffspringRecorded={hasOffspringRecorded}
            allocationSummary={allocationSummary}
            onContractUpdate={handleContractUpdate}
            onMatchCompleted={handleMatchCompleted}
            onRefresh={fetchAll}
          />
        )}
      </ScrollView>

      {/* ─── Rate buttons for completed matches ─── */}
      {contract.status === "fulfilled" && reviewStatus && (
        <View className="bg-white border-t border-gray-100 px-4 py-3">
          <View className="flex-row items-center justify-center gap-3">
            {!reviewStatus.breeder_reviewed && (
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center bg-[#FF6B6B] py-3 rounded-xl"
                onPress={() => setShowBreederReview(true)}
              >
                <Star size={16} color="#fff" />
                <Text className="text-white font-bold ml-2">
                  Rate {contract.is_shooter ? "Breeder" : "Partner"}
                </Text>
              </TouchableOpacity>
            )}
            {reviewStatus.has_shooter &&
              !reviewStatus.shooter_reviewed &&
              !contract.is_shooter && (
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center bg-[#6B8AFF] py-3 rounded-xl"
                  onPress={() => setShowShooterReview(true)}
                >
                  <Star size={16} color="#fff" />
                  <Text className="text-white font-bold ml-2">
                    Rate Shooter
                  </Text>
                </TouchableOpacity>
              )}
          </View>
        </View>
      )}

      {/* ─── Review Modals ─── */}
      <ReviewModal
        visible={showBreederReview}
        type="breeder"
        subjectName={contract.partner_name || "Your Partner"}
        onSubmit={handleBreederReviewSubmit}
        onSkip={() => handleReviewSkip("breeder")}
        loading={reviewSubmitting}
      />
      <ReviewModal
        visible={showShooterReview}
        type="shooter"
        subjectName={contract.shooter?.name || "Shooter"}
        onSubmit={handleShooterReviewSubmit}
        onSkip={() => handleReviewSkip("shooter")}
        loading={reviewSubmitting}
      />
    </SafeAreaView>
  );
}
