import axios from "@/config/axiosConfig";

export interface Notification {
  id: number;
  user_id: number;
  type: string; // 'user_verification', 'pet_verification'
  title: string;
  message: string;
  status: string | null; // 'approved', 'rejected'
  reference_id: number | null;
  reference_type: string | null; // 'user_auth', 'pet', 'vaccination', 'health_record'
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all notifications for the authenticated user.
 */
export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const response = await axios.get("api/notifications");
    return response.data.data || [];
  } catch (error: any) {
    console.error(
      "Error fetching notifications:",
      error.response?.data || error.message
    );
    return [];
  }
};

/**
 * Get unread notification count.
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const response = await axios.get("api/notifications/unread-count");
    return response.data.count || 0;
  } catch (error: any) {
    console.error(
      "Error fetching unread count:",
      error.response?.data || error.message
    );
    return 0;
  }
};

/**
 * Mark a notification as read.
 */
export const markAsRead = async (id: number): Promise<boolean> => {
  try {
    await axios.put(`api/notifications/${id}/read`);
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
export const markAllAsRead = async (): Promise<boolean> => {
  try {
    await axios.put("api/notifications/read-all");
    return true;
  } catch (error: any) {
    console.error(
      "Error marking all notifications as read:",
      error.response?.data || error.message
    );
    return false;
  }
};

/**
 * Delete a notification.
 */
export const deleteNotification = async (id: number): Promise<boolean> => {
  try {
    await axios.delete(`api/notifications/${id}`);
    return true;
  } catch (error: any) {
    console.error(
      "Error deleting notification:",
      error.response?.data || error.message
    );
    return false;
  }
};
