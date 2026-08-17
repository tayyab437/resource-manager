import React, { useState } from 'react';
import { Tag as TagIcon, Plus, Edit2, Trash2, ArrowRight } from 'lucide-react';
import type { Tag, Resource, Category } from '../types';
import { Modal } from '../components/common/Modal';
import { ResourceGrid } from '../components/resources/ResourceGrid';
import { storageService } from '../services/storageService';
import { useToast } from '../components/common/Toast';

interface TagsPageProps {
  tags: Tag[];
  resources: Resource[];
  categories: Category[];
  selectedTagId?: string;
  onSelectTag: (id: string | undefined) => void;
  onRefreshData: () => void;
  onOpenResource: (resource: Resource) => void;
  onEditResource: (resource: Resource) => void;
  onDeleteResource: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenAddModal: () => void;
}

export function TagsPage({
  tags,
  resources,
  categories,
  selectedTagId,
  onSelectTag,
  onRefreshData,
  onOpenResource,
  onEditResource,
  onDeleteResource,
  onToggleFavorite,
  onOpenAddModal,
}: TagsPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState('');
  const toast = useToast();

  const activeTag = selectedTagId ? tags.find((t) => t.id === selectedTagId) : null;

  const activeTagResources = selectedTagId
    ? resources.filter((r) => r.tagIds && r.tagIds.includes(selectedTagId))
    : resources;

  const handleOpenCreate = () => {
    setEditingTag(null);
    setTagName('');
    setModalOpen(true);
  };

  const handleOpenEdit = (tag: Tag, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTag(tag);
    setTagName(tag.name);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    const cleanName = tagName.trim().toLowerCase().replace(/^#/, '');

    if (editingTag) {
      await storageService.saveTag({ ...editingTag, name: cleanName });
      toast.success('Tag updated');
    } else {
      await storageService.findOrCreateTagByName(cleanName);
      toast.success('Tag created');
    }

    setModalOpen(false);
    onRefreshData();
  };

  const handleDelete = async (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this tag? It will be removed from all associated resources.')) {
      await storageService.deleteTag(tagId);
      toast.info('Tag deleted');
      if (selectedTagId === tagId) {
        onSelectTag(undefined);
      }
      onRefreshData();
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Tags
            </h1>
            {activeTag && (
              <button
                onClick={() => onSelectTag(undefined)}
                className="text-xs font-semibold text-indigo-500 hover:underline"
              >
                / View All Tags
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Flexible keyword tags across categories.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Tag</span>
        </button>
      </div>

      {/* Tags Pills Cloud */}
      {!selectedTagId && (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => {
            const count = resources.filter((r) => r.tagIds && r.tagIds.includes(tag.id)).length;
            return (
              <div
                key={tag.id}
                onClick={() => onSelectTag(tag.id)}
                className="group flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-indigo-500 transition-all cursor-pointer"
              >
                <TagIcon className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-500">
                  #{tag.name}
                </span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                  {count}
                </span>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  <button
                    onClick={(e) => handleOpenEdit(tag, e)}
                    className="p-1 hover:text-indigo-500"
                    title="Rename Tag"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(tag.id, e)}
                    className="p-1 hover:text-rose-500"
                    title="Delete Tag"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtered Resources Grid */}
      <div className="space-y-4">
        {activeTag && (
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Tag: #{activeTag.name}
            </h2>
            <button
              onClick={() => onSelectTag(undefined)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm"
            >
              Clear Tag Filter
            </button>
          </div>
        )}

        <ResourceGrid
          resources={activeTagResources}
          categories={categories}
          tags={tags}
          emptyType="all"
          onOpen={onOpenResource}
          onEdit={onEditResource}
          onDelete={onDeleteResource}
          onToggleFavorite={onToggleFavorite}
          onOpenAddModal={onOpenAddModal}
        />
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTag ? 'Rename Tag' : 'Create Tag'}
        maxWidth="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Tag Name
            </label>
            <input
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="e.g. tailwind"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
            >
              Save Tag
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
