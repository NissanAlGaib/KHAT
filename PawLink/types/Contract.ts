/**
 * Contract-related TypeScript interfaces
 */

import type { Pet } from "./Pet";
import type { User } from "./User";

export type ContractStatus =
  | "draft"
  | "pending"
  | "accepted"
  | "shooter_requested"
  | "shooter_accepted"
  | "in_progress"
  | "breeding_complete"
  | "completed"
  | "rejected"
  | "cancelled";

export type OffspringSplitType = "percentage" | "fixed" | "alternating";

export type OffspringSelectionMethod =
  | "owner_first"
  | "sire_first"
  | "alternating"
  | "random";

export interface BreedingContract {
  id: number;
  conversation_id: number;
  dam_owner_id: number;
  sire_owner_id: number;
  dam_pet_id: number;
  sire_pet_id: number;
  status: ContractStatus;

  // Shooter Agreement
  shooter_id?: number;
  shooter_name?: string;
  shooter_payment?: number;
  shooter_location?: string;
  shooter_conditions?: string;

  // Payment & Compensation
  end_contract_date?: string;
  include_monetary_amount: boolean;
  monetary_amount?: number;
  share_offspring: boolean;
  offspring_split_type?: OffspringSplitType;
  offspring_split_value?: number;
  offspring_selection_method?: OffspringSelectionMethod;
  include_goods_foods: boolean;
  goods_foods_value?: number;
  collateral_total: number;

  // Legal & Terms
  owner_responsibilities?: string;
  additional_conditions?: string;
  signature_required: boolean;

  // Relationships
  dam_owner?: User;
  sire_owner?: User;
  dam_pet?: Pet;
  sire_pet?: Pet;
  shooter?: User;
  litters?: import("./Pet").Litter[];

  // Timestamps
  created_at: string;
  updated_at: string;
  accepted_at?: string;
  completed_at?: string;
}

export interface ContractFormData {
  // Shooter Agreement
  shooter_name?: string;
  shooter_payment?: number;
  shooter_location?: string;
  shooter_conditions?: string;

  // Payment & Compensation
  end_contract_date?: string;
  include_monetary_amount?: boolean;
  monetary_amount?: number;
  share_offspring?: boolean;
  offspring_split_type?: OffspringSplitType;
  offspring_split_value?: number;
  offspring_selection_method?: OffspringSelectionMethod;
  include_goods_foods?: boolean;
  goods_foods_value?: number;
  collateral_total?: number;

  // Legal & Terms
  owner_responsibilities?: string;
  additional_conditions?: string;
  signature_required?: boolean;
}

export interface ContractAction {
  type: "accept" | "reject" | "edit" | "complete" | "cancel";
  label: string;
  icon?: string;
  variant: "primary" | "secondary" | "danger" | "success";
}

export interface AllocationSummary {
  dam_owner_count: number;
  sire_owner_count: number;
  shooter_count: number;
  unallocated_count: number;
  total_count: number;
}
