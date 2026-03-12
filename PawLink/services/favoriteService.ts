import axiosInstance from "@/config/axiosConfig";
import { FavoritePet } from "@/types/Pet";

export const getFavorites = async (): Promise<FavoritePet[]> => {
  try {
    const response = await axiosInstance.get("/api/favorites");
    return response.data.data || [];
  } catch (error: any) {
    console.error(
      "Error getting favorites:",
      error.response?.data || error.message,
    );
    return [];
  }
};

export const addFavorite = async (
  petId: number,
): Promise<{ is_favorited: boolean }> => {
  const response = await axiosInstance.post(`/api/favorites/${petId}`);
  return response.data;
};

export const removeFavorite = async (
  petId: number,
): Promise<{ is_favorited: boolean }> => {
  const response = await axiosInstance.delete(`/api/favorites/${petId}`);
  return response.data;
};

export const checkFavorite = async (
  petId: number,
): Promise<{ is_favorited: boolean }> => {
  try {
    const response = await axiosInstance.get(`/api/favorites/${petId}/check`);
    return response.data;
  } catch {
    return { is_favorited: false };
  }
};
