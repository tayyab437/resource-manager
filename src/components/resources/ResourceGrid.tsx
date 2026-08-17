import React from 'react';
import { ResourceCard } from './ResourceCard';
import type { Resource, Category, Tag } from '../../types';
import { FolderKanban, Star, Search, Plus } from 'lucide-react';

interface ResourceGridProps {
  resources: Resource[];
  categories: Category[];
  tags: Tag[];
  emptyType?: 'all' | 'favorites' | 'search' | 'category' | 'tag' | 'collection';
  onOpen: (resource: Resource) => void;
  onEdit: (resource: Resource) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenAddModal: () => void;
}

export function ResourceGrid({
  resources,
  categories,
  tags,
  emptyType = 'all',
  onOpen,
  onEdit,
  onDelete,
  onToggleFavorite,
  onOpenAddModal,
}: ResourceGridProps) {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const tagMap = new Map(tags.map((t) => [t.id, t.name]));

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 my-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-center">
        {emptyType === 'favorites' ? (
          <>
            <div className="p-4 rounded-full bg-amber-500/10 text-amber-500 mb-3">
              <Star className="w-8 h-8 fill-current" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No favorites yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Star useful UI components, snippets, and prompts to access them quickly.
            </p>
          </>
        ) : emptyType === 'search' ? (
          <>
            <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-500 mb-3">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No resources found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Try adjusting your search terms or clearing some filters.
            </p>
          </>
        ) : (
          <>
            <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-500 mb-3">
              <FolderKanban className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your vault is empty</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Start saving components, prompts, code snippets, and inspiration in one local space.
            </p>
            <button
              onClick={onOpenAddModal}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Resource</span>
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {resources.map((res) => (
        <ResourceCard
          key={res.id}
          resource={res}
          categoryName={res.categoryId ? catMap.get(res.categoryId) : undefined}
          tagNames={(res.tagIds || []).map((tid) => tagMap.get(tid) || tid)}
          onOpen={onOpen}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}
