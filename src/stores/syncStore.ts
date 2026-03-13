import { create } from 'zustand';

type SyncStore = {
  pendingSessions: number;
  pendingEvents: number;
  isSyncing: boolean;
  lastSyncedAt?: string;
  markSyncStarted: () => void;
  markSyncFinished: () => void;
};

export const useSyncStore = create<SyncStore>((set) => ({
  pendingSessions: 1,
  pendingEvents: 3,
  isSyncing: false,
  lastSyncedAt: '2026-03-10T19:02:00.000Z',
  markSyncStarted: () => set({ isSyncing: true }),
  markSyncFinished: () =>
    set({
      isSyncing: false,
      pendingSessions: 0,
      pendingEvents: 0,
      lastSyncedAt: new Date().toISOString(),
    }),
}));
