import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import AlertModal from "@/components/core/AlertModal";
import { useAlert } from "@/hooks/useAlert";
import {
  deleteGenerationHistoryItem,
  getGenerationHistory,
  type AiGenerationHistoryItem,
  type AiGenerationHistoryMeta,
  type SourceMode,
} from "@/services/aiImageService";
import { getStorageUrl } from "@/utils/imageUrl";

const PAGE_SIZE = 10;
const DEFAULT_META: AiGenerationHistoryMeta = {
  current_page: 1,
  last_page: 1,
  per_page: PAGE_SIZE,
  total: 0,
};

const formatSourceModeLabel = (mode?: SourceMode | null): string => {
  return mode === "count" ? "Multiple Photos" : "Primary Photo";
};

const formatSourceCountLabel = (
  mode?: SourceMode | null,
  count?: number | null,
): string => {
  const safeCount = typeof count === "number" && count > 0 ? count : 1;

  if (mode === "count") {
    return `${safeCount} photo${safeCount === 1 ? "" : "s"} per parent`;
  }

  return "1 primary photo per parent";
};

const getResolvedImageUrl = (path?: string | null): string | undefined => {
  if (!path) {
    return undefined;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return getStorageUrl(path) ?? undefined;
};

const getParentName = (name?: string | null, fallback: string = "Unknown") => {
  if (typeof name === "string" && name.trim().length > 0) {
    return name;
  }

  return fallback;
};

const getBreedLine = (item: AiGenerationHistoryItem): string | null => {
  const breeds = [item.pet1?.breed, item.pet2?.breed]
    .filter((breed): breed is string => typeof breed === "string" && breed.trim().length > 0)
    .map((breed) => breed.trim());

  if (breeds.length === 0) {
    return null;
  }

  return breeds.join(" x ");
};

export default function AIOffspringHistoryScreen() {
  const router = useRouter();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [items, setItems] = React.useState<AiGenerationHistoryItem[]>([]);
  const [meta, setMeta] = React.useState<AiGenerationHistoryMeta>(DEFAULT_META);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const loadHistory = async (
    page: number = 1,
    options: { append?: boolean; refresh?: boolean } = {},
  ) => {
    const { append = false, refresh = false } = options;

    if (append) {
      setLoadingMore(true);
    } else if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    const response = await getGenerationHistory(page, PAGE_SIZE);

    if (response.success) {
      setItems((previousItems) =>
        append ? [...previousItems, ...response.data] : response.data,
      );
      setMeta(response.meta);
    } else {
      if (!append) {
        setItems([]);
        setMeta({ ...DEFAULT_META, current_page: page });
      }

      showAlert({
        title: "History Unavailable",
        message:
          response.message ||
          "Unable to load AI offspring history right now. Please try again.",
        type: "error",
      });
    }

    setLoading(false);
    setRefreshing(false);
    setLoadingMore(false);
  };

  React.useEffect(() => {
    void loadHistory(1);
  }, []);

  const handleRefresh = () => {
    void loadHistory(1, { refresh: true });
  };

  const handleLoadMore = () => {
    if (loadingMore || loading || meta.current_page >= meta.last_page) {
      return;
    }

    void loadHistory(meta.current_page + 1, { append: true });
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);

    const response = await deleteGenerationHistoryItem(id);

    if (response.success) {
      setItems((previousItems) =>
        previousItems.filter((historyItem) => historyItem.id !== id),
      );
      setMeta((previousMeta) => ({
        ...previousMeta,
        total: Math.max(previousMeta.total - 1, 0),
      }));
    } else {
      showAlert({
        title: "Delete Failed",
        message:
          response.message ||
          "Unable to delete this AI offspring history item right now. Please try again.",
        type: "error",
      });
    }

    setDeletingId(null);
  };

  const confirmDelete = (id: number) => {
    showAlert({
      title: "Delete History Item",
      message:
        "This will permanently remove the generated preview from your AI offspring history.",
      type: "warning",
      buttons: [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void handleDelete(id);
          },
        },
      ],
    });
  };

  const renderItem = ({ item }: { item: AiGenerationHistoryItem }) => {
    const imageUrl = getResolvedImageUrl(item.image_url);
    const parentNames = `${getParentName(item.pet1?.name, "Parent 1")} x ${getParentName(item.pet2?.name, "Parent 2")}`;
    const breedLine = getBreedLine(item);
    const createdAt = item.created_at
      ? new Date(item.created_at).toLocaleString()
      : "Unknown date";
    const isDeleting = deletingId === item.id;

    return (
      <View style={styles.historyCard}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTextContainer}>
            <Text style={styles.cardTitle}>{parentNames}</Text>
            {breedLine ? <Text style={styles.cardSubtitle}>{breedLine}</Text> : null}
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmDelete(item.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Feather name="trash-2" size={18} color="#EF4444" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.generatedImageFrame}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.generatedImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons name="image-off-outline" size={34} color="#9CA3AF" />
              <Text style={styles.imagePlaceholderText}>Preview unavailable</Text>
            </View>
          )}
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#888" />
          <Text style={styles.detailText}>{createdAt}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="sparkles-outline" size={16} color="#FF6B4A" />
          <Text style={styles.detailText}>{formatSourceModeLabel(item.source_mode)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="images-outline" size={16} color="#FF6B4A" />
          <Text style={styles.detailText}>
            {formatSourceCountLabel(item.source_mode, item.source_photo_count)}
          </Text>
        </View>
      </View>
    );
  };

  const hasMore = meta.current_page < meta.last_page;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient colors={["#FF6B4A", "#FF9A8B"]} style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Feather name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Offspring History</Text>
          <View style={styles.headerButton} />
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#FF6B4A" />
          <Text style={styles.centerStateText}>Loading history...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerState}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="time-outline" size={34} color="#FF6B4A" />
          </View>
          <Text style={styles.emptyTitle}>No history yet</Text>
          <Text style={styles.emptySubtitle}>
            Your AI-generated offspring previews will appear here after you create them.
          </Text>
          <TouchableOpacity style={styles.emptyActionButton} onPress={() => router.back()}>
            <Text style={styles.emptyActionButtonText}>Back to Generator</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ListFooterComponent={
            <View style={styles.footerContainer}>
              {loadingMore ? (
                <ActivityIndicator size="small" color="#FF6B4A" />
              ) : hasMore ? (
                <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
                  <Text style={styles.loadMoreButtonText}>Load More</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.footerText}>You have reached the end of your history.</Text>
              )}
            </View>
          }
        />
      )}

      <AlertModal {...{ visible, ...alertOptions, onClose: hideAlert }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF4F4",
  },
  headerGradient: {
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingHorizontal: 20,
  },
  headerButton: {
    width: 42,
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  centerStateText: {
    marginTop: 12,
    fontSize: 14,
    color: "#888",
  },
  emptyIconCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#FFE0D8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    color: "#888",
    textAlign: "center",
  },
  emptyActionButton: {
    marginTop: 20,
    backgroundColor: "#FF6B4A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyActionButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  historyCard: {
    backgroundColor: "white",
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  cardHeaderTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#888",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF1F0",
    alignItems: "center",
    justifyContent: "center",
  },
  generatedImageFrame: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#FFF4F0",
    marginBottom: 14,
  },
  generatedImage: {
    width: "100%",
    aspectRatio: 1,
  },
  imagePlaceholder: {
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    marginTop: 10,
    fontSize: 14,
    color: "#888",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#555",
    flex: 1,
  },
  footerContainer: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 10,
  },
  loadMoreButton: {
    backgroundColor: "#FF6B4A",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  loadMoreButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  footerText: {
    fontSize: 13,
    color: "#999",
  },
});