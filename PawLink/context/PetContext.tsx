import React, { createContext, useContext, useState, useEffect } from "react";
import { getPets } from "@/services/petService";
import * as SecureStore from "expo-secure-store";
import { useSession } from "@/context/AuthContext";

interface Pet {
  pet_id: number;
  name: string;
  breed: string;
  species: string;
  sex: string;
  birthdate: string;
  profile_image?: string;
  status: string;
  photos?: Array<{
    photo_url: string;
    is_primary: boolean;
  }>;
  // Cooldown fields (from backend)
  is_on_cooldown?: boolean;
  cooldown_until?: string;
  cooldown_days_remaining?: number;
}

interface PetContextType {
  selectedPet: Pet | null;
  userPets: Pet[];
  setSelectedPet: (pet: Pet | null) => void;
  loadUserPets: () => Promise<void>;
  isLoading: boolean;
}

const PetContext = createContext<PetContextType | undefined>(undefined);

const SELECTED_PET_KEY = "selected_pet_id";

export function PetProvider({ children }: { children: React.ReactNode }) {
  const [selectedPet, setSelectedPetState] = useState<Pet | null>(null);
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useSession();

  // Load pets and restore selected pet from storage
  const loadUserPets = async () => {
    try {
      setIsLoading(true);
      const pets = await getPets();
      setUserPets(pets);

      // Filter to only active pets not on cooldown for auto-selection
      const availablePets = pets.filter((p: Pet) => !p.is_on_cooldown && p.status === 'active');

      // Restore selected pet from SecureStore
      const storedPetId = await SecureStore.getItemAsync(SELECTED_PET_KEY);
      if (storedPetId && pets.length > 0) {
        const pet = pets.find((p: Pet) => p.pet_id === parseInt(storedPetId));
        // Only restore if pet exists and is not on cooldown
        if (pet && !pet.is_on_cooldown) {
          setSelectedPetState(pet);
        } else if (availablePets.length > 0) {
          // If stored pet is on cooldown or not found, select first available pet
          setSelectedPetState(availablePets[0]);
        } else {
          setSelectedPetState(null);
        }
      } else if (availablePets.length > 0) {
        // Default to first available pet if no stored selection
        setSelectedPetState(availablePets[0]);
      } else {
        setSelectedPetState(null);
      }
    } catch (error) {
      console.error("Error loading user pets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Persist selected pet to storage
  const setSelectedPet = async (pet: Pet | null) => {
    setSelectedPetState(pet);
    if (pet) {
      await SecureStore.setItemAsync(SELECTED_PET_KEY, pet.pet_id.toString());
    } else {
      await SecureStore.deleteItemAsync(SELECTED_PET_KEY);
    }
  };

  // Load pets on mount, but only if user is authenticated
  useEffect(() => {
    if (session) {
      loadUserPets();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  return (
    <PetContext.Provider
      value={{
        selectedPet,
        userPets,
        setSelectedPet,
        loadUserPets,
        isLoading,
      }}
    >
      {children}
    </PetContext.Provider>
  );
}

export function usePet() {
  const context = useContext(PetContext);
  if (!context) {
    throw new Error("usePet must be used within a PetProvider");
  }
  return context;
}
