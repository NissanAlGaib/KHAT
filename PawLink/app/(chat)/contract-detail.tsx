import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
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

// Tab components
import ContractOverviewTab from "@/components/contracts/tabs/OverviewTab";
import ContractPaymentsTab from "@/components/contracts/tabs/PaymentsTab";
import ContractReportsTab from "@/components/contracts/tabs/ReportsTab";
import ContractBreedingTab from "@/components/contracts/tabs/BreedingTab";
import ContractOffspringTab from "@/components/contracts/tabs/OffspringTab";

type TabId = "overview" | "payments" | "reports" | "breeding" | "offspring";

interface TabConfig {
  id: TabId;
  label: string;
  emoji: string;
}

const ALL_TABS: TabConfig[] = [
  { id: "overview", label: "Overview", emoji: "📋" },
  { id: "payments", label: "Payments", emoji: "💳" },
  { id: "reports", label: "Reports", emoji: "📝" },
  { id: "breeding", label: "Breeding", emoji: "❤️" },
  { id: "offspring", label: "Offspring", emoji: "🐾" },
];

// ─── Simplified 5-stage lifecycle ──────────────────────────
interface LifecycleStage {
  id: string;
  label: string;
  emoji: string;
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
    emoji: "📝",
    description: "Draft your breeding agreement",
    isComplete: (ctx) => ctx.c.status !== "draft",
    isActive: (ctx) =>
      ctx.c.status === "draft" || ctx.c.status === "pending_review",
    tab: "overview",
  },
  {
    id: "accept",
    label: "Accept",
    emoji: "🤝",
    description: "Both parties agree to the terms",
    isComplete: (ctx) =>
      ctx.c.status === "accepted" || ctx.c.status === "fulfilled",
    isActive: (ctx) => ctx.c.status === "pending_review",
    tab: "overview",
  },
  {
    id: "pay_collateral",
    label: "Payment",
    emoji: "💰",
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
    emoji: "💕",
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
    emoji: "🎉",
    description: "Record offspring & finalize match",
    isComplete: (ctx) => ctx.c.status === "fulfilled",
    isActive: (ctx) =>
      ctx.c.breeding_status === "completed" ||
      ctx.c.breeding_status === "failed",
    tab: "offspring",
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
        <Text className="text-4xl mb-3">😿</Text>
        <Text className="text-gray-500">No contract found</Text>
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
  const statusConfig: Record<
    string,
    { bg: string; text: string; label: string; emoji: string }
  > = {
    draft: {
      bg: "bg-gray-200",
      text: "text-gray-700",
      label: "Draft",
      emoji: "📝",
    },
    pending_review: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Pending Review",
      emoji: "⏳",
    },
    accepted: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Active",
      emoji: "✅",
    },
    rejected: {
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Rejected",
      emoji: "❌",
    },
    fulfilled: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      label: "Completed",
      emoji: "🎉",
    },
  };
  const badgeConfig = statusConfig[contract.status] || statusConfig.draft;

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
          <Text className="mr-1">{badgeConfig.emoji}</Text>
          <Text className={`${badgeConfig.text} text-xs font-bold`}>
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
                      <Text className="text-[10px]">{stage.emoji}</Text>
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
              <Text className="text-sm mr-2">{nextAction.emoji}</Text>
              <Text className="text-[#FF6B6B] text-xs font-semibold flex-1">
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
                <Text className="mr-1">{tab.emoji}</Text>
                <Text
                  className={`text-sm font-semibold ${
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
          />
        )}
        {activeTab === "offspring" && (
          <ContractOffspringTab
            contract={contract}
            hasOffspringRecorded={hasOffspringRecorded}
            allocationSummary={allocationSummary}
            onContractUpdate={handleContractUpdate}
            onMatchCompleted={() => router.back()}
            onRefresh={fetchAll}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
