/**
 * Utility functions for URL detection, image verification,
 * video platform embed generation, and website metadata extraction.
 */

export interface ParsedUrlInfo {
  isUrl: boolean;
  isImage: boolean;
  isVideo: boolean;
  isWebsite: boolean;
  videoType?: 'youtube' | 'vimeo' | 'loom' | 'direct' | 'other';
  videoId?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  cleanUrl?: string;
}

// Extensions considered direct images
const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|svg|gif|avif|ico|bmp)(\?.*)?$/i;

// Extensions considered direct video files
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|m4v|mkv)(\?.*)?$/i;

/**
 * Checks if a string is a valid HTTP/HTTPS URL
 */
export function isValidUrl(str?: string): boolean {
  if (!str) return false;
  const trimmed = str.trim();
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.trim().match(regExp);
    if (match && match[2] && match[2].length === 11) {
      return match[2];
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Generates YouTube thumbnail URL
 */
export function getYouTubeThumbnailUrl(urlOrId: string): string | null {
  const id = urlOrId.length === 11 ? urlOrId : extractYouTubeId(urlOrId);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Extracts Vimeo video ID
 */
export function extractVimeoId(url: string): string | null {
  if (!url) return null;
  try {
    const regExp = /vimeo\.com\/(?:.*#|.*\/)?([0-9]+)/;
    const match = url.trim().match(regExp);
    if (match && match[1]) {
      return match[1];
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Extracts Loom video ID and returns embed URL
 */
export function extractLoomEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const match = url.trim().match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
      return `https://www.loom.com/embed/${match[1]}`;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Checks if URL is an image URL
 */
export function isImageUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/')) return true;
  if (IMAGE_EXTENSIONS.test(trimmed)) return true;
  if (
    trimmed.includes('images.unsplash.com') ||
    trimmed.includes('i.imgur.com') ||
    trimmed.includes('res.cloudinary.com') ||
    trimmed.includes('cdn.dribbble.com/users') ||
    trimmed.includes('assets.codepen.io')
  ) {
    return true;
  }
  return false;
}

/**
 * Checks if URL is a video URL (YouTube, Vimeo, Loom, or direct file)
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (VIDEO_EXTENSIONS.test(trimmed)) return true;
  if (extractYouTubeId(trimmed)) return true;
  if (extractVimeoId(trimmed)) return true;
  if (extractLoomEmbedUrl(trimmed)) return true;
  if (
    trimmed.includes('youtube.com') ||
    trimmed.includes('youtu.be') ||
    trimmed.includes('vimeo.com') ||
    trimmed.includes('loom.com') ||
    trimmed.includes('streamable.com') ||
    trimmed.includes('dailymotion.com')
  ) {
    return true;
  }
  return false;
}

/**
 * Full parsing of any string/URL
 */
export function parseUrlInfo(input?: string): ParsedUrlInfo {
  if (!input || !isValidUrl(input)) {
    return {
      isUrl: false,
      isImage: false,
      isVideo: false,
      isWebsite: false,
    };
  }

  const cleanUrl = input.trim().startsWith('http') ? input.trim() : `https://${input.trim()}`;
  const isImage = isImageUrl(cleanUrl);

  const ytId = extractYouTubeId(cleanUrl);
  if (ytId) {
    return {
      isUrl: true,
      isImage: false,
      isVideo: true,
      isWebsite: false,
      videoType: 'youtube',
      videoId: ytId,
      embedUrl: `https://www.youtube.com/embed/${ytId}`,
      thumbnailUrl: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      cleanUrl,
    };
  }

  const vimeoId = extractVimeoId(cleanUrl);
  if (vimeoId) {
    return {
      isUrl: true,
      isImage: false,
      isVideo: true,
      isWebsite: false,
      videoType: 'vimeo',
      videoId: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}`,
      cleanUrl,
    };
  }

  const loomEmbed = extractLoomEmbedUrl(cleanUrl);
  if (loomEmbed) {
    return {
      isUrl: true,
      isImage: false,
      isVideo: true,
      isWebsite: false,
      videoType: 'loom',
      embedUrl: loomEmbed,
      cleanUrl,
    };
  }

  if (VIDEO_EXTENSIONS.test(cleanUrl)) {
    return {
      isUrl: true,
      isImage: false,
      isVideo: true,
      isWebsite: false,
      videoType: 'direct',
      embedUrl: cleanUrl,
      cleanUrl,
    };
  }

  if (isImage) {
    return {
      isUrl: true,
      isImage: true,
      isVideo: false,
      isWebsite: false,
      thumbnailUrl: cleanUrl,
      cleanUrl,
    };
  }

  // Otherwise, it's a general website/webpage
  return {
    isUrl: true,
    isImage: false,
    isVideo: false,
    isWebsite: true,
    cleanUrl,
  };
}

/**
 * Extracts a friendly domain name for UI display
 */
export function getFriendlyDomain(urlStr?: string): string {
  if (!urlStr) return '';
  try {
    const parsed = new URL(urlStr.startsWith('http') ? urlStr : `https://${urlStr}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
}
