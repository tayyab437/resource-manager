import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env: Record<string, string> }).env || {};

export const getSupabaseCredentials = (): { url: string; key: string } => {
  const customUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('custom_supabase_url') : null;
  const customKey = typeof localStorage !== 'undefined' ? localStorage.getItem('custom_supabase_anon_key') : null;

  const url = (customUrl || env.VITE_SUPABASE_URL || '').trim();
  const key = (customKey || env.VITE_SUPABASE_ANON_KEY || '').trim();

  return { url, key };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseCredentials();
  return Boolean(
    url &&
      key &&
      url !== 'MY_SUPABASE_URL' &&
      url !== 'https://your-project.supabase.co' &&
      url.startsWith('https://') &&
      key.length > 20
  );
};

let clientInstance: SupabaseClient | null = null;
let lastUsedUrl = '';
let lastUsedKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  const { url, key } = getSupabaseCredentials();

  if (!clientInstance || lastUsedUrl !== url || lastUsedKey !== key) {
    lastUsedUrl = url;
    lastUsedKey = key;
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return clientInstance;
};

export const setCustomSupabaseCredentials = (url: string, key: string): SupabaseClient | null => {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();

  if (cleanUrl) {
    localStorage.setItem('custom_supabase_url', cleanUrl);
  } else {
    localStorage.removeItem('custom_supabase_url');
  }

  if (cleanKey) {
    localStorage.setItem('custom_supabase_anon_key', cleanKey);
  } else {
    localStorage.removeItem('custom_supabase_anon_key');
  }

  clientInstance = null; // reset client instance
  lastUsedUrl = '';
  lastUsedKey = '';
  return getSupabaseClient();
};

export const clearCustomSupabaseCredentials = (): void => {
  localStorage.removeItem('custom_supabase_url');
  localStorage.removeItem('custom_supabase_anon_key');
  clientInstance = null;
  lastUsedUrl = '';
  lastUsedKey = '';
};

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
  tables: {
    resources: boolean;
    categories: boolean;
    tags: boolean;
    collections: boolean;
  };
  details?: string;
}

export const testSupabaseConnection = async (): Promise<ConnectionTestResult> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      message: 'Supabase is not configured. Please enter a valid URL and Anon Key.',
      tables: { resources: false, categories: false, tags: false, collections: false },
    };
  }

  const tableStatus = {
    resources: false,
    categories: false,
    tags: false,
    collections: false,
  };

  try {
    // 1. Test resources
    const { error: resError } = await client.from('resources').select('id').limit(1);
    tableStatus.resources = !resError;

    // 2. Test categories
    const { error: catError } = await client.from('categories').select('id').limit(1);
    tableStatus.categories = !catError;

    // 3. Test tags
    const { error: tagError } = await client.from('tags').select('id').limit(1);
    tableStatus.tags = !tagError;

    // 4. Test collections
    const { error: colError } = await client.from('collections').select('id').limit(1);
    tableStatus.collections = !colError;

    const allTablesExist =
      tableStatus.resources && tableStatus.categories && tableStatus.tags && tableStatus.collections;

    if (allTablesExist) {
      return {
        ok: true,
        message: 'Successfully connected! All 4 tables are accessible.',
        tables: tableStatus,
      };
    } else {
      const missing = Object.entries(tableStatus)
        .filter(([_, exists]) => !exists)
        .map(([name]) => name);

      return {
        ok: false,
        message: `Connected to Supabase, but missing table(s): ${missing.join(', ')}. Please run the SQL schema script in your Supabase SQL Editor.`,
        tables: tableStatus,
      };
    }
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Unknown connection error',
      tables: tableStatus,
      details: String(err),
    };
  }
};

export const supabase: SupabaseClient | null = isSupabaseConfigured() ? getSupabaseClient() : null;
