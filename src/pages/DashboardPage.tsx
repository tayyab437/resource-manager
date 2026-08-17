import React from 'react';
import {
  FolderKanban,
  Star,
  Code2,
  Sparkles,
  Layers,
  Plus,
  Search,
  ArrowRight,
  Zap,
} from 'lucide-react';
import type { Resource, Category, Tag } from '../types';
import { ResourceGrid } from '../components/resources/ResourceGrid';
import { SmartUrlImporter } from '../components/resources/SmartUrlImporter';

interface DashboardPageProps {
  resources: Resource[];
  categories: Category[];
  tags: Tag[];
  onOpenResource: (resource: Resource) => void;
  onEditResource: (resource: Resource) => void;
  onDeleteResource: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenAddModal: () => void;
  onNavigate: (page: string, param?: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onRefreshData?: () => void;
}

export function DashboardPage({
  resources,
  categories,
  tags,
  onOpenResource,
  onEditResource,
  onDeleteResource,
  onToggleFavorite,
  onOpenAddModal,
  onNavigate,
  searchQuery,
  setSearchQuery,
  onRefreshData,
}: DashboardPageProps) {
  // Compute Quick Stats dynamically
  const totalCount = resources.length;
  const favCount = resources.filter((r) => r.favorite).length;
  const componentCount = resources.filter((r) => r.type === 'Component').length;
  const promptCount = resources.filter((r) => r.type === 'Prompt').length;
  const codeCount = resources.filter((r) => r.type === 'Code').length;

  const recentResources = [...resources]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 8);

  const favoriteResources = resources.filter((r) => r.favorite).slice(0, 4);

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Your Resource Vault
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Everything useful you save, organized in one place with AI intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Resource</span>
          </button>
        </div>
      </div>

      {/* Smart URL Importer Widget */}
      <SmartUrlImporter onResourceSaved={onRefreshData} />

      {/* Prominent Search */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your resources..."
          className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div
          onClick={() => onNavigate('resources')}
          className="cursor-pointer p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Resources
            </span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {totalCount}
          </p>
        </div>

        <div
          onClick={() => onNavigate('resources')}
          className="cursor-pointer p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Components
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {componentCount}
          </p>
        </div>

        <div
          onClick={() => onNavigate('resources')}
          className="cursor-pointer p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              AI Prompts
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {promptCount}
          </p>
        </div>

        <div
          onClick={() => onNavigate('resources')}
          className="cursor-pointer p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Code Snippets
            </span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 group-hover:scale-110 transition-transform">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {codeCount}
          </p>
        </div>

        <div
          onClick={() => onNavigate('favorites')}
          className="cursor-pointer p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Favorites
            </span>
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-md group-hover:scale-110 transition-transform">
              <Star className="w-4 h-4 fill-current" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {favCount}
          </p>
        </div>
      </div>

      {/* Quick Categories */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Quick Categories
            </h2>
            <button
              onClick={() => onNavigate('categories')}
              className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {categories.map((cat) => {
              const catResourceCount = resources.filter((r) => r.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => onNavigate('category-detail', cat.id)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-sm cursor-pointer"
                >
                  <span>{cat.name}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                    {catResourceCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Favorites Showcase Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Favorite Resources
            </h2>
          </div>
          {favCount > 4 && (
            <button
              onClick={() => onNavigate('favorites')}
              className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
            >
              <span>See all {favCount} favorites</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <ResourceGrid
          resources={favoriteResources}
          categories={categories}
          tags={tags}
          emptyType="favorites"
          onOpen={onOpenResource}
          onEdit={onEditResource}
          onDelete={onDeleteResource}
          onToggleFavorite={onToggleFavorite}
          onOpenAddModal={onOpenAddModal}
        />
      </div>

      {/* Recently Added Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Recently Added
          </h2>
          <button
            onClick={() => onNavigate('resources')}
            className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
          >
            <span>Explore all resources</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <ResourceGrid
          resources={recentResources}
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
    </div>
  );
}
