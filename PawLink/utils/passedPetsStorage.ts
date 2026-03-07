import AsyncStorage from "@react-native-async-storage/async-storage";

const PASSED_PETS_KEY = "pawlink_passed_pets";

export interface PassedPetEntry {
  /** The user's pet ID that did the passing */
  userPetId: number;
  /** The target pet ID that was passed */
  targetPetId: number;
  /** Timestamp when the pass occurred */
  passedAt: number;
}

/**
 * Get all passed pet entries from AsyncStorage.
 */
export const getPassedPets = async (): Promise<PassedPetEntry[]> => {
  try {
    const stored = await AsyncStorage.getItem(PASSED_PETS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as PassedPetEntry[];
  } catch (error) {
    console.error("Error reading passed pets:", error);
    return [];
  }
};

/**
 * Add a passed pet entry to AsyncStorage.
 * Scoped to the selected pet (userPetId → targetPetId).
 */
export const addPassedPet = async (
  userPetId: number,
  targetPetId: number,
): Promise<void> => {
  try {
    const existing = await getPassedPets();
    // Avoid duplicates
    const alreadyExists = existing.some(
      (e) => e.userPetId === userPetId && e.targetPetId === targetPetId,
    );
    if (alreadyExists) return;

    existing.push({ userPetId, targetPetId, passedAt: Date.now() });
    await AsyncStorage.setItem(PASSED_PETS_KEY, JSON.stringify(existing));
  } catch (error) {
    console.error("Error saving passed pet:", error);
  }
};

/**
 * Get the set of target pet IDs that a specific user pet has passed.
 */
export const getPassedPetIdsForPet = async (
  userPetId: number,
): Promise<Set<number>> => {
  const entries = await getPassedPets();
  const ids = entries
    .filter((e) => e.userPetId === userPetId)
    .map((e) => e.targetPetId);
  return new Set(ids);
};

/**
 * Clear all passed pet records (e.g. for reset/logout).
 */
export const clearPassedPets = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PASSED_PETS_KEY);
  } catch (error) {
    console.error("Error clearing passed pets:", error);
  }
};
