import { db } from '../db/database';
import { exportDB, importInto } from 'dexie-export-import';
import { INITIAL_CATEGORIES, INITIAL_TAGS, INITIAL_COLLECTIONS, DEMO_RESOURCES } from '../db/seed';
import { isSupabaseConfigured, getSupabaseClient } from '../lib/supabase';
import type {
  Resource,
  Category,
  Tag,
  Collection,
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
    created_at: r.createdAt || Date.now(),
    updated_at: r.updatedAt || Date.now(),
  };
}

// Helper to convert Supabase row format to Resource object
function supabaseRowToResource(row: any): Resource {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    type: (row.type as ResourceType) || 'Component',
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
const MIN_SYNC_INTERVAL_MS = 5000; // 5 seconds throttle for auto-sync

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
    // 1. If Supabase is configured, pull latest data first
    if (isSupabaseConfigured()) {
      try {
        await this.syncFromSupabase({ force: false });
      } catch (err) {
        console.warn('Initial Supabase sync deferred/failed:', err);
      }
    }

    // 2. Check if local categories exist; if empty, initialize defaults
    const catCount = await db.categories.count();
    if (catCount === 0) {
      await db.categories.bulkPut(INITIAL_CATEGORIES);
      await db.tags.bulkPut(INITIAL_TAGS);
      await db.collections.bulkPut(INITIAL_COLLECTIONS);
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
      throw new Error(
        'Supabase is not configured. Please enter your credentials in Settings or Cloud Sync modal.'
      );
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
        created_at: c.createdAt || Date.now(),
      }));
      const { error } = await client.from('categories').upsert(catRows, { onConflict: 'id' });
      if (error) {
        throw new Error(
          `Failed to sync categories table in Supabase: ${error.message} (${error.code}). Make sure the 'categories' table exists with RLS permissions.`
        );
      }
    }

    // 2. Sync Tags
    if (tags.length > 0) {
      const tagRows = tags.map((t) => ({
        id: t.id,
        name: t.name,
        created_at: t.createdAt || Date.now(),
      }));
      const { error } = await client.from('tags').upsert(tagRows, { onConflict: 'id' });
      if (error) {
        throw new Error(
          `Failed to sync tags table in Supabase: ${error.message} (${error.code}). Make sure the 'tags' table exists with RLS permissions.`
        );
      }
    }

    // 3. Sync Collections
    if (collections.length > 0) {
      const colRows = collections.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || null,
        resource_ids: c.resourceIds || [],
        created_at: c.createdAt || Date.now(),
        updated_at: c.updatedAt || Date.now(),
      }));
      const { error } = await client.from('collections').upsert(colRows, { onConflict: 'id' });
      if (error) {
        throw new Error(
          `Failed to sync collections table in Supabase: ${error.message} (${error.code}). Make sure the 'collections' table exists with RLS permissions.`
        );
      }
    }

    // 4. Sync Resources in batches of 50
    const batchSize = 50;
    for (let i = 0; i < resources.length; i += batchSize) {
      const batch = resources.slice(i, i + batchSize);
      const rows = batch.map(resourceToSupabaseRow);
      const { error } = await client.from('resources').upsert(rows, { onConflict: 'id' });
      if (error) {
        throw new Error(
          `Failed to sync resources table in Supabase: ${error.message} (${error.code}). Please run the SQL schema in your Supabase SQL Editor.`
        );
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
   * Delta Sync & Caching: If local database is non-empty and lastSync exists,
   * only modified/new records (updated_at > lastSync) are fetched.
   * If local database is empty or force is true, performs a full fetch.
   */
  async syncFromSupabase(options?: {
    force?: boolean;
  }): Promise<{ resourcesCount: number; isDelta: boolean }> {
    const client = getSupabaseClient();
    if (!client || !isSupabaseConfigured()) {
      return { resourcesCount: 0, isDelta: false };
    }

    const localCount = await db.resources.count();
    const rawLastSync = localStorage.getItem(LAST_SYNC_KEY);
    const lastSyncTime = rawLastSync ? Number(rawLastSync) : null;
    const now = Date.now();

    // If local database has items and lastSync happened within 5s, throttle unless forced
    if (!options?.force && localCount > 0 && lastSyncTime && now - lastSyncTime < MIN_SYNC_INTERVAL_MS) {
      return { resourcesCount: localCount, isDelta: true };
    }

    // Only use delta sync if force is false, localCount > 0, and lastSyncTime exists
    const isDelta = Boolean(!options?.force && localCount > 0 && lastSyncTime);

    // 1. Fetch All Categories from Supabase
    try {
      const { data: remoteCats, error: catErr } = await client.from('categories').select('*');
      if (!catErr && remoteCats && remoteCats.length > 0) {
        const localCats: Category[] = remoteCats.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon || 'folder',
          color: c.color || '#6366f1',
          createdAt: Number(c.created_at || Date.now()),
        }));
        await db.categories.bulkPut(localCats);
      }
    } catch (e) {
      console.warn('Could not sync categories from Supabase:', e);
    }

    // 2. Fetch All Tags from Supabase
    try {
      const { data: remoteTags, error: tagErr } = await client.from('tags').select('*');
      if (!tagErr && remoteTags && remoteTags.length > 0) {
        const localTags: Tag[] = remoteTags.map((t) => ({
          id: t.id,
          name: t.name,
          createdAt: Number(t.created_at || Date.now()),
        }));
        await db.tags.bulkPut(localTags);
      }
    } catch (e) {
      console.warn('Could not sync tags from Supabase:', e);
    }

    // 3. Fetch All Collections from Supabase
    try {
      const { data: remoteCols, error: colErr } = await client.from('collections').select('*');
      if (!colErr && remoteCols && remoteCols.length > 0) {
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
    } catch (e) {
      console.warn('Could not sync collections from Supabase:', e);
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
            try {
              res.images = await processMediaThumbnails(res.images);
            } catch (err) {
              console.warn('Thumbnail process warning:', err);
            }
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

        if (error) {
          console.warn('Error querying chunk from Supabase:', error);
          hasMoreChunks = false;
          break;
        }

        if (!chunk || chunk.length === 0) {
          hasMoreChunks = false;
          break;
        }

        const localResources = chunk.map(supabaseRowToResource);
        for (const res of localResources) {
          if (res.images && res.images.length > 0) {
            try {
              res.images = await processMediaThumbnails(res.images);
            } catch (err) {
              console.warn('Thumbnail process warning:', err);
            }
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
    const totalLocalNow = await db.resources.count();
    return { resourcesCount: isDelta ? fetchedCount : totalLocalNow, isDelta };
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

    // Favorites only
    if (filters.favoritesOnly) {
      list = list.filter((r) => r.favorite);
    }

    // Search query
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const titleMatch = r.title.toLowerCase().includes(q);
        const descMatch = r.description ? r.description.toLowerCase().includes(q) : false;
        const notesMatch = r.notes ? r.notes.toLowerCase().includes(q) : false;
        const codeMatch = r.code?.content ? r.code.content.toLowerCase().includes(q) : false;
        const promptMatch = r.prompt ? r.prompt.toLowerCase().includes(q) : false;
        return titleMatch || descMatch || notesMatch || codeMatch || promptMatch;
      });
    }

    // Sort order
    switch (filters.sortBy) {
      case 'recently_added':
        list.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'recently_updated':
        list.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
      case 'alphabetical':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        list.sort((a, b) => b.createdAt - a.createdAt);
    }

    return list;
  },

  async getPaginatedResources(
    filters: FilterState,
    page = 1,
    pageSize = 24
  ): Promise<PaginatedResult<Resource>> {
    const allFiltered = await this.filterResources(filters);
    const totalCount = allFiltered.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const clampedPage = Math.max(1, Math.min(page, totalPages));
    const offset = (clampedPage - 1) * pageSize;
    const paginatedData = allFiltered.slice(offset, offset + pageSize);

    return {
      data: paginatedData,
      totalCount,
      page: clampedPage,
      pageSize,
      totalPages,
      hasNextPage: clampedPage < totalPages,
      hasPrevPage: clampedPage > 1,
    };
  },

  async getResourceById(id: string): Promise<Resource | undefined> {
    return await db.resources.get(id);
  },

  async saveResource(resource: Resource): Promise<void> {
    // 1. Process and generate fast thumbnails
    if (resource.images && resource.images.length > 0) {
      resource.images = await processMediaThumbnails(resource.images);
    }

    // 2. Save locally into IndexedDB
    await db.resources.put(resource);

    // 3. Write-Through Sync to Supabase in background
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        const row = resourceToSupabaseRow(resource);
        (async () => {
          try {
            const { error } = await client.from('resources').upsert([row], { onConflict: 'id' });
            if (error) {
              console.warn('Background Supabase write-through failed:', error.message);
            }
          } catch (err) {
            console.warn('Supabase write network err:', err);
          }
        })();
      }
    }
  },

  async deleteResource(id: string): Promise<void> {
    await db.resources.delete(id);

    // Also delete from collections referencing this resource
    const collections = await db.collections.toArray();
    for (const col of collections) {
      if (col.resourceIds.includes(id)) {
        col.resourceIds = col.resourceIds.filter((rId) => rId !== id);
        await db.collections.put(col);
      }
    }

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client.from('resources').delete().eq('id', id);
            if (error) console.warn('Background Supabase delete failed:', error.message);
          } catch (err) {
            console.warn('Supabase delete network err:', err);
          }
        })();
      }
    }
  },

  async toggleFavorite(id: string): Promise<boolean> {
    const resource = await db.resources.get(id);
    if (!resource) return false;
    const newFavorite = !resource.favorite;
    resource.favorite = newFavorite;
    resource.updatedAt = Date.now();
    await db.resources.put(resource);

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client
              .from('resources')
              .update({ is_favorite: newFavorite, updated_at: resource.updatedAt })
              .eq('id', id);
            if (error) console.warn('Supabase favorite sync error:', error.message);
          } catch (err) {
            console.warn('Supabase favorite err:', err);
          }
        })();
      }
    }
    return newFavorite;
  },

  async getAllCategories(): Promise<Category[]> {
    return await db.categories.orderBy('name').toArray();
  },

  async saveCategory(category: Category): Promise<void> {
    await db.categories.put(category);

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client.from('categories').upsert([
              {
                id: category.id,
                name: category.name,
                icon: category.icon || 'folder',
                color: category.color || '#6366f1',
                created_at: category.createdAt || Date.now(),
              },
            ]);
            if (error) console.warn('Supabase category sync error:', error.message);
          } catch (e) {
            console.warn(e);
          }
        })();
      }
    }
  },

  async deleteCategory(id: string): Promise<void> {
    await db.categories.delete(id);

    // Unlink from resources
    const resources = await db.resources.where('categoryId').equals(id).toArray();
    for (const res of resources) {
      res.categoryId = undefined;
      res.updatedAt = Date.now();
      await db.resources.put(res);
    }

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client.from('categories').delete().eq('id', id);
            if (error) console.warn('Supabase category delete error:', error.message);
          } catch (e) {
            console.warn(e);
          }
        })();
      }
    }
  },

  async getAllTags(): Promise<Tag[]> {
    return await db.tags.orderBy('name').toArray();
  },

  async saveTag(tag: Tag): Promise<void> {
    await db.tags.put(tag);

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client
              .from('tags')
              .upsert([{ id: tag.id, name: tag.name, created_at: tag.createdAt || Date.now() }]);
            if (error) console.warn('Supabase tag sync error:', error.message);
          } catch (e) {
            console.warn(e);
          }
        })();
      }
    }
  },

  async findOrCreateTagByName(name: string): Promise<Tag> {
    const trimmed = name.trim().toLowerCase().replace(/^#/, '');
    const existing = await db.tags.where('name').equalsIgnoreCase(trimmed).first();
    if (existing) return existing;

    const newTag: Tag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: trimmed,
      createdAt: Date.now(),
    };
    await db.tags.put(newTag);

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client
              .from('tags')
              .upsert([{ id: newTag.id, name: newTag.name, created_at: newTag.createdAt }]);
            if (error) console.warn('Supabase tag sync error:', error.message);
          } catch (e) {
            console.warn(e);
          }
        })();
      }
    }

    return newTag;
  },

  async deleteTag(id: string): Promise<void> {
    await db.tags.delete(id);

    // Remove from resources
    const resources = await db.resources.toArray();
    for (const res of resources) {
      if (res.tagIds && res.tagIds.includes(id)) {
        res.tagIds = res.tagIds.filter((tId) => tId !== id);
        res.updatedAt = Date.now();
        await db.resources.put(res);
      }
    }

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client.from('tags').delete().eq('id', id);
            if (error) console.warn('Supabase tag delete error:', error.message);
          } catch (e) {
            console.warn(e);
          }
        })();
      }
    }
  },

  async getAllCollections(): Promise<Collection[]> {
    return await db.collections.orderBy('name').toArray();
  },

  async saveCollection(collection: Collection): Promise<void> {
    await db.collections.put(collection);

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client.from('collections').upsert([
              {
                id: collection.id,
                name: collection.name,
                description: collection.description || null,
                resource_ids: collection.resourceIds || [],
                created_at: collection.createdAt || Date.now(),
                updated_at: collection.updatedAt || Date.now(),
              },
            ]);
            if (error) console.warn('Supabase collection sync error:', error.message);
          } catch (e) {
            console.warn(e);
          }
        })();
      }
    }
  },

  async deleteCollection(id: string): Promise<void> {
    await db.collections.delete(id);

    // Remove collection ID from resources
    const resources = await db.resources.toArray();
    for (const res of resources) {
      if (res.collectionIds && res.collectionIds.includes(id)) {
        res.collectionIds = res.collectionIds.filter((cId) => cId !== id);
        res.updatedAt = Date.now();
        await db.resources.put(res);
      }
    }

    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        (async () => {
          try {
            const { error } = await client.from('collections').delete().eq('id', id);
            if (error) console.warn('Supabase collection delete error:', error.message);
          } catch (e) {
            console.warn(e);
          }
        })();
      }
    }
  },

  async getStorageStats(): Promise<{
    resourceCount: number;
    categoryCount: number;
    tagCount: number;
    collectionCount: number;
    favCount: number;
    totalImages: number;
    estimatedKB: number;
  }> {
    const resources = await db.resources.toArray();
    const categories = await db.categories.toArray();
    const tags = await db.tags.toArray();
    const collections = await db.collections.toArray();

    const favCount = resources.filter((r) => r.favorite).length;
    let totalImages = 0;
    let totalBytes = 0;

    for (const r of resources) {
      if (r.images) {
        totalImages += r.images.length;
        for (const img of r.images) {
          if (img.dataUrl) totalBytes += img.dataUrl.length;
          if (img.thumbnailDataUrl) totalBytes += img.thumbnailDataUrl.length;
        }
      }
      if (r.code?.content) totalBytes += r.code.content.length;
      if (r.prompt) totalBytes += r.prompt.length;
      if (r.notes) totalBytes += r.notes.length;
    }

    return {
      resourceCount: resources.length,
      categoryCount: categories.length,
      tagCount: tags.length,
      collectionCount: collections.length,
      favCount,
      totalImages,
      estimatedKB: Math.round(totalBytes / 1024),
    };
  },

  async exportDatabase(onProgress?: (progress: { completedRows: number }) => void): Promise<Blob> {
    return await exportDB(db, {
      prettyJson: false,
      progressCallback: onProgress ? (progress) => {
        onProgress({ completedRows: progress.completedRows });
        return true;
      } : undefined,
    });
  },

  async importDatabase(fileBlob: Blob): Promise<void> {
    await db.transaction('rw', [db.resources, db.categories, db.tags, db.collections], async () => {
      await db.resources.clear();
      await db.categories.clear();
      await db.tags.clear();
      await db.collections.clear();
    });

    await importInto(db, fileBlob, {
      overwriteValues: true,
      clearTablesBeforeImport: true,
    });

    if (isSupabaseConfigured()) {
      this.syncToSupabase().catch((e) => console.warn('Supabase post-import sync err:', e));
    }
  },

  async clearAllData(): Promise<void> {
    await db.transaction('rw', [db.resources, db.categories, db.tags, db.collections], async () => {
      await db.resources.clear();
      await db.categories.clear();
      await db.tags.clear();
      await db.collections.clear();
    });
    localStorage.removeItem(LAST_SYNC_KEY);
  },
};
