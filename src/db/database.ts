import Dexie, { type Table } from 'dexie';
import type { Resource, Category, Tag, Collection } from '../types';

export class ComponentVaultDatabase extends Dexie {
  resources!: Table<Resource, string>;
  categories!: Table<Category, string>;
  tags!: Table<Tag, string>;
  collections!: Table<Collection, string>;

  constructor() {
    super('ComponentVaultDB');

    this.version(1).stores({
      resources: 'id, title, type, categoryId, *tagIds, *collectionIds, favorite, createdAt, updatedAt',
      categories: 'id, name, createdAt',
      tags: 'id, name, createdAt',
      collections: 'id, name, createdAt, updatedAt',
    });
  }
}

export const db = new ComponentVaultDatabase();
