import React, { useState } from 'react';
import {
  Star,
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Play,
  Globe,
} from 'lucide-react';
import type { Resource, ResourceType } from '../../types';
import { useToast } from '../common/Toast';
import { TypePlaceholder } from './TypePlaceholder';
import { parseUrlInfo, getFriendlyDomain } from '../../utils/urlUtils';

interface ResourceCardProps {
  key?: string;
  resource: Resource;
  categoryName?: string;
  tagNames?: string[];
  onOpen: (resource: Resource) => void;
  onEdit: (resource: Resource) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

const typeColors: Record<ResourceType, { bg: string; text: string; border: string }> = {
  Component: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  Screenshot: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  Code: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  Prompt: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  Video: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  Website: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
  Tutorial: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
  Inspiration: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
  Animation: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30' },
  Template: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  Idea: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  Other: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
};

export function ResourceCard({
  resource,
  categoryName,
  tagNames = [],
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
}: ResourceCardProps) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const toast = useToast();

  const primaryImage =
    resource.images && resource.images.length > 0
      ? resource.images[0].thumbnailDataUrl || resource.images[0].dataUrl || resource.images[0].url
      : null;
  const imageCount = resource.images ? resource.images.length : 0;
  const style = typeColors[resource.type] || typeColors.Other;

  const urlDomain = getFriendlyDomain(resource.sourceUrl || resource.videoUrl);
  const hasAIAnalysis = resource.notes && (resource.notes.includes('•') || resource.notes.includes('Core Functionalities') || resource.notes.includes('Key Features'));

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const contentToCopy = resource.code?.content || resource.prompt || resource.sourceUrl || resource.videoUrl || '';
    if (!contentToCopy) return;

    try {
      await navigator.clipboard.writeText(contentToCopy);
      setCopied(true);
      toast.success(resource.code ? 'Code copied!' : resource.prompt ? 'Prompt copied!' : 'URL copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy.');
    }
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(resource.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDelete(resource.id);
    toast.info('Resource deleted');
  };

  return (
    <div
      onClick={() => onOpen(resource)}
      className="group relative flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Media Preview or Type Specific Visual Fallback */}
      <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden flex items-center justify-center">
        {primaryImage && !imgError ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-slate-600 animate-bounce" />
              </div>
            )}
            <img
              src={primaryImage}
              alt={resource.title}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`h-full w-full object-cover group-hover:scale-105 transition-all duration-300 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
            {imageCount > 1 && (
              <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-950/85 text-white backdrop-blur-md flex items-center gap-1 border border-slate-700/60 shadow-md">
                <ImageIcon className="w-3 h-3 text-indigo-400" />
                <span>+{imageCount - 1}</span>
              </span>
            )}
          </>
        ) : (
          <TypePlaceholder resource={resource} variant="card" />
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md ${style.bg} ${style.text} ${style.border}`}
            >
              {resource.type}
            </span>

            {hasAIAnalysis && (
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md shadow-sm" title="AI Analyzed Website">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>AI Analyzed</span>
              </span>
            )}
          </div>

          <button
            onClick={handleFavorite}
            className={`p-1.5 rounded-full backdrop-blur-md transition-all pointer-events-auto ${
              resource.favorite
                ? 'bg-amber-500 text-white shadow-lg'
                : 'bg-slate-900/60 text-slate-300 hover:text-amber-400 hover:bg-slate-900'
            }`}
            title={resource.favorite ? 'Unfavorite' : 'Favorite'}
          >
            <Star className={`w-3.5 h-3.5 ${resource.favorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {resource.title}
          </h3>

          {resource.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {resource.description}
            </p>
          )}

          {urlDomain && !resource.description && (
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-slate-500" />
              <span className="truncate">{urlDomain}</span>
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2">
          {/* Category & Tags */}
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            {categoryName && (
              <span className="font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {categoryName}
              </span>
            )}
            {tagNames.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="text-slate-400 dark:text-slate-400">
                #{tag}
              </span>
            ))}
            {tagNames.length > 3 && (
              <span className="text-slate-400 font-medium">+{tagNames.length - 3}</span>
            )}
          </div>

          {/* Quick Action Footer */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1">
              {(resource.code || resource.prompt || resource.sourceUrl || resource.videoUrl) && (
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Quick Copy"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(resource);
                }}
                className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                title="Edit Resource"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleDelete}
                className={`p-1.5 rounded transition-colors text-xs font-semibold ${
                  confirmDelete
                    ? 'bg-rose-500 text-white'
                    : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={confirmDelete ? 'Click again to confirm delete' : 'Delete'}
              >
                {confirmDelete ? 'Confirm?' : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
