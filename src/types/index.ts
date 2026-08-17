export type ResourceType =
  | 'Component'
  | 'Screenshot'
  | 'Code'
  | 'Prompt'
  | 'Video'
  | 'Website'
  | 'Tutorial'
  | 'Inspiration'
  | 'Animation'
  | 'Template'
  | 'Idea'
  | 'Other';

export interface CodeSnippet {
  language: string;
  content: string;
}

export interface MediaReference {
  id: string;
  dataUrl?: string; // Base64 data URL for local full resolution display
  thumbnailDataUrl?: string; // Small compressed base64 thumbnail for grid views
  url?: string; // Direct image URL link
  name?: string;
  type?: string;
}

export interface Resource {
  id: string;
  title: string;
  description?: string;
  type: ResourceType;
  categoryId?: string;
  tagIds: string[];
  collectionIds: string[];
  images?: MediaReference[];
  videoUrl?: string;
  sourceUrl?: string;
  code?: CodeSnippet;
  prompt?: string;
  notes?: string;
  favorite: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon: string; // Lucide icon name or emoji
  color: string; // Hex or tailwind color class
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: number;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  resourceIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface VaultBackup {
  version: number;
  exportedAt: string;
  resources: Resource[];
  categories: Category[];
  tags: Tag[];
  collections: Collection[];
}

export type SortOption =
  | 'recently_added'
  | 'oldest'
  | 'recently_updated'
  | 'alphabetical'
  | 'favorites';

export interface FilterState {
  searchQuery: string;
  type: ResourceType | 'All';
  categoryId: string | 'All';
  tagId: string | 'All';
  collectionId: string | 'All';
  favoritesOnly: boolean;
  sortBy: SortOption;
}
