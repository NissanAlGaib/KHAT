import axiosInstance from "@/config/axiosConfig";

/**
 * Breed Identification Service
 * Provides breed search and AI-powered breed identification
 */

// Comprehensive dog breeds list
export const DOG_BREEDS = [
  // Popular breeds
  "Labrador Retriever", "German Shepherd", "Golden Retriever", "French Bulldog",
  "Bulldog", "Poodle", "Beagle", "Rottweiler", "German Shorthaired Pointer",
  "Siberian Husky", "Dachshund", "Doberman Pinscher", "Shih Tzu", "Boxer",
  "Great Dane", "Yorkshire Terrier", "Australian Shepherd", "Cavalier King Charles Spaniel",
  "Miniature Schnauzer", "Pembroke Welsh Corgi", "Pomeranian", "Boston Terrier",
  "Havanese", "Bernese Mountain Dog", "Maltese", "English Springer Spaniel",
  "Shetland Sheepdog", "Brittany", "Cocker Spaniel", "Border Collie",
  "Chihuahua", "Pug", "Mastiff", "Akita", "Basset Hound", "Bloodhound",
  "Bull Terrier", "Chow Chow", "Dalmatian", "Great Pyrenees", "Greyhound",
  "Irish Setter", "Jack Russell Terrier", "Lhasa Apso", "Newfoundland",
  "Old English Sheepdog", "Papillon", "Rhodesian Ridgeback", "Saint Bernard",
  "Samoyed", "Scottish Terrier", "Shiba Inu", "Weimaraner", "Whippet",
  "American Pit Bull Terrier", "American Staffordshire Terrier", "Australian Cattle Dog",
  "Belgian Malinois", "Bichon Frise", "Cairn Terrier", "Cane Corso",
  "English Cocker Spaniel", "English Mastiff", "French Mastiff", "German Spitz",
  "Giant Schnauzer", "Irish Wolfhound", "Italian Greyhound", "Japanese Chin",
  "Keeshond", "Kerry Blue Terrier", "Komondor", "Leonberger", "Miniature Pinscher",
  "Norwegian Elkhound", "Pharaoh Hound", "Portuguese Water Dog", "Saluki",
  "Schipperke", "Schnauzer", "Soft Coated Wheaten Terrier", "Staffordshire Bull Terrier",
  "Tibetan Mastiff", "Tibetan Terrier", "Vizsla", "Welsh Corgi", "West Highland White Terrier",
  // Philippine breeds
  "Aspin", "Askal", "Philippine Native Dog",
  // General
  "Mixed Breed", "Unknown",
];

// Comprehensive cat breeds list
export const CAT_BREEDS = [
  // Popular breeds
  "Siamese", "Persian", "Maine Coon", "Ragdoll", "British Shorthair",
  "Sphynx", "Scottish Fold", "Bengal", "Abyssinian", "Russian Blue",
  "Norwegian Forest Cat", "Birman", "Oriental Shorthair", "Devon Rex",
  "American Shorthair", "Exotic Shorthair", "Burmese", "Himalayan",
  "Cornish Rex", "Balinese", "Tonkinese", "Chartreux", "Egyptian Mau",
  "Turkish Angora", "Turkish Van", "Somali", "Manx", "Bombay",
  "Savannah", "Ocicat", "Singapura", "Korat", "Japanese Bobtail",
  "American Bobtail", "American Curl", "LaPerm", "Munchkin", "Nebelung",
  "Ragamuffin", "Selkirk Rex", "Siberian", "Snowshoe", "Toyger",
  // Philippine breeds
  "Puspin", "Philippine Shorthair",
  // General
  "Mixed Breed", "Unknown",
];

export interface BreedSearchResult {
  breed: string;
  matchScore: number;
}

export interface BreedIdentificationResult {
  predictions: Array<{
    breed: string;
    confidence: number;
  }>;
  topBreed: string;
  topConfidence: number;
}

export interface BreedPrediction {
  breed: string;
  breed_raw: string;
  species: "cat" | "dog";
  confidence: number;
}

export interface BreedIdentifyApiResponse {
  success: boolean;
  prediction: BreedPrediction;
  top_3: BreedPrediction[];
}

/**
 * Search breeds by query
 * @param query Search query string
 * @param species "Dog" or "Cat"
 * @returns Filtered and scored breed results
 */
export const searchBreeds = (query: string, species: "Dog" | "Cat"): BreedSearchResult[] => {
  const breeds = species === "Cat" ? CAT_BREEDS : DOG_BREEDS;
  
  if (!query.trim()) {
    return breeds.map(breed => ({ breed, matchScore: 1 }));
  }

  const queryLower = query.toLowerCase().trim();
  const results: BreedSearchResult[] = [];

  breeds.forEach(breed => {
    const breedLower = breed.toLowerCase();
    let matchScore = 0;

    // Exact match
    if (breedLower === queryLower) {
      matchScore = 100;
    }
    // Starts with query
    else if (breedLower.startsWith(queryLower)) {
      matchScore = 80;
    }
    // Word starts with query
    else if (breedLower.split(' ').some(word => word.startsWith(queryLower))) {
      matchScore = 60;
    }
    // Contains query
    else if (breedLower.includes(queryLower)) {
      matchScore = 40;
    }
    // Fuzzy match (character by character)
    else {
      let matchedChars = 0;
      let queryIndex = 0;
      for (let i = 0; i < breedLower.length && queryIndex < queryLower.length; i++) {
        if (breedLower[i] === queryLower[queryIndex]) {
          matchedChars++;
          queryIndex++;
        }
      }
      if (queryIndex === queryLower.length) {
        matchScore = 20 + (matchedChars / breedLower.length) * 10;
      }
    }

    if (matchScore > 0) {
      results.push({ breed, matchScore });
    }
  });

  // Sort by match score descending
  return results.sort((a, b) => b.matchScore - a.matchScore);
};

/**
 * Get breed suggestions for autocomplete
 * @param query Partial breed name
 * @param species "Dog" or "Cat"
 * @param limit Maximum number of suggestions
 */
export const getBreedSuggestions = (
  query: string,
  species: "Dog" | "Cat",
  limit: number = 10
): string[] => {
  const results = searchBreeds(query, species);
  return results.slice(0, limit).map(r => r.breed);
};

/**
 * Identify breed from image using the PawLink AI classifier.
 * Sends the image to the Laravel backend which proxies to the Python breed classifier API.
 *
 * @param imageUri Local URI of the image
 * @param species "Dog" or "Cat" (used for fallback only; the model detects species automatically)
 * @returns Promise with breed predictions
 */
export const identifyBreedFromImage = async (
  imageUri: string,
  species: "Dog" | "Cat"
): Promise<BreedIdentificationResult> => {
  try {
    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      name: `breed_photo_${Date.now()}.jpg`,
      type: "image/jpeg",
    } as any);

    const response = await axiosInstance.post("/api/breed-identify", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000, // 30s timeout for model inference
    });

    const data: BreedIdentifyApiResponse = response.data;

    if (!data.success || !data.top_3) {
      throw new Error("Invalid response from breed identifier");
    }

    return {
      predictions: data.top_3.map((p) => ({
        breed: p.breed,
        confidence: p.confidence / 100, // Convert from percentage to decimal
      })),
      topBreed: data.prediction.breed,
      topConfidence: data.prediction.confidence / 100,
    };
  } catch (error: any) {
    // If the breed API is unavailable, throw a descriptive error
    if (error.response?.status === 503) {
      throw new Error(
        "Breed identification service is currently unavailable. Please try again later."
      );
    }
    console.error("Breed identification error:", error);
    throw error;
  }
};

/**
 * Get breed information/description
 * @param breed Breed name
 * @param species "Dog" or "Cat"
 */
export const getBreedInfo = (breed: string, species: "Dog" | "Cat"): {
  name: string;
  description: string;
  characteristics: string[];
  sizeCategory: "small" | "medium" | "large";
  temperament: string[];
} | null => {
  // This is a simplified breed info database
  // In production, you would fetch this from a comprehensive database or API
  
  const dogBreedInfo: Record<string, any> = {
    "Labrador Retriever": {
      name: "Labrador Retriever",
      description: "Friendly, active, and outgoing. Labs are excellent family dogs.",
      characteristics: ["Water-resistant coat", "Otter-like tail", "Kind eyes"],
      sizeCategory: "large",
      temperament: ["Friendly", "Active", "Outgoing", "Gentle"],
    },
    "German Shepherd": {
      name: "German Shepherd",
      description: "Confident, courageous, and smart. One of the most versatile breeds.",
      characteristics: ["Double coat", "Pointed ears", "Muscular build"],
      sizeCategory: "large",
      temperament: ["Confident", "Courageous", "Smart", "Loyal"],
    },
    "Golden Retriever": {
      name: "Golden Retriever",
      description: "Devoted, friendly, and intelligent. Great with families and children.",
      characteristics: ["Golden coat", "Feathered fur", "Soft mouth"],
      sizeCategory: "large",
      temperament: ["Friendly", "Reliable", "Trustworthy", "Kind"],
    },
    "Aspin": {
      name: "Aspin (Asong Pinoy)",
      description: "Native Philippine mixed breed dogs known for their resilience and adaptability.",
      characteristics: ["Varied appearance", "Weather-resistant", "Adaptable"],
      sizeCategory: "medium",
      temperament: ["Loyal", "Alert", "Adaptable", "Friendly"],
    },
  };

  const catBreedInfo: Record<string, any> = {
    "Siamese": {
      name: "Siamese",
      description: "Vocal, social, and intelligent cats with striking blue eyes.",
      characteristics: ["Blue almond eyes", "Color points", "Sleek body"],
      sizeCategory: "medium",
      temperament: ["Vocal", "Social", "Intelligent", "Affectionate"],
    },
    "Persian": {
      name: "Persian",
      description: "Calm, sweet, and gentle cats known for their luxurious coats.",
      characteristics: ["Long coat", "Flat face", "Round eyes"],
      sizeCategory: "medium",
      temperament: ["Calm", "Sweet", "Gentle", "Quiet"],
    },
    "Puspin": {
      name: "Puspin (Pusang Pinoy)",
      description: "Native Philippine mixed breed cats, hardy and adaptable.",
      characteristics: ["Varied appearance", "Hardy constitution", "Adaptable"],
      sizeCategory: "medium",
      temperament: ["Independent", "Adaptable", "Friendly", "Alert"],
    },
  };

  const infoDb = species === "Cat" ? catBreedInfo : dogBreedInfo;
  return infoDb[breed] || null;
};

/**
 * Validate if a string is a valid breed name
 * @param breed Breed name to validate
 * @param species "Dog" or "Cat"
 */
export const isValidBreed = (breed: string, species: "Dog" | "Cat"): boolean => {
  const breeds = species === "Cat" ? CAT_BREEDS : DOG_BREEDS;
  return breeds.some(b => b.toLowerCase() === breed.toLowerCase());
};

/**
 * Get popular breeds for quick selection
 * @param species "Dog" or "Cat"
 * @param limit Number of breeds to return
 */
export const getPopularBreeds = (species: "Dog" | "Cat", limit: number = 6): string[] => {
  if (species === "Cat") {
    return ["Siamese", "Persian", "Maine Coon", "Ragdoll", "British Shorthair", "Puspin"].slice(0, limit);
  }
  return ["Labrador Retriever", "German Shepherd", "Golden Retriever", "Bulldog", "Beagle", "Aspin"].slice(0, limit);
};

/**
 * Check if the breed identification AI service is available.
 */
export const checkBreedServiceHealth = async (): Promise<boolean> => {
  try {
    const response = await axiosInstance.get("/api/breed-identify/health", {
      timeout: 5000,
    });
    return response.data?.available === true;
  } catch {
    return false;
  }
};
