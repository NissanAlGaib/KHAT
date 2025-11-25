import axiosInstance from "@/config/axiosConfig";

export interface BreedingContract {
  id: number;
  conversation_id: number;
  created_by: number;
  last_edited_by?: number;
  status: "draft" | "pending_review" | "accepted" | "rejected";

  // Shooter Agreement
  shooter_name?: string;
  shooter_payment?: number;
  shooter_location?: string;
  shooter_conditions?: string;

  // Payment & Compensation
  end_contract_date?: string;
  include_monetary_amount: boolean;
  monetary_amount?: number;
  share_offspring: boolean;
  offspring_split_type?: "percentage" | "specific_number";
  offspring_split_value?: number;
  offspring_selection_method?: "first_pick" | "randomized";
  include_goods_foods: boolean;
  goods_foods_value?: number;

  // Collateral
  collateral_total: number;
  collateral_per_owner: number;
  cancellation_fee_percentage: number;

  // Terms & Policies
  pet_care_responsibilities?: string;
  harm_liability_terms?: string;
  cancellation_policy?: string;
  custom_terms?: string;

  // Timestamps
  accepted_at?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;

  // User-specific fields
  can_edit: boolean;
  can_accept: boolean;
  is_creator: boolean;
}

export interface ContractFormData {
  // Shooter Agreement (Optional)
  shooter_name?: string;
  shooter_payment?: number;
  shooter_location?: string;
  shooter_conditions?: string;

  // Payment & Compensation
  end_contract_date?: string;
  include_monetary_amount?: boolean;
  monetary_amount?: number;
  share_offspring?: boolean;
  offspring_split_type?: "percentage" | "specific_number";
  offspring_split_value?: number;
  offspring_selection_method?: "first_pick" | "randomized";
  include_goods_foods?: boolean;
  goods_foods_value?: number;

  // Collateral
  collateral_total?: number;

  // Terms & Policies
  pet_care_responsibilities?: string;
  harm_liability_terms?: string;
  cancellation_policy?: string;
  custom_terms?: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Create a new breeding contract for a conversation
 */
export const createContract = async (
  conversationId: number,
  data: ContractFormData
): Promise<ApiResponse<BreedingContract>> => {
  try {
    const response = await axiosInstance.post(
      `/api/conversations/${conversationId}/contracts`,
      data
    );
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to create contract";
    return { success: false, message: errorMessage };
  }
};

/**
 * Get the breeding contract for a conversation
 */
export const getContract = async (
  conversationId: number
): Promise<BreedingContract | null> => {
  try {
    const response = await axiosInstance.get(
      `/api/conversations/${conversationId}/contracts`
    );
    return response.data.data || null;
  } catch (error: any) {
    console.error(
      "Error getting contract:",
      error.response?.data || error.message
    );
    return null;
  }
};

/**
 * Update an existing breeding contract
 */
export const updateContract = async (
  contractId: number,
  data: ContractFormData
): Promise<ApiResponse<BreedingContract>> => {
  try {
    const response = await axiosInstance.put(`/api/contracts/${contractId}`, data);
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to update contract";
    return { success: false, message: errorMessage };
  }
};

/**
 * Accept a breeding contract
 */
export const acceptContract = async (
  contractId: number
): Promise<ApiResponse<BreedingContract>> => {
  try {
    const response = await axiosInstance.put(
      `/api/contracts/${contractId}/accept`
    );
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to accept contract";
    return { success: false, message: errorMessage };
  }
};

/**
 * Reject a breeding contract (ends the match)
 */
export const rejectContract = async (
  contractId: number
): Promise<ApiResponse<BreedingContract>> => {
  try {
    const response = await axiosInstance.put(
      `/api/contracts/${contractId}/reject`
    );
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to reject contract";
    return { success: false, message: errorMessage };
  }
};
