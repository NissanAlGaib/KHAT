import axios from "@/config/axiosConfig";

export interface VerificationData {
  user_id: number;
  id_document: any; // File/URI
  breeder_document?: any; // File/URI (optional)
  shooter_document?: any; // File/URI (optional)
}

export interface VerificationStatus {
  auth_id: number;
  user_id: number;
  auth_type: string; // 'id', 'breeder_certificate', or 'shooter_certificate'
  document_path: string;
  status: "pending" | "approved" | "rejected";
  date_created: string;
}

/**
 * Submit verification documents
 */
export const submitVerification = async (data: VerificationData) => {
  try {
    const formData = new FormData();
    formData.append("user_id", data.user_id.toString());

    // Handle ID document
    if (data.id_document) {
      const idFile = await uriToFile(data.id_document, "id_document");
      formData.append("id_document", idFile as any);
    }

    // Handle breeder document if provided
    if (data.breeder_document) {
      const breederFile = await uriToFile(
        data.breeder_document,
        "breeder_document"
      );
      formData.append("breeder_document", breederFile as any);
    }

    // Handle shooter document if provided
    if (data.shooter_document) {
      const shooterFile = await uriToFile(
        data.shooter_document,
        "shooter_document"
      );
      formData.append("shooter_document", shooterFile as any);
    }

    const response = await axios.post("api/verification/submit", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  } catch (error: any) {
    console.error(
      "Error submitting verification:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Get verification status for a user
 */
export const getVerificationStatus = async (userId: number) => {
  try {
    const response = await axios.get(`api/verification/status/${userId}`);
    return response.data.data || [];
  } catch (error: any) {
    console.error(
      "Error getting verification status:",
      error.response?.data || error.message
    );
    return [];
  }
};

/**
 * Get all pending verifications (admin only)
 */
export const getPendingVerifications = async () => {
  try {
    const response = await axios.get("api/verification/pending");
    return response.data;
  } catch (error: any) {
    console.error(
      "Error getting pending verifications:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Update verification status (admin only)
 */
export const updateVerificationStatus = async (
  authId: number,
  status: "approved" | "rejected"
) => {
  try {
    const response = await axios.put(`api/verification/${authId}/status`, {
      status,
    });
    return response.data;
  } catch (error: any) {
    console.error(
      "Error updating verification status:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Helper function to convert URI to File object for upload
 */
const uriToFile = async (uri: string, name: string) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `${name}_${Date.now()}.${blob.type.split("/")[1] || "jpg"}`;
    return {
      uri,
      name: filename,
      type: blob.type,
    };
  } catch (error) {
    console.error("Error converting URI to file:", error);
    throw error;
  }
};
