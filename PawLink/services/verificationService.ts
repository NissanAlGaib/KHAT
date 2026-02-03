import axios from "@/config/axiosConfig";

export interface VerificationData {
  user_id: number;
  id_document: any; // File/URI
  id_number?: string;
  id_name?: string;
  id_issue_date?: string;
  id_expiration_date?: string;
  breeder_document?: any; // File/URI (optional)
  breeder_number?: string;
  breeder_name?: string;
  breeder_issuing_authority?: string;
  breeder_issue_date?: string;
  breeder_expiration_date?: string;
  shooter_document?: any; // File/URI (optional)
  shooter_number?: string;
  shooter_name?: string;
  shooter_issuing_authority?: string;
  shooter_issue_date?: string;
  shooter_expiration_date?: string;
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
      if (data.id_number) formData.append("id_number", data.id_number);
      if (data.id_name) formData.append("id_name", data.id_name);
      if (data.id_issue_date)
        formData.append("id_issue_date", data.id_issue_date);
      if (data.id_expiration_date)
        formData.append("id_expiration_date", data.id_expiration_date);
    }

    // Handle breeder document if provided
    if (data.breeder_document) {
      const breederFile = await uriToFile(
        data.breeder_document,
        "breeder_document"
      );
      formData.append("breeder_document", breederFile as any);
      if (data.breeder_number)
        formData.append("breeder_number", data.breeder_number);
      if (data.breeder_name) formData.append("breeder_name", data.breeder_name);
      if (data.breeder_issuing_authority)
        formData.append(
          "breeder_issuing_authority",
          data.breeder_issuing_authority
        );
      if (data.breeder_issue_date)
        formData.append("breeder_issue_date", data.breeder_issue_date);
      if (data.breeder_expiration_date)
        formData.append(
          "breeder_expiration_date",
          data.breeder_expiration_date
        );
    }

    // Handle shooter document if provided
    if (data.shooter_document) {
      const shooterFile = await uriToFile(
        data.shooter_document,
        "shooter_document"
      );
      formData.append("shooter_document", shooterFile as any);
      if (data.shooter_number)
        formData.append("shooter_number", data.shooter_number);
      if (data.shooter_name) formData.append("shooter_name", data.shooter_name);
      if (data.shooter_issuing_authority)
        formData.append(
          "shooter_issuing_authority",
          data.shooter_issuing_authority
        );
      if (data.shooter_issue_date)
        formData.append("shooter_issue_date", data.shooter_issue_date);
      if (data.shooter_expiration_date)
        formData.append(
          "shooter_expiration_date",
          data.shooter_expiration_date
        );
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
    // Get file extension from URI
    const uriParts = uri.split('.');
    const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
    
    // Map extension to MIME type
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      pdf: 'application/pdf',
    };
    
    const mimeType = mimeTypes[fileExtension] || 'image/jpeg';
    const filename = `${name}_${Date.now()}.${fileExtension || 'jpg'}`;
    
    return {
      uri,
      name: filename,
      type: mimeType,
    };
  } catch (error) {
    console.error("Error converting URI to file:", error);
    throw error;
  }
};
