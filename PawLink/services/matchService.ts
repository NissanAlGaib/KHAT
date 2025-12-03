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
 * Calculate compatibility score between two pets using MLP-like architecture
 * This is a client-side implementation that mimics the backend logic
 * 
 * MLP Architecture:
 * - Input layer: Feature extraction and normalization
 * - Hidden layer: Non-linear transformations and feature interactions
 * - Output layer: Final score calculation with activation
 */
export const calculateCompatibility = (
  pet: PetMatch,
  userPetPreferences?: any
): number => {
  if (!userPetPreferences) return 0;

  // ============================================
  // INPUT LAYER: Feature extraction & normalization
  // ============================================
  const inputFeatures = extractInputFeatures(pet, userPetPreferences);

  // ============================================
  // HIDDEN LAYER: Non-linear transformations & interactions
  // ============================================
  const hiddenActivations = computeHiddenLayer(inputFeatures);

  // ============================================
  // OUTPUT LAYER: Final score with activation
  // ============================================
  const score = computeOutputLayer(hiddenActivations, inputFeatures);

  return Math.min(100, Math.max(0, Math.round(score)));
};

/**
 * Input Layer: Extract and normalize features from pet data
 */
interface InputFeatures {
  breed: number;
  sex: number;
  age: number;
  behaviors: number;
  behaviorsCount: number;
  attributes: number;
  attributesCount: number;
}

const extractInputFeatures = (
  pet: PetMatch,
  preferences: any
): InputFeatures => {
  const features: InputFeatures = {
    breed: 0,
    sex: 0.5,
    age: 0.5,
    behaviors: 0,
    behaviorsCount: 0,
    attributes: 0,
    attributesCount: 0,
  };

  // Breed feature (exact match = 1.0, no match = 0)
  if (preferences.preferred_breed) {
    features.breed = pet.breed === preferences.preferred_breed ? 1.0 : 0.0;
  }

  // Sex feature (exact match = 1.0, no preference = 0.5, no match = 0)
  if (preferences.preferred_sex) {
    features.sex = pet.sex === preferences.preferred_sex ? 1.0 : 0.0;
  }

  // Age feature (normalized based on distance from preferred range)
  if (preferences.min_age && preferences.max_age) {
    const petAge = calculatePetAgeInMonths(pet.birthdate);
    const midAge = (preferences.min_age + preferences.max_age) / 2;
    const ageRange = preferences.max_age - preferences.min_age;

    if (petAge >= preferences.min_age && petAge <= preferences.max_age) {
      const distanceFromMid = Math.abs(petAge - midAge);
      const normalizedDistance = ageRange > 0 ? distanceFromMid / (ageRange / 2) : 0;
      features.age = 1.0 - 0.2 * normalizedDistance;
    } else {
      const distanceOutside = Math.min(
        Math.abs(petAge - preferences.min_age),
        Math.abs(petAge - preferences.max_age)
      );
      features.age = Math.max(0.0, 0.4 - (distanceOutside / (ageRange || 12)) * 0.3);
    }
  }

  // Behaviors feature
  if (preferences.preferred_behaviors && pet.behaviors) {
    const matchingBehaviors = preferences.preferred_behaviors.filter(
      (b: string) => pet.behaviors?.includes(b)
    );
    const matchCount = matchingBehaviors.length;
    const totalPreferred = preferences.preferred_behaviors.length;

    if (totalPreferred > 0) {
      features.behaviors = matchCount / totalPreferred;
      features.behaviorsCount = matchCount;
    }
  }

  // Attributes feature
  if (preferences.preferred_attributes && pet.attributes) {
    const matchingAttributes = preferences.preferred_attributes.filter(
      (a: string) => pet.attributes?.includes(a)
    );
    const matchCount = matchingAttributes.length;
    const totalPreferred = preferences.preferred_attributes.length;

    if (totalPreferred > 0) {
      features.attributes = matchCount / totalPreferred;
      features.attributesCount = matchCount;
    }
  }

  return features;
};

/**
 * Hidden Layer: Apply non-linear transformations and compute feature interactions
 */
interface HiddenActivations {
  primary: number;
  secondary: number;
  interaction: number;
  bonus: number;
}

const computeHiddenLayer = (inputFeatures: InputFeatures): HiddenActivations => {
  const weights = {
    breed: 0.35,
    sex: 0.15,
    age: 0.2,
    behaviors: 0.15,
    attributes: 0.15,
  };

  // Hidden Neuron 1: Primary compatibility (weighted sum with ReLU)
  const primarySum =
    inputFeatures.breed * weights.breed +
    inputFeatures.sex * weights.sex +
    inputFeatures.age * weights.age;
  const primary = relu(primarySum);

  // Hidden Neuron 2: Secondary compatibility (behaviors & attributes with sigmoid)
  const secondarySum =
    inputFeatures.behaviors * weights.behaviors +
    inputFeatures.attributes * weights.attributes;
  const secondary = sigmoid(secondarySum * 3);

  // Hidden Neuron 3: Feature interaction term (multiplicative interaction with tanh)
  const interactionTerm =
    inputFeatures.breed * inputFeatures.behaviors * 0.5 +
    inputFeatures.breed * inputFeatures.attributes * 0.3 +
    inputFeatures.age * inputFeatures.sex * 0.2;
  const interaction = Math.tanh(interactionTerm);

  // Hidden Neuron 4: Bonus neuron for multiple feature matches
  let matchBonus = 0;
  if (inputFeatures.breed >= 0.9) matchBonus += 0.3;
  if (inputFeatures.sex >= 0.9) matchBonus += 0.2;
  if (inputFeatures.age >= 0.8) matchBonus += 0.2;
  if (inputFeatures.behaviorsCount >= 2) matchBonus += 0.15;
  if (inputFeatures.attributesCount >= 2) matchBonus += 0.15;
  const bonus = sigmoid(matchBonus * 2);

  return { primary, secondary, interaction, bonus };
};

/**
 * Output Layer: Compute final compatibility score with activation
 */
const computeOutputLayer = (
  hiddenActivations: HiddenActivations,
  inputFeatures: InputFeatures
): number => {
  const outputWeights = {
    primary: 0.45,
    secondary: 0.25,
    interaction: 0.15,
    bonus: 0.15,
  };

  // Compute weighted sum of hidden layer outputs
  const outputSum =
    hiddenActivations.primary * outputWeights.primary +
    hiddenActivations.secondary * outputWeights.secondary +
    hiddenActivations.interaction * outputWeights.interaction +
    hiddenActivations.bonus * outputWeights.bonus;

  // Apply sigmoid activation and scale to 0-100
  const rawScore = sigmoid(outputSum * 4) * 100;

  // Apply softplus for smooth lower bound
  const finalScore = softplus(rawScore - 10) + 10;

  return finalScore;
};

/**
 * ReLU activation function
 */
const relu = (x: number): number => Math.max(0, x);

/**
 * Sigmoid activation function
 */
const sigmoid = (x: number): number => 1 / (1 + Math.exp(-x));

/**
 * Softplus activation function (smooth ReLU)
 */
const softplus = (x: number): number => Math.log(1 + Math.exp(x));

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
