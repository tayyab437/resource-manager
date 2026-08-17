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
  Zap,
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
  onOpenQuickAdd: () => void;
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
  onOpenQuickAdd,
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
          <div className="flex gap-2">
            <button
              onClick={onOpenAddModal}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Resource</span>
            </button>
            <button
              onClick={onOpenQuickAdd}
              className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold border border-amber-500/30 transition-all"
              title="Quick Add (N)"
            >
              <Zap className="w-4 h-4 fill-current" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAddModal}
            className="w-full flex items-center justify-center p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md"
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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3 truncate">
                <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Theme Toggle & Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800">
        <button
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark / Light Theme"
        >
          <div className="flex items-center gap-3">
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
          </div>
          {!collapsed && (
            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
              {isDark ? 'DARK' : 'LIGHT'}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
