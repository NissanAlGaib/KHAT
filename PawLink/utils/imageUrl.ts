import { STORAGE_URL } from "@/config/env";

/**
 * Converts a storage path to a full URL for fetching images from DigitalOcean Spaces.
 * Handles various path formats consistently:
 * - Full URLs (http/https) are returned as-is
 * - Paths with leading slashes are normalized
 * - Paths already containing "storage/" have the prefix removed
 * - All paths point to the DigitalOcean Spaces bucket
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
  let cleanPath = path.startsWith("/") ? path.substring(1) : path;

  // Remove "storage/" prefix if present (we'll use the Spaces URL directly)
  if (cleanPath.startsWith("storage/")) {
    cleanPath = cleanPath.substring(8);
  }

  return `${STORAGE_URL}/${cleanPath}`;
}
