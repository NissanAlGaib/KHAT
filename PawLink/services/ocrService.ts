import axios from "@/config/axiosConfig";

export interface OcrExtractedData {
  full_name?: string;
  id_number?: string;
  birthdate?: string;
  issue_date?: string;
  expiration_date?: string;
  address?: string;
  id_type_detected?: string;
}

export interface OcrResponse {
  success: boolean;
  confidence: number;
  extracted_fields: OcrExtractedData;
  raw_text?: string;
  error?: string;
}

/**
 * OCR Service for extracting information from ID documents
 * 
 * This service will connect to the Python OCR microservice
 * once it's deployed. For now, it returns a stub response.
 */

const OCR_SERVICE_URL = process.env.EXPO_PUBLIC_OCR_SERVICE_URL || "";

/**
 * Extract information from an ID document image
 * @param imageUri - Local URI of the image to process
 * @param idType - Type of ID (helps with parsing)
 * @returns Extracted fields with confidence score
 */
export const extractIdInformation = async (
  imageUri: string,
  idType?: string
): Promise<OcrResponse> => {
  // If OCR service is not configured, return stub
  if (!OCR_SERVICE_URL) {
    console.log("[OCR] Service not configured, returning stub response");
    return createStubResponse();
  }

  try {
    const formData = new FormData();
    
    // Convert URI to file object for upload
    const filename = `id_scan_${Date.now()}.jpg`;
    formData.append("image", {
      uri: imageUri,
      name: filename,
      type: "image/jpeg",
    } as unknown as Blob);

    if (idType) {
      formData.append("id_type", idType);
    }

    const response = await axios.post<OcrResponse>(
      `${OCR_SERVICE_URL}/api/ocr/extract`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000, // 30 second timeout for OCR processing
      }
    );

    return response.data;
  } catch (error: unknown) {
    console.error("[OCR] Extraction failed:", error);
    
    // Return error response
    return {
      success: false,
      confidence: 0,
      extracted_fields: {},
      error: error instanceof Error ? error.message : "OCR extraction failed",
    };
  }
};

/**
 * Check if OCR service is available
 */
export const checkOcrServiceHealth = async (): Promise<boolean> => {
  if (!OCR_SERVICE_URL) {
    return false;
  }

  try {
    const response = await axios.get(`${OCR_SERVICE_URL}/api/health`, {
      timeout: 5000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
};

/**
 * Stub response for development/testing when OCR service is not available
 */
const createStubResponse = (): OcrResponse => {
  // Simulate processing delay
  return {
    success: true,
    confidence: 0,
    extracted_fields: {},
    raw_text: "",
    error: "OCR service not configured. Fields will need to be filled manually.",
  };
};

/**
 * Parse date string from various formats to ISO format
 */
export const parseDateFromOcr = (dateString: string): string | null => {
  if (!dateString) return null;

  // Common date patterns in Philippine IDs
  const patterns = [
    // MM/DD/YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    // DD-MM-YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/,
    // YYYY-MM-DD (ISO)
    /^(\d{4})-(\d{2})-(\d{2})$/,
    // Month DD, YYYY
    /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/,
  ];

  for (const pattern of patterns) {
    const match = dateString.match(pattern);
    if (match) {
      try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split("T")[0];
        }
      } catch {
        continue;
      }
    }
  }

  return null;
};

/**
 * Validate extracted data quality
 */
export const validateExtractedData = (
  data: OcrExtractedData
): { isValid: boolean; missingFields: string[] } => {
  const requiredFields = ["full_name", "id_number"];
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (!data[field as keyof OcrExtractedData]) {
      missingFields.push(field);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};
