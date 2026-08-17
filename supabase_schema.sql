-- =========================================================
-- ComponentVault - Supabase Production Schema & Policy Script
-- =========================================================
-- Run this script in your Supabase SQL Editor (https://app.supabase.com/project/_/sql)

-- 1. Create Resources Table
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
  images JSONB, -- Stores array of [{id, dataUrl, thumbnailDataUrl, url, name, type}]
  notes TEXT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);

-- Indexes for ultra-fast queries & reduced scanning egress
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(type);
CREATE INDEX IF NOT EXISTS idx_resources_favorite ON public.resources(is_favorite);
CREATE INDEX IF NOT EXISTS idx_resources_updated ON public.resources(updated_at DESC);

-- 2. Create Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at BIGINT
);

-- 3. Create Tags Table
CREATE TABLE IF NOT EXISTS public.tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at BIGINT
);

-- 4. Create Collections Table
CREATE TABLE IF NOT EXISTS public.collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  resource_ids TEXT[] DEFAULT '{}',
  created_at BIGINT NOT NULL,
  updated_at BIGINT
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Allow public read & write access for development / client usage
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
