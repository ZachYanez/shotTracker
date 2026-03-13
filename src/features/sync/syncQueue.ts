export type SyncSnapshot = {
  pendingSessions: number;
  pendingEvents: number;
  isSyncing: boolean;
  lastSyncedAt?: string;
};

export function describeSyncState(snapshot: SyncSnapshot) {
  if (snapshot.isSyncing) {
    return 'Syncing local sessions to Supabase';
  }

  if (snapshot.pendingSessions > 0 || snapshot.pendingEvents > 0) {
    return `${snapshot.pendingSessions} sessions and ${snapshot.pendingEvents} events queued`;
  }

  return snapshot.lastSyncedAt
    ? `Last synced ${new Date(snapshot.lastSyncedAt).toLocaleString()}`
    : 'All caught up';
}
