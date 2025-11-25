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
import { useAlert } from "@/hooks/useAlert";
import AlertModal from "@/components/core/AlertModal";
import {
  getIncomingRequests,
  getAcceptedMatches,
  acceptMatchRequest,
  declineMatchRequest,
  type MatchRequest,
  type AcceptedMatch,
} from "@/services/matchRequestService";
import { API_BASE_URL } from "@/config/env";

type TabType = "PET" | "SHOOTER";
type SubTabType = "REQUESTS" | "MATCH";

const Favorites = () => {
  const router = useRouter();
  const { visible, alertOptions, showAlert, hideAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<TabType>("PET");
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>("REQUESTS");
  const [incomingRequests, setIncomingRequests] = useState<MatchRequest[]>([]);
  const [acceptedMatches, setAcceptedMatches] = useState<AcceptedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return `${API_BASE_URL}/storage/${path}`;
  };

  const fetchData = useCallback(async () => {
    try {
      const [requests, matches] = await Promise.all([
        getIncomingRequests(),
        getAcceptedMatches(),
      ]);
      setIncomingRequests(requests);
      setAcceptedMatches(matches);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleAccept = async (requestId: number) => {
    if (processingId) return;
    setProcessingId(requestId);

    try {
      const result = await acceptMatchRequest(requestId);
      if (result.success) {
        showAlert({
          title: "Match Accepted!",
          message: "You can now start chatting with the pet owner.",
          type: "success",
          buttons: [
            {
              text: "Start Chat",
              onPress: () => {
                if (result.conversation_id) {
                  router.push(`/(chat)/conversation?id=${result.conversation_id}`);
                }
              },
            },
            { text: "Later", style: "cancel" },
          ],
        });
        fetchData();
      } else {
        showAlert({
          title: "Error",
          message: result.message,
          type: "error",
        });
      }
    } catch (error) {
      showAlert({
        title: "Error",
        message: "Failed to accept match request",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: number) => {
    if (processingId) return;
    setProcessingId(requestId);

    try {
      const result = await declineMatchRequest(requestId);
      if (result.success) {
        showAlert({
          title: "Request Declined",
          message: "The match request has been declined.",
          type: "info",
        });
        fetchData();
      } else {
        showAlert({
          title: "Error",
          message: result.message,
          type: "error",
        });
      }
    } catch (error) {
      showAlert({
        title: "Error",
        message: "Failed to decline match request",
        type: "error",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderRequestItem = (request: MatchRequest) => (
    <View
      key={request.id}
      className="bg-white rounded-2xl p-4 mb-3 flex-row items-center shadow-sm"
    >
      {request.requester_pet.photo_url ? (
        <Image
          source={{
            uri: getImageUrl(request.requester_pet.photo_url) || undefined,
          }}
          className="w-16 h-16 rounded-full bg-gray-200"
        />
      ) : (
        <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center">
          <Feather name="image" size={24} color="#9CA3AF" />
        </View>
      )}
      <View className="flex-1 ml-3">
        <Text className="text-gray-500 text-sm">{request.owner.name}</Text>
        <Text className="font-bold text-base">{request.requester_pet.name}</Text>
        <Text className="text-gray-400 text-xs">
          {formatTimeAgo(request.created_at)}
        </Text>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="w-10 h-10 bg-gray-200 rounded-full items-center justify-center"
          onPress={() => handleDecline(request.id)}
          disabled={processingId === request.id}
        >
          {processingId === request.id ? (
            <ActivityIndicator size="small" color="#666" />
          ) : (
            <Feather name="x" size={20} color="#666" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          className="w-10 h-10 bg-[#FF6B6B] rounded-full items-center justify-center"
          onPress={() => handleAccept(request.id)}
          disabled={processingId === request.id}
        >
          {processingId === request.id ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Feather name="heart" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMatchItem = (match: AcceptedMatch) => (
    <TouchableOpacity
      key={match.id}
      className="bg-white rounded-2xl p-4 mb-3 flex-row items-center shadow-sm"
      onPress={() => {
        if (match.conversation_id) {
          router.push(`/(chat)/conversation?id=${match.conversation_id}`);
        }
      }}
    >
      {match.matched_pet.photo_url ? (
        <Image
          source={{
            uri: getImageUrl(match.matched_pet.photo_url) || undefined,
          }}
          className="w-16 h-16 rounded-full bg-gray-200"
        />
      ) : (
        <View className="w-16 h-16 rounded-full bg-gray-200 items-center justify-center">
          <Feather name="image" size={24} color="#9CA3AF" />
        </View>
      )}
      <View className="flex-1 ml-3">
        <Text className="text-gray-500 text-sm">{match.owner.name}</Text>
        <Text className="font-bold text-base">{match.matched_pet.name}</Text>
        <Text className="text-green-500 text-xs">
          Matched {formatTimeAgo(match.matched_at)}
        </Text>
      </View>
      <TouchableOpacity
        className="w-10 h-10 bg-[#FF6B6B] rounded-full items-center justify-center"
        onPress={() => {
          if (match.conversation_id) {
            router.push(`/(chat)/conversation?id=${match.conversation_id}`);
          }
        }}
      >
        <Feather name="message-circle" size={20} color="white" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

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
      <View className="px-6 py-4 bg-white">
        <Text className="text-2xl font-bold text-center">REQUEST</Text>
      </View>

      {/* Main Tab Toggle */}
      <View className="flex-row mx-4 mt-4 bg-gray-200 rounded-full p-1">
        <TouchableOpacity
          className={`flex-1 py-3 rounded-full ${
            activeTab === "PET" ? "bg-[#FF6B6B]" : ""
          }`}
          onPress={() => setActiveTab("PET")}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === "PET" ? "text-white" : "text-gray-600"
            }`}
          >
            PET
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 rounded-full ${
            activeTab === "SHOOTER" ? "bg-[#FF6B6B]" : ""
          }`}
          onPress={() => setActiveTab("SHOOTER")}
        >
          <Text
            className={`text-center font-semibold ${
              activeTab === "SHOOTER" ? "text-white" : "text-gray-600"
            }`}
          >
            SHOOTER
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sub Tab Toggle */}
      <View className="flex-row mx-4 mt-4 bg-gray-100 rounded-full p-1">
        <TouchableOpacity
          className={`flex-1 py-2 rounded-full ${
            activeSubTab === "REQUESTS" ? "bg-white" : ""
          }`}
          onPress={() => setActiveSubTab("REQUESTS")}
        >
          <Text
            className={`text-center font-medium ${
              activeSubTab === "REQUESTS" ? "text-[#FF6B6B]" : "text-gray-500"
            }`}
          >
            REQUESTS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-2 rounded-full ${
            activeSubTab === "MATCH" ? "bg-white" : ""
          }`}
          onPress={() => setActiveSubTab("MATCH")}
        >
          <Text
            className={`text-center font-medium ${
              activeSubTab === "MATCH" ? "text-[#FF6B6B]" : "text-gray-500"
            }`}
          >
            MATCH
          </Text>
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
        {activeTab === "PET" ? (
          activeSubTab === "REQUESTS" ? (
            incomingRequests.length > 0 ? (
              incomingRequests.map(renderRequestItem)
            ) : (
              <View className="items-center justify-center py-20">
                <Feather name="inbox" size={48} color="#ccc" />
                <Text className="text-gray-400 mt-4 text-center">
                  No pending requests
                </Text>
                <Text className="text-gray-400 text-sm text-center mt-1">
                  When someone sends a match request to your pet, it will appear
                  here
                </Text>
              </View>
            )
          ) : acceptedMatches.length > 0 ? (
            acceptedMatches.map(renderMatchItem)
          ) : (
            <View className="items-center justify-center py-20">
              <Feather name="heart" size={48} color="#ccc" />
              <Text className="text-gray-400 mt-4 text-center">
                No matches yet
              </Text>
              <Text className="text-gray-400 text-sm text-center mt-1">
                Accept match requests to start chatting with pet owners
              </Text>
            </View>
          )
        ) : (
          <View className="items-center justify-center py-20">
            <Feather name="camera" size={48} color="#ccc" />
            <Text className="text-gray-400 mt-4 text-center">
              Shooter requests coming soon
            </Text>
          </View>
        )}
      </ScrollView>

      <AlertModal
        visible={visible}
        title={alertOptions.title}
        message={alertOptions.message}
        type={alertOptions.type}
        buttons={alertOptions.buttons}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
};

export default Favorites;