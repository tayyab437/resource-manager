import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { ImageUpload } from '../common/ImageUpload';
import { VideoEmbed } from '../common/VideoEmbed';
import type { Resource, ResourceType, Category, Tag, MediaReference } from '../../types';
import {
  Plus,
  X,
  Star,
  Code2,
  Sparkles,
  Video,
  Globe,
  FileText,
  Tag as TagIcon,
  Loader2,
  Check,
  CheckCircle2,
  ExternalLink,
  Film,
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { aiService, type WebsiteAnalysisResult } from '../../services/aiService';
import { parseUrlInfo, isImageUrl, isVideoUrl, isValidUrl } from '../../utils/urlUtils';
import { useToast } from '../common/Toast';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialResource?: Resource | null;
  categories: Category[];
  tags: Tag[];
  onSaved: () => void;
}

const RESOURCE_TYPES: ResourceType[] = [
  'Component',
  'Screenshot',
  'Code',
  'Prompt',
  'Video',
  'Website',
  'Tutorial',
  'Inspiration',
  'Animation',
  'Template',
  'Idea',
  'Other',
];

const CODE_LANGUAGES = [
  'tsx',
  'jsx',
  'typescript',
  'javascript',
  'html',
  'css',
  'python',
  'json',
  'shell',
  'other',
];

export function AddResourceModal({
  isOpen,
  onClose,
  initialResource,
  categories,
  tags: availableTags,
  onSaved,
}: AddResourceModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ResourceType>('Component');
  const [categoryId, setCategoryId] = useState<string>('');
  const [tagInput, setTagInput] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [images, setImages] = useState<MediaReference[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [codeLang, setCodeLang] = useState('tsx');
  const [codeContent, setCodeContent] = useState('');
  const [prompt, setPrompt] = useState('');
  const [notes, setNotes] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);

  const toast = useToast();

  useEffect(() => {
    if (initialResource) {
      setTitle(initialResource.title);
      setDescription(initialResource.description || '');
      setType(initialResource.type);
      setCategoryId(initialResource.categoryId || '');
      setSelectedTagIds(initialResource.tagIds || []);
      setImages(initialResource.images || []);
      setVideoUrl(initialResource.videoUrl || '');
      setSourceUrl(initialResource.sourceUrl || '');
      setCodeLang(initialResource.code?.language || 'tsx');
      setCodeContent(initialResource.code?.content || '');
      setPrompt(initialResource.prompt || '');
      setNotes(initialResource.notes || '');
      setFavorite(initialResource.favorite);
      setAnalysisDone(false);
    } else {
      // Reset defaults
      setTitle('');
      setDescription('');
      setType('Component');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setSelectedTagIds([]);
      setImages([]);
      setVideoUrl('');
      setSourceUrl('');
      setCodeLang('tsx');
      setCodeContent('');
      setPrompt('');
      setNotes('');
      setFavorite(false);
      setAnalysisDone(false);
    }
  }, [initialResource, isOpen, categories]);

  // Handle URL change detection (image / video / website)
  const handleSourceUrlChange = (val: string) => {
    setSourceUrl(val);
    const trimmed = val.trim();

    if (!trimmed || !isValidUrl(trimmed)) return;

    const info = parseUrlInfo(trimmed);

    // If it's an image URL, automatically attach as media preview
    if (info.isImage) {
      const alreadyAttached = images.some((img) => img.url === trimmed);
      if (!alreadyAttached) {
        const newImg: MediaReference = {
          id: `img-url-${Date.now()}`,
          url: trimmed,
          thumbnailDataUrl: trimmed,
          name: title || 'Image Resource',
          type: 'image/link',
        };
        setImages((prev) => [...prev, newImg]);
        if (type === 'Component' || type === 'Other') {
          setType('Screenshot');
        }
        toast.info('Image URL detected & attached as preview!');
      }
    } else if (info.isVideo) {
      // If it's a video URL, automatically set videoUrl and type
      setVideoUrl(trimmed);
      setType('Video');
      toast.info('Video URL detected!');
    }
  };

  // AI Website Analysis Trigger
  const handleAnalyzeWebsite = async () => {
    const urlToAnalyze = sourceUrl.trim();
    if (!urlToAnalyze) {
      toast.error('Please enter a website URL to analyze.');
      return;
    }

    if (!isValidUrl(urlToAnalyze)) {
      toast.error('Please enter a valid HTTP or HTTPS website URL.');
      return;
    }

    setIsAnalyzing(true);
    try {
      toast.info('AI is analyzing website and extracting core functionalities...');
      const result: WebsiteAnalysisResult = await aiService.analyzeWebsite(urlToAnalyze);

      if (result.title && (!title || title.trim() === '')) {
        setTitle(result.title);
      }

      if (result.description) {
        setDescription(result.description);
      }

      if (result.suggestedType) {
        setType(result.suggestedType);
      }

      // Format core functionalities in notes
      if (result.coreFunctionalities && result.coreFunctionalities.length > 0) {
        const funcsFormatted = `Key Features & Core Functionalities:\n${result.coreFunctionalities
          .map((f) => `• ${f}`)
          .join('\n')}`;
        setNotes(funcsFormatted);
      }

      // Add suggested tags
      if (result.suggestedTags && result.suggestedTags.length > 0) {
        const newTagIds = [...selectedTagIds];
        for (const tagName of result.suggestedTags) {
          const tagObj = await storageService.findOrCreateTagByName(tagName);
          if (!newTagIds.includes(tagObj.id)) {
            newTagIds.push(tagObj.id);
          }
        }
        setSelectedTagIds(newTagIds);
      }

      // Attach OpenGraph preview image if found
      if (result.previewImage && images.length === 0) {
        const previewMedia: MediaReference = {
          id: `og-img-${Date.now()}`,
          url: result.previewImage,
          thumbnailDataUrl: result.previewImage,
          name: `${result.title} Preview`,
          type: 'image/link',
        };
        setImages([previewMedia]);
      }

      setAnalysisDone(true);
      toast.success('Website analyzed! Core functionalities & description populated.');
    } catch (err) {
      console.error('AI analysis error:', err);
      toast.error('Could not complete website analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddTag = async (rawName: string) => {
    if (!rawName.trim()) return;
    const createdTag = await storageService.findOrCreateTagByName(rawName);
    if (!selectedTagIds.includes(createdTag.id)) {
      setSelectedTagIds((prev) => [...prev, createdTag.id]);
    }
    setTagInput('');
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a title for the resource.');
      return;
    }

    // Process any remaining tag input
    let finalTagIds = [...selectedTagIds];
    if (tagInput.trim()) {
      const tagObj = await storageService.findOrCreateTagByName(tagInput);
      if (!finalTagIds.includes(tagObj.id)) {
        finalTagIds.push(tagObj.id);
      }
    }

    const newResource: Resource = {
      id: initialResource ? initialResource.id : `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      categoryId: categoryId || undefined,
      tagIds: finalTagIds,
      collectionIds: initialResource?.collectionIds || [],
      images: images.length > 0 ? images : undefined,
      videoUrl: videoUrl.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
      code: codeContent.trim() ? { language: codeLang, content: codeContent } : undefined,
      prompt: prompt.trim() || undefined,
      notes: notes.trim() || undefined,
      favorite,
      createdAt: initialResource ? initialResource.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    await storageService.saveResource(newResource);
    toast.success(initialResource ? 'Resource updated!' : 'Resource saved to vault!');
    onSaved();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialResource ? 'Edit Resource' : 'Add New Resource'}
      subtitle="Save components, prompts, code, videos, and inspiration to your local vault."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Source URL & AI Analysis Section */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Source URL (Website, Image, or Video Link)
              </label>
            </div>
            {analysisDone && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Check className="w-3 h-3" />
                AI Analyzed
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => handleSourceUrlChange(e.target.value)}
              placeholder="https://example.com, https://youtube.com/watch?v=..., or direct image/video URL"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              type="button"
              onClick={handleAnalyzeWebsite}
              disabled={isAnalyzing || !sourceUrl.trim()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 fill-current text-slate-950" />
                  <span>✨ AI Auto-Analyze</span>
                </>
              )}
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Paste a link and click <strong className="text-slate-700 dark:text-slate-300">AI Auto-Analyze</strong> to extract the website's description, core functionalities, tags, and preview image!
          </p>
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Glassmorphic Metric Card Component"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="w-full sm:w-48">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Resource Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Short Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief summary of why this resource is useful..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Input */}
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tags (press Enter to add)
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 min-h-[42px]">
                {selectedTagIds.map((id) => {
                  const tagObj = availableTags.find((t) => t.id === id);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                    >
                      #{tagObj?.name || id}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(id)}
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder={selectedTagIds.length === 0 ? 'e.g. react, tailwind' : ''}
                  className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none px-1 py-0.5 min-w-[80px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Media & Links */}
        <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Screenshots & Images (Upload File or Image URL Link)
          </label>
          <ImageUpload images={images} onChange={setImages} />

          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Video URL (YouTube / Vimeo / Loom / Direct MP4)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  if (e.target.value.trim() && type !== 'Video') {
                    setType('Video');
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=..., Vimeo, Loom, or direct .mp4 link"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Video Player Live Preview */}
            {videoUrl.trim() && (
              <div className="mt-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Video Preview:
                </p>
                <VideoEmbed url={videoUrl} />
              </div>
            )}
          </div>
        </div>

        {/* AI Core Functionalities & Notes Section */}
        <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Core Functionalities, Features & Notes
            </label>
            <span className="text-[10px] text-slate-400">
              Auto-filled by AI when analyzing website
            </span>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Key features, implementation notes, or core functionalities..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono leading-relaxed"
          />
        </div>

        {/* Code Snippet Section */}
        <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-500" />
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Code Snippet (Optional)
              </label>
            </div>
            <select
              value={codeLang}
              onChange={(e) => setCodeLang(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            >
              {CODE_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={codeContent}
            onChange={(e) => setCodeContent(e.target.value)}
            rows={4}
            placeholder="Paste component or utility code here..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* AI Prompt Section */}
        <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              AI Prompt (Optional)
            </label>
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder="Paste prompt used to generate this resource..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-900 text-amber-200 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Favorite & Submit Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setFavorite(!favorite)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              favorite
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Star className={`w-4 h-4 ${favorite ? 'fill-current' : ''}`} />
            <span>{favorite ? 'Starred as Favorite' : 'Mark as Favorite'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{initialResource ? 'Save Changes' : 'Add Resource'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
