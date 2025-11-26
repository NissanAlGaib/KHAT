import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { FileText } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  getConversationMessages,
  sendMessage,
  type ConversationDetail,
  type Message,
} from "@/services/matchRequestService";
import { getContract, type BreedingContract } from "@/services/contractService";
import { API_BASE_URL } from "@/config/env";
import {
  ContractPrompt,
  ContractModal,
  ContractCard,
} from "@/components/contracts";

export default function ConversationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const conversationId = params.id as string;
  const scrollViewRef = useRef<ScrollView>(null);

  const [conversation, setConversation] = useState<ConversationDetail | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState("");

  // Contract state
  const [contract, setContract] = useState<BreedingContract | null>(null);
  const [showContractPrompt, setShowContractPrompt] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [isEditingContract, setIsEditingContract] = useState(false);

  const getImageUrl = (path: string | null | undefined) => {
    if (!path) return null;
    return `${API_BASE_URL}/storage/${path}`;
  };

  const fetchMessages = useCallback(async () => {
    try {
      const data = await getConversationMessages(parseInt(conversationId));
      setConversation(data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const fetchContract = useCallback(async () => {
    try {
      const contractData = await getContract(parseInt(conversationId));
      setContract(contractData);
    } catch (error) {
      console.error("Error fetching contract:", error);
    }
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      fetchContract();
    }
  }, [conversationId, fetchMessages, fetchContract]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (conversationId && !sending) {
        fetchMessages();
        fetchContract();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [conversationId, fetchMessages, fetchContract, sending]);

  const handleContractSuccess = (newContract: BreedingContract) => {
    setContract(newContract);
    setIsEditingContract(false);
  };

  const handleEditContract = () => {
    setIsEditingContract(true);
    setShowContractModal(true);
  };

  const handleCreateContract = () => {
    setShowContractPrompt(false);
    setIsEditingContract(false);
    setShowContractModal(true);
  };

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;

    setSending(true);
    const text = messageText.trim();
    setMessageText("");

    try {
      const result = await sendMessage(parseInt(conversationId), text);
      if (result.success && result.data) {
        setConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, result.data as Message],
          };
        });
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        setMessageText(text);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessageText(text);
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString();
  };

  const renderMessages = () => {
    if (!conversation?.messages.length) {
      const recipientName = conversation?.is_shooter_view
        ? `${conversation.owner1?.name} and ${conversation.owner2?.name}`
        : conversation?.owner?.name;

      return (
        <View className="items-center justify-center py-20">
          <Feather name="message-circle" size={48} color="#ccc" />
          <Text className="text-gray-400 mt-4 text-center">
            Start the conversation
          </Text>
          <Text className="text-gray-400 text-sm text-center mt-1">
            Send a message to connect with {recipientName}
          </Text>
        </View>
      );
    }

    let lastDate = "";

    return conversation.messages.map((message, index) => {
      const messageDate = formatMessageDate(message.created_at);
      const showDateHeader = messageDate !== lastDate;
      lastDate = messageDate;

      return (
        <View key={message.id}>
          {showDateHeader && (
            <View className="items-center my-4">
              <Text className="text-gray-400 text-xs bg-gray-100 px-3 py-1 rounded-full">
                {messageDate}
              </Text>
            </View>
          )}
          <View
            className={`mb-3 max-w-[80%] ${
              message.is_own ? "self-end" : "self-start"
            }`}
          >
            {/* Sender name */}
            <Text
              className={`text-xs font-semibold mb-1 ${
                message.is_own
                  ? "text-right text-[#FF6B6B]"
                  : "text-left text-gray-600"
              }`}
            >
              {message.sender.name}
            </Text>
            <View
              className={`px-4 py-3 rounded-2xl ${
                message.is_own
                  ? "bg-[#FF6B6B] rounded-br-md"
                  : "bg-white rounded-bl-md"
              }`}
            >
              <Text className={message.is_own ? "text-white" : "text-black"}>
                {message.content}
              </Text>
            </View>
            <Text
              className={`text-xs text-gray-400 mt-1 ${
                message.is_own ? "text-right" : "text-left"
              }`}
            >
              {formatMessageTime(message.created_at)}
              {message.is_own && message.read_at && (
                <Text className="text-blue-500"> ✓✓</Text>
              )}
            </Text>
          </View>
        </View>
      );
    });
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
      <View className="px-4 py-3 bg-white flex-row items-center border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>

        {conversation?.is_shooter_view ? (
          // Shooter view header - show both pets
          <>
            <View className="flex-row">
              {conversation.pet1?.photo_url ? (
                <Image
                  source={{
                    uri: getImageUrl(conversation.pet1.photo_url) || undefined,
                  }}
                  className="w-10 h-10 rounded-full bg-gray-200 border-2 border-white"
                />
              ) : (
                <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center border-2 border-white">
                  <Feather name="image" size={16} color="#9CA3AF" />
                </View>
              )}
              {conversation.pet2?.photo_url ? (
                <Image
                  source={{
                    uri: getImageUrl(conversation.pet2.photo_url) || undefined,
                  }}
                  className="w-10 h-10 rounded-full bg-gray-200 -ml-2 border-2 border-white"
                />
              ) : (
                <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center -ml-2 border-2 border-white">
                  <Feather name="image" size={16} color="#9CA3AF" />
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
          </>
        ) : (
          // Owner view header - show matched pet
          <>
            {conversation?.matched_pet?.photo_url ? (
              <Image
                source={{
                  uri:
                    getImageUrl(conversation?.matched_pet.photo_url) ||
                    undefined,
                }}
                className="w-10 h-10 rounded-full bg-gray-200"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center">
                <Feather name="image" size={16} color="#9CA3AF" />
              </View>
            )}
            <View className="flex-1 ml-3">
              <Text className="font-bold text-base">
                {conversation?.matched_pet?.name}
              </Text>
              <Text className="text-gray-500 text-sm">
                {conversation?.owner?.name}
                {conversation?.shooter && (
                  <Text className="text-[#FF6B6B]">
                    {" "}
                    • Shooter: {conversation.shooter.name}
                  </Text>
                )}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/(pet)/view-profile?id=${conversation?.matched_pet?.pet_id}`
                )
              }
            >
              <Feather name="info" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </>
        )}
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 16 }}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: false })
          }
        >
          {/* Contract Card */}
          {contract && (
            <ContractCard
              contract={contract}
              onContractUpdate={handleContractSuccess}
              onEdit={handleEditContract}
            />
          )}

          {/* Messages */}
          <View className="px-4">{renderMessages()}</View>
        </ScrollView>

        {/* Create Contract Button - shown when no contract exists */}
        {!contract && contract !== undefined && (
          <TouchableOpacity
            onPress={() => setShowContractPrompt(true)}
            className="mx-4 mb-2 bg-[#FF6B6B] py-3 px-6 rounded-full flex-row items-center justify-center"
          >
            <FileText size={18} color="white" />
            <Text className="text-white font-semibold ml-2">
              Create a Contract
            </Text>
          </TouchableOpacity>
        )}

        {/* Input */}
        <View className="px-4 py-3 bg-white border-t border-gray-100">
          <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
            <TextInput
              className="flex-1 text-base"
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${
                messageText.trim() ? "bg-[#FF6B6B]" : "bg-gray-300"
              }`}
              onPress={handleSend}
              disabled={!messageText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Feather name="send" size={18} color="white" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Contract Prompt Modal */}
      <ContractPrompt
        visible={showContractPrompt}
        onClose={() => setShowContractPrompt(false)}
        onAccept={handleCreateContract}
      />

      {/* Contract Creation/Edit Modal */}
      <ContractModal
        visible={showContractModal}
        onClose={() => {
          setShowContractModal(false);
          setIsEditingContract(false);
        }}
        onSuccess={handleContractSuccess}
        conversationId={parseInt(conversationId)}
        existingContract={isEditingContract ? contract : null}
      />
    </SafeAreaView>
  );
}
