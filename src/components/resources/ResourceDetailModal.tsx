import React, { useState, useEffect } from 'react';
import {
  Star,
  Edit2,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  Layers,
  Tag as TagIcon,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Globe,
  Film,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { CodeViewer } from '../common/CodeViewer';
import { PromptViewer } from '../common/PromptViewer';
import { VideoEmbed } from '../common/VideoEmbed';
import type { Resource, Category, Tag } from '../../types';
import { useToast } from '../common/Toast';
import { TypePlaceholder } from './TypePlaceholder';
import { getFriendlyDomain } from '../../utils/urlUtils';

interface ResourceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource | null;
  category?: Category;
  tags?: Tag[];
  onEdit: (resource: Resource) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function ResourceDetailModal({
  isOpen,
  onClose,
  resource,
  category,
  tags = [],
  onEdit,
  onDelete,
  onToggleFavorite,
}: ResourceDetailModalProps) {
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mainImgLoading, setMainImgLoading] = useState(true);
  const [mainImgError, setMainImgError] = useState(false);
  const [copiedFeatures, setCopiedFeatures] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setActiveImageIdx(0);
    setMainImgLoading(true);
    setMainImgError(false);
  }, [resource?.id]);

  useEffect(() => {
    setMainImgLoading(true);
    setMainImgError(false);
  }, [activeImageIdx]);

  if (!resource) return null;

  const images = resource.images || [];
  const domain = getFriendlyDomain(resource.sourceUrl || resource.videoUrl);

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDelete(resource.id);
    toast.info('Resource deleted');
    onClose();
  };

  // Check if notes contains bulleted core functionalities from AI analysis
  const notesText = resource.notes || '';
  const isFunctionalitiesList = notesText.includes('•') || notesText.includes('Core Functionalities') || notesText.includes('Key Features:');
  const bulletLines = notesText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('•') || l.startsWith('-') || l.startsWith('*'))
    .map((l) => l.replace(/^[•\-*]\s*/, ''));

  const handleCopyFunctionalities = async () => {
    try {
      await navigator.clipboard.writeText(notesText);
      setCopiedFeatures(true);
      toast.success('Core functionalities copied to clipboard!');
      setTimeout(() => setCopiedFeatures(false), 2000);
    } catch {
      toast.error('Failed to copy.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="4xl">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
                {resource.type}
              </span>
              {category && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  {category.name}
                </span>
              )}
              {domain && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 font-mono">
                  <Globe className="w-3 h-3 text-slate-500" />
                  {domain}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {resource.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleFavorite(resource.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                resource.favorite
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Star className={`w-4 h-4 ${resource.favorite ? 'fill-current' : ''}`} />
              <span>{resource.favorite ? 'Favorited' : 'Favorite'}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(resource);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>

            <button
              onClick={handleDelete}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                confirmDelete
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{confirmDelete ? 'Confirm?' : 'Delete'}</span>
            </button>
          </div>
        </div>

        {/* Video Player (if present, prioritized at top) */}
        {resource.videoUrl && (
          <div className="space-y-2">
            <VideoEmbed url={resource.videoUrl} />
          </div>
        )}

        {/* Gallery / Image Display or Type-Aware Empty State Placeholder */}
        {images.length > 0 ? (
          <div className="space-y-3">
            <div className="relative aspect-video w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden shadow-lg flex items-center justify-center">
              {/* Image Loading Skeleton */}
              {mainImgLoading && !mainImgError && (
                <div className="absolute inset-0 bg-slate-900 animate-pulse flex flex-col items-center justify-center gap-2 text-slate-500">
                  <ImageIcon className="w-10 h-10 animate-bounce text-indigo-400/60" />
                  <span className="text-xs font-semibold">Loading Image...</span>
                </div>
              )}

              {/* Main Image or Error Fallback */}
              {!mainImgError ? (
                <img
                  src={images[activeImageIdx]?.dataUrl || images[activeImageIdx]?.url}
                  alt={resource.title}
                  loading="lazy"
                  onLoad={() => setMainImgLoading(false)}
                  onError={() => {
                    setMainImgLoading(false);
                    setMainImgError(true);
                  }}
                  className={`h-full w-full object-contain transition-opacity duration-300 ${
                    mainImgLoading ? 'opacity-0' : 'opacity-100'
                  }`}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-slate-400">
                  <div className="p-3 rounded-full bg-rose-500/10 text-rose-400">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-200">Unable to load image preview</p>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      The image URL may be protected, blocked by CORS, or unreachable.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setMainImgError(false);
                        setMainImgLoading(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry</span>
                    </button>
                    {images[activeImageIdx]?.url && (
                      <a
                        href={images[activeImageIdx].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Direct Image URL</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Counter Badge */}
              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 text-white text-[11px] font-bold backdrop-blur-md border border-slate-700/60 shadow-md flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{activeImageIdx + 1} / {images.length}</span>
              </span>

              {/* External Image Link Badge if URL */}
              {images[activeImageIdx]?.url && !mainImgError && (
                <a
                  href={images[activeImageIdx].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold backdrop-blur-md border border-slate-700 transition-all shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  <span>View Full Image</span>
                </a>
              )}

              {/* Carousel Controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIdx((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    className="absolute left-3 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-900 transition-colors"
                    title="Previous Image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveImageIdx((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    className="absolute right-3 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-900 transition-colors"
                    title="Next Image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Gallery Bar */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activeImageIdx
                        ? 'border-indigo-500 scale-105 shadow-md'
                        : 'border-slate-300 dark:border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.thumbnailDataUrl || img.dataUrl || img.url}
                      alt={`Thumbnail ${idx + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : !resource.videoUrl ? (
          <div className="relative aspect-[21/9] sm:aspect-video w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden shadow-lg flex items-center justify-center">
            <TypePlaceholder resource={resource} variant="modal" />
          </div>
        ) : null}

        {/* Description & Overview */}
        {resource.description && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Overview Description
            </h3>
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {resource.description}
            </p>
          </div>
        )}

        {/* AI Analyzed Core Functionalities & Features */}
        {isFunctionalitiesList && bulletLines.length > 0 ? (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/5 via-slate-900/40 to-purple-500/5 border border-indigo-500/30 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Core Functionalities & Key Capabilities
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCopyFunctionalities}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Copy functionalities"
              >
                {copiedFeatures ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFeatures ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              {bulletLines.map((line, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-white/70 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {line}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : resource.notes ? (
          /* Standard Notes Section if not formatted as bullets */
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Notes & Guidance
            </h3>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {resource.notes}
            </div>
          </div>
        ) : null}

        {/* Source URL Button */}
        {resource.sourceUrl && (
          <div>
            <a
              href={resource.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Website</span>
              <span className="text-[10px] text-indigo-200 font-normal truncate max-w-xs">
                ({resource.sourceUrl})
              </span>
            </a>
          </div>
        )}

        {/* Code Section */}
        {resource.code && resource.code.content && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Code Snippet
            </h3>
            <CodeViewer code={resource.code.content} language={resource.code.language} />
          </div>
        )}

        {/* Prompt Section */}
        {resource.prompt && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              AI System Prompt
            </h3>
            <PromptViewer prompt={resource.prompt} />
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <TagIcon className="w-3.5 h-3.5 text-slate-400" />
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Timestamps Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-6 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Added {new Date(resource.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {new Date(resource.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
