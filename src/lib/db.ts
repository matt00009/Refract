import PocketBase from 'pocketbase';
import type { HistoryEntry, AnalysisResult } from '../types/analysis';

/**
 * PocketBase Client for SOTA Cloud Persistence.
 * This client handles Real-time Subscriptions and Zero-Knowledge Auth for Phase 3.
 */
export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090');

// Disable auto-cancellation for multiple parallel requests in the same hook
pb.autoCancellation(false);

/**
 * Interface for the PocketBase 'history' collection record.
 */
export interface HistoryRecord extends HistoryEntry {
  user: string;
}

/**
 * Helper to check if a user is currently authenticated with PocketBase.
 */
export const isAuthenticated = () => pb.authStore.isValid;

/**
 * Helper to get the current user ID.
 */
export const currentUserId = () => pb.authStore.model?.id;

/**
 * Generates a public cloud report for sharing.
 */
export async function createSharedReport(result: AnalysisResult, lang: string) {
  if (!isAuthenticated()) {
    throw new Error('Vous devez être connecté pour créer un rapport public.');
  }

  return pb.collection('reports').create({
    user: currentUserId(),
    result,
    lang,
    ts: Date.now(),
    public: true
  });
}

/**
 * Real-time subscription helper for the history collection.
 */
export function subscribeToHistory(callback: (data: { action: string; record: Record<string, unknown> }) => void) {
  if (!isAuthenticated()) return () => {};

  pb.collection('history').subscribe('*', (e) => {
    callback(e as { action: string; record: Record<string, unknown> });
  });
  return () => pb.collection('history').unsubscribe('*');
}
