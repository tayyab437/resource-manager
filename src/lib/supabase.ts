import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env: Record<string, string> }).env || {};

export const getSupabaseCredentials = (): { url: string; key: string } => {
  const customUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('custom_supabase_url') : null;
  const customKey = typeof localStorage !== 'undefined' ? localStorage.getItem('custom_supabase_anon_key') : null;

  const url = customUrl || env.VITE_SUPABASE_URL || '';
  const key = customKey || env.VITE_SUPABASE_ANON_KEY || '';

  return { url, key };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseCredentials();
  return Boolean(
    url &&
      key &&
      url !== 'MY_SUPABASE_URL' &&
      url.startsWith('https://')
  );
};

let clientInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) return null;
  const { url, key } = getSupabaseCredentials();

  if (!clientInstance) {
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
  return getSupabaseClient();
};

export const supabase: SupabaseClient | null = isSupabaseConfigured() ? getSupabaseClient() : null;

