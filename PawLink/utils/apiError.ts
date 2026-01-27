/**
 * API Error Handling Utilities
 * Centralized error handling for API calls
 */

import { AxiosError, isAxiosError } from "axios";
import { Alert } from "react-native";

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}

/**
 * Parse an error from an API call into a standardized format
 */
export function parseApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    const axiosError = error as AxiosError<{
      message?: string;
      errors?: Record<string, string[]>;
    }>;

    const responseData = axiosError.response?.data;
    const statusCode = axiosError.response?.status;

    return {
      message:
        responseData?.message ||
        axiosError.message ||
        "An unexpected error occurred",
      errors: responseData?.errors,
      statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: "An unexpected error occurred",
  };
}

/**
 * Handle API error with optional alert display
 */
export function handleApiError(
  error: unknown,
  context: string,
  options: {
    showAlert?: boolean;
    alertTitle?: string;
    onError?: (error: ApiError) => void;
  } = {}
): ApiError {
  const { showAlert = true, alertTitle = "Error", onError } = options;

  const parsedError = parseApiError(error);

  // Log for debugging (replace with proper logging in production)
  if (__DEV__) {
    console.error(`[${context}]`, parsedError);
  }

  if (showAlert) {
    Alert.alert(alertTitle, parsedError.message);
  }

  if (onError) {
    onError(parsedError);
  }

  return parsedError;
}

/**
 * Extract validation errors from API response
 * Returns a flat object suitable for form error state
 */
export function extractValidationErrors(
  errors: Record<string, string[]> | undefined
): Record<string, string> {
  if (!errors) return {};

  const flatErrors: Record<string, string> = {};

  for (const [field, messages] of Object.entries(errors)) {
    // Take the first error message for each field
    if (messages.length > 0) {
      flatErrors[field] = messages[0];
    }
  }

  return flatErrors;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return !error.response && error.code === "ERR_NETWORK";
  }
  return false;
}

/**
 * Check if error is an authentication error (401)
 */
export function isAuthError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Check if error is a validation error (422)
 */
export function isValidationError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.response?.status === 422;
  }
  return false;
}

/**
 * Get user-friendly error message based on status code
 */
export function getErrorMessage(error: unknown): string {
  const parsedError = parseApiError(error);

  if (isNetworkError(error)) {
    return "Unable to connect. Please check your internet connection.";
  }

  switch (parsedError.statusCode) {
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 422:
      return parsedError.message || "Please check your input and try again.";
    case 429:
      return "Too many requests. Please try again later.";
    case 500:
      return "Something went wrong on our end. Please try again later.";
    default:
      return parsedError.message;
  }
}
