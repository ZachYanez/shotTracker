import { create } from 'zustand';

import { getPendingSyncCounts } from '@/lib/db/localSessions';
import { syncPendingSessionsToSupabase, type SessionSyncResult } from '@/lib/supabase/sessionSync';

type SyncStore = {
  pendingSessions: number;
  pendingEvents: number;
  isSyncing: boolean;
  lastSyncedAt?: string;
  lastError?: string;
  hydrate: () => Promise<void>;
  refreshCounts: () => Promise<void>;
  syncNow: () => Promise<SessionSyncResult>;
};

export const useSyncStore = create<SyncStore>((set) => ({
  pendingSessions: 0,
  pendingEvents: 0,
  isSyncing: false,
  lastSyncedAt: undefined,
  lastError: undefined,
  hydrate: async () => {
    try {
      const counts = await getPendingSyncCounts();
      set(counts);
    } catch (error) {
      console.warn('Sync hydration failed', error);
    }
  },
  refreshCounts: async () => {
    try {
      const counts = await getPendingSyncCounts();
      set(counts);
    } catch (error) {
      console.warn('Sync counts refresh failed', error);
    }
  },
  syncNow: async () => {
    set({ isSyncing: true, lastError: undefined });

    try {
      const result = await syncPendingSessionsToSupabase();
      const counts = await getPendingSyncCounts();

      set({
        ...counts,
        isSyncing: false,
        lastSyncedAt: new Date().toISOString(),
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sync failed.';
      const counts = await getPendingSyncCounts().catch(() => ({
        pendingSessions: 0,
        pendingEvents: 0,
      }));

      set({
        ...counts,
        isSyncing: false,
        lastError: message,
      });

      throw error;
    }
  },
}));
