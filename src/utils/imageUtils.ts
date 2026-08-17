import type { MediaReference } from '../types';

/**
 * Generates a compressed, resized base64 thumbnail image URL from an image source
 * using HTML Canvas to optimize rendering speed in card grids.
 */
export async function generateThumbnail(
  imageSrc: string,
  maxDimension: number = 400
): Promise<string> {
  return new Promise((resolve) => {
    if (!imageSrc) {
      resolve('');
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;

        // If the image is already small, return original
        if (width <= maxDimension && height <= maxDimension && imageSrc.length < 50000) {
          resolve(imageSrc);
          return;
        }

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to webp/jpeg data URL
        const thumbDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbDataUrl);
      } catch (err) {
        // Fallback to original if canvas operations fail or CORS block occurs
        resolve(imageSrc);
      }
    };

    img.onerror = () => {
      resolve(imageSrc);
    };

    img.src = imageSrc;
  });
}

/**
 * Ensures all media references in a list have a thumbnailDataUrl property generated.
 */
export async function processMediaThumbnails(
  images?: MediaReference[]
): Promise<MediaReference[] | undefined> {
  if (!images || images.length === 0) return images;

  const processed = await Promise.all(
    images.map(async (img) => {
      if (img.thumbnailDataUrl) {
        return img;
      }

      const src = img.dataUrl || img.url;
      if (!src) return img;

      const thumb = await generateThumbnail(src, 380);
      return {
        ...img,
        thumbnailDataUrl: thumb,
      };
    })
  );

  return processed;
}
