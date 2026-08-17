import React, { useEffect, useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  Sparkles,
  Trash2,
  HardDrive,
  Sun,
  Moon,
  Keyboard,
  CheckCircle2,
  AlertTriangle,
  Cloud,
  CloudUpload,
  CloudDownload,
  Code,
  Copy,
  ShieldCheck,
  Zap,
  RefreshCw,
  Key,
  Link,
  PlusCircle,
  Loader2,
} from 'lucide-react';
import { storageService } from '../services/storageService';
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  setCustomSupabaseCredentials,
  clearCustomSupabaseCredentials,
  testSupabaseConnection,
  type ConnectionTestResult,
} from '../lib/supabase';
import { useToast } from '../components/common/Toast';

interface SettingsPageProps {
  onRefreshData: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const SUPABASE_SQL_SCRIPT = `-- ComponentVault Supabase Schema
CREATE TABLE IF NOT EXISTS public.resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  category_id TEXT,
  tags TEXT[] DEFAULT '{}',
  collection_ids TEXT[] DEFAULT '{}',
  is_favorite BOOLEAN DEFAULT FALSE,
  code JSONB,
  prompt TEXT,
  source_url TEXT,
  video_url TEXT,
  images JSONB,
  notes TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_updated ON public.resources(updated_at DESC);

CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at BIGINT
);

CREATE TABLE IF NOT EXISTS public.tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at BIGINT
);

CREATE TABLE IF NOT EXISTS public.collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  resource_ids TEXT[] DEFAULT '{}',
  created_at BIGINT NOT NULL,
  updated_at BIGINT
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Allow public insert on resources" ON public.resources FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on resources" ON public.resources FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on resources" ON public.resources FOR DELETE USING (true);

CREATE POLICY "Allow public select on categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public insert on categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on categories" ON public.categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on categories" ON public.categories FOR DELETE USING (true);

CREATE POLICY "Allow public select on tags" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Allow public insert on tags" ON public.tags FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on tags" ON public.tags FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on tags" ON public.tags FOR DELETE USING (true);

CREATE POLICY "Allow public select on collections" ON public.collections FOR SELECT USING (true);
CREATE POLICY "Allow public insert on collections" ON public.collections FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on collections" ON public.collections FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on collections" ON public.collections FOR DELETE USING (true);
`;

export function SettingsPage({
  onRefreshData,
  isDark,
  onToggleTheme,
}: SettingsPageProps) {
  const [stats, setStats] = useState<{
    resourceCount: number;
    categoryCount: number;
    tagCount: number;
    collectionCount: number;
    favCount: number;
    totalImages: number;
    estimatedKB: number;
  }>({
    resourceCount: 0,
    categoryCount: 0,
    tagCount: 0,
    collectionCount: 0,
    favCount: 0,
    totalImages: 0,
    estimatedKB: 0,
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [exportProgress, setExportProgress] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const initialCreds = getSupabaseCredentials();
  const [inputUrl, setInputUrl] = useState(initialCreds.url);
  const [inputKey, setInputKey] = useState(initialCreds.key);

  const isConfigured = isSupabaseConfigured();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const fetchStats = async () => {
    const data = await storageService.getStorageStats();
    setStats(data);
  };

  useEffect(() => {
    fetchStats();
    if (isSupabaseConfigured()) {
      handleTestConnection();
    }
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
      if (res.ok) {
        toast.success(res.message);
      } else {
        toast.warning(res.message);
      }
    } catch (e) {
      toast.error('Connection test failed: ' + String(e));
    } finally {
      setTesting(false);
    }
  };

  const handleSaveCredentials = async () => {
    try {
      if (!inputUrl.trim().startsWith('https://')) {
        toast.error('Supabase URL must start with https:// (e.g. https://xxxx.supabase.co)');
        return;
      }
      if (!inputKey.trim()) {
        toast.error('Please enter your Supabase Anon Key.');
        return;
      }

      setCustomSupabaseCredentials(inputUrl.trim(), inputKey.trim());
      toast.success('Supabase credentials saved! Testing connection...');

      setTesting(true);
      const res = await testSupabaseConnection();
      setTestResult(res);
      setTesting(false);

      if (res.ok) {
        toast.success('Connection verified! Pulling Supabase data into local vault...');
        await handleSyncFromSupabase(true);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save credentials.');
    }
  };

  const handleDisconnect = () => {
    clearCustomSupabaseCredentials();
    setInputUrl('');
    setInputKey('');
    setTestResult(null);
    toast.info('Supabase credentials removed from this device.');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    toast.success('Supabase SQL Schema copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSyncToSupabase = async () => {
    try {
      setLoading(true);
      setExportProgress('Pushing data to Supabase...');
      const res = await storageService.syncToSupabase();
      toast.success(
        `Successfully pushed ${res.resourcesCount} resources, ${res.categoriesCount} categories, ${res.tagsCount} tags, and ${res.collectionsCount} collections to Supabase!`
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to sync to Supabase';
      toast.error(errMsg);
      if (
        errMsg.toLowerCase().includes('does not exist') ||
        errMsg.toLowerCase().includes('42p01') ||
        errMsg.toLowerCase().includes('rls')
      ) {
        setShowSqlModal(true);
      }
    } finally {
      setLoading(false);
      setExportProgress(null);
    }
  };

  const handleLoadDemoAndSync = async () => {
    try {
      setLoading(true);
      setExportProgress('Seeding demo data and syncing to Supabase...');
      await storageService.loadDemoData();
      await fetchStats();
      onRefreshData();
      if (isSupabaseConfigured()) {
        const res = await storageService.syncToSupabase();
        toast.success(`Demo data loaded and ${res.resourcesCount} resources pushed to Supabase!`);
      } else {
        toast.success('Demo data loaded locally in vault.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to seed demo data.');
    } finally {
      setLoading(false);
      setExportProgress(null);
    }
  };

  const handleSyncFromSupabase = async (force = false) => {
    try {
      setLoading(true);
      setExportProgress(
        force
          ? 'Downloading full database from Supabase...'
          : 'Pulling delta sync from Supabase...'
      );
      const res = await storageService.syncFromSupabase({ force });
      if (res.isDelta) {
        toast.success(`Delta sync complete! ${res.resourcesCount} items up to date.`);
      } else {
        toast.success(`Full sync complete! Loaded ${res.resourcesCount} items from Supabase.`);
      }
      await fetchStats();
      onRefreshData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to pull from Supabase');
    } finally {
      setLoading(false);
      setExportProgress(null);
    }
  };

  const handleExportBackup = async () => {
    try {
      setLoading(true);
      setExportProgress('Exporting Dexie Database & Blobs...');
      const blob = await storageService.exportDatabase((progress) => {
        setExportProgress(`Exporting Dexie database... (${progress.completedRows} rows processed)`);
      });

      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10);

      const a = document.createElement('a');
      a.href = url;
      a.download = `ComponentVault-DexieBackup-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('Dexie database exported successfully with binary media Blobs!');
    } catch (err) {
      toast.error('Failed to export Dexie database backup.');
    } finally {
      setLoading(false);
      setExportProgress(null);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !confirm(
        'This will import resources, categories, tags, collections, and binary media into your vault. Continue?'
      )
    ) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setLoading(true);
    setExportProgress('Importing database...');
    try {
      await storageService.importDatabase(file);
      toast.success('Successfully imported database vault!');
      await fetchStats();
      onRefreshData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid database backup format.');
    } finally {
      setLoading(false);
      setExportProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLoadDemoData = async () => {
    if (confirm('Load sample resources, categories, and tags into your vault?')) {
      setLoading(true);
      await storageService.loadDemoData();
      toast.success('Loaded demo resources into your vault!');
      await fetchStats();
      onRefreshData();
      setLoading(false);
    }
  };

  const handleClearVault = async () => {
    if (
      confirm(
        'CRITICAL WARNING: Are you sure you want to delete ALL resources, categories, tags, and collections? This cannot be undone.'
      )
    ) {
      await storageService.clearAllData();
      toast.info('Vault cleared.');
      await fetchStats();
      onRefreshData();
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Settings & Cloud Storage
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your local database, Supabase cloud sync, backup JSON files, theme, and shortcuts.
        </p>
      </div>

      {/* Local Storage Status Banner */}
      <div className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-slate-900/60 to-slate-900/90 shadow-md flex items-start gap-4">
        <div className="p-3 rounded-xl bg-indigo-500 text-white shadow-md shrink-0">
          <HardDrive className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Local Browser Vault (IndexedDB + Dexie)
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active Cache
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            Your resources, screenshots, video embeds, code snippets, and AI notes are cached directly in your browser using IndexedDB. Syncs with Supabase when configured.
          </p>
        </div>
      </div>

      {/* Storage Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Stored Items</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.resourceCount}
          </p>
          <span className="text-[10px] text-slate-500">{stats.favCount} favorited</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Categories & Tags</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.categoryCount + stats.tagCount}
          </p>
          <span className="text-[10px] text-slate-500">
            {stats.categoryCount} cats, {stats.tagCount} tags
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Local Images</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {stats.totalImages}
          </p>
          <span className="text-[10px] text-slate-500">Thumbnails Cached</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <p className="text-xs font-semibold text-slate-400">Est. Usage Size</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ~{stats.estimatedKB} KB
          </p>
          <span className="text-[10px] text-slate-500">Data payload</span>
        </div>
      </div>

      {/* Supabase Integration & Diagnostics Panel */}
      <div className="p-6 rounded-2xl border border-emerald-500/30 bg-white dark:bg-slate-900 shadow-sm space-y-5 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Supabase Cloud Database Synchronization
                </h2>
                {testResult?.ok ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Connected & Verified
                  </span>
                ) : isConfigured ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Configured (Click Test)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                    Not Configured
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pull existing cloud items or push local resources into your Supabase PostgreSQL instance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConfigured && (
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>
            )}

            <button
              onClick={() => setShowSqlModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <Code className="w-3.5 h-3.5 text-emerald-400" />
              <span>View SQL Schema</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Table Status */}
        {testResult && (
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Database Tables Status:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              {Object.entries(testResult.tables).map(([tableName, exists]) => (
                <div
                  key={tableName}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
                    exists
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {exists ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{tableName}</span>
                </div>
              ))}
            </div>

            {!testResult.ok && (
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-rose-500 font-medium">{testResult.message}</span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL Script</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Configuration Setup & Sync Action Controls */}
        <div className="space-y-4 border-t border-slate-100 dark:border-slate-800/80 pt-4">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Key className="w-4 h-4 text-emerald-400" />
                <span>Supabase API Connection Credentials</span>
              </div>
              <button
                onClick={() => setShowSqlModal(true)}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 cursor-pointer"
              >
                <Code className="w-3 h-3" />
                <span>Need Tables? Copy SQL Schema</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Link className="w-3 h-3 text-emerald-400" />
                  <span>Supabase Project URL (VITE_SUPABASE_URL)</span>
                </label>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Key className="w-3 h-3 text-emerald-400" />
                  <span>Supabase Anon API Key (VITE_SUPABASE_ANON_KEY)</span>
                </label>
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveCredentials}
                  disabled={loading || testing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {testing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save & Connect</span>
                </button>

                {isConfigured && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleLoadDemoAndSync}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                title="Populate vault with starter components and push them to Supabase"
              >
                <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Seed Demo Items & Push to Supabase</span>
              </button>
            </div>
          </div>

          {isConfigured && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => handleSyncFromSupabase(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CloudDownload className="w-4 h-4" />
                  <span>Pull All Data from Supabase</span>
                </button>

                <button
                  onClick={handleSyncToSupabase}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CloudUpload className="w-4 h-4" />
                  <span>Push Local Data to Supabase</span>
                </button>

                <button
                  onClick={() => handleSyncFromSupabase(false)}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Delta Pull</span>
                </button>
              </div>

              {storageService.getCacheSyncInfo().lastSyncedAt && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Last synced: {new Date(storageService.getCacheSyncInfo().lastSyncedAt!).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backup & Data Management */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-500" />
            <span>Backup & Data Management (Dexie.js Export/Import)</span>
          </h2>
          {exportProgress && (
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 animate-pulse">
              {exportProgress}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleExportBackup}
            disabled={loading}
            className="flex items-center justify-center gap-2 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              {loading && exportProgress ? exportProgress : 'Export Dexie DB & Blobs (JSON)'}
            </span>
          </button>

          <label
            className={`flex items-center justify-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-slate-400 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer shadow-sm transition-all ${
              loading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <Upload className="w-4 h-4 text-cyan-500" />
            <span>Import Database File</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              disabled={loading}
              className="hidden"
            />
          </label>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleLoadDemoData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Load Demo Data Locally</span>
          </button>

          <button
            onClick={handleClearVault}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white text-xs font-bold border border-rose-500/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Local Vault Data</span>
          </button>
        </div>
      </div>

      {/* Theme Setting */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            {isDark ? (
              <Moon className="w-5 h-5 text-amber-400" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500" />
            )}
            <span>Application Theme</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Current mode: <strong className="uppercase">{isDark ? 'Dark Theme' : 'Light Theme'}</strong>
          </p>
        </div>

        <button
          onClick={onToggleTheme}
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer"
        >
          Switch to {isDark ? 'Light' : 'Dark'} Mode
        </button>
      </div>

      {/* Keyboard Shortcuts Cheat Sheet */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-indigo-500" />
          <span>Keyboard Shortcuts</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Command Palette</span>
            <kbd className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
              Cmd / Ctrl + K
            </kbd>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Add Resource</span>
            <kbd className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
              N
            </kbd>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Focus Search Bar</span>
            <kbd className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
              /
            </kbd>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Close Modal</span>
            <kbd className="font-mono text-[11px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-800 dark:text-slate-200">
              Esc
            </kbd>
          </div>
        </div>
      </div>

      {/* SQL Schema Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-extrabold text-white">
                  Supabase Production SQL Schema
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto font-mono text-xs text-slate-300 space-y-3 bg-slate-950/80">
              <p className="text-slate-400 font-sans text-xs">
                Copy and run this script inside your <strong>Supabase SQL Editor</strong> (
                <em>https://supabase.com/dashboard/project/_/sql</em>) to provision all tables, indexes,
                and Row Level Security policies:
              </p>
              <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto text-[11px] text-emerald-300/90 leading-relaxed">
                {SUPABASE_SQL_SCRIPT}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Created in file <code>/supabase_schema.sql</code>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                >
                  {copiedSql ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy SQL Script</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
