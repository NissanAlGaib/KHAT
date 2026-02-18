import React, { useEffect, useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useNotifications } from "@/context/NotificationContext";
import { NotificationItem } from "@/services/notificationService";
import { SettingsLayout } from "@/components/settings";

function NotificationCard({
  notification,
  onResubmit,
}: {
  notification: NotificationItem;
  onResubmit: (notification: NotificationItem) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100";
      case "rejected":
        return "bg-red-100";
      case "warning":
        return "bg-orange-100";
      case "pending":
      default:
        return "bg-yellow-100";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-green-700";
      case "rejected":
        return "text-red-700";
      case "warning":
        return "text-orange-700";
      case "pending":
      default:
        return "text-yellow-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "check-circle";
      case "rejected":
        return "x-circle";
      case "warning":
        return "alert-triangle";
      case "pending":
      default:
        return "clock";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "warning":
        return "Warning";
      case "pending":
      default:
        return "Pending";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "user_verification":
        return "user-check";
      case "pet_vaccination":
        return "activity";
      case "pet_health_record":
        return "file-text";
      case "admin_warning":
        return "alert-triangle";
      default:
        return "bell";
    }
  };

  const getStatusIconColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#15803d";
      case "rejected":
        return "#b91c1c";
      case "warning":
        return "#c2410c";
      case "pending":
      default:
        return "#a16207";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm mx-4 border border-gray-100">
      <View className="flex-row items-start">
        {/* Icon */}
        <View
          className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${getStatusColor(notification.status)}`}
        >
          <Feather
            name={getTypeIcon(notification.type) as any}
            size={20}
            color={getStatusIconColor(notification.status)}
          />
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs text-gray-400">
              {formatDate(notification.updated_at)}
            </Text>
            <View
              className={`px-2 py-0.5 rounded-full flex-row items-center ${getStatusColor(notification.status)}`}
            >
              <Feather
                name={getStatusIcon(notification.status) as any}
                size={10}
                color={getStatusIconColor(notification.status)}
              />
              <Text
                className={`text-[10px] ml-1 font-medium uppercase tracking-wide ${getStatusTextColor(notification.status)}`}
              >
                {getStatusLabel(notification.status)}
              </Text>
            </View>
          </View>

          <Text className="text-sm font-semibold text-gray-900 mb-1 leading-5">
            {notification.message}
          </Text>

          {/* Show rejection reason if rejected */}
          {notification.status === "rejected" &&
            notification.rejection_reason && (
              <View className="bg-red-50 rounded-lg p-3 mt-2 border border-red-100">
                <Text className="text-xs font-semibold text-red-800 mb-1">
                  Reason for rejection:
                </Text>
                <Text className="text-xs text-red-700 leading-4">
                  {notification.rejection_reason}
                </Text>
              </View>
            )}

          {/* Show admin notes for warnings */}
          {notification.type === "admin_warning" &&
            notification.admin_notes && (
              <View className="bg-orange-50 rounded-lg p-3 mt-2 border border-orange-100">
                <Text className="text-xs font-semibold text-orange-800 mb-1">
                  Details from admin:
                </Text>
                <Text className="text-xs text-orange-700 leading-4">
                  {notification.admin_notes}
                </Text>
              </View>
            )}

          {/* Resubmit button for rejected items (not for warnings) */}
          {notification.status === "rejected" &&
            notification.type !== "admin_warning" && (
              <TouchableOpacity
                className="mt-3 bg-red-500 rounded-lg py-2 px-3 self-start shadow-sm"
                onPress={() => onResubmit(notification)}
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-xs">
                  Resubmit Document
                </Text>
              </TouchableOpacity>
            )}
        </View>
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, summary, isLoading, error, refreshNotifications } =
    useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  }, [refreshNotifications]);

  const handleResubmit = (notification: NotificationItem) => {
    // Navigate to appropriate resubmission screen based on notification type
    if (notification.type === "user_verification") {
      router.push({
        pathname: "/(verification)/resubmit-user-verification",
        params: {
          authId: notification.auth_id,
          authType: notification.auth_type,
          documentType: notification.document_type,
        },
      });
    } else if (notification.type === "pet_vaccination") {
      router.push({
        pathname: "/(verification)/resubmit-document",
        params: {
          type: "vaccination",
          petId: notification.pet_id,
          vaccinationId: notification.vaccination_id,
          petName: notification.pet_name,
          vaccineName: notification.vaccine_name,
        },
      });
    } else if (notification.type === "pet_health_record") {
      router.push({
        pathname: "/(verification)/resubmit-document",
        params: {
          type: "health_record",
          petId: notification.pet_id,
          healthRecordId: notification.health_record_id,
          petName: notification.pet_name,
          recordType: notification.record_type,
        },
      });
    }
  };

  // Group notifications by status for section display
  const warningNotifications = notifications.filter(
    (n) => n.status === "warning",
  );
  const rejectedNotifications = notifications.filter(
    (n) => n.status === "rejected",
  );
  const pendingNotifications = notifications.filter(
    (n) => n.status === "pending",
  );
  const approvedNotifications = notifications.filter(
    (n) => n.status === "approved",
  );

  return (
    <SettingsLayout
      headerTitle="Notifications"
      contentContainerStyle={{ paddingBottom: 20 }}
      scrollable={false}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#ea5b3a"]}
            tintColor="#ea5b3a"
          />
        }
      >
        {/* Summary badges */}
        {summary && (
          <View className="px-4 py-4 flex-row gap-2 flex-wrap mb-2">
            {(summary.warnings ?? 0) > 0 && (
              <View className="bg-orange-100 px-3 py-1.5 rounded-full flex-row items-center border border-orange-200">
                <Feather name="alert-triangle" size={12} color="#c2410c" />
                <Text className="text-orange-800 text-xs ml-1.5 font-medium">
                  {summary.warnings} warning{summary.warnings > 1 ? "s" : ""}
                </Text>
              </View>
            )}
            {summary.rejected > 0 && (
              <View className="bg-red-100 px-3 py-1.5 rounded-full flex-row items-center border border-red-200">
                <Feather name="alert-circle" size={12} color="#b91c1c" />
                <Text className="text-red-800 text-xs ml-1.5 font-medium">
                  {summary.rejected} action{summary.rejected > 1 ? "s" : ""}{" "}
                  needed
                </Text>
              </View>
            )}
            {summary.pending > 0 && (
              <View className="bg-yellow-100 px-3 py-1.5 rounded-full flex-row items-center border border-yellow-200">
                <Feather name="clock" size={12} color="#a16207" />
                <Text className="text-yellow-800 text-xs ml-1.5 font-medium">
                  {summary.pending} pending
                </Text>
              </View>
            )}
          </View>
        )}

        {isLoading && !refreshing ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#ea5b3a" />
            <Text className="text-gray-500 mt-4">Loading notifications...</Text>
          </View>
        ) : error ? (
          <View className="items-center justify-center py-20 px-6">
            <Feather name="alert-circle" size={48} color="#ef4444" />
            <Text className="text-gray-700 text-lg mt-4 text-center">
              {error}
            </Text>
            <TouchableOpacity
              className="mt-4 bg-[#ea5b3a] px-6 py-3 rounded-full"
              onPress={refreshNotifications}
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View className="items-center justify-center py-32 px-6">
            <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Feather name="bell-off" size={32} color="#9CA3AF" />
            </View>
            <Text className="text-gray-900 text-lg font-semibold">
              All caught up!
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              You don't have any notifications at the moment.
            </Text>
          </View>
        ) : (
          <>
            {/* Admin warnings section */}
            {warningNotifications.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-4">
                  Admin Warnings
                </Text>
                {warningNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onResubmit={handleResubmit}
                  />
                ))}
              </View>
            )}

            {/* Rejected section - needs action */}
            {rejectedNotifications.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-4">
                  Needs Your Attention
                </Text>
                {rejectedNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onResubmit={handleResubmit}
                  />
                ))}
              </View>
            )}

            {/* Pending section */}
            {pendingNotifications.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-4">
                  Under Review
                </Text>
                {pendingNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onResubmit={handleResubmit}
                  />
                ))}
              </View>
            )}

            {/* Approved section */}
            {approvedNotifications.length > 0 && (
              <View className="mb-6">
                <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 px-4">
                  Approved
                </Text>
                {approvedNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    onResubmit={handleResubmit}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SettingsLayout>
  );
}
