import React, { useEffect, useState, useCallback } from 'react';
import { ToastProvider } from './components/common/Toast';
import { AppShell } from './components/layout/AppShell';
import type { NavPage } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { AllResourcesPage } from './pages/AllResourcesPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { TagsPage } from './pages/TagsPage';
import { CollectionsPage } from './pages/CollectionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ResourceDetailModal } from './components/resources/ResourceDetailModal';
import { AddResourceModal } from './components/resources/AddResourceModal';
import { storageService } from './services/storageService';
import type { Resource, Category, Tag, Collection, FilterState } from './types';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('vault_theme');
    return saved ? saved === 'dark' : true; // Default dark developer theme
  });

  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [selectedParam, setSelectedParam] = useState<string | undefined>(undefined);

  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    type: 'All',
    categoryId: 'All',
    tagId: 'All',
    collectionId: 'All',
    favoritesOnly: false,
    sortBy: 'recently_added',
  });

  const [detailResource, setDetailResource] = useState<Resource | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleOpenAddModal = () => {
    setEditingResource(null);
    setIsAddModalOpen(true);
  };

  // Apply theme class to HTML root
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('vault_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('vault_theme', 'light');
    }
  }, [isDark]);

  const refreshData = useCallback(async () => {
    await storageService.initDatabase();

    const cats = await storageService.getAllCategories();
    const tgs = await storageService.getAllTags();
    const cols = await storageService.getAllCollections();
    const resList = await storageService.filterResources(filters);

    setCategories(cats);
    setTags(tgs);
    setCollections(cols);
    setResources(resList);
  }, [filters]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleNavigate = (page: NavPage, param?: string) => {
    setCurrentPage(page);
    setSelectedParam(param);

    if (page === 'resource-detail' && param) {
      storageService.getResourceById(param).then((r) => {
        if (r) setDetailResource(r);
      });
    }

    if (page === 'recent') {
      setFilters((prev) => ({ ...prev, sortBy: 'recently_added', type: 'All' }));
      setCurrentPage('resources');
    }

    if (page === 'favorites') {
      setFilters((prev) => ({ ...prev, favoritesOnly: true, type: 'All' }));
      setCurrentPage('resources');
    }
  };

  const handleToggleFavorite = async (id: string) => {
    await storageService.toggleFavorite(id);
    await refreshData();
    if (detailResource && detailResource.id === id) {
      const updated = await storageService.getResourceById(id);
      if (updated) setDetailResource(updated);
    }
  };

  const handleDeleteResource = async (id: string) => {
    await storageService.deleteResource(id);
    await refreshData();
    if (detailResource?.id === id) {
      setDetailResource(null);
    }
  };

  const totalCount = resources.length;
  const favCount = resources.filter((r) => r.favorite).length;

  return (
    <ToastProvider>
      <AppShell
        currentPage={currentPage}
        onNavigate={handleNavigate}
        categories={categories}
        tags={tags}
        totalCount={totalCount}
        favCount={favCount}
        onRefreshData={refreshData}
        onOpenAddModal={handleOpenAddModal}
        globalSearchQuery={filters.searchQuery}
        setGlobalSearchQuery={(q) => setFilters((prev) => ({ ...prev, searchQuery: q }))}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
      >
        {currentPage === 'dashboard' && (
          <DashboardPage
            resources={resources}
            categories={categories}
            tags={tags}
            onOpenResource={setDetailResource}
            onEditResource={setEditingResource}
            onDeleteResource={handleDeleteResource}
            onToggleFavorite={handleToggleFavorite}
            onOpenAddModal={handleOpenAddModal}
            onNavigate={(p, param) => handleNavigate(p as NavPage, param)}
            searchQuery={filters.searchQuery}
            setSearchQuery={(q) => {
              setFilters((prev) => ({ ...prev, searchQuery: q }));
              if (q.trim()) handleNavigate('resources');
            }}
            onRefreshData={refreshData}
          />
        )}

        {currentPage === 'resources' && (
          <AllResourcesPage
            resources={resources}
            categories={categories}
            tags={tags}
            collections={collections}
            filters={filters}
            setFilters={setFilters}
            onOpenResource={setDetailResource}
            onEditResource={setEditingResource}
            onDeleteResource={handleDeleteResource}
            onToggleFavorite={handleToggleFavorite}
            onOpenAddModal={handleOpenAddModal}
          />
        )}

        {currentPage === 'categories' && (
          <CategoriesPage
            categories={categories}
            resources={resources}
            tags={tags}
            selectedCategoryId={selectedParam}
            onSelectCategory={(id) => setSelectedParam(id)}
            onRefreshData={refreshData}
            onOpenResource={setDetailResource}
            onEditResource={setEditingResource}
            onDeleteResource={handleDeleteResource}
            onToggleFavorite={handleToggleFavorite}
            onOpenAddModal={handleOpenAddModal}
          />
        )}

        {currentPage === 'tags' && (
          <TagsPage
            tags={tags}
            resources={resources}
            categories={categories}
            selectedTagId={selectedParam}
            onSelectTag={(id) => setSelectedParam(id)}
            onRefreshData={refreshData}
            onOpenResource={setDetailResource}
            onEditResource={setEditingResource}
            onDeleteResource={handleDeleteResource}
            onToggleFavorite={handleToggleFavorite}
            onOpenAddModal={handleOpenAddModal}
          />
        )}

        {currentPage === 'collections' && (
          <CollectionsPage
            collections={collections}
            resources={resources}
            categories={categories}
            tags={tags}
            selectedCollectionId={selectedParam}
            onSelectCollection={(id) => setSelectedParam(id)}
            onRefreshData={refreshData}
            onOpenResource={setDetailResource}
            onEditResource={setEditingResource}
            onDeleteResource={handleDeleteResource}
            onToggleFavorite={handleToggleFavorite}
            onOpenAddModal={handleOpenAddModal}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsPage
            onRefreshData={refreshData}
            isDark={isDark}
            onToggleTheme={handleToggleTheme}
          />
        )}
      </AppShell>

      {/* Global Resource Detail View Modal */}
      <ResourceDetailModal
        isOpen={!!detailResource}
        onClose={() => setDetailResource(null)}
        resource={detailResource}
        category={categories.find((c) => c.id === detailResource?.categoryId)}
        tags={tags.filter((t) => detailResource?.tagIds?.includes(t.id))}
        onEdit={(r) => {
          setDetailResource(null);
          setEditingResource(r);
        }}
        onDelete={handleDeleteResource}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Global Add / Edit Resource Modal */}
      <AddResourceModal
        isOpen={isAddModalOpen || !!editingResource}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingResource(null);
        }}
        initialResource={editingResource || undefined}
        categories={categories}
        tags={tags}
        onSaved={refreshData}
      />
    </ToastProvider>
  );
}
