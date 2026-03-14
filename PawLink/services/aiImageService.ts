import axios from "@/config/axiosConfig";

export interface AiOffspringResponse {
  success: boolean;
  image_url?: string;
  prompt_used?: string;
  remaining_generations?: number;
  message?: string;
}

/**
 * AI Image Service for generating pet offspring predictions
 */

/**
 * Generate an offspring image for two pets
 * @param pet1Id - ID of the first pet (requester)
 * @param pet2Id - ID of the second pet (target)
 * @returns AI generated image URL and metadata
 */
export const generateOffspringImage = async (
  pet1Id: number,
  pet2Id: number
): Promise<AiOffspringResponse> => {
  try {
    const response = await axios.post<AiOffspringResponse>(
      "/api/ai/generate-offspring",
      {
        pet1_id: pet1Id,
        pet2_id: pet2Id,
      }
    );

    return response.data;
  } catch (error: unknown) {
    console.error("[AI Image] Generation failed:", error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : "AI image generation failed",
    };
  }
};
