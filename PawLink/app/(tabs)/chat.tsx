import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  getConversations,
  type ConversationPreview,
} from "@/services/matchRequestService";
import { API_BASE_URL } from "@/config/env";

export default function ChatScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const getImageUrl = (path: string | null | undefined): string | undefined => {
    if (!path) return undefined;
    return `${API_BASE_URL}/storage/${path}`;
  };

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  const renderConversationItem = (conversation: ConversationPreview) => (
    <TouchableOpacity
      key={conversation.id}
      style={styles.chatItem}
      onPress={() => router.push(`/(chat)/conversation?id=${conversation.id}`)}
    >
      <View style={styles.avatarContainer}>
        {conversation.is_shooter_conversation ? (
          <>
            <Image source={{ uri: getImageUrl(conversation.pet1?.photo_url) }} style={styles.avatar} />
            <Image source={{ uri: getImageUrl(conversation.pet2?.photo_url) }} style={[styles.avatar, styles.avatarOverlap]} />
          </>
        ) : (
          <Image source={{ uri: getImageUrl(conversation.matched_pet?.photo_url) }} style={styles.avatar} />
        )}
      </View>
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.chatName} numberOfLines={1}>
            {conversation.is_shooter_conversation ? `${conversation.pet1?.name} & ${conversation.pet2?.name}` : conversation.matched_pet?.name}
          </Text>
          <Text style={styles.chatTime}>
            {conversation.last_message ? formatTimeAgo(conversation.last_message.created_at) : formatTimeAgo(conversation.updated_at)}
          </Text>
        </View>
        <View style={styles.chatMessage}>
          <Text style={[styles.lastMessage, conversation.unread_count > 0 && styles.lastMessageUnread]} numberOfLines={1}>
            {conversation.last_message?.is_own && "You: "}
            {conversation.last_message?.content || (conversation.is_shooter_conversation ? 'Shooter conversation started' : 'Match successful!')}
          </Text>
          {conversation.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{conversation.unread_count > 9 ? '9+' : conversation.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const filteredConversations = conversations.filter(c => activeTab === 'active' ? !c.archived : c.archived);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity>
          <Feather name="search" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'active' && styles.tabActive]} onPress={() => setActiveTab('active')}>
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>Active</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabButton, activeTab === 'archived' && styles.tabActive]} onPress={() => setActiveTab('archived')}>
          <Text style={[styles.tabText, activeTab === 'archived' && styles.tabTextActive]}>Archived</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FF6B4A"]} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FF6B4A" style={{ marginTop: 50 }}/>
        ) : filteredConversations.length > 0 ? (
          filteredConversations.map(renderConversationItem)
        ) : (
          <View style={styles.emptyState}>
            <Feather name="message-square" size={48} color="#D1D5DB" />
            <Text style={styles.emptyStateText}>No {activeTab} conversations</Text>
            <Text style={styles.emptyStateSubText}>
              {activeTab === 'active' ? 'New matches will appear here.' : 'You have no archived chats.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: { fontSize: 32, fontWeight: 'bold' },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  tabButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  tabActive: { backgroundColor: '#FF6B4A' },
  tabText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: 'white' },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  avatarContainer: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#E5E7EB' },
  avatarOverlap: { marginLeft: -20, borderWidth: 2, borderColor: 'white' },
  chatContent: { flex: 1, marginLeft: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { fontSize: 17, fontWeight: 'bold' },
  chatTime: { fontSize: 13, color: '#9CA3AF' },
  chatMessage: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  lastMessage: { fontSize: 15, color: '#6B7280', flex: 1 },
  lastMessageUnread: { color: '#111827', fontWeight: '600' },
  unreadBadge: { backgroundColor: '#FF6B4A', borderRadius: 12, height: 24, minWidth: 24, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  unreadCount: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyStateText: { fontSize: 18, fontWeight: '600', color: '#6B7280', marginTop: 16 },
  emptyStateSubText: { fontSize: 14, color: '#9CA3AF', marginTop: 4 }
});