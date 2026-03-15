import axiosInstance from "@/config/axiosConfig";

// ============================================================================
// Types
// ============================================================================

export type PoolTransactionType =
  | "deposit"
  | "hold"
  | "release"
  | "refund"
  | "fee_deduction"
  | "cancellation_penalty";

export type PoolTransactionStatus =
  | "completed"
  | "pending"
  | "frozen"
  | "cancelled";

export interface PoolTransaction {
  id: number;
  payment_id: number;
  contract_id: number | null;
  user_id: number;
  type: PoolTransactionType;
  amount: number;
  currency: string;
  balance_after: number;
  status: PoolTransactionStatus;
  description: string | null;
  metadata: Record<string, any> | null;
  processed_at: string | null;
  processed_by: number | null;
  created_at: string;
  updated_at: string;
  // Relations (when loaded)
  user?: { id: number; name: string; email: string };
  payment?: { id: number; payment_type: string; amount: number };
}

export interface PoolBalance {
  /** Net funds currently held (deposited minus released) */
  held: number;
  /** Funds currently frozen (under dispute, etc.) */
  frozen: number;
  /** Deposits awaiting payment confirmation */
  pending_deposits: number;
  /** Lifetime total deposited */
  total_deposited: number;
  /** Lifetime total released/refunded */
  total_released: number;
  /** Lifetime total released to this user as recipient */
  incoming_releases?: number;
}

export interface ContractPoolSummary {
  contract_id: number;
  total_deposited: number;
  total_released: number;
  total_fees: number;
  net_balance: number;
  transactions: PoolTransaction[];
}

export interface PoolTransactionsFilter {
  type?: PoolTransactionType;
  status?: PoolTransactionStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get user's pool transactions (paginated)
 */
export const getMyPoolTransactions = async (
  filters?: PoolTransactionsFilter,
): Promise<ApiResponse<PaginatedResponse<PoolTransaction>>> => {
  try {
    const params = new URLSearchParams();
    if (filters?.type) params.append("type", filters.type);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.date_from) params.append("date_from", filters.date_from);
    if (filters?.date_to) params.append("date_to", filters.date_to);
    if (filters?.page) params.append("page", filters.page.toString());

    const queryString = params.toString();
    const url = `/api/pool/my-transactions${queryString ? `?${queryString}` : ""}`;

    const response = await axiosInstance.get(url);
    return {
      success: true,
      message: "Transactions retrieved successfully",
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to get pool transactions";
    return { success: false, message: errorMessage };
  }
};

/**
 * Get pool summary for a specific contract
 */
export const getContractPoolSummary = async (
  contractId: number,
): Promise<ApiResponse<ContractPoolSummary>> => {
  try {
    const response = await axiosInstance.get(
      `/api/pool/contracts/${contractId}/summary`,
    );
    return {
      success: true,
      message: "Contract pool summary retrieved",
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to get contract pool summary";
    return { success: false, message: errorMessage };
  }
};

/**
 * Get user's overall pool balance
 */
export const getPoolBalance = async (): Promise<ApiResponse<PoolBalance>> => {
  try {
    const response = await axiosInstance.get("/api/pool/balance");
    return {
      success: true,
      message: "Pool balance retrieved",
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to get pool balance";
    return { success: false, message: errorMessage };
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format amount as Philippine Peso.
 * Handles string, number, null, and undefined inputs safely.
 */
export const formatPoolAmount = (
  amount: number | string | null | undefined,
): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (num == null || isNaN(num)) return "₱0.00";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(num);
};

/**
 * Get human-readable transaction type label
 */
export const getTransactionTypeLabel = (type: PoolTransactionType): string => {
  const labels: Record<PoolTransactionType, string> = {
    deposit: "Deposit",
    hold: "Hold",
    release: "Release",
    refund: "Refund",
    fee_deduction: "Fee Deduction",
    cancellation_penalty: "Cancellation Penalty",
  };
  return labels[type] || type;
};

/**
 * Get status color for UI display
 */
export const getPoolStatusColor = (
  status: PoolTransactionStatus,
): { bg: string; text: string } => {
  const colors: Record<PoolTransactionStatus, { bg: string; text: string }> = {
    completed: { bg: "bg-green-100", text: "text-green-800" },
    pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
    frozen: { bg: "bg-blue-100", text: "text-blue-800" },
    cancelled: { bg: "bg-gray-100", text: "text-gray-800" },
  };
  return colors[status] || { bg: "bg-gray-100", text: "text-gray-800" };
};

/**
 * Get type color for UI display
 */
export const getTransactionTypeColor = (
  type: PoolTransactionType,
): { bg: string; text: string } => {
  const colors: Record<PoolTransactionType, { bg: string; text: string }> = {
    deposit: { bg: "bg-green-100", text: "text-green-800" },
    hold: { bg: "bg-yellow-100", text: "text-yellow-800" },
    release: { bg: "bg-blue-100", text: "text-blue-800" },
    refund: { bg: "bg-purple-100", text: "text-purple-800" },
    fee_deduction: { bg: "bg-red-100", text: "text-red-800" },
    cancellation_penalty: { bg: "bg-red-100", text: "text-red-800" },
  };
  return colors[type] || { bg: "bg-gray-100", text: "text-gray-800" };
};

/**
 * Check if a transaction type is a credit (money coming into the pool).
 * Deposits and holds represent money paid into the system.
 * Releases and refunds represent money paid out to the user.
 */
export const isCredit = (type: PoolTransactionType): boolean => {
  return ["deposit", "hold"].includes(type);
};

/**
 * Check if a transaction type is money being paid out to the user (earned/returned).
 */
export const isEarned = (type: PoolTransactionType): boolean => {
  return ["release", "refund"].includes(type);
};

/**
 * Get a user-friendly direction label that clarifies the money flow.
 */
export const getTransactionDirectionLabel = (
  type: PoolTransactionType,
): { label: string; icon: string } => {
  switch (type) {
    case "deposit":
      return { label: "You paid", icon: "arrow-up-right" };
    case "hold":
      return { label: "Held from you", icon: "lock" };
    case "release":
      return { label: "Earned", icon: "arrow-down-left" };
    case "refund":
      return { label: "Refunded to you", icon: "arrow-down-left" };
    case "fee_deduction":
      return { label: "Platform fee", icon: "arrow-up-right" };
    case "cancellation_penalty":
      return { label: "Penalty charged", icon: "arrow-up-right" };
    default:
      return { label: "Transaction", icon: "repeat" };
  }
};
