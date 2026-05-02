import { create } from 'zustand';

import { getPendingSyncCounts } from '@/lib/db/localSessions';

type SyncStore = {
  pendingSessions: number;
  pendingEvents: number;
  isSyncing: boolean;
  lastSyncedAt?: string;
  hydrate: () => Promise<void>;
  refreshCounts: () => Promise<void>;
  markSyncStarted: () => void;
  markSyncFinished: () => void;
};

export const useSyncStore = create<SyncStore>((set) => ({
  pendingSessions: 0,
  pendingEvents: 0,
  isSyncing: false,
  lastSyncedAt: undefined,
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
  markSyncStarted: () => set({ isSyncing: true }),
  markSyncFinished: () =>
    set({
      isSyncing: false,
      pendingSessions: 0,
      pendingEvents: 0,
      lastSyncedAt: new Date().toISOString(),
    }),
}));
