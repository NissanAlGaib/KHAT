import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getNotifications,
  getNotificationCount,
  NotificationItem,
  NotificationSummary,
  NotificationCountResponse,
} from "@/services/notificationService";
import { useSession } from "@/context/AuthContext";

interface NotificationContextType {
  notifications: NotificationItem[];
  summary: NotificationSummary | null;
  badgeCount: number;
  hasRejected: boolean;
  isLoading: boolean;
  error: string | null;
  refreshNotifications: () => Promise<void>;
  refreshBadgeCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const [hasRejected, setHasRejected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useSession();

  const refreshNotifications = useCallback(async () => {
    if (!session) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getNotifications();
      setNotifications(data.notifications);
      setSummary(data.summary);
      // Also update badge count from summary
      setBadgeCount(data.summary.rejected + (data.summary.warnings ?? 0));
      setHasRejected(data.summary.rejected > 0);
    } catch (err: any) {
      console.error("Error refreshing notifications:", err);
      setError(err.message || "Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const refreshBadgeCount = useCallback(async () => {
    if (!session) return;

    try {
      const data: NotificationCountResponse = await getNotificationCount();
      setBadgeCount(data.count);
      setHasRejected(data.has_rejected);
    } catch (err: any) {
      console.error("Error refreshing badge count:", err);
    }
  }, [session]);

  // Load badge count on mount and when session changes
  useEffect(() => {
    if (session) {
      refreshBadgeCount();
    } else {
      // Reset state when user logs out
      setNotifications([]);
      setSummary(null);
      setBadgeCount(0);
      setHasRejected(false);
    }
  }, [session, refreshBadgeCount]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        summary,
        badgeCount,
        hasRejected,
        isLoading,
        error,
        refreshNotifications,
        refreshBadgeCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
