import axiosInstance from "@/config/axiosConfig";

// Type definitions
export interface BreedingPair {
  id: number;
  pet1: {
    pet_id: number;
    name: string;
    photo_url?: string;
  };
  pet2: {
    pet_id: number;
    name: string;
    photo_url?: string;
  };
  owner1_name: string;
  owner2_name: string;
  location: string;
  fee: number;
  status: "active" | "pending" | "completed";
  booking_id?: number;
  created_at?: string;
  scheduled_date?: string;
}

export interface ShooterOffer {
  id: number;
  conversation_id: number;
  pet1: {
    pet_id: number;
    name: string;
    breed: string;
    species: string;
    sex?: string;
    birthdate?: string;
    photo_url?: string;
  };
  pet2: {
    pet_id: number;
    name: string;
    breed: string;
    species: string;
    sex?: string;
    birthdate?: string;
    photo_url?: string;
  };
  owner1: {
    id: number;
    name: string;
    profile_image?: string;
    contact_number?: string;
  };
  owner2: {
    id: number;
    name: string;
    profile_image?: string;
    contact_number?: string;
  };
  payment: number;
  location?: string;
  conditions?: string;
  shooter_name?: string;
  shooter_status?: string;
  owner1_accepted?: boolean;
  owner2_accepted?: boolean;
  end_contract_date?: string;
  created_at: string;
}

export interface BreedingPairResponse {
  breeding_pairs: BreedingPair[];
  current_handling: number;
  total_completed: number;
  total_earnings: number;
}

export interface BreedingDetail extends BreedingPair {
  pet1_details: {
    pet_id: number;
    name: string;
    breed: string;
    age: string;
    sex: string;
    photos: Array<{ photo_url: string; is_primary: boolean }>;
  };
  pet2_details: {
    pet_id: number;
    name: string;
    breed: string;
    age: string;
    sex: string;
    photos: Array<{ photo_url: string; is_primary: boolean }>;
  };
  owner1_details: {
    user_id: number;
    name: string;
    phone: string;
    email: string;
  };
  owner2_details: {
    user_id: number;
    name: string;
    phone: string;
    email: string;
  };
  notes?: string;
  progress_updates?: Array<{
    id: number;
    update: string;
    created_at: string;
  }>;
}

/**
 * Get available shooter offers (contracts with shooter payment)
 */
export async function getShooterOffers(): Promise<ShooterOffer[]> {
  try {
    const response = await axiosInstance.get("/shooter/offers");
    return response.data.data || [];
  } catch (error: any) {
    if (error.response?.status === 404) {
      // No shooter role found or no offers available
      return [];
    }
    if (error.response?.status === 403) {
      // User is not a shooter
      return [];
    }
    console.error("Error fetching shooter offers:", error);
    return [];
  }
}

/**
 * Get details of a specific shooter offer
 */
export async function getShooterOfferDetails(
  offerId: number
): Promise<ShooterOffer> {
  try {
    const response = await axiosInstance.get(`/shooter/offers/${offerId}`);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching shooter offer details:", error);
    throw error;
  }
}

/**
 * Accept a shooter offer
 */
export async function acceptShooterOffer(
  offerId: number
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await axiosInstance.put(
      `/shooter/offers/${offerId}/accept`
    );
    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error accepting shooter offer:", error);
    throw error;
  }
}

/**
 * Get shooter's accepted offers (pending owner confirmation)
 */
export async function getMyShooterOffers(): Promise<ShooterOffer[]> {
  try {
    const response = await axiosInstance.get("/shooter/my-offers");
    return response.data.data || [];
  } catch (error: any) {
    if (error.response?.status === 404) {
      // No offers found or shooter role not found
      return [];
    }
    if (error.response?.status === 403) {
      // User is not a shooter
      return [];
    }
    console.error("Error fetching my shooter offers:", error);
    return [];
  }
}

/**
 * Get all active breeding pairs assigned to the shooter
 * TODO: Backend endpoint to implement: GET /api/shooter/breeding-pairs
 */
export async function getShooterBreedingPairs(): Promise<BreedingPairResponse> {
  try {
    const response = await axiosInstance.get("/shooter/breeding-pairs");
    return response.data;
  } catch (error) {
    console.error("Error fetching shooter breeding pairs:", error);
    throw error;
  }
}

/**
 * Get detailed information about a specific breeding pair
 * TODO: Backend endpoint to implement: GET /api/shooter/breeding-pairs/:id
 */
export async function getBreedingPairDetail(
  pairId: number
): Promise<BreedingDetail> {
  try {
    const response = await axiosInstance.get(
      `/shooter/breeding-pairs/${pairId}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching breeding pair detail:", error);
    throw error;
  }
}

/**
 * Update breeding pair status
 * TODO: Backend endpoint to implement: PUT /api/shooter/breeding-pairs/:id/status
 */
export async function updateBreedingStatus(
  pairId: number,
  status: "in_progress" | "completed" | "cancelled",
  notes?: string
): Promise<void> {
  try {
    await axiosInstance.put(`/shooter/breeding-pairs/${pairId}/status`, {
      status,
      notes,
    });
  } catch (error) {
    console.error("Error updating breeding status:", error);
    throw error;
  }
}

/**
 * Add a progress update to a breeding pair
 * TODO: Backend endpoint to implement: POST /api/shooter/breeding-pairs/:id/updates
 */
export async function addBreedingUpdate(
  pairId: number,
  update: string,
  photos?: string[]
): Promise<void> {
  try {
    await axiosInstance.post(`/shooter/breeding-pairs/${pairId}/updates`, {
      update,
      photos,
    });
  } catch (error) {
    console.error("Error adding breeding update:", error);
    throw error;
  }
}

/**
 * Get shooter statistics and earnings
 * TODO: Backend endpoint to implement: GET /api/shooter/statistics
 */
export async function getShooterStatistics(): Promise<{
  total_breeding_handled: number;
  active_breeding: number;
  success_rate: number;
  total_earnings: number;
  monthly_earnings: number;
  rating: number;
  reviews_count: number;
}> {
  try {
    const response = await axiosInstance.get("/shooter/statistics");
    return response.data;
  } catch (error) {
    console.error("Error fetching shooter statistics:", error);
    throw error;
  }
}

/**
 * Accept or reject a breeding assignment
 * TODO: Backend endpoint to implement: POST /api/shooter/breeding-pairs/:id/respond
 */
export async function respondToBreedingRequest(
  pairId: number,
  accept: boolean,
  reason?: string
): Promise<void> {
  try {
    await axiosInstance.post(`/shooter/breeding-pairs/${pairId}/respond`, {
      accept,
      reason,
    });
  } catch (error) {
    console.error("Error responding to breeding request:", error);
    throw error;
  }
}
