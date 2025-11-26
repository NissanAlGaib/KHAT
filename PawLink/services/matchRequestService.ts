import axiosInstance from "@/config/axiosConfig";

export interface MatchRequestPet {
  pet_id: number;
  name: string;
  breed?: string;
  photo_url?: string;
}

export interface MatchRequestOwner {
  id: number;
  name: string;
  profile_image?: string;
}

export interface MatchRequest {
  id: number;
  requester_pet: MatchRequestPet;
  target_pet: MatchRequestPet;
  owner: MatchRequestOwner;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

export interface AcceptedMatch {
  id: number;
  conversation_id?: number;
  user_pet: MatchRequestPet;
  matched_pet: MatchRequestPet;
  owner: MatchRequestOwner;
  status: "accepted";
  matched_at: string;
  has_pending_shooter_request?: boolean;
}

export interface ConversationPreview {
  id: number;
  is_shooter_conversation: boolean;
  // For owner conversations
  matched_pet?: MatchRequestPet;
  owner?: MatchRequestOwner;
  shooter?: {
    id: number;
    name: string;
    profile_image?: string;
  };
  // For shooter conversations
  pet1?: {
    pet_id: number;
    name: string;
    breed: string;
    photo_url?: string;
  };
  pet2?: {
    pet_id: number;
    name: string;
    breed: string;
    photo_url?: string;
  };
  owner1?: {
    id: number;
    name: string;
    profile_image?: string;
  };
  owner2?: {
    id: number;
    name: string;
    profile_image?: string;
  };
  // Common fields
  last_message?: {
    content: string;
    created_at: string;
    is_own: boolean;
  };
  unread_count: number;
  updated_at: string;
}

export interface MessageSender {
  id: number;
  name: string;
  profile_image?: string;
}

export interface Message {
  id: number;
  content: string;
  sender: MessageSender;
  is_own: boolean;
  read_at?: string;
  created_at: string;
}

export interface ConversationDetail {
  conversation_id: number;
  is_shooter_view?: boolean;
  // For owner view
  matched_pet?: MatchRequestPet;
  owner?: MatchRequestOwner;
  shooter?: {
    id: number;
    name: string;
    profile_image?: string;
  };
  // For shooter view
  pet1?: {
    pet_id: number;
    name: string;
    photo_url?: string;
  };
  pet2?: {
    pet_id: number;
    name: string;
    photo_url?: string;
  };
  owner1?: {
    id: number;
    name: string;
    profile_image?: string;
  };
  owner2?: {
    id: number;
    name: string;
    profile_image?: string;
  };
  messages: Message[];
}

/**
 * Send a match request from one pet to another
 */
export const sendMatchRequest = async (
  requesterPetId: number,
  targetPetId: number
): Promise<{ success: boolean; message: string; data?: MatchRequest }> => {
  try {
    const response = await axiosInstance.post("/api/match-requests", {
      requester_pet_id: requesterPetId,
      target_pet_id: targetPetId,
    });
    return response.data;
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to send match request";
    return { success: false, message: errorMessage };
  }
};

/**
 * Get incoming match requests for user's pets
 */
export const getIncomingRequests = async (): Promise<MatchRequest[]> => {
  try {
    const response = await axiosInstance.get("/api/match-requests/incoming");
    return response.data.data || [];
  } catch (error: any) {
    console.error(
      "Error getting incoming requests:",
      error.response?.data || error.message
    );
    return [];
  }
};

/**
 * Get outgoing match requests from user's pets
 */
export const getOutgoingRequests = async (): Promise<MatchRequest[]> => {
  try {
    const response = await axiosInstance.get("/api/match-requests/outgoing");
    return response.data.data || [];
  } catch (error: any) {
    console.error(
      "Error getting outgoing requests:",
      error.response?.data || error.message
    );
    return [];
  }
};

/**
 * Get accepted matches for user's pets
 */
export const getAcceptedMatches = async (): Promise<AcceptedMatch[]> => {
  try {
    const response = await axiosInstance.get("/api/match-requests/matches");
    return response.data.data || [];
  } catch (error: any) {
    console.error(
      "Error getting accepted matches:",
      error.response?.data || error.message
    );
    return [];
  }
};

/**
 * Accept a match request
 */
export const acceptMatchRequest = async (
  requestId: number
): Promise<{ success: boolean; message: string; conversation_id?: number }> => {
  try {
    const response = await axiosInstance.put(
      `/api/match-requests/${requestId}/accept`
    );
    return {
      success: true,
      message: response.data.message,
      conversation_id: response.data.data?.conversation_id,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to accept match request";
    return { success: false, message: errorMessage };
  }
};

/**
 * Decline a match request
 */
export const declineMatchRequest = async (
  requestId: number
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axiosInstance.put(
      `/api/match-requests/${requestId}/decline`
    );
    return { success: true, message: response.data.message };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to decline match request";
    return { success: false, message: errorMessage };
  }
};

/**
 * Get user's conversations
 */
export const getConversations = async (): Promise<ConversationPreview[]> => {
  try {
    const response = await axiosInstance.get("/api/conversations");
    return response.data.data || [];
  } catch (error: any) {
    console.error(
      "Error getting conversations:",
      error.response?.data || error.message
    );
    return [];
  }
};

/**
 * Get messages for a conversation
 */
export const getConversationMessages = async (
  conversationId: number
): Promise<ConversationDetail | null> => {
  try {
    const response = await axiosInstance.get(
      `/api/conversations/${conversationId}/messages`
    );
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Error getting messages:",
      error.response?.data || error.message
    );
    return null;
  }
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  conversationId: number,
  content: string
): Promise<{ success: boolean; message: string; data?: Message }> => {
  try {
    const response = await axiosInstance.post(
      `/api/conversations/${conversationId}/messages`,
      { content }
    );
    return {
      success: true,
      message: response.data.message,
      data: response.data.data,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.message || "Failed to send message";
    return { success: false, message: errorMessage };
  }
};
