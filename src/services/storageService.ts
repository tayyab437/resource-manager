import { db } from '../db/database';
import { exportDB, importInto } from 'dexie-export-import';
import { INITIAL_CATEGORIES, INITIAL_TAGS, INITIAL_COLLECTIONS, DEMO_RESOURCES } from '../db/seed';
import { isSupabaseConfigured, getSupabaseClient } from '../lib/supabase';
import type {
  Resource,
  Category,
  Tag,
  Collection,
  VaultBackup,
  FilterState,
  ResourceType,
} from '../types';
import { processMediaThumbnails } from '../utils/imageUtils';

// Helper to convert Resource object to Supabase row format
function resourceToSupabaseRow(r: Resource) {
  return {
    id: r.id,
    title: r.title,
    description: r.description || null,
    type: r.type,
    category_id: r.categoryId || null,
    tags: r.tagIds || [],
    collection_ids: r.collectionIds || [],
    is_favorite: Boolean(r.favorite),
    code: r.code || null,
    prompt: r.prompt || null,
    source_url: r.sourceUrl || null,
    video_url: r.videoUrl || null,
    images: r.images || [],
    notes: r.notes || null,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  };
}

// Helper to convert Supabase row format to Resource object
function supabaseRowToResource(row: any): Resource {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    type: row.type as ResourceType,
    categoryId: row.category_id || undefined,
    tagIds: row.tags || [],
    collectionIds: row.collection_ids || [],
    favorite: Boolean(row.is_favorite),
    code: row.code || undefined,
    prompt: row.prompt || undefined,
    sourceUrl: row.source_url || undefined,
    videoUrl: row.video_url || undefined,
    images: row.images || undefined,
    notes: row.notes || undefined,
    createdAt: Number(row.created_at || Date.now()),
    updatedAt: Number(row.updated_at || Date.now()),
  };
}

const LAST_SYNC_KEY = 'vault_supabase_last_sync_timestamp';
const MIN_SYNC_INTERVAL_MS = 10000; // 10 seconds throttle for auto-sync

export interface PaginatedResult<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export const storageService = {
  getCacheSyncInfo(): { lastSyncedAt: number | null; isConfigured: boolean } {
    const raw = localStorage.getItem(LAST_SYNC_KEY);
    const lastSyncedAt = raw ? Number(raw) : null;
    return {
      lastSyncedAt,
      isConfigured: isSupabaseConfigured(),
    };
  },

  clearSyncCache(): void {
    localStorage.removeItem(LAST_SYNC_KEY);
  },

  async initDatabase(): Promise<void> {
    const catCount = await db.categories.count();
    if (catCount === 0) {
      await db.categories.bulkPut(INITIAL_CATEGORIES);
      await db.tags.bulkPut(INITIAL_TAGS);
      await db.collections.bulkPut(INITIAL_COLLECTIONS);
    }

    // Background sync from Supabase if configured (Stale-While-Revalidate to conserve bandwidth)
    if (isSupabaseConfigured()) {
      this.syncFromSupabase().catch((err) => {
        console.warn('Initial Supabase sync deferred:', err);
      });
    }
  },

  /**
   * Pushes all local IndexedDB records to Supabase in batches.
   * Optimizes egress by sending sanitized data.
   */
  async syncToSupabase(): Promise<{
    resourcesCount: number;
    categoriesCount: number;
    tagsCount: number;
    collectionsCount: number;
  }> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or enter your credentials in Settings.');
    }

    const resources = await db.resources.toArray();
    const categories = await db.categories.toArray();
    const tags = await db.tags.toArray();
    const collections = await db.collections.toArray();

    // 1. Sync Categories
    if (categories.length > 0) {
      const catRows = categories.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon || 'folder',
        color: c.color || '#6366f1',
      }));
      const { error } = await client.from('categories').upsert(catRows, { onConflict: 'id' });
      if (error) {
        throw new Error(`Failed to sync categories table in Supabase: ${error.message} (${error.code}). Make sure the 'categories' table exists with RLS permissions.`);
      }
    }

    // 2. Sync Tags
    if (tags.length > 0) {
      const tagRows = tags.map((t) => ({
        id: t.id,
        name: t.name,
      }));
      const { error } = await client.from('tags').upsert(tagRows, { onConflict: 'id' });
      if (error) {
        throw new Error(`Failed to sync tags table in Supabase: ${error.message} (${error.code}). Make sure the 'tags' table exists with RLS permissions.`);
      }
    }

    // 3. Sync Collections
    if (collections.length > 0) {
      const colRows = collections.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || null,
        resource_ids: c.resourceIds || [],
        created_at: c.createdAt,
      }));
      const { error } = await client.from('collections').upsert(colRows, { onConflict: 'id' });
      if (error) {
        throw new Error(`Failed to sync collections table in Supabase: ${error.message} (${error.code}). Make sure the 'collections' table exists with RLS permissions.`);
      }
    }

    // 4. Sync Resources in batches of 50
    const batchSize = 50;
    for (let i = 0; i < resources.length; i += batchSize) {
      const batch = resources.slice(i, i + batchSize);
      const rows = batch.map(resourceToSupabaseRow);
      const { error } = await client.from('resources').upsert(rows, { onConflict: 'id' });
      if (error) {
        throw new Error(`Failed to sync resources table in Supabase: ${error.message} (${error.code}). Please run the SQL schema in your Supabase SQL Editor.`);
      }
    }

    localStorage.setItem(LAST_SYNC_KEY, String(Date.now()));
    return {
      resourcesCount: resources.length,
      categoriesCount: categories.length,
      tagsCount: tags.length,
      collectionsCount: collections.length,
    };
  },

  /**
   * Pulls remote data from Supabase into local Dexie IndexedDB cache.
   * Delta Sync & Caching: If last sync timestamp exists and force is false,
   * only modified/new records (updated_at > lastSync) are fetched to save 100% bandwidth.
   */
  async syncFromSupabase(options?: { force?: boolean }): Promise<{ resourcesCount: number; isDelta: boolean }> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return { resourcesCount: 0, isDelta: false };
    }

    const rawLastSync = localStorage.getItem(LAST_SYNC_KEY);
    const lastSyncTime = rawLastSync ? Number(rawLastSync) : null;
    const now = Date.now();

    // Throttling auto-syncs within 10 seconds if not forced
    if (!options?.force && lastSyncTime && now - lastSyncTime < MIN_SYNC_INTERVAL_MS) {
      const count = await db.resources.count();
      return { resourcesCount: count, isDelta: true };
    }

    const isDelta = Boolean(!options?.force && lastSyncTime);

    // 1. Fetch Categories
    let catQuery = client.from('categories').select('*');
    if (isDelta && lastSyncTime) {
      catQuery = catQuery.gt('created_at', lastSyncTime);
    }
    const { data: remoteCats } = await catQuery;
    if (remoteCats && remoteCats.length > 0) {
      const localCats: Category[] = remoteCats.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon || 'folder',
        color: c.color || '#6366f1',
        createdAt: Number(c.created_at || Date.now()),
      }));
      await db.categories.bulkPut(localCats);
    }

    // 2. Fetch Tags
    let tagQuery = client.from('tags').select('*');
    if (isDelta && lastSyncTime) {
      tagQuery = tagQuery.gt('created_at', lastSyncTime);
    }
    const { data: remoteTags } = await tagQuery;
    if (remoteTags && remoteTags.length > 0) {
      const localTags: Tag[] = remoteTags.map((t) => ({
        id: t.id,
        name: t.name,
        createdAt: Number(t.created_at || Date.now()),
      }));
      await db.tags.bulkPut(localTags);
    }

    // 3. Fetch Collections
    let colQuery = client.from('collections').select('*');
    if (isDelta && lastSyncTime) {
      colQuery = colQuery.gt('created_at', lastSyncTime);
    }
    const { data: remoteCols } = await colQuery;
    if (remoteCols && remoteCols.length > 0) {
      const localCols: Collection[] = remoteCols.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || undefined,
        resourceIds: c.resource_ids || [],
        createdAt: Number(c.created_at || Date.now()),
        updatedAt: Number(c.updated_at || Date.now()),
      }));
      await db.collections.bulkPut(localCols);
    }

    // 4. Fetch Resources from Supabase
    let fetchedCount = 0;
    if (isDelta && lastSyncTime) {
      // Delta fetch only modified resources
      const { data: modifiedResources, error } = await client
        .from('resources')
        .select('*')
        .gt('updated_at', lastSyncTime);

      if (error) {
        console.warn('Error fetching delta resources from Supabase:', error);
      } else if (modifiedResources && modifiedResources.length > 0) {
        const localResources = modifiedResources.map(supabaseRowToResource);
        for (const res of localResources) {
          if (res.images && res.images.length > 0) {
            res.images = await processMediaThumbnails(res.images);
          }
        }
        await db.resources.bulkPut(localResources);
        fetchedCount = localResources.length;
      }
    } else {
      // Full sync with Paginated Range Chunks (chunk size 50) to prevent memory spikes
      const CHUNK_SIZE = 50;
      let start = 0;
      let hasMoreChunks = true;

      while (hasMoreChunks) {
        const { data: chunk, error } = await client
          .from('resources')
          .select('*')
          .order('updated_at', { ascending: false })
          .range(start, start + CHUNK_SIZE - 1);

        if (error || !chunk || chunk.length === 0) {
          hasMoreChunks = false;
          break;
        }

        const localResources = chunk.map(supabaseRowToResource);
        for (const res of localResources) {
          if (res.images && res.images.length > 0) {
            res.images = await processMediaThumbnails(res.images);
          }
        }
        await db.resources.bulkPut(localResources);
        fetchedCount += localResources.length;

        if (chunk.length < CHUNK_SIZE) {
          hasMoreChunks = false;
        } else {
          start += CHUNK_SIZE;
        }
      }
    }

    localStorage.setItem(LAST_SYNC_KEY, String(now));
    return { resourcesCount: fetchedCount, isDelta };
  },

  async loadDemoData(): Promise<void> {
    await db.transaction('rw', [db.resources, db.categories, db.tags, db.collections], async () => {
      await db.categories.bulkPut(INITIAL_CATEGORIES);
      await db.tags.bulkPut(INITIAL_TAGS);
      await db.collections.bulkPut(INITIAL_COLLECTIONS);
      await db.resources.bulkPut(DEMO_RESOURCES);
    });

    if (isSupabaseConfigured()) {
      this.syncToSupabase().catch((e) => console.warn('Supabase demo sync background:', e));
    }
  },


  async getAllResources(): Promise<Resource[]> {
    return await db.resources.orderBy('updatedAt').reverse().toArray();
  },

  async filterResources(filters: FilterState): Promise<Resource[]> {
    let list = await db.resources.toArray();

    // Type filter
    if (filters.type && filters.type !== 'All') {
      list = list.filter((r) => r.type === filters.type);
    }

    // Category filter
    if (filters.categoryId && filters.categoryId !== 'All') {
      list = list.filter((r) => r.categoryId === filters.categoryId);
    }

    // Tag filter
    if (filters.tagId && filters.tagId !== 'All') {
      list = list.filter((r) => r.tagIds && r.tagIds.includes(filters.tagId));
    }

    // Collection filter
    if (filters.collectionId && filters.collectionId !== 'All') {
      list = list.filter((r) => r.collectionIds && r.collectionIds.includes(filters.collectionId));
    }

    // Favorites only filter
    if (filters.favoritesOnly) {
      list = list.filter((r) => r.favorite);
    }

    // Search query across title, description, tags, category, code, prompt, notes
    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase().trim();
      const allTags = await this.getAllTags();
      const tagMap = new Map<string, string>(allTags.map((t) => [t.id, t.name.toLowerCase()]));
      const allCats = await this.getAllCategories();
      const catMap = new Map<string, string>(allCats.map((c) => [c.id, c.name.toLowerCase()]));

      list = list.filter((r) => {
        const titleMatch = r.title.toLowerCase().includes(query);
        const descMatch = r.description?.toLowerCase().includes(query) ?? false;
        const notesMatch = r.notes?.toLowerCase().includes(query) ?? false;
        const promptMatch = r.prompt?.toLowerCase().includes(query) ?? false;
        const codeMatch = r.code?.content.toLowerCase().includes(query) ?? false;
        const typeMatch = r.type.toLowerCase().includes(query);

        const categoryName = r.categoryId ? catMap.get(r.categoryId) || '' : '';
        const catMatch = categoryName.includes(query);

        const tagMatch = r.tagIds.some((tid) => {
          const name = tagMap.get(tid);
          return name ? name.includes(query) : false;
        });

        return titleMatch || descMatch || notesMatch || promptMatch || codeMatch || typeMatch || catMatch || tagMatch;
      });
    }

    // Sorting
    switch (filters.sortBy) {
      case 'recently_added':
        list.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'oldest':
        list.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'recently_updated':
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
      case 'alphabetical':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'favorites':
        list.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0) || b.updatedAt - a.updatedAt);
        break;
      default:
        list.sort((a, b) => b.createdAt - a.createdAt);
    }

    return list;
  },

  /**
   * Performs client-side indexed filtering with local pagination.
   * Keeps React DOM light and memory usage low.
   */
  async getPaginatedResources(
    filters: FilterState,
    page = 1,
    pageSize = 12
  ): Promise<PaginatedResult<Resource>> {
    const allFiltered = await this.filterResources(filters);
    const totalCount = allFiltered.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const safePage = Math.max(1, Math.min(page, totalPages));

    const startIndex = (safePage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const data = allFiltered.slice(startIndex, endIndex);

    return {
      data,
      totalCount,
      page: safePage,
      pageSize,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    };
  },

  /**
   * Direct server-side paginated query to Supabase with bandwidth range filtering.
   */
  async fetchPaginatedFromSupabase(
    filters: FilterState,
    page = 1,
    pageSize = 12
  ): Promise<PaginatedResult<Resource>> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return this.getPaginatedResources(filters, page, pageSize);
    }

    try {
      let query = client.from('resources').select('*', { count: 'exact' });

      if (filters.type && filters.type !== 'All') {
        query = query.eq('type', filters.type);
      }
      if (filters.categoryId && filters.categoryId !== 'All') {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.favoritesOnly) {
        query = query.eq('is_favorite', true);
      }
      if (filters.searchQuery.trim()) {
        const q = `%${filters.searchQuery.trim().toLowerCase()}%`;
        query = query.or(`title.ilike.${q},description.ilike.${q},notes.ilike.${q},prompt.ilike.${q}`);
      }

      // Sorting
      switch (filters.sortBy) {
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'recently_updated':
          query = query.order('updated_at', { ascending: false });
          break;
        case 'alphabetical':
          query = query.order('title', { ascending: true });
          break;
        case 'favorites':
          query = query.order('is_favorite', { ascending: false }).order('updated_at', { ascending: false });
          break;
        case 'recently_added':
        default:
          query = query.order('created_at', { ascending: false });
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data: rows, count, error } = await query.range(from, to);

      if (error || !rows) {
        console.warn('Supabase paginated query fallback to local:', error);
        return this.getPaginatedResources(filters, page, pageSize);
      }

      const resources = rows.map(supabaseRowToResource);
      const totalCount = count || resources.length;
      const totalPages = Math.ceil(totalCount / pageSize) || 1;

      return {
        data: resources,
        totalCount,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (err) {
      console.warn('Supabase fetchPaginated error, falling back to local:', err);
      return this.getPaginatedResources(filters, page, pageSize);
    }
  },

  async getResourceById(id: string): Promise<Resource | undefined> {
    return await db.resources.get(id);
  },

  async saveResource(resource: Resource): Promise<string> {
    const now = Date.now();
    const existing = await db.resources.get(resource.id);

    const processedImages = await processMediaThumbnails(resource.images);

    const recordToSave: Resource = {
      ...resource,
      images: processedImages,
      createdAt: existing ? existing.createdAt : (resource.createdAt || now),
      updatedAt: now,
    };

    await db.resources.put(recordToSave);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        const row = resourceToSupabaseRow(recordToSave);
        await client.from('resources').upsert(row, { onConflict: 'id' });
      } catch (err) {
        console.warn('Supabase saveResource error:', err);
      }
    }

    return recordToSave.id;
  },

  async deleteResource(id: string): Promise<void> {
    await db.resources.delete(id);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('resources').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteResource error:', err);
      }
    }
  },

  async toggleFavorite(id: string): Promise<boolean> {
    const resource = await db.resources.get(id);
    if (!resource) return false;

    const newFav = !resource.favorite;
    const now = Date.now();
    await db.resources.update(id, {
      favorite: newFav,
      updatedAt: now,
    });

    // Surgical egress-saving update: Only patch is_favorite and updated_at
    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client
          .from('resources')
          .update({ is_favorite: newFav, updated_at: now })
          .eq('id', id);
      } catch (err) {
        console.warn('Supabase toggleFavorite error:', err);
      }
    }

    return newFav;
  },

  // Categories
  async getAllCategories(): Promise<Category[]> {
    return await db.categories.orderBy('name').toArray();
  },

  async saveCategory(category: Category): Promise<string> {
    await db.categories.put(category);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('categories').upsert(
          {
            id: category.id,
            name: category.name,
            icon: category.icon || 'folder',
            color: category.color || '#6366f1',
          },
          { onConflict: 'id' }
        );
      } catch (err) {
        console.warn('Supabase saveCategory error:', err);
      }
    }

    return category.id;
  },

  async deleteCategory(id: string): Promise<void> {
    await db.transaction('rw', [db.categories, db.resources], async () => {
      await db.categories.delete(id);
      // Remove category reference from resources
      const affected = await db.resources.where('categoryId').equals(id).toArray();
      for (const r of affected) {
        await db.resources.update(r.id, { categoryId: undefined });
      }
    });

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('categories').delete().eq('id', id);
      } catch (e) {
        console.warn(e);
      }
    }
  },

  // Tags
  async getAllTags(): Promise<Tag[]> {
    return await db.tags.orderBy('name').toArray();
  },

  async saveTag(tag: Tag): Promise<string> {
    await db.tags.put(tag);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client
          .from('tags')
          .upsert({ id: tag.id, name: tag.name }, { onConflict: 'id' });
      } catch (e) {
        console.warn(e);
      }
    }

    return tag.id;
  },

  async findOrCreateTagByName(rawName: string): Promise<Tag> {
    const cleanName = rawName.trim().toLowerCase().replace(/^#/, '');
    const existing = await db.tags.filter((t) => t.name.toLowerCase() === cleanName).first();
    if (existing) return existing;

    const newTag: Tag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      createdAt: Date.now(),
    };
    await db.tags.put(newTag);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client
          .from('tags')
          .upsert({ id: newTag.id, name: newTag.name }, { onConflict: 'id' });
      } catch (e) {
        console.warn(e);
      }
    }

    return newTag;
  },

  async deleteTag(id: string): Promise<void> {
    await db.transaction('rw', [db.tags, db.resources], async () => {
      await db.tags.delete(id);
      const allRes = await db.resources.toArray();
      for (const r of allRes) {
        if (r.tagIds && r.tagIds.includes(id)) {
          const updatedTagIds = r.tagIds.filter((t) => t !== id);
          await db.resources.update(r.id, { tagIds: updatedTagIds });
        }
      }
    });

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('tags').delete().eq('id', id);
      } catch (e) {
        console.warn(e);
      }
    }
  },

  // Collections
  async getAllCollections(): Promise<Collection[]> {
    return await db.collections.orderBy('updatedAt').reverse().toArray();
  },

  async saveCollection(collection: Collection): Promise<string> {
    await db.collections.put(collection);

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('collections').upsert(
          {
            id: collection.id,
            name: collection.name,
            description: collection.description || null,
            resource_ids: collection.resourceIds || [],
            created_at: collection.createdAt,
          },
          { onConflict: 'id' }
        );
      } catch (e) {
        console.warn(e);
      }
    }

    return collection.id;
  },

  async deleteCollection(id: string): Promise<void> {
    await db.transaction('rw', [db.collections, db.resources], async () => {
      await db.collections.delete(id);
      const allRes = await db.resources.toArray();
      for (const r of allRes) {
        if (r.collectionIds && r.collectionIds.includes(id)) {
          const updatedColIds = r.collectionIds.filter((c) => c !== id);
          await db.resources.update(r.id, { collectionIds: updatedColIds });
        }
      }
    });

    const client = getSupabaseClient();
    if (client && isSupabaseConfigured()) {
      try {
        await client.from('collections').delete().eq('id', id);
      } catch (e) {
        console.warn(e);
      }
    }
  },

  // Backup & Dexie Database Export/Import
  async exportDatabase(
    onProgress?: (progress: { completedRows: number; totalRows: number }) => void
  ): Promise<Blob> {
    const blob = await exportDB(db, {
      prettyJson: true,
      progressCallback: (p) => {
        if (onProgress) {
          onProgress({
            completedRows: p.completedRows,
            totalRows: p.totalRows || 0,
          });
        }
        return true;
      },
    });
    return blob;
  },

  async importDatabase(
    file: Blob,
    onProgress?: (progress: { completedRows: number; totalRows: number }) => void
  ): Promise<{ count: number }> {
    const text = await file.text();
    let isDexieFormat = false;

    try {
      const parsed = JSON.parse(text);
      if (parsed && (parsed.formatName === 'dexie' || parsed.data?.tables)) {
        isDexieFormat = true;
      }
    } catch {
      throw new Error('Invalid JSON backup file format.');
    }

    if (isDexieFormat) {
      await importInto(db, file, {
        overwriteValues: true,
        clearTablesBeforeImport: false,
        progressCallback: (p) => {
          if (onProgress) {
            onProgress({
              completedRows: p.completedRows,
              totalRows: p.totalRows || 0,
            });
          }
          return true;
        },
      });

      // Post-process imported resources to ensure thumbnails exist
      const allResources = await db.resources.toArray();
      for (const res of allResources) {
        if (res.images && res.images.length > 0) {
          const processed = await processMediaThumbnails(res.images);
          if (processed && JSON.stringify(processed) !== JSON.stringify(res.images)) {
            await db.resources.update(res.id, { images: processed });
          }
        }
      }

      const totalCount = await db.resources.count();
      return { count: totalCount };
    } else {
      // Fallback for standard VaultBackup format
      const parsed: VaultBackup = JSON.parse(text);
      return await this.importBackup(parsed);
    }
  },

  async exportBackup(): Promise<VaultBackup> {
    const resources = await db.resources.toArray();
    const categories = await db.categories.toArray();
    const tags = await db.tags.toArray();
    const collections = await db.collections.toArray();

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      resources,
      categories,
      tags,
      collections,
    };
  },

  async importBackup(backup: VaultBackup): Promise<{ count: number }> {
    if (!backup || !Array.isArray(backup.resources)) {
      throw new Error('Invalid backup file format.');
    }

    // Process thumbnails for all imported resources
    const processedResources = await Promise.all(
      backup.resources.map(async (r) => {
        if (r.images && r.images.length > 0) {
          const imagesWithThumbs = await processMediaThumbnails(r.images);
          return { ...r, images: imagesWithThumbs };
        }
        return r;
      })
    );

    await db.transaction('rw', [db.resources, db.categories, db.tags, db.collections], async () => {
      if (backup.categories && backup.categories.length > 0) {
        await db.categories.bulkPut(backup.categories);
      }
      if (backup.tags && backup.tags.length > 0) {
        await db.tags.bulkPut(backup.tags);
      }
      if (backup.collections && backup.collections.length > 0) {
        await db.collections.bulkPut(backup.collections);
      }
      if (processedResources.length > 0) {
        await db.resources.bulkPut(processedResources);
      }
    });

    return { count: processedResources.length };
  },

  async clearVault(): Promise<void> {
    await db.transaction('rw', [db.resources, db.categories, db.tags, db.collections], async () => {
      await db.resources.clear();
      await db.categories.clear();
      await db.tags.clear();
      await db.collections.clear();
    });
  },

  async getStorageStats() {
    const resourceCount = await db.resources.count();
    const categoryCount = await db.categories.count();
    const tagCount = await db.tags.count();
    const collectionCount = await db.collections.count();
    const favCount = await db.resources.where('favorite').equals(1).count();

    const resources = await db.resources.toArray();
    let totalImages = 0;
    let typeCounts: Record<string, number> = {};

    resources.forEach((r) => {
      if (r.images) totalImages += r.images.length;
      typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
    });

    // Estimate total size in KB
    const jsonStr = JSON.stringify(resources);
    const estimatedKB = Math.round(jsonStr.length / 1024);

    return {
      resourceCount,
      categoryCount,
      tagCount,
      collectionCount,
      favCount,
      totalImages,
      typeCounts,
      estimatedKB,
    };
  },
};
