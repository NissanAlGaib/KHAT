/**
 * FormData Utilities for React Native
 * Handles image and file uploads with proper formatting
 */

import type { ImagePickerAsset, DocumentPickerAsset } from "@/types";

interface FormDataFile {
  uri: string;
  type: string;
  name: string;
}

/**
 * Convert an image picker result to a FormData-compatible file object
 */
export function toFormDataImage(
  image: ImagePickerAsset | string,
  defaultName: string = "image.jpg"
): FormDataFile {
  if (typeof image === "string") {
    return {
      uri: image,
      type: "image/jpeg",
      name: defaultName,
    };
  }

  return {
    uri: image.uri,
    type: image.type || "image/jpeg",
    name: image.name || defaultName,
  };
}

/**
 * Convert a document picker result to a FormData-compatible file object
 */
export function toFormDataDocument(
  document: DocumentPickerAsset | string,
  defaultName: string = "document.pdf"
): FormDataFile {
  if (typeof document === "string") {
    return {
      uri: document,
      type: "application/pdf",
      name: defaultName,
    };
  }

  return {
    uri: document.uri,
    type: document.type || "application/pdf",
    name: document.name || defaultName,
  };
}

/**
 * Append an image to FormData with proper React Native formatting
 */
export function appendImageToFormData(
  formData: FormData,
  fieldName: string,
  image: ImagePickerAsset | string,
  defaultName?: string
): void {
  const imageFile = toFormDataImage(image, defaultName);
  formData.append(fieldName, imageFile as unknown as Blob);
}

/**
 * Append multiple images to FormData
 */
export function appendImagesToFormData(
  formData: FormData,
  fieldName: string,
  images: (ImagePickerAsset | string)[],
  baseFileName: string = "image"
): void {
  images.forEach((image, index) => {
    const imageFile = toFormDataImage(image, `${baseFileName}_${index}.jpg`);
    formData.append(`${fieldName}[${index}]`, imageFile as unknown as Blob);
  });
}

/**
 * Append a document to FormData with proper React Native formatting
 */
export function appendDocumentToFormData(
  formData: FormData,
  fieldName: string,
  document: DocumentPickerAsset | string,
  defaultName?: string
): void {
  const documentFile = toFormDataDocument(document, defaultName);
  formData.append(fieldName, documentFile as unknown as Blob);
}

/**
 * Create FormData from an object with optional image/document handling
 */
export function createFormData(
  data: Record<string, unknown>,
  imageFields: string[] = [],
  documentFields: string[] = []
): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (imageFields.includes(key)) {
      if (Array.isArray(value)) {
        appendImagesToFormData(formData, key, value as ImagePickerAsset[]);
      } else {
        appendImageToFormData(formData, key, value as ImagePickerAsset);
      }
    } else if (documentFields.includes(key)) {
      appendDocumentToFormData(formData, key, value as DocumentPickerAsset);
    } else if (typeof value === "boolean") {
      formData.append(key, value ? "1" : "0");
    } else if (typeof value === "number") {
      formData.append(key, value.toString());
    } else if (typeof value === "string") {
      formData.append(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, String(item));
      });
    } else if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    }
  }

  return formData;
}

/**
 * Get file extension from URI
 */
export function getFileExtension(uri: string): string {
  const parts = uri.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  return mimeTypes[extension] || "application/octet-stream";
}
