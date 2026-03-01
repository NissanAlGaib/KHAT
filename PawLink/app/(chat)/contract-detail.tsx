import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Animated,
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
  Circle,
  AlertCircle,
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
import {
  getContractPayments,
  Payment,
  PaymentType,
} from "@/services/paymentService";
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
  icon: React.ReactNode;
  emoji: string;
}

const TABS: TabConfig[] = [
  { id: "overview", label: "Overview", icon: <FileText size={16} color="#FF6B6B" />, emoji: "📋" },
  { id: "payments", label: "Payments", icon: <CreditCard size={16} color="#FF6B6B" />, emoji: "💳" },
  { id: "reports", label: "Reports", icon: <ClipboardList size={16} color="#FF6B6B" />, emoji: "📝" },
  { id: "breeding", label: "Breeding", icon: <Heart size={16} color="#FF6B6B" />, emoji: "❤️" },
  { id: "offspring", label: "Offspring", icon: <Baby size={16} color="#FF6B6B" />, emoji: "🐾" },
];

// ─── Lifecycle stages ─────────────────────────────────────
interface LifecycleStage {
  id: string;
  label: string;
  emoji: string;
  description: string;
  isComplete: (c: BreedingContract, payments: Payment[], currentUserId: number, hasOffspring: boolean, allocationData: AllocationSummaryData | null) => boolean;
  isActive: (c: BreedingContract, payments: Payment[], currentUserId: number, hasOffspring: boolean, allocationData: AllocationSummaryData | null) => boolean;
  tab: TabId;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: "create",
    label: "Create Contract",
    emoji: "📝",
    description: "Draft your breeding agreement",
    isComplete: (c) => c.status !== "draft",
    isActive: (c) => c.status === "draft" || c.status === "pending_review",
    tab: "overview",
  },
  {
    id: "accept",
    label: "Accept Contract",
    emoji: "🤝",
    description: "Both parties agree to the terms",
    isComplete: (c) => c.status === "accepted" || c.status === "fulfilled",
    isActive: (c) => c.status === "pending_review",
    tab: "overview",
  },
  {
    id: "pay_collateral",
    label: "Pay Collateral",
    emoji: "💰",
    description: "Pay your security deposit",
    isComplete: (c, payments, userId) => {
      if (!c.collateral_per_owner || c.collateral_per_owner <= 0) return true;
      return payments.some(p => p.payment_type === "collateral" && p.user_id === userId && p.status === "paid");
    },
    isActive: (c) => c.status === "accepted",
    tab: "payments",
  },
  {
    id: "daily_reports",
    label: "Submit Reports",
    emoji: "📊",
    description: "Track breeding progress daily",
    isComplete: (c) => c.breeding_status === "completed" || c.breeding_status === "failed",
    isActive: (c) => c.status === "accepted" && (!c.breeding_status || c.breeding_status === "pending" || c.breeding_status === "in_progress"),
    tab: "reports",
  },
  {
    id: "mark_breeding",
    label: "Mark Breeding",
    emoji: "❤️",
    description: "Record breeding outcome",
    isComplete: (c) => c.breeding_status === "completed" || c.breeding_status === "failed",
    isActive: (c) => c.status === "accepted" && (!c.breeding_status || c.breeding_status === "pending" || c.breeding_status === "in_progress"),
    tab: "breeding",
  },
  {
    id: "offspring",
    label: "Record Offspring",
    emoji: "🐾",
    description: "Log litter details",
    isComplete: (_c, _p, _u, hasOffspring) => hasOffspring,
    isActive: (c) => c.breeding_status === "completed" && c.has_offspring === true,
    tab: "offspring",
  },
  {
    id: "complete",
    label: "Complete Match",
    emoji: "🎉",
    description: "Finalize and archive",
    isComplete: (c) => c.status === "fulfilled",
    isActive: (c, _p, _u, hasOffspring) => c.breeding_status === "completed" && hasOffspring,
    tab: "offspring",
  },
];

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
  const [allocationSummary, setAllocationSummary] = useState<AllocationSummaryData | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation for the "Next Action" badge
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const contractData = await getContract(parseInt(conversationId));
      if (contractData) {
        setContract(contractData);

        // Fetch payments
        if (contractData.status === "accepted" || contractData.status === "fulfilled") {
          const payResult = await getContractPayments(contractData.id);
          if (payResult.success && payResult.data) {
            setContractPayments(payResult.data);
          }
        }

        // Check offspring
        if (contractData.breeding_status === "completed" && contractData.has_offspring) {
          const offspring = await getOffspring(contractData.id);
          setHasOffspringRecorded(offspring !== null && offspring.offspring.length > 0);
        }

        // Fetch allocation summary
        if (contractData.status === "fulfilled" && contractData.has_offspring && contractData.share_offspring) {
          const allocResult = await getOffspringAllocationSummary(contractData.id);
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

  // Find the current/next lifecycle stage
  const getNextAction = (): LifecycleStage | null => {
    if (!contract) return null;
    for (const stage of LIFECYCLE_STAGES) {
      if (stage.isActive(contract, contractPayments, currentUserId, hasOffspringRecorded, allocationSummary) && !stage.isComplete(contract, contractPayments, currentUserId, hasOffspringRecorded, allocationSummary)) {
        return stage;
      }
    }
    return null;
  };

  const nextAction = contract ? getNextAction() : null;

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
        <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-[#FF6B6B] px-6 py-2 rounded-full">
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Status badge component
  const StatusBadge = () => {
    const statusConfig: Record<string, { bg: string; text: string; label: string; emoji: string }> = {
      draft: { bg: "bg-gray-200", text: "text-gray-700", label: "Draft", emoji: "📝" },
      pending_review: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending Review", emoji: "⏳" },
      accepted: { bg: "bg-green-100", text: "text-green-800", label: "Active", emoji: "✅" },
      rejected: { bg: "bg-red-100", text: "text-red-800", label: "Rejected", emoji: "❌" },
      fulfilled: { bg: "bg-purple-100", text: "text-purple-800", label: "Completed", emoji: "🎉" },
    };
    const config = statusConfig[contract.status] || statusConfig.draft;
    return (
      <View className={`${config.bg} px-3 py-1 rounded-full flex-row items-center`}>
        <Text className="mr-1">{config.emoji}</Text>
        <Text className={`${config.text} text-xs font-bold`}>{config.label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA]" edges={["top"]}>
      {/* Header */}
      <View className="px-4 py-3 bg-white flex-row items-center justify-between border-b border-gray-100">
        <View className="flex-row items-center flex-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">Breeding Contract 🐾</Text>
            <Text className="text-xs text-gray-500">
              Created {dayjs(contract.created_at).format("MMM D, YYYY")}
            </Text>
          </View>
        </View>
        <StatusBadge />
      </View>

      {/* Lifecycle Progress Bar */}
      {contract.status !== "rejected" && (
        <View className="bg-white px-4 py-3 border-b border-gray-100">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row items-center">
              {LIFECYCLE_STAGES.map((stage, i) => {
                const isComplete = stage.isComplete(contract, contractPayments, currentUserId, hasOffspringRecorded, allocationSummary);
                const isActive = stage.isActive(contract, contractPayments, currentUserId, hasOffspringRecorded, allocationSummary) && !isComplete;
                const isNext = nextAction?.id === stage.id;

                return (
                  <React.Fragment key={stage.id}>
                    <TouchableOpacity
                      onPress={() => setActiveTab(stage.tab)}
                      className="items-center"
                      style={{ width: 56 }}
                    >
                      {isNext ? (
                        <Animated.View
                          style={{ transform: [{ scale: pulseAnim }] }}
                          className="w-8 h-8 rounded-full bg-[#FF6B6B] items-center justify-center"
                        >
                          <Text className="text-xs">{stage.emoji}</Text>
                        </Animated.View>
                      ) : (
                        <View
                          className={`w-8 h-8 rounded-full items-center justify-center ${
                            isComplete ? "bg-green-100" : isActive ? "bg-[#FF6B6B]/10" : "bg-gray-100"
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle size={16} color="#10b981" />
                          ) : (
                            <Text className="text-xs">{stage.emoji}</Text>
                          )}
                        </View>
                      )}
                      <Text
                        className={`text-[8px] mt-1 text-center ${
                          isComplete ? "text-green-600" : isNext ? "text-[#FF6B6B] font-bold" : "text-gray-400"
                        }`}
                        numberOfLines={1}
                      >
                        {stage.label}
                      </Text>
                    </TouchableOpacity>
                    {i < LIFECYCLE_STAGES.length - 1 && (
                      <View
                        className={`w-3 h-0.5 ${
                          isComplete ? "bg-green-300" : "bg-gray-200"
                        }`}
                        style={{ marginHorizontal: -2 }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Next Action Banner */}
      {nextAction && contract.status !== "rejected" && contract.status !== "fulfilled" && (
        <TouchableOpacity
          onPress={() => setActiveTab(nextAction.tab)}
          className="mx-4 mt-3 bg-[#FF6B6B] rounded-2xl px-4 py-3 flex-row items-center"
        >
          <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3">
            <Text className="text-lg">{nextAction.emoji}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-xs font-medium opacity-80">NEXT ACTION</Text>
            <Text className="text-white font-bold text-base">{nextAction.label}</Text>
            <Text className="text-white/80 text-xs">{nextAction.description}</Text>
          </View>
          <ChevronRight size={20} color="white" />
        </TouchableOpacity>
      )}

      {/* Tab Bar */}
      <View className="bg-white mt-3 border-b border-gray-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
          {TABS.map((tab) => (
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FF6B6B" />}
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
          <ContractReportsTab contract={contract} />
        )}
        {activeTab === "breeding" && (
          <ContractBreedingTab
            contract={contract}
            onContractUpdate={handleContractUpdate}
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
