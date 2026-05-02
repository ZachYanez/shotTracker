import { create } from 'zustand';

import { listLocalSessions, seedLocalSessionsIfEmpty } from '@/lib/db/localSessions';
import type { SessionSummary } from '@/types/session';

const seedSessions: SessionSummary[] = [
  {
    id: 'session-2026-03-10',
    startedAt: '2026-03-10T18:15:00.000Z',
    endedAt: '2026-03-10T18:47:00.000Z',
    durationSeconds: 1920,
    drillType: 'solo_session',
    totalAttempts: 100,
    totalMakes: 68,
    fgPct: 68,
    currentStreak: 4,
    bestStreak: 8,
    status: 'completed',
    syncState: 'synced',
  },
  {
    id: 'session-2026-03-08',
    startedAt: '2026-03-08T17:05:00.000Z',
    endedAt: '2026-03-08T17:34:00.000Z',
    durationSeconds: 1740,
    drillType: 'solo_session',
    totalAttempts: 95,
    totalMakes: 59,
    fgPct: 62.1,
    currentStreak: 2,
    bestStreak: 6,
    status: 'completed',
    syncState: 'synced',
  },
  {
    id: 'session-2026-03-06',
    startedAt: '2026-03-06T17:20:00.000Z',
    endedAt: '2026-03-06T17:58:00.000Z',
    durationSeconds: 2280,
    drillType: 'solo_session',
    totalAttempts: 110,
    totalMakes: 72,
    fgPct: 65.5,
    currentStreak: 3,
    bestStreak: 9,
    status: 'completed',
    syncState: 'pending',
  },
];

type HistoryStore = {
  sessions: SessionSummary[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  addSession: (session: SessionSummary) => void;
};

function sortSessions(sessions: SessionSummary[]) {
  return [...sessions].sort(
    (left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime(),
  );
}

function mergeSession(sessions: SessionSummary[], incoming: SessionSummary) {
  const next = sessions.filter((session) => session.id !== incoming.id);
  return sortSessions([incoming, ...next]);
}

export const useHistoryStore = create<HistoryStore>((set) => ({
  sessions: [],
  isHydrated: false,
  hydrate: async () => {
    try {
      await seedLocalSessionsIfEmpty(seedSessions);
      const sessions = await listLocalSessions();

      set({
        sessions,
        isHydrated: true,
      });
    } catch (error) {
      console.warn('History hydration failed', error);
      set({
        sessions: sortSessions(seedSessions),
        isHydrated: true,
      });
    }
  },
  addSession: (session) =>
    set((state) => ({
      sessions: mergeSession(state.sessions, session),
    })),
}));
