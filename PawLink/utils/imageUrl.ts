import { API_BASE_URL } from "@/config/env";

/**
 * Converts a storage path to a full URL for fetching images.
 * Handles various path formats consistently:
 * - Full URLs (http/https) are returned as-is
 * - Paths with leading slashes are normalized
 * - Paths already containing "storage/" are not double-prefixed
 * - All other paths get the storage prefix added
 *
 * @param path - The image path from database (e.g., "profile_images/abc123...")
 * @returns Full URL or null if path is empty
 */
export function getStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  // Already a full URL - return as-is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.substring(1) : path;

  // Avoid double "storage/" prefix
  const finalPath = cleanPath.startsWith("storage/")
    ? cleanPath
    : `storage/${cleanPath}`;

  return `${API_BASE_URL}/${finalPath}`;
}
