import axiosInstance from "@/config/axiosConfig";

// ============================================================================
// Types
// ============================================================================

export type DisputeStatus = "open" | "under_review" | "resolved" | "dismissed";

export type DisputeResolutionType =
  | "refund_full"
  | "refund_partial"
  | "release_funds"
  | "forfeit";

export interface Dispute {
  id: number;
  contract_id: number;
  raised_by: number;
  resolved_by: number | null;
  reason: string;
  resolution_notes: string | null;
  status: DisputeStatus;
  resolution_type: DisputeResolutionType | null;
  resolved_amount: number | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  // Relations (when loaded)
  contract?: {
    id: number;
    status: string;
  };
  raised_by_user?: {
    id: number;
    name: string;
    email: string;
  };
  resolved_by_user?: {
    id: number;
    name: string;
  };
}

export interface CreateDisputeParams {
  contract_id: number;
  reason: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create a new dispute for a contract
 */
export const createDispute = async (
  params: CreateDisputeParams,
): Promise<ApiResponse<Dispute>> => {
  try {
    const response = await axiosInstance.post("/api/disputes", params);
    return {
      success: true,
      message: response.data.message || "Dispute filed successfully",
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to file dispute";
    return { success: false, message: errorMessage };
  }
};

/**
 * Get user's disputes (paginated)
 */
export const getMyDisputes = async (
  page?: number,
): Promise<ApiResponse<PaginatedResponse<Dispute>>> => {
  try {
    const url = `/api/disputes${page ? `?page=${page}` : ""}`;
    const response = await axiosInstance.get(url);
    return {
      success: true,
      message: "Disputes retrieved successfully",
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to get disputes";
    return { success: false, message: errorMessage };
  }
};

/**
 * Get a specific dispute by ID
 */
export const getDispute = async (
  disputeId: number,
): Promise<ApiResponse<Dispute>> => {
  try {
    const response = await axiosInstance.get(`/api/disputes/${disputeId}`);
    return {
      success: true,
      message: "Dispute retrieved",
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to get dispute";
    return { success: false, message: errorMessage };
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get human-readable dispute status label
 */
export const getDisputeStatusLabel = (status: DisputeStatus): string => {
  const labels: Record<DisputeStatus, string> = {
    open: "Open",
    under_review: "Under Review",
    resolved: "Resolved",
    dismissed: "Dismissed",
  };
  return labels[status] || status;
};

/**
 * Get dispute status color for UI display
 */
export const getDisputeStatusColor = (
  status: DisputeStatus,
): { bg: string; text: string } => {
  const colors: Record<DisputeStatus, { bg: string; text: string }> = {
    open: { bg: "bg-yellow-100", text: "text-yellow-800" },
    under_review: { bg: "bg-blue-100", text: "text-blue-800" },
    resolved: { bg: "bg-green-100", text: "text-green-800" },
    dismissed: { bg: "bg-gray-100", text: "text-gray-800" },
  };
  return colors[status] || { bg: "bg-gray-100", text: "text-gray-800" };
};

/**
 * Get resolution type label
 */
export const getResolutionTypeLabel = (type: DisputeResolutionType): string => {
  const labels: Record<DisputeResolutionType, string> = {
    refund_full: "Full Refund",
    refund_partial: "Partial Refund",
    release_funds: "Funds Released",
    forfeit: "Forfeited",
  };
  return labels[type] || type;
};

/**
 * Check if a dispute is active (can still be resolved)
 */
export const isDisputeActive = (status: DisputeStatus): boolean => {
  return ["open", "under_review"].includes(status);
};
