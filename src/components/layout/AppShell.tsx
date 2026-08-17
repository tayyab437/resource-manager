import React, { useState, useEffect } from 'react';
import { Sidebar, type NavPage } from './Sidebar';
import { CommandPalette } from '../common/CommandPalette';
import { CloudSyncModal } from '../common/CloudSyncModal';
import { Search, Plus, Menu, Command, Cloud, CheckCircle2 } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import type { Category, Tag } from '../../types';

interface AppShellProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage, param?: string) => void;
  categories: Category[];
  tags: Tag[];
  totalCount: number;
  favCount: number;
  onRefreshData: () => void;
  onOpenAddModal: () => void;
  children: React.ReactNode;
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function AppShell({
  currentPage,
  onNavigate,
  categories,
  tags,
  totalCount,
  favCount,
  onRefreshData,
  onOpenAddModal,
  children,
  globalSearchQuery,
  setGlobalSearchQuery,
  isDark,
  onToggleTheme,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [cloudSyncModalOpen, setCloudSyncModalOpen] = useState(false);

  const isConfigured = isSupabaseConfigured();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd + K or Ctrl + K -> Command Palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Check if user is typing in an input/textarea/select
      const activeElement = document.activeElement;
      const isInput =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.tagName === 'SELECT' ||
        activeElement?.getAttribute('contenteditable') === 'true';

      if (isInput) return;

      // N -> New Resource Modal
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onOpenAddModal();
        return;
      }

      // / -> Focus search bar
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenAddModal]);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans antialiased">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          currentPage={currentPage}
          onNavigate={(p) => onNavigate(p)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenAddModal={onOpenAddModal}
          onToggleTheme={onToggleTheme}
          isDark={isDark}
          totalCount={totalCount}
          favCount={favCount}
        />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 md:hidden transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar
          currentPage={currentPage}
          onNavigate={(p) => {
            onNavigate(p);
            setMobileMenuOpen(false);
          }}
          collapsed={false}
          onToggleCollapse={() => setMobileMenuOpen(false)}
          onOpenAddModal={() => {
            onOpenAddModal();
            setMobileMenuOpen(false);
          }}
          onToggleTheme={onToggleTheme}
          isDark={isDark}
          totalCount={totalCount}
          favCount={favCount}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white md:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Global Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="global-search-input"
                type="text"
                value={globalSearchQuery}
                onChange={(e) => {
                  setGlobalSearchQuery(e.target.value);
                  if (currentPage !== 'resources' && e.target.value.trim()) {
                    onNavigate('resources');
                  }
                }}
                placeholder="Search your resources... (/)"
                className="w-full pl-9 pr-12 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 text-[10px] font-mono text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                title="Command Palette (Cmd+K)"
              >
                <Command className="w-3 h-3" />
                <span>K</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Supabase Cloud Sync Status Button */}
            <button
              onClick={() => setCloudSyncModalOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isConfigured
                  ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="Configure & Sync Supabase Cloud"
            >
              <Cloud className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isConfigured ? 'Cloud Synced' : 'Connect Cloud'}
              </span>
              {isConfigured && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            {/* Add Resource Action */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Resource</span>
            </button>
          </div>
        </header>

        {/* Page View Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Global Modals */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(path, param) => onNavigate(path as NavPage, param)}
        onOpenAddModal={onOpenAddModal}
        onToggleTheme={onToggleTheme}
        isDark={isDark}
      />

      <CloudSyncModal
        isOpen={cloudSyncModalOpen}
        onClose={() => setCloudSyncModalOpen(false)}
        onRefreshData={onRefreshData}
      />
    </div>
  );
}
