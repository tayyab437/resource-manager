import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Key,
  Globe,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  isSupabaseConfigured,
  getSupabaseCredentials,
  setCustomSupabaseCredentials,
  clearCustomSupabaseCredentials,
  testSupabaseConnection,
  type ConnectionTestResult,
} from '../../lib/supabase';
import { storageService } from '../../services/storageService';
import { useToast } from './Toast';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

const SUPABASE_SQL_SCRIPT = `-- ComponentVault Supabase Schema & Permissions
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

export function CloudSyncModal({ isOpen, onClose, onRefreshData }: CloudSyncModalProps) {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setKey(creds.key);
      setTestResult(null);

      if (isSupabaseConfigured()) {
        runTest();
      }
    }
  }, [isOpen]);

  const runTest = async () => {
    setTesting(true);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } catch (e) {
      setTestResult({
        ok: false,
        message: 'Failed to test connection: ' + String(e),
        tables: { resources: false, categories: false, tags: false, collections: false },
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    const cleanKey = key.trim();

    if (!cleanUrl.startsWith('https://')) {
      toast.error('Supabase URL must start with https://');
      return;
    }

    if (!cleanKey) {
      toast.error('Please enter your Supabase Anon Key');
      return;
    }

    setCustomSupabaseCredentials(cleanUrl, cleanKey);
    toast.success('Credentials saved! Testing connection...');

    setTesting(true);
    const result = await testSupabaseConnection();
    setTestResult(result);
    setTesting(false);

    if (result.ok) {
      toast.success('Connected to Supabase! Pulling remote data...');
      handlePullData(true);
    } else {
      toast.error(result.message);
    }
  };

  const handlePullData = async (force = true) => {
    if (!isSupabaseConfigured()) {
      toast.error('Please configure and save your Supabase credentials first.');
      return;
    }

    setSyncing(true);
    try {
      toast.info('Pulling data from Supabase...');
      const res = await storageService.syncFromSupabase({ force });
      onRefreshData();
      toast.success(`Successfully pulled ${res.resourcesCount} resources from Supabase!`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to pull from Supabase');
    } finally {
      setSyncing(false);
    }
  };

  const handlePushData = async () => {
    if (!isSupabaseConfigured()) {
      toast.error('Please configure and save your Supabase credentials first.');
      return;
    }

    setSyncing(true);
    try {
      toast.info('Pushing local vault to Supabase...');
      const res = await storageService.syncToSupabase();
      toast.success(
        `Pushed ${res.resourcesCount} resources & ${res.categoriesCount} categories to Supabase!`
      );
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to push to Supabase');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = () => {
    clearCustomSupabaseCredentials();
    setUrl('');
    setKey('');
    setTestResult(null);
    toast.info('Supabase disconnected from this device.');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    toast.success('SQL schema copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supabase Cloud Synchronization"
      subtitle="Connect your Supabase database to pull and sync your saved components across devices."
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Status Header */}
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                testResult?.ok
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : isConfigured
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-slate-500/10 text-slate-500'
              }`}
            >
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {testResult?.ok
                    ? 'Connected & Synchronized'
                    : isConfigured
                    ? 'Credentials Configured'
                    : 'Not Connected'}
                </h3>
                <span
                  className={`w-2 h-2 rounded-full ${
                    testResult?.ok ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                  }`}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {testResult?.message ||
                  (isConfigured
                    ? 'Click Test Connection to verify access'
                    : 'Enter your project URL and Anon key below')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isConfigured && (
              <button
                type="button"
                onClick={runTest}
                disabled={testing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>Test</span>
              </button>
            )}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSaveCredentials} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Project URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project-id.supabase.co"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Supabase Anon / Public API Key
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            {isConfigured ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            ) : <span />}

            <button
              type="submit"
              disabled={testing || !url.trim() || !key.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
            >
              {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Save & Connect</span>
            </button>
          </div>
        </form>

        {/* Diagnostic Table Status */}
        {testResult && (
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Supabase Tables Status:
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
                  {exists ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                  <span>{tableName}</span>
                </div>
              ))}
            </div>

            {!testResult.ok && (
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-rose-500 font-medium">Missing tables in Supabase?</span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-500 hover:underline cursor-pointer"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copied SQL Script!' : 'Copy SQL Schema Script'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sync Actions */}
        {isConfigured && (
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Cloud Sync Operations
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePullData(true)}
                disabled={syncing}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 text-xs font-bold transition-colors cursor-pointer"
              >
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudDownload className="w-4 h-4" />}
                <span>Pull All Data from Supabase</span>
              </button>

              <button
                type="button"
                onClick={handlePushData}
                disabled={syncing}
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
                <span>Push Local Vault to Supabase</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
