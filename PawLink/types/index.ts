/**
 * PawLink Type Exports
 * Central export file for all TypeScript interfaces
 */

export * from "./Pet";
export * from "./User";
export * from "./Contract";

// Common API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

// Common component prop types
export interface ModalProps {
  visible: boolean;
  onClose: () => void;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}
