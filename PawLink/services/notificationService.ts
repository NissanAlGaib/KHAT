import axios from "@/config/axiosConfig";

export interface NotificationItem {
  id: string;
  type: "user_verification" | "pet_vaccination" | "pet_health_record" | "admin_warning";
  status: "pending" | "approved" | "rejected" | "warning";
  rejection_reason?: string;
  message: string;
  created_at: string;
  updated_at: string;
  // User verification specific fields
  auth_id?: number;
  auth_type?: string;
  document_type?: string;
  // Pet verification specific fields
  vaccination_id?: number;
  health_record_id?: number;
  pet_id?: number;
  pet_name?: string;
  vaccine_name?: string;
  record_type?: string;
  // Admin warning specific fields
  report_id?: number;
  reason?: string;
  reason_label?: string;
  admin_notes?: string;
}

export interface NotificationSummary {
  total: number;
  pending: number;
  rejected: number;
  warnings: number;
  approved: number;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  summary: NotificationSummary;
}

export interface NotificationCountResponse {
  count: number;
  has_rejected: boolean;
  has_warnings: boolean;
}

/**
 * Get all notifications for the authenticated user
 */
export const getNotifications = async (): Promise<NotificationsResponse> => {
  try {
    const response = await axios.get("api/notifications");
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Error getting notifications:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Get notification count for badge display
 */
export const getNotificationCount =
  async (): Promise<NotificationCountResponse> => {
    try {
      const response = await axios.get("api/notifications/count");
      return response.data.data;
    } catch (error: any) {
      console.error(
        "Error getting notification count:",
        error.response?.data || error.message
      );
      return { count: 0, has_rejected: false, has_warnings: false };
    }
  };
