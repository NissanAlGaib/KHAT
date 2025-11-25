import axiosInstance from "@/config/axiosConfig";

export interface PetMatch {
  pet_id: number;
  name: string;
  species: string;
  breed: string;
  sex: string;
  birthdate: string;
  age: string;
  profile_image?: string;
  behaviors?: string[];
  attributes?: string[];
  photos?: Array<{
    photo_url: string;
    is_primary: boolean;
  }>;
  owner: {
    id: number;
    name: string;
    profile_image?: string;
  };
  compatibility_score?: number;
  match_reasons?: string[];
}

export interface ShooterPet {
  pet_id: number;
  name: string;
  breed: string;
  species: string;
  sex: string;
  profile_image?: string;
  status: "Available" | "Breeding";
  has_been_bred: boolean;
  breeding_count: number;
}

export interface ShooterProfile {
  id: number;
  name: string;
  profile_image?: string;
  sex?: string;
  birthdate?: string;
  age?: number;
  experience_years?: number;
  specialization?: string;
  is_pet_owner: boolean;
  breeds_handled: string[];
  pets: ShooterPet[];
  rating?: number;
  completed_sessions?: number;
  breeders_handled?: number;
  successful_shoots?: number;
  verification_status?: string;
  id_verified?: boolean;
  breeder_verified?: boolean;
  shooter_verified?: boolean;
  statistics: {
    total_pets: number;
    matched: number;
    dog_count: number;
    cat_count: number;
    breeders_handled: number;
    successful_shoots: number;
  };
}

export interface TopMatch {
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
  compatibility_score: number;
  match_reasons?: string[];
}

/**
 * Get all available pets (regardless of preferences)
 * For browsing all pets in the system
 */
export const getAllAvailablePets = async (): Promise<PetMatch[]> => {
  try {
    const response = await axiosInstance.get("/api/pets/available");
    return response.data.data || [];
  } catch (error: any) {
    console.error(
      "Error getting available pets:",
      error.response?.data || error.message
    );
    return [];
  }
};

/**
 * Get potential pet matches for the user's pet
 * Based on partner preferences and compatibility
 */
export const getPotentialMatches = async (): Promise<PetMatch[]> => {
  try {
    const response = await axiosInstance.get("/api/matches/potential");
    return response.data.data || [];
  } catch (error: any) {
    console.error(
      "Error getting potential matches:",
      error.response?.data || error.message
    );
    return [];
  }
};

/**
 * Get top matches for the user's pets
 * Returns the best compatibility matches
 */
export const getTopMatches = async (): Promise<TopMatch[]> => {
  try {
    const response = await axiosInstance.get("/api/matches/top");
    return response.data.data || [];
  } catch (error: any) {
    console.error(
      "Error getting top matches:",
      error.response?.data || error.message
    );
    return [];
  }
};

/**
 * Get all available shooters
 */
export const getShooters = async (): Promise<ShooterProfile[]> => {
  try {
    const response = await axiosInstance.get("/api/shooters");
    return response.data.data || [];
  } catch (error: any) {
    console.error(
      "Error getting shooters:",
      error.response?.data || error.message
    );
    return [];
  }
};

/**
 * Get detailed shooter profile by ID
 */
export const getShooterProfile = async (
  shooterId: number
): Promise<ShooterProfile> => {
  try {
    const response = await axiosInstance.get(`/api/shooters/${shooterId}`);
    return response.data.data;
  } catch (error: any) {
    console.error(
      "Error getting shooter profile:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Calculate compatibility score between two pets based on preferences
 * This is a client-side helper for display purposes
 */
export const calculateCompatibility = (
  pet: PetMatch,
  userPetPreferences?: any
): number => {
  if (!userPetPreferences) return 0;

  let score = 0;
  let factors = 0;

  // Breed match (40% weight)
  if (
    userPetPreferences.preferred_breed &&
    pet.breed === userPetPreferences.preferred_breed
  ) {
    score += 40;
  }
  factors++;

  // Sex preference (20% weight)
  if (
    userPetPreferences.preferred_sex &&
    pet.sex === userPetPreferences.preferred_sex
  ) {
    score += 20;
  }
  factors++;

  // Age range (20% weight)
  if (userPetPreferences.min_age && userPetPreferences.max_age) {
    const petAge = calculatePetAgeInMonths(pet.birthdate);
    if (
      petAge >= userPetPreferences.min_age &&
      petAge <= userPetPreferences.max_age
    ) {
      score += 20;
    }
  }
  factors++;

  // Behaviors match (10% weight)
  if (userPetPreferences.preferred_behaviors && pet.behaviors) {
    const matchingBehaviors = userPetPreferences.preferred_behaviors.filter(
      (b: string) => pet.behaviors?.includes(b)
    );
    if (matchingBehaviors.length > 0) {
      score += 10;
    }
  }
  factors++;

  // Attributes match (10% weight)
  if (userPetPreferences.preferred_attributes && pet.attributes) {
    const matchingAttributes = userPetPreferences.preferred_attributes.filter(
      (a: string) => pet.attributes?.includes(a)
    );
    if (matchingAttributes.length > 0) {
      score += 10;
    }
  }
  factors++;

  return Math.min(score, 100);
};

/**
 * Helper to calculate pet age in months
 */
const calculatePetAgeInMonths = (birthdate: string): number => {
  const birth = new Date(birthdate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - birth.getTime());
  const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  return diffMonths;
};
