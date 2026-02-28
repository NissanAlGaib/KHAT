import axios from "@/config/axiosConfig";

// ─── Types ──────────────────────────────────────────────────────

export type ActivityNotificationType =
  | "match_request"
  | "match_accepted"
  | "match_declined"
  | "new_message"
  | "system"
  | "shooter_request"
  | "shooter_accepted"
  | "contract_completed"
  | "subscription"
  | "payment";

export interface ActivityNotification {
  id: number;
  user_id: number;
  type: ActivityNotificationType;
  title: string;
  message: string;
  data: Record<string, any> | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityNotificationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ActivityNotificationsResponse {
  success: boolean;
  data: ActivityNotification[];
  meta: ActivityNotificationMeta;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

// ─── API Functions ──────────────────────────────────────────────

/**
 * Fetch paginated activity notifications.
 */
export const getActivityNotifications = async (
  page: number = 1,
  perPage: number = 20,
  type?: ActivityNotificationType,
  status?: "read" | "unread"
): Promise<ActivityNotificationsResponse> => {
  try {
    const params: Record<string, any> = { page, per_page: perPage };
    if (type) params.type = type;
    if (status) params.status = status;

    const response = await axios.get("api/activity-notifications", { params });
    return response.data;
  } catch (error: any) {
    console.error(
      "Error fetching activity notifications:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Get unread activity notification count.
 */
export const getActivityUnreadCount = async (): Promise<number> => {
  try {
    const response = await axios.get("api/activity-notifications/unread-count");
    return response.data.data.count;
  } catch (error: any) {
    console.error(
      "Error fetching unread count:",
      error.response?.data || error.message
    );
    return 0;
  }
};

/**
 * Mark a single notification as read.
 */
export const markActivityAsRead = async (id: number): Promise<boolean> => {
  try {
    await axios.put(`api/activity-notifications/${id}/read`);
    return true;
  } catch (error: any) {
    console.error(
      "Error marking notification as read:",
      error.response?.data || error.message
    );
    return false;
  }
};

/**
 * Mark all notifications as read.
 */
export const markAllActivityAsRead = async (): Promise<boolean> => {
  try {
    await axios.put("api/activity-notifications/read-all");
    return true;
  } catch (error: any) {
    console.error(
      "Error marking all notifications as read:",
      error.response?.data || error.message
    );
    return false;
  }
};

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Get the icon name (Feather) for a notification type.
 */
export const getNotificationIcon = (
  type: ActivityNotificationType
): string => {
  const icons: Record<ActivityNotificationType, string> = {
    match_request: "heart",
    match_accepted: "check-circle",
    match_declined: "x-circle",
    new_message: "message-circle",
    system: "info",
    shooter_request: "camera",
    shooter_accepted: "check-square",
    contract_completed: "award",
    subscription: "star",
    payment: "credit-card",
  };
  return icons[type] || "bell";
};

/**
 * Get the color for a notification type.
 */
export const getNotificationColor = (
  type: ActivityNotificationType
): string => {
  const colors: Record<ActivityNotificationType, string> = {
    match_request: "#FF6B4A",
    match_accepted: "#22C55E",
    match_declined: "#EF4444",
    new_message: "#3B82F6",
    system: "#6B7280",
    shooter_request: "#F59E0B",
    shooter_accepted: "#10B981",
    contract_completed: "#8B5CF6",
    subscription: "#F59E0B",
    payment: "#8B5CF6",
  };
  return colors[type] || "#6B7280";
};

/**
 * Get a human-friendly label for a notification type.
 */
export const getNotificationTypeLabel = (
  type: ActivityNotificationType
): string => {
  const labels: Record<ActivityNotificationType, string> = {
    match_request: "Match Request",
    match_accepted: "Match Accepted",
    match_declined: "Match Declined",
    new_message: "New Message",
    system: "System",
    shooter_request: "Shooter Request",
    shooter_accepted: "Shooter Accepted",
    contract_completed: "Contract Complete",
    subscription: "Subscription",
    payment: "Payment",
  };
  return labels[type] || "Notification";
};
