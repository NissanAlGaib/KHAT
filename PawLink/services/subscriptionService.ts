import axiosInstance from "@/config/axiosConfig";

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  features: string[];
  highlighted?: boolean;
  tier_level: number; // 0 = free, 1 = standard, 2 = premium
  color_primary: string;
  color_secondary: string;
  icon: string;
}

export interface SubscriptionPlansResponse {
  success: boolean;
  data: SubscriptionPlan[];
  payment_configured: boolean;
  current_subscription?: {
    tier: string;
    expires_at: string | null;
    is_active: boolean;
  };
}

export interface CheckoutResponse {
  success: boolean;
  message?: string;
  data?: {
    payment_id: number;
    checkout_url: string;
    expires_at: string;
  };
}

export interface PaymentVerifyResponse {
  success: boolean;
  data?: {
    status: string;
  };
}

/**
 * Fetch available subscription plans from the backend
 */
export const getSubscriptionPlans =
  async (): Promise<SubscriptionPlansResponse> => {
    const response =
      await axiosInstance.get<SubscriptionPlansResponse>(
        "/api/subscriptions/plans",
      );
    return response.data;
  };

/**
 * Create a checkout session for a subscription plan
 */
export const createSubscriptionCheckout = async (params: {
  plan_id: string;
  billing_cycle: "monthly" | "yearly";
  amount: number;
  success_url: string;
  cancel_url: string;
}): Promise<CheckoutResponse> => {
  const response = await axiosInstance.post<CheckoutResponse>(
    "/api/subscriptions/checkout",
    params,
  );
  return response.data;
};

/**
 * Verify a payment by its ID
 */
export const verifyPayment = async (
  paymentId: number,
): Promise<PaymentVerifyResponse> => {
  const response = await axiosInstance.get<PaymentVerifyResponse>(
    `/api/payments/${paymentId}/verify`,
  );
  return response.data;
};
