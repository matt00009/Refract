import type { HistoryEntry } from '../types/analysis';

const STORAGE_KEY = 'refract_premium_history';
const LIMIT = 15;

function generateId(): string {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    try { return `rf-${window.crypto.randomUUID()}`; } catch { /* fallback below */ }
  }
  return `rf-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveToHistory(entry: Omit<HistoryEntry, 'id'>): HistoryEntry {
  const current = loadHistory();
  const item: HistoryEntry = { ...entry, id: generateId() };
  const updated = [item, ...current].slice(0, LIMIT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return item;
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportHistoryJSON(): void {
  const data = loadHistory();
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
