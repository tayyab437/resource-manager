import React, { useRef, useState } from 'react';
import { Upload, X, Link as LinkIcon, Plus } from 'lucide-react';
import type { MediaReference } from '../../types';
import { generateThumbnail } from '../../utils/imageUtils';

interface ImageUploadProps {
  images: MediaReference[];
  onChange: (images: MediaReference[]) => void;
  maxFiles?: number;
}

export function ImageUpload({ images, onChange, maxFiles = 5 }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'));

    if (fileArray.length === 0) return;

    fileArray.forEach((file) => {
      if (images.length >= maxFiles) return;

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          const thumbnailDataUrl = await generateThumbnail(dataUrl, 380);
          const newMedia: MediaReference = {
            id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            dataUrl,
            thumbnailDataUrl,
            name: file.name,
            type: file.type,
          };
          onChange([...images, newMedia]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = imageUrlInput.trim();
    if (!url) return;

    if (images.length >= maxFiles) return;

    const thumbnailDataUrl = await generateThumbnail(url, 380);

    const newMedia: MediaReference = {
      id: `img-url-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url,
      thumbnailDataUrl,
      name: 'Image Link',
      type: 'image/link',
    };

    onChange([...images, newMedia]);
    setImageUrlInput('');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  return (
    <div className="space-y-3">
      {/* Existing Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img) => {
            const imgSrc = img.thumbnailDataUrl || img.dataUrl || img.url;
            return (
              <div
                key={img.id}
                className="group relative aspect-video rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 overflow-hidden shadow-sm"
              >
                <img
                  src={imgSrc}
                  alt={img.name || 'Preview'}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    // Fallback visual if image link is invalid/broken
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                  }}
                />

                {/* Source Badge */}
                <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-950/80 text-slate-200 backdrop-blur-sm flex items-center gap-1 border border-slate-700/50">
                  {img.url ? <LinkIcon className="w-2.5 h-2.5 text-cyan-400" /> : <Upload className="w-2.5 h-2.5 text-emerald-400" />}
                  {img.url ? 'Link' : 'Upload'}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemove(img.id)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-950/80 text-white hover:bg-rose-600 transition-colors shadow-md"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs / Control for adding files or URL links */}
      {images.length < maxFiles && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700/60 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload File</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'link'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Image URL Link</span>
            </button>

            <span className="ml-auto text-[11px] text-slate-400 font-medium">
              {images.length}/{maxFiles} attached
            </span>
          </div>

          {activeTab === 'upload' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-500/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) processFiles(e.target.files);
                }}
              />

              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="p-2 rounded-full bg-indigo-500/10 text-indigo-500">
                  <Upload className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Drop image files here or <span className="text-indigo-500 underline">Browse</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  PNG, JPG, SVG, WebP up to {maxFiles} images
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddImageUrl} className="flex gap-2 items-center">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/... or direct image link"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={!imageUrlInput.trim()}
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Link</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
