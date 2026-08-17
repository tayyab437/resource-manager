import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Star,
  Plus,
  Layers,
  Tag as TagIcon,
  FolderHeart,
  X,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import type { Resource, ResourceType, Category, Tag, Collection, FilterState, SortOption } from '../types';
import { ResourceGrid } from '../components/resources/ResourceGrid';

interface AllResourcesPageProps {
  resources: Resource[];
  categories: Category[];
  tags: Tag[];
  collections: Collection[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onOpenResource: (resource: Resource) => void;
  onEditResource: (resource: Resource) => void;
  onDeleteResource: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenAddModal: () => void;
}

const RESOURCE_TYPES: (ResourceType | 'All')[] = [
  'All',
  'Component',
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

export function AllResourcesPage({
  resources,
  categories,
  tags,
  collections,
  filters,
  setFilters,
  onOpenResource,
  onEditResource,
  onDeleteResource,
  onToggleFavorite,
  onOpenAddModal,
}: AllResourcesPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(12);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const totalItems = resources.length;
  const isShowAll = pageSize === 0;
  const totalPages = isShowAll ? 1 : Math.ceil(totalItems / pageSize) || 1;
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  const startIndex = isShowAll ? 0 : (safePage - 1) * pageSize;
  const endIndex = isShowAll ? totalItems : Math.min(startIndex + pageSize, totalItems);
  const pagedResources = resources.slice(startIndex, endIndex);

  const handleTypeChange = (type: ResourceType | 'All') => {
    setFilters((prev) => ({ ...prev, type }));
  };

  const handleCategoryChange = (categoryId: string) => {
    setFilters((prev) => ({ ...prev, categoryId }));
  };

  const handleTagChange = (tagId: string) => {
    setFilters((prev) => ({ ...prev, tagId }));
  };

  const handleSortChange = (sortBy: SortOption) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  };

  const handleToggleFavoritesOnly = () => {
    setFilters((prev) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }));
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: '',
      type: 'All',
      categoryId: 'All',
      tagId: 'All',
      collectionId: 'All',
      favoritesOnly: false,
      sortBy: 'recently_added',
    });
  };

  const hasActiveFilters =
    filters.searchQuery ||
    filters.type !== 'All' ||
    filters.categoryId !== 'All' ||
    filters.tagId !== 'All' ||
    filters.collectionId !== 'All' ||
    filters.favoritesOnly;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            All Resources ({resources.length})
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Browse and filter your saved component library with paginated cache loading.
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Resource</span>
        </button>
      </div>

      {/* Resource Types Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {RESOURCE_TYPES.map((t) => {
          const isActive = filters.type === t;
          return (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {t === 'All' ? 'All Types' : t}
            </button>
          );
        })}
      </div>

      {/* Filter & Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={filters.categoryId}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Tag Dropdown */}
          <select
            value={filters.tagId}
            onChange={(e) => handleTagChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="All">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id}>
                #{t.name}
              </option>
            ))}
          </select>

          {/* Favorites Only Button */}
          <button
            onClick={handleToggleFavoritesOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filters.favoritesOnly
                ? 'bg-amber-500 text-white'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${filters.favoritesOnly ? 'fill-current' : ''}`} />
            <span>Favorites</span>
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Sort By Dropdown */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filters.sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="recently_added">Recently Added</option>
            <option value="oldest">Oldest First</option>
            <option value="recently_updated">Recently Updated</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
            <option value="favorites">Favorites First</option>
          </select>
        </div>
      </div>

      {/* Grid Display */}
      <ResourceGrid
        resources={pagedResources}
        categories={categories}
        tags={tags}
        emptyType={filters.searchQuery ? 'search' : filters.favoritesOnly ? 'favorites' : 'all'}
        onOpen={onOpenResource}
        onEdit={onEditResource}
        onDelete={onDeleteResource}
        onToggleFavorite={onToggleFavorite}
        onOpenAddModal={onOpenAddModal}
      />

      {/* Pagination Footer Controls */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing <strong className="text-slate-900 dark:text-white">{totalItems === 0 ? 0 : startIndex + 1}</strong> to{' '}
              <strong className="text-slate-900 dark:text-white">{endIndex}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white">{totalItems}</strong> resources
            </span>

            <div className="flex items-center gap-1.5 ml-2">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={0}>All</option>
              </select>
            </div>
          </div>

          {!isShowAll && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
                <span>Page</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  {safePage}
                </span>
                <span>of {totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
