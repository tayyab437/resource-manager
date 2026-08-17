import React, { useState } from 'react';
import { Play, ExternalLink, Video, Film, AlertCircle } from 'lucide-react';
import { parseUrlInfo } from '../../utils/urlUtils';

interface VideoEmbedProps {
  url: string;
  className?: string;
}

export function VideoEmbed({ url, className = '' }: VideoEmbedProps) {
  const [videoError, setVideoError] = useState(false);
  if (!url) return null;

  const urlInfo = parseUrlInfo(url);

  // YouTube Embed
  if (urlInfo.videoType === 'youtube' && urlInfo.embedUrl) {
    return (
      <div className={`my-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-xl ${className}`}>
        <div className="relative aspect-video w-full">
          <iframe
            src={urlInfo.embedUrl}
            title="YouTube video player"
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // Vimeo Embed
  if (urlInfo.videoType === 'vimeo' && urlInfo.embedUrl) {
    return (
      <div className={`my-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-xl ${className}`}>
        <div className="relative aspect-video w-full">
          <iframe
            src={urlInfo.embedUrl}
            title="Vimeo video player"
            className="absolute inset-0 h-full w-full border-0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // Loom Embed
  if (urlInfo.videoType === 'loom' && urlInfo.embedUrl) {
    return (
      <div className={`my-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-xl ${className}`}>
        <div className="relative aspect-video w-full">
          <iframe
            src={urlInfo.embedUrl}
            title="Loom video player"
            className="absolute inset-0 h-full w-full border-0"
            allow="fullscreen"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // Direct MP4 / WebM video file
  if (urlInfo.videoType === 'direct' && !videoError) {
    return (
      <div className={`my-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-xl ${className}`}>
        <div className="relative aspect-video w-full flex items-center justify-center bg-black">
          <video
            src={url}
            controls
            playsInline
            onError={() => setVideoError(true)}
            className="h-full w-full object-contain"
          >
            Your browser does not support HTML5 video.
          </video>
        </div>
      </div>
    );
  }

  // Fallback banner
  return (
    <div className={`my-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 dark:bg-slate-900 shadow-md ${className}`}>
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
          <Film className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Video Source Reference
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm mt-0.5">{url}</p>
        </div>
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all shrink-0 self-start sm:self-auto"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>Watch Video</span>
        <ExternalLink className="w-3.5 h-3.5 ml-1 opacity-80" />
      </a>
    </div>
  );
}
