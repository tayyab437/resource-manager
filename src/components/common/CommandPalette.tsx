import React, { useEffect, useState } from 'react';
import {
  Search,
  LayoutDashboard,
  FolderKanban,
  Star,
  Layers,
  Tag as TagIcon,
  FolderHeart,
  Settings,
  Plus,
  Sun,
  Moon,
  Sparkles,
  Code,
  ArrowRight,
} from 'lucide-react';
import { Modal } from './Modal';
import { storageService } from '../../services/storageService';
import type { Resource } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string, param?: string) => void;
  onOpenAddModal: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
}

export function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onOpenAddModal,
  onToggleTheme,
  isDark,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);

  useEffect(() => {
    if (isOpen) {
      storageService.getAllResources().then(setResources);
      setQuery('');
    }
  }, [isOpen]);

  const filteredResources = query.trim()
    ? resources
        .filter((r) =>
          r.title.toLowerCase().includes(query.toLowerCase()) ||
          r.type.toLowerCase().includes(query.toLowerCase()) ||
          r.description?.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const mainNavigation = [
    { label: 'Dashboard', icon: LayoutDashboard, action: () => onNavigate('dashboard') },
    { label: 'All Resources', icon: FolderKanban, action: () => onNavigate('resources') },
    { label: 'Favorites', icon: Star, action: () => onNavigate('favorites') },
    { label: 'Categories', icon: Layers, action: () => onNavigate('categories') },
    { label: 'Tags', icon: TagIcon, action: () => onNavigate('tags') },
    { label: 'Collections', icon: FolderHeart, action: () => onNavigate('collections') },
    { label: 'Settings', icon: Settings, action: () => onNavigate('settings') },
  ];

  const handleAction = (cb: () => void) => {
    cb();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl">
      <div className="-m-6 flex flex-col">
        {/* Search input header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search resources..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <kbd className="hidden sm:inline-block font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
            ESC
          </kbd>
        </div>

        {/* List Body */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-4">
          {/* Quick Actions */}
          {!query && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Actions
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleAction(onOpenAddModal)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-indigo-500/10">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span>Create New Resource</span>
                  </div>
                  <kbd className="font-mono text-[10px] text-slate-400">N</kbd>
                </button>

                <button
                  onClick={() => handleAction(onToggleTheme)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-slate-200 dark:bg-slate-700">
                      {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
                    </div>
                    <span>Toggle Theme ({isDark ? 'Light' : 'Dark'})</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Search Resource Results */}
          {filteredResources.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Matching Resources
              </div>
              <div className="space-y-1">
                {filteredResources.map((res) => (
                  <button
                    key={res.id}
                    onClick={() => handleAction(() => onNavigate('resource-detail', res.id))}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {res.type}
                      </span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {res.title}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          {!query && (
            <div>
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Navigation
              </div>
              <div className="space-y-1">
                {mainNavigation.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleAction(item.action)}
                    className="w-full flex items-center gap-2.5 p-2.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <item.icon className="w-4 h-4 text-slate-400" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
