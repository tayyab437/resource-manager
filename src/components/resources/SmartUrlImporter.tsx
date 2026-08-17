import React, { useState } from 'react';
import {
  Sparkles,
  Link as LinkIcon,
  Loader2,
  Check,
  Plus,
  Image as ImageIcon,
  Film,
  Globe,
  X,
  ArrowRight,
} from 'lucide-react';
import { aiService, type WebsiteAnalysisResult } from '../../services/aiService';
import { storageService } from '../../services/storageService';
import { parseUrlInfo, isValidUrl } from '../../utils/urlUtils';
import type { Resource, MediaReference, ResourceType } from '../../types';
import { VideoEmbed } from '../common/VideoEmbed';
import { useToast } from '../common/Toast';

interface SmartUrlImporterProps {
  onResourceSaved?: () => void;
}

export function SmartUrlImporter({ onResourceSaved }: SmartUrlImporterProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewResult, setPreviewResult] = useState<WebsiteAnalysisResult | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const toast = useToast();

  const urlInfo = parseUrlInfo(inputUrl);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = inputUrl.trim();
    if (!url) return;

    if (!isValidUrl(url)) {
      toast.error('Please enter a valid HTTP or HTTPS URL.');
      return;
    }

    // Direct Image URL
    if (urlInfo.isImage) {
      toast.info('Image URL detected! Ready to save.');
      setCustomTitle('Image Asset');
      return;
    }

    // Direct Video URL
    if (urlInfo.isVideo) {
      toast.info('Video URL detected! Ready to save.');
      setCustomTitle(urlInfo.videoType === 'youtube' ? 'YouTube Video' : 'Video Resource');
      return;
    }

    // Website Link -> Run AI Analysis
    setIsAnalyzing(true);
    try {
      toast.info('AI is analyzing the website and extracting core functionalities...');
      const result = await aiService.analyzeWebsite(url);
      setPreviewResult(result);
      setCustomTitle(result.title);
      toast.success('Website analyzed! Review and save to vault.');
    } catch (err) {
      console.error('AI Analysis failed:', err);
      toast.error('Failed to analyze website link.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToVault = async () => {
    const url = inputUrl.trim();
    if (!url) return;

    let titleToSave = customTitle.trim() || previewResult?.title;
    let typeToSave: ResourceType = previewResult?.suggestedType || 'Website';
    let descriptionToSave = previewResult?.description;
    let notesToSave = '';
    let imagesToSave: MediaReference[] | undefined = undefined;
    let videoUrlVal: string | undefined = undefined;

    // Process Tags
    const tagNames = previewResult?.suggestedTags || [];
    const tagIds: string[] = [];
    for (const tagName of tagNames) {
      const tagObj = await storageService.findOrCreateTagByName(tagName);
      tagIds.push(tagObj.id);
    }

    if (urlInfo.isImage) {
      typeToSave = 'Screenshot';
      if (!titleToSave) titleToSave = 'Saved Image';
      imagesToSave = [
        {
          id: `img-direct-${Date.now()}`,
          url,
          thumbnailDataUrl: url,
          name: titleToSave,
          type: 'image/link',
        },
      ];
    } else if (urlInfo.isVideo) {
      typeToSave = 'Video';
      videoUrlVal = url;
      if (!titleToSave) titleToSave = 'Saved Video';
    } else {
      // Website
      if (!titleToSave) {
        titleToSave = url.replace(/^https?:\/\//, '').split('/')[0] || 'Web Resource';
      }
      if (previewResult?.coreFunctionalities && previewResult.coreFunctionalities.length > 0) {
        notesToSave = `Key Features & Core Functionalities:\n${previewResult.coreFunctionalities
          .map((f) => `• ${f}`)
          .join('\n')}`;
      }
      if (previewResult?.previewImage) {
        imagesToSave = [
          {
            id: `og-img-${Date.now()}`,
            url: previewResult.previewImage,
            thumbnailDataUrl: previewResult.previewImage,
            name: `${titleToSave} Preview`,
            type: 'image/link',
          },
        ];
      }
    }

    const newResource: Resource = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: titleToSave,
      type: typeToSave,
      tagIds,
      collectionIds: [],
      sourceUrl: url,
      videoUrl: videoUrlVal,
      images: imagesToSave,
      description: descriptionToSave,
      notes: notesToSave || undefined,
      favorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await storageService.saveResource(newResource);
    toast.success('Successfully saved to your Vault!');
    setInputUrl('');
    setPreviewResult(null);
    setCustomTitle('');
    if (onResourceSaved) {
      onResourceSaved();
    }
  };

  const handleReset = () => {
    setInputUrl('');
    setPreviewResult(null);
    setCustomTitle('');
  };

  return (
    <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/50 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 p-4 sm:p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
              Smart URL Importer & AI Analyzer
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paste image, video, or website links. AI analyzes core features & auto-saves to vault.
            </p>
          </div>
        </div>

        {inputUrl && (
          <button
            onClick={handleReset}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            title="Clear"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="url"
            value={inputUrl}
            onChange={(e) => {
              setInputUrl(e.target.value);
              setPreviewResult(null);
            }}
            placeholder="Paste URL (e.g. https://tailwindcss.com, YouTube, direct .png/.mp4)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={isAnalyzing || !inputUrl.trim()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all shrink-0 cursor-pointer"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Analyze & Preview</span>
            </>
          )}
        </button>
      </form>

      {/* Render Image Preview */}
      {urlInfo.isImage && (
        <div className="p-4 rounded-xl border border-blue-500/30 bg-white dark:bg-slate-950 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
              <ImageIcon className="w-4 h-4" />
              <span>Image URL Rendered:</span>
            </div>
            <button
              onClick={handleSaveToVault}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Image to Vault</span>
            </button>
          </div>

          <div className="relative aspect-video max-h-56 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 flex items-center justify-center">
            <img
              src={inputUrl}
              alt="Image Preview"
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
              }}
            />
          </div>
        </div>
      )}

      {/* Render Video Preview */}
      {urlInfo.isVideo && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-white dark:bg-slate-950 space-y-3 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
              <Film className="w-4 h-4" />
              <span>Video Link Rendered:</span>
            </div>
            <button
              onClick={handleSaveToVault}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Video to Vault</span>
            </button>
          </div>

          <VideoEmbed url={inputUrl} />
        </div>
      )}

      {/* Render AI Website Analysis Result */}
      {previewResult && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-white dark:bg-slate-950 shadow-md space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {previewResult.suggestedType}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {previewResult.title}
              </span>
            </div>

            <button
              onClick={handleSaveToVault}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Save to Vault with Link</span>
            </button>
          </div>

          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {previewResult.description}
          </p>

          {/* Core Functionalities */}
          {previewResult.coreFunctionalities.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Core Functionalities:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {previewResult.coreFunctionalities.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-1.5 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300"
                  >
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {previewResult.suggestedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {previewResult.suggestedTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
