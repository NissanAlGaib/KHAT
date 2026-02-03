import axios from "@/config/axiosConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pet } from "@/types/Pet";
import { User, ShooterProfile } from "@/types/User";

// Constants
const RECENT_SEARCHES_KEY = "@pawlink_recent_searches";
const MAX_RECENT_SEARCHES = 10;

// Define Breeder type based on User (extending if necessary in the future)
export interface Breeder extends User {
  kennel_name?: string;
  experience_years?: number;
  rating?: number;
  pet_breeds?: string[];
  pet_count?: number;
}

export interface SearchFilters {
  species?: "dog" | "cat";
  sex?: "male" | "female";
}

// Global search result types
export interface GlobalSearchPetItem {
  pet_id: number;
  name: string;
  species: string;
  breed: string;
  sex: string;
  age: number | null;
  profile_image: string | null;
  owner: { id: number; name: string } | null;
}

export interface GlobalSearchBreederItem {
  id: number;
  name: string;
  profile_image: string | null;
  pet_breeds: string[];
  pet_count: number;
}

export interface GlobalSearchShooterItem {
  id: number;
  name: string;
  profile_image: string | null;
  experience_years: number;
}

export interface GlobalSearchResults {
  pets: {
    count: number;
    items: GlobalSearchPetItem[];
  };
  breeders: {
    count: number;
    items: GlobalSearchBreederItem[];
  };
  shooters: {
    count: number;
    items: GlobalSearchShooterItem[];
  };
}

export const searchService = {
  /**
   * Global search across all categories (pets, breeders, shooters)
   * Returns unified results with counts for each category
   */
  searchGlobal: async (query: string, limit: number = 5): Promise<GlobalSearchResults> => {
    const response = await axios.get("/api/search/global", { 
      params: { q: query, limit } 
    });
    return response.data.data || {
      pets: { count: 0, items: [] },
      breeders: { count: 0, items: [] },
      shooters: { count: 0, items: [] },
    };
  },

  /**
   * Search for pets with optional filters
   */
  searchPets: async (query: string, filters: SearchFilters = {}): Promise<Pet[]> => {
    const params: any = { q: query };
    
    if (filters.species) params.species = filters.species;
    if (filters.sex) params.sex = filters.sex;
    
    const response = await axios.get("/api/search/pets", { params });
    return response.data.data || response.data;
  },

  /**
   * Search for breeders
   */
  searchBreeders: async (query: string): Promise<Breeder[]> => {
    const response = await axios.get("/api/search/breeders", { 
      params: { q: query } 
    });
    return response.data.data || response.data;
  },

  /**
   * Search for shooters
   */
  searchShooters: async (query: string): Promise<ShooterProfile[]> => {
    const response = await axios.get("/api/search/shooters", { 
      params: { q: query } 
    });
    return response.data.data || response.data;
  },
  
  /**
   * Get recent searches from AsyncStorage
   */
  getRecentSearches: async (): Promise<string[]> => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error("Error loading recent searches:", error);
      return [];
    }
  },

  /**
   * Save a search term to recent searches
   */
  saveRecentSearch: async (term: string): Promise<void> => {
    try {
      if (!term.trim()) return;
      
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      let searches: string[] = stored ? JSON.parse(stored) : [];
      
      // Remove duplicate if exists
      searches = searches.filter((s) => s.toLowerCase() !== term.toLowerCase());
      
      // Add to beginning
      searches.unshift(term.trim());
      
      // Keep only max items
      searches = searches.slice(0, MAX_RECENT_SEARCHES);
      
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  },

  /**
   * Remove a specific search term from recent searches
   */
  removeRecentSearch: async (term: string): Promise<void> => {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (!stored) return;
      
      let searches: string[] = JSON.parse(stored);
      searches = searches.filter((s) => s !== term);
      
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
    } catch (error) {
      console.error("Error removing recent search:", error);
    }
  },

  /**
   * Clear all recent searches
   */
  clearRecentSearches: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error("Error clearing recent searches:", error);
    }
  }
};
