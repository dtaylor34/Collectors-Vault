import { useState, useCallback, useMemo } from 'react';
import {
  SEED_COLLECTIONS, getCollectionValue, getItemPrice,
  type Collection, type CollectionItem, type CollectibleType,
} from '../lib/data';

/**
 * Collection management hook.
 * Uses local seed data for demo; swap in Supabase queries for production.
 */
export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>(SEED_COLLECTIONS);

  const totalValue = useMemo(
    () => collections.reduce((s, c) => s + getCollectionValue(c), 0),
    [collections]
  );

  const totalItems = useMemo(
    () => collections.reduce((s, c) => s + c.items.length, 0),
    [collections]
  );

  const createCollection = useCallback((
    name: string,
    privacy: 'private' | 'public',
    collectibleType: CollectibleType
  ) => {
    const nc: Collection = {
      id: `c-${Date.now()}`,
      name,
      privacy,
      collectibleType,
      items: [],
      createdAt: new Date().toISOString(),
    };
    setCollections(prev => [...prev, nc]);
    return nc;
  }, []);

  const addItem = useCallback((collectionId: string, item: Omit<CollectionItem, 'id' | 'createdAt'>) => {
    const newItem: CollectionItem = {
      ...item,
      id: `i-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCollections(prev =>
      prev.map(c =>
        c.id === collectionId
          ? { ...c, items: [...c.items, newItem] }
          : c
      )
    );
    return newItem;
  }, []);

  const removeItem = useCallback((collectionId: string, itemId: string) => {
    setCollections(prev =>
      prev.map(c =>
        c.id === collectionId
          ? { ...c, items: c.items.filter(i => i.id !== itemId) }
          : c
      )
    );
  }, []);

  const deleteCollection = useCallback((collectionId: string) => {
    setCollections(prev => prev.filter(c => c.id !== collectionId));
  }, []);

  const updatePrivacy = useCallback((collectionId: string, privacy: 'private' | 'public') => {
    setCollections(prev =>
      prev.map(c => c.id === collectionId ? { ...c, privacy } : c)
    );
  }, []);

  return {
    collections,
    totalValue,
    totalItems,
    createCollection,
    addItem,
    removeItem,
    deleteCollection,
    updatePrivacy,
  };
}
