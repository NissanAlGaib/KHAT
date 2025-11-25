import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useNotifications } from "@/context/NotificationContext";
import { ChevronLeft, Bell, CheckCheck, Trash2 } from "lucide-react-native";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
  } = useNotifications();

  useEffect(() => {
    refreshNotifications();
  }, []);

  const getNotificationIcon = (type: string, status: string | null) => {
    const iconColor = status === "approved" ? "#22c55e" : status === "rejected" ? "#ef4444" : "#ea5b3a";
    return <Bell size={24} color={iconColor} />;
  };

  const getStatusColor = (status: string | null) => {
    if (status === "approved") return "bg-green-100 text-green-800";
    if (status === "rejected") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const handleNotificationPress = async (notification: any) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
    }
  };

  return (
    <View className="flex-1 bg-[#FFE0D8]">
      {/* Header */}
      <View className="bg-white pt-14 pb-4 px-4 rounded-b-3xl shadow-md">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <ChevronLeft size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-xl font-baloo text-[#ea5b3a]">Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={markAllNotificationsAsRead}
              className="flex-row items-center gap-1"
            >
              <CheckCheck size={20} color="#ea5b3a" />
              <Text className="text-[#ea5b3a] text-sm">Read All</Text>
            </TouchableOpacity>
          )}
          {unreadCount === 0 && <View className="w-20" />}
        </View>
        {unreadCount > 0 && (
          <Text className="text-center text-gray-500 mt-2">
            {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {/* Notifications List */}
      <ScrollView
        className="flex-1 px-4 mt-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshNotifications}
            colors={["#ea5b3a"]}
            tintColor="#ea5b3a"
          />
        }
      >
        {isLoading && notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#ea5b3a" />
          </View>
        ) : notifications.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Bell size={64} color="#ccc" />
            <Text className="text-gray-400 text-lg mt-4 font-baloo">
              No notifications yet
            </Text>
            <Text className="text-gray-400 text-sm mt-1 text-center px-8">
              You&apos;ll receive notifications here when your verifications are processed
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => handleNotificationPress(notification)}
              className={`mb-3 rounded-2xl p-4 shadow-sm ${
                notification.is_read ? "bg-white" : "bg-white border-2 border-[#ea5b3a]"
              }`}
            >
              <View className="flex-row items-start">
                <View className="mr-3 mt-1">
                  {getNotificationIcon(notification.type, notification.status)}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`font-baloo text-base ${
                        notification.is_read ? "text-gray-700" : "text-[#111]"
                      }`}
                    >
                      {notification.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeNotification(notification.id)}
                      className="p-1"
                    >
                      <Trash2 size={16} color="#999" />
                    </TouchableOpacity>
                  </View>
                  <Text
                    className={`text-sm mt-1 ${
                      notification.is_read ? "text-gray-500" : "text-gray-600"
                    }`}
                  >
                    {notification.message}
                  </Text>
                  <View className="flex-row items-center justify-between mt-2">
                    {notification.status && (
                      <View
                        className={`px-2 py-0.5 rounded-full ${getStatusColor(
                          notification.status
                        )}`}
                      >
                        <Text className="text-xs capitalize">
                          {notification.status}
                        </Text>
                      </View>
                    )}
                    <Text className="text-xs text-gray-400">
                      {dayjs(notification.created_at).fromNow()}
                    </Text>
                  </View>
                </View>
              </View>
              {!notification.is_read && (
                <View className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#ea5b3a]" />
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}
