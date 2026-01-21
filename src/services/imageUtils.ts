/**
 * Image processing and validation utilities
 */

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates an image file for type and size
 *
 * @param file - The file to validate
 * @returns Validation result with error message if invalid
 *
 * @example
 * ```typescript
 * const result = imageUtils.validateImageFile(file);
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 * ```
 */
export function validateImageFile(file: File): ValidationResult {
  // Check file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Please upload a PNG, JPG, or WebP image'
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Image must be less than 10MB (current size: ${sizeMB}MB)`
    };
  }

  return { valid: true };
}

/**
 * Converts a File to a base64 data URI
 *
 * @param file - The file to convert
 * @returns Promise resolving to base64 data URI
 *
 * @example
 * ```typescript
 * const base64 = await imageUtils.fileToBase64(file);
 * // Returns: "data:image/png;base64,iVBORw0KGgo..."
 * ```
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Creates a preview URL for an image file
 * Remember to call revokePreviewUrl when done to prevent memory leaks
 *
 * @param file - The file to create a preview for
 * @returns Preview URL
 *
 * @example
 * ```typescript
 * const url = imageUtils.createPreviewUrl(file);
 * // Use url in <img src={url} />
 * // Later: imageUtils.revokePreviewUrl(url);
 * ```
 */
export function createPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revokes a preview URL to free memory
 *
 * @param url - The URL to revoke
 *
 * @example
 * ```typescript
 * imageUtils.revokePreviewUrl(previewUrl);
 * ```
 */
export function revokePreviewUrl(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Image utilities service
 */
export const imageUtils = {
  validateImageFile,
  fileToBase64,
  createPreviewUrl,
  revokePreviewUrl,
};
