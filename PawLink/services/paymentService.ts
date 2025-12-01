import axiosInstance from "@/config/axiosConfig";

export interface Payment {
  id: number;
  user_id: number;
  contract_id: number | null;
  payment_type: PaymentType;
  amount: number;
  currency: string;
  description: string | null;
  paymongo_checkout_id: string | null;
  paymongo_checkout_url: string | null;
  paymongo_payment_id: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentType =
  | "collateral"
  | "shooter_payment"
  | "monetary_compensation"
  | "shooter_collateral";

export type PaymentStatus =
  | "pending"
  | "awaiting_payment"
  | "processing"
  | "paid"
  | "failed"
  | "expired"
  | "refunded";

export interface CreateCheckoutParams {
  contract_id: number;
  payment_type: PaymentType;
  amount: number;
  success_url: string;
  cancel_url: string;
}

export interface CheckoutResponse {
  payment_id: number;
  checkout_url: string;
  expires_at: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
}

export interface VerifyPaymentResponse {
  payment_id: number;
  status: PaymentStatus;
  paid_at?: string;
}

/**
 * Create a PayMongo checkout session for payment
 */
export const createCheckout = async (
  params: CreateCheckoutParams
): Promise<ApiResponse<CheckoutResponse>> => {
  try {
    const response = await axiosInstance.post("/api/payments/checkout", params);
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to create payment session";
    return { success: false, message: errorMessage };
  }
};

/**
 * Verify a payment status
 */
export const verifyPayment = async (
  paymentId: number
): Promise<ApiResponse<VerifyPaymentResponse>> => {
  try {
    const response = await axiosInstance.get(
      `/api/payments/${paymentId}/verify`
    );
    return {
      success: true,
      message: "Payment status retrieved",
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to verify payment";
    return { success: false, message: errorMessage };
  }
};

/**
 * Get user's payment history
 */
export const getPayments = async (): Promise<ApiResponse<Payment[]>> => {
  try {
    const response = await axiosInstance.get("/api/payments");
    return {
      success: true,
      message: "Payments retrieved successfully",
      data: response.data.data.data, // Paginated data
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to get payments";
    return { success: false, message: errorMessage };
  }
};

/**
 * Get payments for a specific contract
 */
export const getContractPayments = async (
  contractId: number
): Promise<ApiResponse<Payment[]>> => {
  try {
    const response = await axiosInstance.get(
      `/api/contracts/${contractId}/payments`
    );
    return {
      success: true,
      message: "Contract payments retrieved successfully",
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to get contract payments";
    return { success: false, message: errorMessage };
  }
};

/**
 * Helper function to format payment amount as Philippine Peso
 */
export const formatPaymentAmount = (amount: number): string => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

/**
 * Helper function to get human-readable payment type
 */
export const getPaymentTypeLabel = (type: PaymentType): string => {
  const labels: Record<PaymentType, string> = {
    collateral: "Collateral",
    shooter_payment: "Shooter Payment",
    monetary_compensation: "Monetary Compensation",
    shooter_collateral: "Shooter Collateral",
  };
  return labels[type] || type;
};

/**
 * Helper function to get status color for UI
 */
export const getPaymentStatusColor = (
  status: PaymentStatus
): { bg: string; text: string } => {
  const colors: Record<PaymentStatus, { bg: string; text: string }> = {
    pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
    awaiting_payment: { bg: "bg-blue-100", text: "text-blue-800" },
    processing: { bg: "bg-blue-100", text: "text-blue-800" },
    paid: { bg: "bg-green-100", text: "text-green-800" },
    failed: { bg: "bg-red-100", text: "text-red-800" },
    expired: { bg: "bg-gray-100", text: "text-gray-800" },
    refunded: { bg: "bg-purple-100", text: "text-purple-800" },
  };
  return colors[status] || { bg: "bg-gray-100", text: "text-gray-800" };
};
