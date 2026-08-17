import React, { useState } from 'react';
import { Layers, Plus, Edit2, Trash2, FolderKanban, ArrowRight } from 'lucide-react';
import type { Category, Resource, Tag } from '../types';
import { Modal } from '../components/common/Modal';
import { ResourceGrid } from '../components/resources/ResourceGrid';
import { storageService } from '../services/storageService';
import { useToast } from '../components/common/Toast';

interface CategoriesPageProps {
  categories: Category[];
  resources: Resource[];
  tags: Tag[];
  selectedCategoryId?: string;
  onSelectCategory: (id: string | undefined) => void;
  onRefreshData: () => void;
  onOpenResource: (resource: Resource) => void;
  onEditResource: (resource: Resource) => void;
  onDeleteResource: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenAddModal: () => void;
}

export function CategoriesPage({
  categories,
  resources,
  tags,
  selectedCategoryId,
  onSelectCategory,
  onRefreshData,
  onOpenResource,
  onEditResource,
  onDeleteResource,
  onToggleFavorite,
  onOpenAddModal,
}: CategoriesPageProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const toast = useToast();

  const activeCategory = selectedCategoryId
    ? categories.find((c) => c.id === selectedCategoryId)
    : null;

  const activeCategoryResources = selectedCategoryId
    ? resources.filter((r) => r.categoryId === selectedCategoryId)
    : resources;

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const catToSave: Category = {
      id: editingCategory ? editingCategory.id : `cat-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      icon: editingCategory ? editingCategory.icon : 'Layers',
      color: editingCategory ? editingCategory.color : 'indigo',
      createdAt: editingCategory ? editingCategory.createdAt : Date.now(),
    };

    await storageService.saveCategory(catToSave);
    toast.success(editingCategory ? 'Category updated' : 'Category created');
    setModalOpen(false);
    onRefreshData();
  };

  const handleDelete = async (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this category? Associated resources will be moved to Uncategorized.')) {
      await storageService.deleteCategory(catId);
      toast.info('Category deleted');
      if (selectedCategoryId === catId) {
        onSelectCategory(undefined);
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
              Categories
            </h1>
            {activeCategory && (
              <button
                onClick={() => onSelectCategory(undefined)}
                className="text-xs font-semibold text-indigo-500 hover:underline"
              >
                / View All Categories
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organize resources into structural design and engineering topics.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* Category Selection Cards */}
      {!selectedCategoryId && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const count = resources.filter((r) => r.categoryId === cat.id).length;
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group relative p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold">
                      <Layers className="w-5 h-5" />
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleOpenEditModal(cat, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(cat.id, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                    {cat.name}
                  </h3>

                  {cat.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-medium">{count} resources</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtered Category Resource Grid */}
      <div className="space-y-4">
        {activeCategory && (
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Category: {activeCategory.name}
              </h2>
              {activeCategory.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {activeCategory.description}
                </p>
              )}
            </div>
            <button
              onClick={() => onSelectCategory(undefined)}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm"
            >
              Show All
            </button>
          </div>
        )}

        <ResourceGrid
          resources={activeCategoryResources}
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

      {/* Category Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Category Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Systems"
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
              placeholder="Brief summary of resources in this category..."
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
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
