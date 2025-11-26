import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  getConversations,
  type ConversationPreview,
} from "@/services/matchRequestService";
import { API_BASE_URL } from "@/config/env";

const Chat = () => {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return `${API_BASE_URL}/storage/${path}`;
  };

  const fetchConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const renderConversationItem = (conversation: ConversationPreview) => {
    // Handle shooter conversations differently
    if (conversation.is_shooter_conversation) {
      return (
        <TouchableOpacity
          key={conversation.id}
          className="bg-white rounded-2xl p-4 mb-3 shadow-sm"
          onPress={() =>
            router.push(`/(chat)/conversation?id=${conversation.id}`)
          }
        >
          <View className="flex-row items-center mb-2">
            <View className="bg-[#FF6B6B] px-2 py-1 rounded">
              <Text className="text-white text-xs font-semibold">Shooter</Text>
            </View>
            <Text className="text-gray-400 text-xs ml-auto">
              {conversation.last_message
                ? formatTimeAgo(conversation.last_message.created_at)
                : formatTimeAgo(conversation.updated_at)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="flex-row">
              {conversation.pet1?.photo_url ? (
                <Image
                  source={{
                    uri: getImageUrl(conversation.pet1.photo_url) || undefined,
                  }}
                  className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white"
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center border-2 border-white">
                  <Feather name="image" size={20} color="#9CA3AF" />
                </View>
              )}
              {conversation.pet2?.photo_url ? (
                <Image
                  source={{
                    uri: getImageUrl(conversation.pet2.photo_url) || undefined,
                  }}
                  className="w-12 h-12 rounded-full bg-gray-200 -ml-3 border-2 border-white"
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center -ml-3 border-2 border-white">
                  <Feather name="image" size={20} color="#9CA3AF" />
                </View>
              )}
            </View>
            <View className="flex-1 ml-3">
              <Text className="font-bold text-base">
                {conversation.pet1?.name} & {conversation.pet2?.name}
              </Text>
              <Text className="text-gray-500 text-sm">
                {conversation.owner1?.name} & {conversation.owner2?.name}
              </Text>
            </View>
            {conversation.unread_count > 0 && (
              <View className="bg-[#FF6B6B] rounded-full min-w-[20px] h-5 items-center justify-center px-1">
                <Text className="text-white text-xs font-bold">
                  {conversation.unread_count > 99
                    ? "99+"
                    : conversation.unread_count}
                </Text>
              </View>
            )}
          </View>
          {conversation.last_message && (
            <Text
              className={`text-sm mt-2 ${
                conversation.unread_count > 0
                  ? "text-black font-medium"
                  : "text-gray-400"
              }`}
              numberOfLines={1}
            >
              {conversation.last_message.is_own ? "You: " : ""}
              {conversation.last_message.content}
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    // Regular owner conversation
    return (
      <TouchableOpacity
        key={conversation.id}
        className="bg-white rounded-2xl p-4 mb-3 flex-row items-center shadow-sm"
        onPress={() =>
          router.push(`/(chat)/conversation?id=${conversation.id}`)
        }
      >
        <View className="relative">
          {conversation.matched_pet?.photo_url ? (
            <Image
              source={{
                uri:
                  getImageUrl(conversation.matched_pet.photo_url) || undefined,
              }}
              className="w-16 h-16 rounded-full bg-gray-200"
            />
          ) : (
            <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center">
              <Feather name="image" size={24} color="#9CA3AF" />
            </View>
          )}
          {conversation.unread_count > 0 && (
            <View className="absolute -top-1 -right-1 bg-[#FF6B6B] rounded-full min-w-[20px] h-5 items-center justify-center px-1">
              <Text className="text-white text-xs font-bold">
                {conversation.unread_count > 99
                  ? "99+"
                  : conversation.unread_count}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-base">
              {conversation.matched_pet?.name}
            </Text>
            <Text className="text-gray-400 text-xs">
              {conversation.last_message
                ? formatTimeAgo(conversation.last_message.created_at)
                : formatTimeAgo(conversation.updated_at)}
            </Text>
          </View>
          <Text className="text-gray-500 text-sm">
            {conversation.owner?.name}
          </Text>
          {conversation.last_message && (
            <Text
              className={`text-sm mt-1 ${
                conversation.unread_count > 0
                  ? "text-black font-medium"
                  : "text-gray-400"
              }`}
              numberOfLines={1}
            >
              {conversation.last_message.is_own ? "You: " : ""}
              {conversation.last_message.content}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FFF5F5] items-center justify-center">
        <ActivityIndicator size="large" color="#ea5b3a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FFF5F5]" edges={["top"]}>
      {/* Header */}
      <View className="px-6 py-4 bg-white flex-row items-center justify-between">
        <Text className="text-2xl font-bold">Messages</Text>
        <TouchableOpacity>
          <Feather name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        className="flex-1 px-4 mt-4"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {conversations.length > 0 ? (
          conversations.map(renderConversationItem)
        ) : (
          <View className="items-center justify-center py-20">
            <Feather name="message-circle" size={48} color="#ccc" />
            <Text className="text-gray-400 mt-4 text-center">
              No conversations yet
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-1">
              Accept a match request to start chatting
            </Text>
            <TouchableOpacity
              className="mt-6 bg-[#FF6B6B] px-6 py-3 rounded-full"
              onPress={() => router.push("/(tabs)/favorites")}
            >
              <Text className="text-white font-semibold">View Requests</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Chat;
