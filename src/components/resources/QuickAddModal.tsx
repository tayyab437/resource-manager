import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Zap, Plus, Sparkles, Loader2, Globe, Film, Image as ImageIcon, Check } from 'lucide-react';
import type { ResourceType, Resource, MediaReference } from '../../types';
import { storageService } from '../../services/storageService';
import { aiService, type WebsiteAnalysisResult } from '../../services/aiService';
import { parseUrlInfo, isValidUrl } from '../../utils/urlUtils';
import { VideoEmbed } from '../common/VideoEmbed';
import { useToast } from '../common/Toast';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function QuickAddModal({ isOpen, onClose, onSaved }: QuickAddModalProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ResourceType>('Component');
  const [urlOrContent, setUrlOrContent] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<WebsiteAnalysisResult | null>(null);
  const toast = useToast();

  const content = urlOrContent.trim();
  const urlInfo = parseUrlInfo(content);

  // Trigger AI Website Analysis
  const handleAnalyzeWebsite = async () => {
    if (!urlInfo.isUrl || !content) {
      toast.error('Please enter a valid website URL to analyze.');
      return;
    }

    setIsAnalyzing(true);
    try {
      toast.info('AI is analyzing website and extracting core functionalities...');
      const result = await aiService.analyzeWebsite(content);
      setAiAnalysisResult(result);
      if (result.title) setTitle(result.title);
      if (result.suggestedType) setType(result.suggestedType);
      if (result.suggestedTags && result.suggestedTags.length > 0) {
        setTagsText(result.suggestedTags.join(', '));
      }
      toast.success('Website analyzed! Description and functionalities extracted.');
    } catch (err) {
      console.error('AI Analysis failed:', err);
      toast.error('Could not analyze website link.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalTitle = title.trim();
    let finalType = type;
    let descriptionText = '';
    let notesText = '';
    let imagesToSave: MediaReference[] | undefined = undefined;

    // If website link is pasted and not analyzed yet, analyze automatically
    if (urlInfo.isWebsite && !aiAnalysisResult && !finalTitle) {
      setIsAnalyzing(true);
      try {
        const result = await aiService.analyzeWebsite(content);
        finalTitle = result.title;
        finalType = result.suggestedType || 'Website';
        descriptionText = result.description;
        if (result.coreFunctionalities && result.coreFunctionalities.length > 0) {
          notesText = `Key Features & Core Functionalities:\n${result.coreFunctionalities
            .map((f) => `• ${f}`)
            .join('\n')}`;
        }
        if (result.previewImage) {
          imagesToSave = [
            {
              id: `og-img-${Date.now()}`,
              url: result.previewImage,
              thumbnailDataUrl: result.previewImage,
              name: `${result.title} Preview`,
              type: 'image/link',
            },
          ];
        }
        if (result.suggestedTags && !tagsText) {
          setTagsText(result.suggestedTags.join(', '));
        }
      } catch (err) {
        console.warn('Auto analysis error:', err);
      } finally {
        setIsAnalyzing(false);
      }
    } else if (aiAnalysisResult) {
      descriptionText = aiAnalysisResult.description;
      if (aiAnalysisResult.coreFunctionalities && aiAnalysisResult.coreFunctionalities.length > 0) {
        notesText = `Key Features & Core Functionalities:\n${aiAnalysisResult.coreFunctionalities
          .map((f) => `• ${f}`)
          .join('\n')}`;
      }
      if (aiAnalysisResult.previewImage) {
        imagesToSave = [
          {
            id: `og-img-${Date.now()}`,
            url: aiAnalysisResult.previewImage,
            thumbnailDataUrl: aiAnalysisResult.previewImage,
            name: `${aiAnalysisResult.title} Preview`,
            type: 'image/link',
          },
        ];
      }
    }

    if (!finalTitle) {
      if (urlInfo.isUrl) {
        finalTitle = urlInfo.cleanUrl?.replace(/^https?:\/\//, '').split('/')[0] || 'Web Resource';
      } else {
        toast.error('Title is required for quick add.');
        return;
      }
    }

    // Process tags
    const tagNames = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const tagIds: string[] = [];
    for (const name of tagNames) {
      const tagObj = await storageService.findOrCreateTagByName(name);
      tagIds.push(tagObj.id);
    }

    // Handle Image URL
    if (urlInfo.isImage && !imagesToSave) {
      imagesToSave = [
        {
          id: `img-quick-${Date.now()}`,
          url: content,
          thumbnailDataUrl: content,
          name: finalTitle,
          type: 'image/link',
        },
      ];
      if (finalType === 'Component') finalType = 'Screenshot';
    }

    // Handle Video URL
    let videoUrlVal: string | undefined = undefined;
    if (urlInfo.isVideo) {
      videoUrlVal = content;
      finalType = 'Video';
    }

    const newResource: Resource = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: finalTitle,
      type: finalType,
      tagIds,
      collectionIds: [],
      sourceUrl: urlInfo.isUrl ? content : undefined,
      videoUrl: videoUrlVal,
      images: imagesToSave,
      description: descriptionText || undefined,
      code: !urlInfo.isUrl && (finalType === 'Code' || finalType === 'Component') ? { language: 'tsx', content } : undefined,
      prompt: !urlInfo.isUrl && finalType === 'Prompt' ? content : undefined,
      notes: notesText || (!urlInfo.isUrl && !['Code', 'Component', 'Prompt'].includes(finalType) ? content : undefined),
      favorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await storageService.saveResource(newResource);
    toast.success('Saved to Vault!');
    setTitle('');
    setUrlOrContent('');
    setTagsText('');
    setAiAnalysisResult(null);
    onSaved();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Quick Add Resource</h2>
            <p className="text-xs text-slate-500">
              Paste any URL (image, video, website) or code snippet to capture
            </p>
          </div>
        </div>

        {/* URL or Content Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              URL / Code / Prompt / Content
            </label>
            {urlInfo.isWebsite && (
              <button
                type="button"
                onClick={handleAnalyzeWebsite}
                disabled={isAnalyzing}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 fill-current" />
                    <span>✨ AI Analyze Website</span>
                  </>
                )}
              </button>
            )}
          </div>
          <textarea
            value={urlOrContent}
            onChange={(e) => {
              setUrlOrContent(e.target.value);
              setAiAnalysisResult(null);
            }}
            rows={3}
            placeholder="Paste website link (e.g. https://tailwindcss.com), image URL, video URL, or code..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            autoFocus
          />
        </div>

        {/* Live Detected Media Preview */}
        {urlInfo.isImage && (
          <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-500">
              <ImageIcon className="w-4 h-4" />
              <span>Image URL Detected & Rendered:</span>
            </div>
            <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center">
              <img
                src={content}
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

        {urlInfo.isVideo && (
          <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-500">
              <Film className="w-4 h-4" />
              <span>Video Player Preview:</span>
            </div>
            <VideoEmbed url={content} />
          </div>
        )}

        {/* AI Analysis Preview Card */}
        {aiAnalysisResult && (
          <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-amber-500">
              <Sparkles className="w-4 h-4" />
              <span>AI Analysis Result</span>
            </div>
            <p className="text-slate-800 dark:text-slate-200 font-medium">
              {aiAnalysisResult.description}
            </p>
            {aiAnalysisResult.coreFunctionalities.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-amber-500/20 text-[11px] text-slate-700 dark:text-slate-300">
                <span className="font-bold text-amber-600 dark:text-amber-400">Core Functionalities:</span>
                <ul className="list-disc pl-4 space-y-0.5">
                  {aiAnalysisResult.coreFunctionalities.slice(0, 3).map((feat, i) => (
                    <li key={i}>{feat}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Title {urlInfo.isWebsite && <span className="text-slate-400 font-normal">(Auto-generated by AI if left blank)</span>}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={urlInfo.isWebsite ? 'Auto-extracted title or custom name...' : 'e.g. Clean Navbar Component'}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ResourceType)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            >
              <option value="Component">Component</option>
              <option value="Website">Website</option>
              <option value="Screenshot">Screenshot</option>
              <option value="Video">Video</option>
              <option value="Code">Code</option>
              <option value="Prompt">Prompt</option>
              <option value="Inspiration">Inspiration</option>
              <option value="Template">Template</option>
              <option value="Tutorial">Tutorial</option>
              <option value="Idea">Idea</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="react, tailwind, ui"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Analyzing & Saving...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Save to Vault</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
