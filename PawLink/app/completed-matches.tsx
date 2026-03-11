import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  getMatchHistory,
  type HistoryItem,
} from "@/services/matchRequestService";
import { getStorageUrl } from "@/utils/imageUrl";
import { Colors } from "@/constants";
import { SettingsLayout } from "@/components/settings";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function CompletedMatchesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchCompleted = useCallback(
    async (pageNum: number = 1, isRefresh = false) => {
      try {
        const result = await getMatchHistory(pageNum, "completed");
        if (pageNum === 1) {
          setItems(result.data);
        } else {
          setItems((prev) => [...prev, ...result.data]);
        }
        setPage(result.meta.current_page);
        setLastPage(result.meta.last_page);
      } catch (error) {
        console.error("Error fetching completed matches:", error);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchCompleted(1);
  }, [fetchCompleted]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCompleted(1, true);
  };

  const onEndReached = () => {
    if (page < lastPage && !loadingMore) {
      setLoadingMore(true);
      fetchCompleted(page + 1);
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const photoUrl = getStorageUrl(item.other_pet.photo_url);

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 shadow-sm mx-4"
        activeOpacity={0.7}
        onPress={() => {
          if (item.conversation_id) {
            router.push(
              `/(chat)/contract-detail?conversationId=${item.conversation_id}`,
            );
          }
        }}
      >
        <View className="flex-row items-center">
          {/* Pet avatar */}
          <View className="w-14 h-14 rounded-2xl bg-gray-100 overflow-hidden">
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Feather name="image" size={22} color="#D1D5DB" />
              </View>
            )}
          </View>

          {/* Info */}
          <View className="flex-1 ml-3">
            <View className="flex-row items-center justify-between">
              <Text className="font-bold text-base text-gray-800">
                {item.other_pet.name}
              </Text>
              <View className="bg-purple-100 px-2.5 py-1 rounded-full">
                <Text className="text-purple-700 text-xs font-semibold">
                  Completed
                </Text>
              </View>
            </View>
            {item.other_pet.breed && (
              <Text className="text-gray-400 text-xs mt-0.5">
                {item.other_pet.breed}
              </Text>
            )}
            <View className="flex-row items-center mt-1.5">
              <View className="flex-row items-center">
                <Feather name="user" size={11} color="#9CA3AF" />
                <Text className="text-gray-500 text-xs ml-1">
                  {item.owner.name}
                </Text>
              </View>
              <View className="mx-2 w-1 h-1 rounded-full bg-gray-300" />
              <View className="flex-row items-center">
                <Feather name="calendar" size={11} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs ml-1">
                  {formatDate(item.updated_at)}
                </Text>
              </View>
            </View>
          </View>

          <Feather name="chevron-right" size={18} color="#D1D5DB" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SettingsLayout headerTitle="Breeding History" scrollable={false}>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-gray-500 mt-3 text-sm">Loading...</Text>
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-4">
            <Feather name="award" size={36} color="#D1D5DB" />
          </View>
          <Text className="text-gray-600 font-semibold text-lg">
            No completed matches yet
          </Text>
          <Text className="text-gray-400 text-sm text-center mt-2">
            Your completed breeding contracts will appear here after both
            parties finalize.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={Colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </SettingsLayout>
  );
}
