import axiosInstance from "@/config/axiosConfig";

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  contact_number?: string;
  birthdate?: string;
  sex?: string;
  address?: any;
  profile_image?: string;
  email_verified_at?: string | null;
  roles?: { role_id: number; role_type: string }[];
}

export interface UserStatistics {
  current_breeding: number;
  total_matches: number;
  success_rate: number;
  income: number;
}

export interface UpdateProfileData {
  name?: string;
  firstName?: string;
  lastName?: string;
  contact_number?: string;
  birthdate?: string;
  sex?: string;
  address?: any;
  profile_image?: any; // File/URI
}

/**
 * Get current user profile
 */
export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await axiosInstance.get("/api/user");
    return response.data;
  } catch (error: any) {
    console.error(
      "Error getting user profile:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  data: UpdateProfileData
): Promise<UserProfile> => {
  try {
    const formData = new FormData();

    // Add text fields
    if (data.name) formData.append("name", data.name);
    if (data.firstName) formData.append("firstName", data.firstName);
    if (data.lastName) formData.append("lastName", data.lastName);
    if (data.contact_number)
      formData.append("contact_number", data.contact_number);
    if (data.birthdate) formData.append("birthdate", data.birthdate);
    if (data.sex) formData.append("sex", data.sex);
    if (data.address) formData.append("address", JSON.stringify(data.address));

    // Handle profile image if provided
    if (data.profile_image) {
      // For React Native, we need to handle the image properly
      const imageFile = {
        uri: data.profile_image.uri || data.profile_image,
        type: data.profile_image.type || "image/jpeg",
        name: data.profile_image.name || "profile.jpg",
      };
      formData.append("profile_image", imageFile as any);
    }

    const response = await axiosInstance.post("/api/user/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error(
      "Error updating user profile:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Get user statistics for breeding overview
 */
export const getUserStatistics = async (): Promise<UserStatistics> => {
  try {
    const response = await axiosInstance.get("/api/user/statistics");
    return response.data;
  } catch (error: any) {
    console.error(
      "Error getting user statistics:",
      error.response?.data || error.message
    );
    // Return default values if endpoint doesn't exist yet
    return {
      current_breeding: 0,
      total_matches: 0,
      success_rate: 0,
      income: 0,
    };
  }
};

/**
 * Upload profile image
 */
export const uploadProfileImage = async (imageUri: string): Promise<string> => {
  try {
    const formData = new FormData();

    const imageFile = {
      uri: imageUri,
      type: "image/jpeg",
      name: "profile.jpg",
    };

    formData.append("profile_image", imageFile as any);

    const response = await axiosInstance.post(
      "/api/user/profile-image",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data.profile_image;
  } catch (error: any) {
    console.error(
      "Error uploading profile image:",
      error.response?.data || error.message
    );
    throw error;
  }
};
