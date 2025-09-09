/**
 * Image compression utilities for optimizing uploaded images
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

/**
 * Compress an image file using canvas
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality = 0.8,
    format = 'webp'
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          // Create new file with compressed blob
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, `.${format === 'jpeg' ? 'jpg' : format}`),
            {
              type: `image/${format}`,
              lastModified: Date.now(),
            }
          );
          
          resolve(compressedFile);
        },
        `image/${format}`,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Get optimized image dimensions for different use cases
 */
export const IMAGE_PRESETS = {
  thumbnail: { maxWidth: 150, maxHeight: 150, quality: 0.7 },
  card: { maxWidth: 400, maxHeight: 300, quality: 0.8 },
  hero: { maxWidth: 1200, maxHeight: 800, quality: 0.85 },
  full: { maxWidth: 1920, maxHeight: 1080, quality: 0.9 },
} as const;

/**
 * Generate multiple sizes of an image for responsive loading
 */
export async function generateImageSizes(
  file: File,
  presets: (keyof typeof IMAGE_PRESETS)[] = ['thumbnail', 'card', 'full']
): Promise<Record<string, File>> {
  const results: Record<string, File> = {};
  
  for (const preset of presets) {
    const options = IMAGE_PRESETS[preset];
    try {
      results[preset] = await compressImage(file, options);
    } catch (error) {
      console.error(`Failed to generate ${preset} size:`, error);
    }
  }
  
  return results;
}

/**
 * Calculate file size reduction percentage
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}