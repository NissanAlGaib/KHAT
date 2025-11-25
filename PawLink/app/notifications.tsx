import React, { useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useNotifications } from "@/context/NotificationContext";
import { NotificationItem } from "@/services/notificationService";

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
      default:
        return "bell";
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
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
      <View className="flex-row items-start">
        {/* Icon */}
        <View
          className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${getStatusColor(notification.status)}`}
        >
          <Feather
            name={getTypeIcon(notification.type) as any}
            size={20}
            color={
              notification.status === "approved"
                ? "#15803d"
                : notification.status === "rejected"
                  ? "#b91c1c"
                  : "#a16207"
            }
          />
        </View>

        {/* Content */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-sm text-gray-500">
              {formatDate(notification.updated_at)}
            </Text>
            <View
              className={`px-2 py-1 rounded-full flex-row items-center ${getStatusColor(notification.status)}`}
            >
              <Feather
                name={getStatusIcon(notification.status) as any}
                size={12}
                color={
                  notification.status === "approved"
                    ? "#15803d"
                    : notification.status === "rejected"
                      ? "#b91c1c"
                      : "#a16207"
                }
              />
              <Text
                className={`text-xs ml-1 font-medium ${getStatusTextColor(notification.status)}`}
              >
                {getStatusLabel(notification.status)}
              </Text>
            </View>
          </View>

          <Text className="text-base font-semibold text-gray-800 mb-1">
            {notification.message}
          </Text>

          {/* Show rejection reason if rejected */}
          {notification.status === "rejected" && notification.rejection_reason && (
            <View className="bg-red-50 rounded-lg p-3 mt-2">
              <Text className="text-sm font-medium text-red-800 mb-1">
                Reason for rejection:
              </Text>
              <Text className="text-sm text-red-700">
                {notification.rejection_reason}
              </Text>
            </View>
          )}

          {/* Resubmit button for rejected items */}
          {notification.status === "rejected" && (
            <TouchableOpacity
              className="mt-3 bg-[#ea5b3a] rounded-full py-2 px-4 self-start"
              onPress={() => onResubmit(notification)}
            >
              <Text className="text-white font-semibold text-sm">
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
  const {
    notifications,
    summary,
    isLoading,
    error,
    refreshNotifications,
  } = useNotifications();
  const [refreshing, setRefreshing] = React.useState(false);

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
      // Navigate to user verification resubmit screen
      router.push({
        pathname: "/(verification)/resubmit-user-verification",
        params: {
          authId: notification.auth_id,
          authType: notification.auth_type,
          documentType: notification.document_type,
        },
      });
    } else if (notification.type === "pet_vaccination") {
      // Navigate to pet vaccination resubmission
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
      // Navigate to health record resubmission
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
  const rejectedNotifications = notifications.filter(
    (n) => n.status === "rejected"
  );
  const pendingNotifications = notifications.filter(
    (n) => n.status === "pending"
  );
  const approvedNotifications = notifications.filter(
    (n) => n.status === "approved"
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FFE0D8]" edges={["top"]}>
      {/* Header */}
      <View className="bg-white px-6 py-4 rounded-b-[35px] shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-black ml-4">
            Notifications
          </Text>
        </View>

        {/* Summary badges */}
        {summary && (
          <View className="flex-row mt-4 gap-3">
            {summary.rejected > 0 && (
              <View className="bg-red-100 px-3 py-1 rounded-full flex-row items-center">
                <Feather name="alert-circle" size={14} color="#b91c1c" />
                <Text className="text-red-700 text-sm ml-1 font-medium">
                  {summary.rejected} needs action
                </Text>
              </View>
            )}
            {summary.pending > 0 && (
              <View className="bg-yellow-100 px-3 py-1 rounded-full flex-row items-center">
                <Feather name="clock" size={14} color="#a16207" />
                <Text className="text-yellow-700 text-sm ml-1 font-medium">
                  {summary.pending} pending
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 20 }}
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
        {isLoading && !refreshing ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#ea5b3a" />
            <Text className="text-gray-500 mt-4">Loading notifications...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-20">
            <Feather name="alert-circle" size={48} color="#ef4444" />
            <Text className="text-gray-700 text-lg mt-4">{error}</Text>
            <TouchableOpacity
              className="mt-4 bg-[#ea5b3a] px-6 py-3 rounded-full"
              onPress={refreshNotifications}
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <View className="w-20 h-20 bg-white rounded-full items-center justify-center mb-4">
              <Feather name="bell-off" size={40} color="#9ca3af" />
            </View>
            <Text className="text-gray-700 text-lg font-semibold">
              No notifications yet
            </Text>
            <Text className="text-gray-500 text-center mt-2 px-8">
              You&apos;ll see updates about your verification documents and pet
              records here
            </Text>
          </View>
        ) : (
          <>
            {/* Rejected section - needs action */}
            {rejectedNotifications.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-bold text-red-700 mb-3">
                  ⚠️ Needs Your Attention
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
                <Text className="text-lg font-bold text-yellow-700 mb-3">
                  ⏳ Under Review
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
                <Text className="text-lg font-bold text-green-700 mb-3">
                  ✅ Approved
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
    </SafeAreaView>
  );
}
