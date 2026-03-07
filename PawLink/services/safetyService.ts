import axiosInstance from "@/config/axiosConfig";

export interface BlockedUser {
  id: number;
  name: string;
  profile_image?: string;
}

export interface BlockStatus {
  is_blocked: boolean;
  is_blocked_by: boolean;
}

export interface ReportReason {
  value: string;
  label: string;
}

export interface SafetyReport {
  id: number;
  reporter_id: number;
  reported_id: number;
  reason: string;
  description?: string;
  status: string;
  created_at: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Block a user
 */
export const blockUser = async (userId: number): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.post(`/api/users/${userId}/block`);
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    const errorMessage = err.response?.data?.message || "Failed to block user";
    return { success: false, message: errorMessage };
  }
};

/**
 * Unblock a user
 */
export const unblockUser = async (userId: number): Promise<ApiResponse> => {
  try {
    const response = await axiosInstance.delete(`/api/users/${userId}/block`);
    return {
      success: true,
      message: response.data.message,
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    const errorMessage = err.response?.data?.message || "Failed to unblock user";
    return { success: false, message: errorMessage };
  }
};

/**
 * Get list of blocked users
 */
export const getBlockedUsers = async (): Promise<BlockedUser[]> => {
  try {
    const response = await axiosInstance.get("/api/users/blocked");
    return response.data.data || [];
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string };
    console.error("Error getting blocked users:", err.response?.data || err.message);
    return [];
  }
};

/**
 * Check if a user is blocked
 */
export const getBlockStatus = async (userId: number): Promise<BlockStatus> => {
  try {
    const response = await axiosInstance.get(`/api/users/${userId}/blocked-status`);
    return response.data.data || { is_blocked: false, is_blocked_by: false };
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string };
    console.error("Error checking block status:", err.response?.data || err.message);
    return { is_blocked: false, is_blocked_by: false };
  }
};

/**
 * Report a user
 */
export const reportUser = async (
  userId: number,
  reason: string,
  description?: string
): Promise<ApiResponse<SafetyReport>> => {
  try {
    const response = await axiosInstance.post(`/api/users/${userId}/report`, {
      reason,
      description,
    });
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    const errorMessage = err.response?.data?.message || "Failed to submit report";
    return { success: false, message: errorMessage };
  }
};

/**
 * Get available report reasons
 */
export const getReportReasons = async (): Promise<ReportReason[]> => {
  try {
    const response = await axiosInstance.get("/api/report-reasons");
    return response.data.data || [];
  } catch (error: unknown) {
    const err = error as { response?: { data?: unknown }; message?: string };
    console.error("Error getting report reasons:", err.response?.data || err.message);
    // Return default reasons as fallback
    return [
      { value: "harassment", label: "Harassment" },
      { value: "scam", label: "Scam or Fraud" },
      { value: "inappropriate", label: "Inappropriate Content" },
      { value: "fake_profile", label: "Fake Profile" },
      { value: "other", label: "Other" },
    ];
  }
};
