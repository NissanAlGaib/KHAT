import axiosInstance from "@/config/axiosConfig";

export interface BreedingContract {
  id: number;
  conversation_id: number;
  created_by: number;
  last_edited_by?: number;
  status: "draft" | "pending_review" | "accepted" | "rejected" | "fulfilled";

  // Shooter Agreement
  shooter_name?: string;
  shooter_payment?: number;
  shooter_location?: string;
  shooter_conditions?: string;
  shooter_collateral?: number;
  shooter_collateral_paid?: boolean;

  // Shooter Request Status
  shooter_user_id?: number;
  shooter_status?:
    | "none"
    | "pending"
    | "accepted_by_shooter"
    | "accepted_by_owners"
    | "declined";
  shooter_accepted_at?: string;
  owner1_accepted_shooter?: boolean;
  owner2_accepted_shooter?: boolean;
  shooter?: {
    id: number;
    name: string;
    profile_image?: string;
  };

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

  // Breeding Completion
  breeding_status?: "pending" | "in_progress" | "completed" | "failed";
  breeding_completed_at?: string;
  has_offspring?: boolean;
  breeding_notes?: string;

  // Timestamps
  accepted_at?: string;
  rejected_at?: string;
  created_at: string;
  updated_at: string;

  // User-specific fields
  can_edit: boolean;
  can_accept: boolean;
  is_creator: boolean;
  is_owner1?: boolean;
  is_shooter?: boolean;
  can_shooter_edit?: boolean;
  current_user_accepted_shooter?: boolean;
  can_mark_breeding_complete?: boolean;
  can_input_offspring?: boolean;
}

export interface ShooterRequestStatus {
  shooter_status: string;
  shooter?: {
    id: number;
    name: string;
    profile_image?: string;
  };
  owner1_accepted: boolean;
  owner2_accepted: boolean;
  is_owner1: boolean;
  current_user_accepted: boolean;
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
    const response = await axiosInstance.put(
      `/api/contracts/${contractId}`,
      data
    );
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

/**
 * Get shooter request status for a contract
 */
export const getShooterRequest = async (
  contractId: number
): Promise<ShooterRequestStatus | null> => {
  try {
    const response = await axiosInstance.get(
      `/api/contracts/${contractId}/shooter-request`
    );
    return response.data.data || null;
  } catch (error: any) {
    console.error(
      "Error getting shooter request:",
      error.response?.data || error.message
    );
    return null;
  }
};

/**
 * Accept a shooter request (by owner)
 */
export const acceptShooterRequest = async (
  contractId: number
): Promise<ApiResponse<BreedingContract>> => {
  try {
    const response = await axiosInstance.put(
      `/api/contracts/${contractId}/shooter-request/accept`
    );
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to accept shooter request";
    return { success: false, message: errorMessage };
  }
};

/**
 * Decline a shooter request (by owner)
 */
export const declineShooterRequest = async (
  contractId: number
): Promise<ApiResponse<BreedingContract>> => {
  try {
    const response = await axiosInstance.put(
      `/api/contracts/${contractId}/shooter-request/decline`
    );
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to decline shooter request";
    return { success: false, message: errorMessage };
  }
};

/**
 * Get count of pending shooter requests for current user
 */
export const getPendingShooterRequestsCount = async (): Promise<number> => {
  try {
    const response = await axiosInstance.get(
      `/api/contracts/shooter-requests/count`
    );
    return response.data.data?.count || 0;
  } catch (error: any) {
    console.error(
      "Error getting pending shooter requests count:",
      error.response?.data || error.message
    );
    return 0;
  }
};

/**
 * Update shooter's payment and collateral
 * Shooter can only edit payment and must provide collateral
 */
export const updateShooterTerms = async (
  contractId: number,
  shooterPayment: number,
  shooterCollateral: number
): Promise<ApiResponse<BreedingContract>> => {
  try {
    const response = await axiosInstance.put(
      `/api/shooter/contracts/${contractId}/terms`,
      {
        shooter_payment: shooterPayment,
        shooter_collateral: shooterCollateral,
      }
    );
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to update shooter terms";
    return { success: false, message: errorMessage };
  }
};

// ==================== BREEDING COMPLETION INTERFACES ====================

export interface BreedingCompletionData {
  breeding_status: "completed" | "failed";
  has_offspring: boolean;
  breeding_notes?: string;
}

export interface OffspringData {
  name?: string;
  sex: "male" | "female";
  color?: string;
  status: "alive" | "died" | "adopted";
  death_date?: string;
  notes?: string;
}

export interface OffspringInputData {
  birth_date: string;
  notes?: string;
  offspring: OffspringData[];
}

export interface OffspringAllocation {
  offspring_id: number;
  assigned_to: number;
  selection_order?: number;
}

export interface Offspring {
  offspring_id: number;
  name?: string;
  sex: "male" | "female";
  color?: string;
  status: "alive" | "died" | "adopted";
  allocation_status: "unassigned" | "assigned" | "transferred";
  assigned_to?: {
    id: number;
    name: string;
  };
  selection_order?: number;
}

export interface LitterData {
  litter_id: number;
  birth_date: string;
  statistics: {
    total_offspring: number;
    alive_offspring: number;
    died_offspring: number;
    male_count: number;
    female_count: number;
  };
  parents: {
    sire: {
      pet_id: number;
      name: string;
    };
    dam: {
      pet_id: number;
      name: string;
    };
  };
  offspring: Offspring[];
  share_offspring?: boolean;
  offspring_split_type?: "percentage" | "specific_number";
  offspring_split_value?: number;
  offspring_selection_method?: "first_pick" | "randomized";
}

export interface AllocationSummary {
  total_alive: number;
  dam_owner_receives: number;
  sire_owner_receives: number;
  selection_method: string;
}

export interface OwnerAllocationInfo {
  id: number;
  name: string;
  expected_count: number;
  current_count: number;
}

export interface ParentInfo {
  pet_id: number;
  name: string;
  owner_id: number;
  owner_name: string;
}

export interface AllocationSummaryData {
  contract_id: number;
  litter_id: number;
  share_offspring: boolean;
  allocation_method: {
    split_type: "percentage" | "specific_number";
    split_value: number;
    selection_method: "first_pick" | "randomized";
    selection_method_label: string;
  };
  statistics: {
    total_alive: number;
    total_died: number;
    male_count: number;
    female_count: number;
  };
  expected_allocation: {
    dam_owner: OwnerAllocationInfo;
    sire_owner: OwnerAllocationInfo;
  };
  unallocated_count: number;
  is_fully_allocated: boolean;
  can_complete_match: boolean;
  parents: {
    sire: ParentInfo;
    dam: ParentInfo;
  };
  offspring: Offspring[];
}

export interface CompleteMatchResponse {
  contract_id: number;
  conversation_id: number;
  status: string;
  archived_at: string;
}

// ==================== BREEDING COMPLETION FUNCTIONS ====================

/**
 * Mark breeding as complete
 * Only shooter (if assigned) or male pet owner can mark breeding complete
 */
export const completeBreeding = async (
  contractId: number,
  data: BreedingCompletionData
): Promise<ApiResponse<BreedingContract>> => {
  try {
    const response = await axiosInstance.put(
      `/api/contracts/${contractId}/complete-breeding`,
      data
    );
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to complete breeding";
    return { success: false, message: errorMessage };
  }
};

/**
 * Input offspring for a completed breeding contract
 * Only shooter (if assigned) or male pet owner can input offspring
 */
export const storeOffspring = async (
  contractId: number,
  data: OffspringInputData
): Promise<ApiResponse<{ litter: LitterData; contract: BreedingContract }>> => {
  try {
    const response = await axiosInstance.post(
      `/api/contracts/${contractId}/offspring`,
      data
    );
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to store offspring";
    return { success: false, message: errorMessage };
  }
};

/**
 * Get offspring for a contract
 */
export const getOffspring = async (
  contractId: number
): Promise<LitterData | null> => {
  try {
    const response = await axiosInstance.get(
      `/api/contracts/${contractId}/offspring`
    );
    return response.data.data || null;
  } catch (error: any) {
    // Return null to indicate no offspring data available
    // The calling component can handle this gracefully
    return null;
  }
};

/**
 * Manually allocate offspring to owners
 * Only shooter (if assigned) or male pet owner can allocate
 */
export const allocateOffspring = async (
  contractId: number,
  allocations: OffspringAllocation[]
): Promise<ApiResponse<{ offspring: Offspring[] }>> => {
  try {
    const response = await axiosInstance.put(
      `/api/contracts/${contractId}/offspring/allocate`,
      { allocations }
    );
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to allocate offspring";
    return { success: false, message: errorMessage };
  }
};

/**
 * Auto-allocate offspring based on contract terms
 * Uses contract's split type and selection method to distribute
 */
export const autoAllocateOffspring = async (
  contractId: number
): Promise<
  ApiResponse<{ allocation_summary: AllocationSummary; offspring: Offspring[] }>
> => {
  try {
    const response = await axiosInstance.post(
      `/api/contracts/${contractId}/offspring/auto-allocate`
    );
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to auto-allocate offspring";
    return { success: false, message: errorMessage };
  }
};

/**
 * Get offspring allocation summary for a contract
 * Shows allocation breakdown based on contract terms
 */
export const getOffspringAllocationSummary = async (
  contractId: number
): Promise<AllocationSummaryData | null> => {
  try {
    const response = await axiosInstance.get(
      `/api/contracts/${contractId}/offspring/allocation-summary`
    );
    return response.data.data || null;
  } catch (error: any) {
    console.error(
      "Error getting allocation summary:",
      error.response?.data || error.message
    );
    return null;
  }
};

/**
 * Complete the match after offspring allocation
 * Archives the conversation and marks the contract as fulfilled
 */
export const completeMatch = async (
  contractId: number
): Promise<ApiResponse<CompleteMatchResponse>> => {
  try {
    const response = await axiosInstance.post(
      `/api/contracts/${contractId}/complete-match`
    );
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to complete match";
    return { success: false, message: errorMessage };
  }
};
