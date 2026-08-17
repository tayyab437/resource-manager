import React, { useState } from 'react';
import { FolderHeart, Plus, Edit2, Trash2, ArrowRight } from 'lucide-react';
import type { Collection, Resource, Category, Tag } from '../types';
import { Modal } from '../components/common/Modal';
import { ResourceGrid } from '../components/resources/ResourceGrid';
import { storageService } from '../services/storageService';
import { useToast } from '../components/common/Toast';

interface CollectionsPageProps {
  collections: Collection[];
  resources: Resource[];
  categories: Category[];
  tags: Tag[];
  selectedCollectionId?: string;
  onSelectCollection: (id: string | undefined) => void;
  onRefreshData: () => void;
  onOpenResource: (resource: Resource) => void;
  onEditResource: (resource: Resource) => void;
  onDeleteResource: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenAddModal: () => void;
}

export function CollectionsPage({
  collections,
  resources,
  categories,
  tags,
  selectedCollectionId,
  onSelectCollection,
  onRefreshData,
  onOpenResource,
  onEditResource,
  onDeleteResource,
  onToggleFavorite,
  onOpenAddModal,
}: CollectionsPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<Collection | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const toast = useToast();

  const activeCollection = selectedCollectionId
    ? collections.find((c) => c.id === selectedCollectionId)
    : null;

  const activeCollectionResources = selectedCollectionId
    ? resources.filter((r) => r.collectionIds && r.collectionIds.includes(selectedCollectionId))
    : resources;

  const handleOpenCreate = () => {
    setEditingCol(null);
    setName('');
    setDescription('');
    setModalOpen(true);
  };

  const handleOpenEdit = (col: Collection, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCol(col);
    setName(col.name);
    setDescription(col.description || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const record: Collection = {
      id: editingCol ? editingCol.id : `col-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      resourceIds: editingCol ? editingCol.resourceIds : [],
      createdAt: editingCol ? editingCol.createdAt : Date.now(),
      updatedAt: Date.now(),
    };

    await storageService.saveCollection(record);
    toast.success(editingCol ? 'Collection updated' : 'Collection created');
    setModalOpen(false);
    onRefreshData();
  };

  const handleDelete = async (colId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this collection? Resources will remain in your vault.')) {
      await storageService.deleteCollection(colId);
      toast.info('Collection deleted');
      if (selectedCollectionId === colId) {
        onSelectCollection(undefined);
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
              Collections
            </h1>
            {activeCollection && (
              <button
                onClick={() => onSelectCollection(undefined)}
                className="text-xs font-semibold text-indigo-500 hover:underline"
              >
                / View All Collections
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Group components, prompts, and tutorials by project goals.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Collection Cards */}
      {!selectedCollectionId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => {
            const count = resources.filter(
              (r) => r.collectionIds && r.collectionIds.includes(col.id)
            ).length;

            return (
              <div
                key={col.id}
                onClick={() => onSelectCollection(col.id)}
                className="group relative p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:border-violet-500/50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500 font-bold">
                      <FolderHeart className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleOpenEdit(col, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Collection"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(col.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete Collection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-violet-500 transition-colors">
                    {col.name}
                  </h3>

                  {col.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {col.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">{count} grouped items</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtered Collection Grid */}
      <div className="space-y-4">
        {activeCollection && (
          <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Collection: {activeCollection.name}
              </h2>
              {activeCollection.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeCollection.description}
                </p>
              )}
            </div>
            <button
              onClick={() => onSelectCollection(undefined)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm"
            >
              Show All Collections
            </button>
          </div>
        )}

        <ResourceGrid
          resources={activeCollectionResources}
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
        title={editingCol ? 'Edit Collection' : 'Create Collection'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Collection Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Portfolio Website Ideas"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Why did you group these resources together..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all"
            >
              Save Collection
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
