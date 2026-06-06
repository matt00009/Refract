import type { HistoryEntry } from '../types/analysis';
import { pb, isAuthenticated, currentUserId } from './db';

const STORAGE_KEY = 'refract_premium_history';

/** Maximum number of history entries stored. */
export const LIMIT = 15;

/**
 * Loads all history entries. 
 * Combines localStorage with PocketBase if authenticated.
 */
export async function loadHistory(): Promise<HistoryEntry[]> {
  // 1. Load from LocalStorage (Primary for fast initial render)
  let localData: HistoryEntry[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    localData = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    localData = [];
  }

  // 2. If authenticated, attempt to fetch latest from PocketBase
  if (isAuthenticated()) {
    try {
      const records = await pb.collection('history').getList<HistoryEntry>(1, LIMIT, {
        sort: '-ts',
        filter: `user = "${currentUserId()}"`
      });
      
      const cloudData = records.items;
      
      // If cloud has data, sync it back to local for future offline use
      if (cloudData.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
        return cloudData;
      }
    } catch (err) {
      console.warn('PocketBase history fetch failed, falling back to local:', err);
    }
  }

  return localData;
}

/**
 * Saves a new entry to the history. 
 * Persists to LocalStorage and attempts to sync with PocketBase.
 */
export async function saveToHistory(entry: Omit<HistoryEntry, 'id'>): Promise<HistoryEntry> {
  const current = await loadHistory();
  const ts = Date.now();
  
  // Create the record object
  const item: HistoryEntry = { ...entry, id: '', ts };

  // 1. Persist to PocketBase if authenticated
  if (isAuthenticated()) {
    try {
      const record = await pb.collection('history').create({
        ...item,
        user: currentUserId(),
      });
      item.id = record.id;
    } catch (err) {
      console.error('PocketBase save failed:', err);
      // Fallback ID for local-only entry
      item.id = `rf-${ts}-${Math.random().toString(36).substring(2, 7)}`;
    }
  } else {
    item.id = `rf-${ts}-${Math.random().toString(36).substring(2, 7)}`;
  }

  // 2. Persist to LocalStorage
  const updated = [item, ...current].slice(0, LIMIT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  
  return item;
}

/** Clears history from both LocalStorage and PocketBase. */
export async function clearHistory(): Promise<void> {
  localStorage.removeItem(STORAGE_KEY);
  
  if (isAuthenticated()) {
    try {
      // Fetch all user records to delete them
      const records = await pb.collection('history').getFullList({
        filter: `user = "${currentUserId()}"`
      });
      
      await Promise.all(records.map(r => pb.collection('history').delete(r.id)));
    } catch (err) {
      console.error('PocketBase clear failed:', err);
    }
  }
}

/**
 * Syncs legacy or offline history entries to the cloud.
 */
export async function syncLocalHistoryToCloud(): Promise<void> {
  if (!isAuthenticated()) return;
  
  const local = await loadHistory();
  if (local.length === 0) return;

  try {
    // Check which IDs are local-only (start with 'rf-')
    const localOnly = local.filter(entry => entry.id.startsWith('rf-'));
    
    await Promise.all(localOnly.map(entry => 
      pb.collection('history').create({
        ...entry,
        user: currentUserId(),
        id: undefined // Let PB generate a real ID
      })
    ));
    
    // Reload and refresh cache
    await loadHistory();
  } catch (err) {
    console.error('Cloud synchronization failed:', err);
  }
}

export function exportHistoryJSON(data: HistoryEntry[]): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `refract-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function importHistoryJSON(rawText: string): HistoryEntry[] | null {
  try {
    const parsed = JSON.parse(rawText);
    if (!Array.isArray(parsed)) return null;

    const isValid = parsed.every(
      (item): item is HistoryEntry =>
        item &&
        typeof item.id === 'string' &&
        typeof item.code === 'string' &&
        typeof item.score === 'number' &&
        item.resultCache !== undefined
    );

    if (!isValid) return null;

    const bounded = parsed.slice(0, LIMIT);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bounded));
    return bounded;
  } catch {
    return null;
  }
}
