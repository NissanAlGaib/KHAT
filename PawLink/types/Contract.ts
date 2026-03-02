/**
 * Contract-related TypeScript interfaces
 *
 * DEPRECATED: This file is kept for backward compatibility only.
 * The authoritative contract types are defined in @/services/contractService.ts.
 * Import from there instead:
 *
 *   import { BreedingContract, ContractFormData } from "@/services/contractService";
 */

// Re-export authoritative types from the service layer
export type {
  BreedingContract,
  ContractFormData,
  AllocationSummaryData as AllocationSummary,
} from "@/services/contractService";

// Contract statuses actually used by the backend
export type ContractStatus =
  | "draft"
  | "pending_review"
  | "accepted"
  | "rejected"
  | "fulfilled";
