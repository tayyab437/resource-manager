import React from 'react';
import {
  Code2,
  Sparkles,
  Play,
  Globe,
  Layers,
  Camera,
  Palette,
  GraduationCap,
  Zap,
  Layout,
  Lightbulb,
  Bookmark,
  Terminal,
  ExternalLink,
  BookOpen,
  Film,
} from 'lucide-react';
import type { Resource } from '../../types';
import { parseUrlInfo, getFriendlyDomain } from '../../utils/urlUtils';

interface TypePlaceholderProps {
  resource: Resource;
  variant?: 'card' | 'modal';
}

export function TypePlaceholder({ resource, variant = 'card' }: TypePlaceholderProps) {
  const { type, code, prompt, sourceUrl, videoUrl, title } = resource;
  const isModal = variant === 'modal';

  const videoInfo = videoUrl ? parseUrlInfo(videoUrl) : null;
  const sourceInfo = sourceUrl ? parseUrlInfo(sourceUrl) : null;
  const domain = getFriendlyDomain(videoUrl || sourceUrl);

  // If videoUrl has a thumbnail (e.g. YouTube), render it with a play overlay
  if (videoInfo?.thumbnailUrl) {
    return (
      <div className="relative w-full h-full bg-slate-950 overflow-hidden group/video-thumb">
        <img
          src={videoInfo.thumbnailUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover/video-thumb:scale-105 transition-transform duration-300 opacity-90 group-hover/video-thumb:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="p-3.5 rounded-full bg-rose-600/90 text-white shadow-xl shadow-rose-950/60 ring-4 ring-white/10 group-hover/video-thumb:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current translate-x-0.5" />
          </div>
        </div>
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-bold text-white/90 drop-shadow-md">
          <span className="flex items-center gap-1 uppercase tracking-wider">
            <Film className="w-3 h-3 text-rose-400" />
            {videoInfo.videoType === 'youtube' ? 'YouTube' : 'Video'}
          </span>
        </div>
      </div>
    );
  }

  switch (type) {
    case 'Code': {
      const lang = code?.language || 'code';
      const snippet = code?.content?.trim();
      return (
        <div className="w-full h-full bg-slate-950 p-3 flex flex-col justify-between font-mono text-slate-300 select-none relative overflow-hidden group/placeholder">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:16px_16px] opacity-20" />

          {/* Code Window Header */}
          <div className="relative z-10 flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="ml-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {lang}
              </span>
            </div>
            <Code2 className="w-3.5 h-3.5 text-emerald-400/80" />
          </div>

          {/* Snippet Content or Mock Lines */}
          <div className="relative z-10 flex-1 overflow-hidden text-[10px] leading-relaxed">
            {snippet ? (
              <pre className="text-emerald-300/90 whitespace-pre-wrap font-mono line-clamp-4">
                {snippet}
              </pre>
            ) : (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2 text-indigo-400/80">
                  <Terminal className="w-3 h-3 shrink-0" />
                  <span className="text-slate-400">// Code Snippet Reference</span>
                </div>
                <div className="h-2 w-3/4 rounded bg-emerald-500/20" />
                <div className="h-2 w-1/2 rounded bg-indigo-500/20 ml-3" />
                <div className="h-2 w-5/6 rounded bg-slate-700/40 ml-3" />
                <div className="h-2 w-2/3 rounded bg-emerald-500/20" />
              </div>
            )}
          </div>

          {/* Footer Tag */}
          <div className="relative z-10 pt-2 flex items-center justify-between text-[9px] text-slate-500 border-t border-slate-800/60 mt-1">
            <span>Syntax Highlighting</span>
            <span className="text-emerald-400 font-bold uppercase">{lang}</span>
          </div>
        </div>
      );
    }

    case 'Prompt': {
      const promptText = prompt || resource.notes || resource.description;
      return (
        <div className="w-full h-full bg-gradient-to-br from-purple-950 via-slate-900 to-amber-950/70 p-4 flex flex-col justify-between select-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>AI Prompt</span>
            </div>
            <span className="text-[10px] text-purple-300/60 font-mono">LLM Ready</span>
          </div>

          <div className="relative z-10 my-2">
            {promptText ? (
              <p className="text-slate-200 text-xs italic font-serif leading-relaxed line-clamp-3 bg-slate-950/40 p-2.5 rounded-xl border border-purple-500/20 shadow-inner">
                "{promptText}"
              </p>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950/50 border border-amber-500/20 text-center space-y-1">
                <Sparkles className="w-5 h-5 text-amber-400 mx-auto" />
                <p className="text-xs text-amber-200/90 font-medium">Generative Prompt Matrix</p>
              </div>
            )}
          </div>

          <div className="relative z-10 flex items-center justify-between text-[9px] text-amber-300/70">
            <span>Copyable Prompt</span>
            <span className="font-semibold">{title.slice(0, 20)}</span>
          </div>
        </div>
      );
    }

    case 'Video': {
      return (
        <div className="w-full h-full bg-gradient-to-br from-rose-950/80 via-slate-950 to-slate-900 p-4 flex flex-col items-center justify-center relative overflow-hidden group/video">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-600/10 via-transparent to-transparent" />

          <div className="relative z-10 flex flex-col items-center gap-2">
            <div className="p-3.5 rounded-full bg-rose-600/20 border border-rose-500/30 text-rose-400 shadow-lg shadow-rose-900/30 group-hover/video:scale-110 transition-transform duration-300">
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            </div>
            <div className="text-center">
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-200 block">
                Video Resource
              </span>
              {domain && (
                <span className="text-[10px] text-rose-300/80 font-medium flex items-center justify-center gap-1 mt-0.5">
                  <ExternalLink className="w-2.5 h-2.5" />
                  {domain}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }

    case 'Website': {
      return (
        <div className="w-full h-full bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-900 p-3 flex flex-col justify-between relative overflow-hidden select-none">
          {/* Mock Browser Header */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400">
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-2 h-2 rounded-full bg-rose-500/70" />
              <div className="w-2 h-2 rounded-full bg-amber-500/70" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
            </div>
            <div className="flex-1 truncate text-slate-300 font-mono text-[9px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
              <Globe className="w-2.5 h-2.5 text-blue-400 shrink-0" />
              <span className="truncate">{domain || 'https://website.com'}</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center my-auto text-center gap-1.5">
            <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Globe className={`text-blue-400 ${isModal ? 'w-8 h-8' : 'w-6 h-6'}`} />
            </div>
            <span className="text-xs font-semibold text-slate-200">{title}</span>
            {resource.description && (
              <span className="text-[10px] text-slate-400 line-clamp-1 max-w-xs px-2">
                {resource.description}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[9px] text-blue-300/70 pt-1 border-t border-slate-800/40">
            <span>Website Portal</span>
            <span className="font-semibold truncate max-w-[120px]">{domain}</span>
          </div>
        </div>
      );
    }

    case 'Component': {
      return (
        <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>UI Component</span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              JSX/TSX
            </span>
          </div>

          {/* Wireframe Mockup */}
          <div className="my-auto p-3 rounded-xl bg-slate-900/70 border border-indigo-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-2 w-1/3 rounded bg-indigo-400/40" />
              <div className="h-4 w-12 rounded-lg bg-indigo-600/60" />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className="h-6 rounded bg-slate-800 border border-indigo-500/10" />
              <div className="h-6 rounded bg-slate-800 border border-indigo-500/10" />
              <div className="h-6 rounded bg-slate-800 border border-indigo-500/10" />
            </div>
          </div>
        </div>
      );
    }

    case 'Screenshot': {
      return (
        <div className="w-full h-full bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-950 p-4 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2">
            <Camera className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">
            Screenshot Asset
          </span>
          <span className="text-[10px] text-cyan-400/70 mt-0.5 font-medium">Visual Design Spec</span>
        </div>
      );
    }

    case 'Inspiration': {
      return (
        <div className="w-full h-full bg-gradient-to-br from-fuchsia-950/80 via-slate-900 to-pink-950/60 p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-fuchsia-400 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span>Inspiration</span>
            </div>
            <span className="text-pink-300/60">Moodboard</span>
          </div>

          <div className="my-auto flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-full bg-fuchsia-500 shadow-md shadow-fuchsia-500/30 ring-2 ring-slate-900" />
            <div className="w-8 h-8 rounded-full bg-pink-500 shadow-md shadow-pink-500/30 ring-2 ring-slate-900" />
            <div className="w-8 h-8 rounded-full bg-violet-500 shadow-md shadow-violet-500/30 ring-2 ring-slate-900" />
            <div className="w-8 h-8 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/30 ring-2 ring-slate-900" />
          </div>

          <span className="text-[10px] text-fuchsia-300/70 font-semibold text-center">
            Design & Aesthetics
          </span>
        </div>
      );
    }

    case 'Tutorial': {
      return (
        <div className="w-full h-full bg-gradient-to-br from-purple-950 via-slate-900 to-violet-950 p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-purple-400 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              <span>Guide & Tutorial</span>
            </div>
            <BookOpen className="w-3.5 h-3.5 text-purple-300/60" />
          </div>

          <div className="my-auto p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/20 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-200">
              <span className="px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-300 text-[10px]">
                STEP 1
              </span>
              <span className="truncate">{title}</span>
            </div>
            <div className="h-1.5 w-full rounded bg-purple-500/20" />
            <div className="h-1.5 w-3/4 rounded bg-slate-700/40" />
          </div>
        </div>
      );
    }

    case 'Animation': {
      return (
        <div className="w-full h-full bg-gradient-to-br from-sky-950 via-slate-900 to-teal-950 p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-sky-400 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-sky-400 animate-bounce" />
              <span>Motion / FX</span>
            </div>
            <span className="text-teal-300/60 font-mono">60 FPS</span>
          </div>

          <div className="my-auto flex items-center justify-center gap-1">
            <div className="w-1.5 h-6 rounded bg-sky-400/80 animate-pulse" />
            <div className="w-1.5 h-10 rounded bg-teal-400 animate-pulse" />
            <div className="w-1.5 h-4 rounded bg-sky-500/60 animate-pulse" />
            <div className="w-1.5 h-8 rounded bg-teal-300/90 animate-pulse" />
            <div className="w-1.5 h-5 rounded bg-sky-400/80 animate-pulse" />
          </div>

          <span className="text-[10px] text-sky-300/70 font-semibold text-center">
            Keyframe & Transition
          </span>
        </div>
      );
    }

    case 'Template': {
      return (
        <div className="w-full h-full bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-violet-400 text-[10px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5" />
              <span>Starter Template</span>
            </div>
            <span className="text-violet-300/60 font-mono">Blueprint</span>
          </div>

          <div className="my-auto p-2.5 rounded-xl bg-slate-900/80 border border-violet-500/20 grid grid-cols-2 gap-2">
            <div className="h-8 rounded bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-300">
              Hero
            </div>
            <div className="h-8 rounded bg-slate-800 border border-slate-700/60 flex items-center justify-center text-[10px] text-slate-400">
              Grid
            </div>
          </div>
        </div>
      );
    }

    case 'Idea': {
      return (
        <div className="w-full h-full bg-gradient-to-br from-amber-950/80 via-slate-900 to-yellow-950/60 p-4 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="p-3 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 mb-2 shadow-lg shadow-amber-900/20">
            <Lightbulb className="w-7 h-7" />
          </div>
          <span className="text-xs font-bold text-slate-200 tracking-wide uppercase">
            Concept Note
          </span>
          <span className="text-[10px] text-amber-300/70 font-medium">Creative Brainstorm</span>
        </div>
      );
    }

    default: {
      return (
        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 p-4 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="p-3 rounded-full bg-slate-800 border border-slate-700 text-slate-400 mb-2">
            <Bookmark className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">
            {type}
          </span>
        </div>
      );
    }
  }
}
