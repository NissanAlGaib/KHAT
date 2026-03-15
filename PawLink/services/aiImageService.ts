import axios from "@/config/axiosConfig";

export type SourceMode = "primary" | "count";

export interface AiOffspringResponse {
  success: boolean;
  generation_id?: number;
  image_url?: string;
  prompt_used?: string;
  remaining_generations?: number;
  source_mode?: SourceMode;
  source_photo_count?: number;
  message?: string;
}

export interface GenerateOffspringOptions {
  sourceMode?: SourceMode;
  sourcePhotoCount?: number;
}

export interface AiGenerationHistoryPet {
  pet_id: number;
  name?: string | null;
  breed?: string | null;
  profile_image?: string | null;
}

export interface AiGenerationHistoryItem {
  id: number;
  image_url?: string | null;
  prompt_used?: string | null;
  source_mode?: SourceMode | null;
  source_photo_count?: number | null;
  created_at?: string | null;
  pet1?: AiGenerationHistoryPet | null;
  pet2?: AiGenerationHistoryPet | null;
}

export interface AiGenerationHistoryMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface AiGenerationHistoryResponse {
  success: boolean;
  data: AiGenerationHistoryItem[];
  meta: AiGenerationHistoryMeta;
  message?: string;
}

export interface DeleteGenerationHistoryResponse {
  success: boolean;
  message: string;
}

const DEFAULT_HISTORY_META: AiGenerationHistoryMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null) {
    const errorWithResponse = error as {
      response?: {
        data?: {
          message?: unknown;
        };
      };
      message?: unknown;
    };

    const responseMessage = errorWithResponse.response?.data?.message;
    if (
      typeof responseMessage === "string" &&
      responseMessage.trim().length > 0
    ) {
      return responseMessage;
    }

    if (
      typeof errorWithResponse.message === "string" &&
      errorWithResponse.message.trim().length > 0
    ) {
      return errorWithResponse.message;
    }
  }

  return fallback;
};

const clampPhotoCount = (count?: number): number => {
  if (typeof count !== "number" || Number.isNaN(count)) {
    return 2;
  }

  return Math.min(3, Math.max(1, Math.round(count)));
};

/**
 * AI Image Service for generating pet offspring predictions
 */

/**
 * Generate an offspring image for two pets
 * @param pet1Id - ID of the first pet (requester)
 * @param pet2Id - ID of the second pet (target)
 * @param options - Controls which parent photos the backend should use
 * @returns AI generated image URL and metadata
 */
export const generateOffspringImage = async (
  pet1Id: number,
  pet2Id: number,
  options: GenerateOffspringOptions = {},
): Promise<AiOffspringResponse> => {
  const sourceMode = options.sourceMode ?? "primary";
  const payload: {
    pet1_id: number;
    pet2_id: number;
    source_mode: SourceMode;
    source_photo_count?: number;
  } = {
    pet1_id: pet1Id,
    pet2_id: pet2Id,
    source_mode: sourceMode,
  };

  if (sourceMode === "count") {
    payload.source_photo_count = clampPhotoCount(options.sourcePhotoCount);
  }

  try {
    const response = await axios.post<AiOffspringResponse>(
      "/api/ai/generate-offspring",
      payload,
    );

    return response.data;
  } catch (error: unknown) {
    console.error("[AI Image] Generation failed:", error);

    return {
      success: false,
      message: getErrorMessage(
        error,
        "Unable to generate the AI offspring preview right now. Please try again.",
      ),
    };
  }
};

/**
 * Fetch paginated AI offspring generation history for the authenticated user.
 */
export const getGenerationHistory = async (
  page: number = 1,
  perPage: number = 20,
): Promise<AiGenerationHistoryResponse> => {
  try {
    const response = await axios.get<AiGenerationHistoryResponse>(
      "/api/ai/generation-history",
      {
        params: {
          page,
          per_page: perPage,
        },
      },
    );

    return response.data;
  } catch (error: unknown) {
    console.error("[AI Image] History fetch failed:", error);

    return {
      success: false,
      data: [],
      meta: {
        ...DEFAULT_HISTORY_META,
        current_page: page,
        per_page: perPage,
      },
      message: getErrorMessage(
        error,
        "Unable to load AI offspring history right now. Please try again.",
      ),
    };
  }
};

/**
 * Delete a single AI offspring generation history item.
 */
export const deleteGenerationHistoryItem = async (
  id: number,
): Promise<DeleteGenerationHistoryResponse> => {
  try {
    const response = await axios.delete<DeleteGenerationHistoryResponse>(
      `/api/ai/generation-history/${id}`,
    );

    return response.data;
  } catch (error: unknown) {
    console.error("[AI Image] History delete failed:", error);

    return {
      success: false,
      message: getErrorMessage(
        error,
        "Unable to delete this AI offspring history item right now. Please try again.",
      ),
    };
  }
};
