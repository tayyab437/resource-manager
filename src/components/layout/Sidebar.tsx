import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Star,
  Clock,
  Layers,
  Tag as TagIcon,
  FolderHeart,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Vault,
  Sun,
  Moon,
} from 'lucide-react';

export type NavPage =
  | 'dashboard'
  | 'resources'
  | 'favorites'
  | 'recent'
  | 'categories'
  | 'tags'
  | 'collections'
  | 'settings'
  | 'category-detail'
  | 'tag-detail'
  | 'collection-detail'
  | 'resource-detail';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenAddModal: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
  totalCount: number;
  favCount: number;
}

export function Sidebar({
  currentPage,
  onNavigate,
  collapsed,
  onToggleCollapse,
  onOpenAddModal,
  onToggleTheme,
  isDark,
  totalCount,
  favCount,
}: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resources', label: 'All Resources', icon: FolderKanban, badge: totalCount },
    { id: 'favorites', label: 'Favorites', icon: Star, badge: favCount },
    { id: 'recent', label: 'Recently Added', icon: Clock },
    { id: 'categories', label: 'Categories', icon: Layers },
    { id: 'tags', label: 'Tags', icon: TagIcon },
    { id: 'collections', label: 'Collections', icon: FolderHeart },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 z-30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Vault className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight leading-tight">
                Component Vault
              </h1>
              <p className="text-[10px] text-slate-400 font-medium truncate">Local Resource Manager</p>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Add Resource Primary Action */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-800">
        {!collapsed ? (
          <button
            onClick={onOpenAddModal}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Resource</span>
          </button>
        ) : (
          <button
            onClick={onOpenAddModal}
            className="w-full flex items-center justify-center p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md cursor-pointer"
            title="Add Resource"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as NavPage)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800/60'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                  }`}
                />
                {!collapsed && <span>{item.label}</span>}
              </div>

              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle & Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <button
          onClick={onToggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
            collapsed ? 'justify-center' : ''
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500" />
          )}
          {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {!collapsed && (
          <div className="px-3 py-1 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-2 font-mono">
            <span>IndexedDB Vault</span>
            <span className="text-emerald-500 font-bold">● Active</span>
          </div>
        )}
      </div>
    </aside>
  );
}
