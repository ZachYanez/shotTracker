import { create } from 'zustand';

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
  addSession: (session: SessionSummary) => void;
};

export const useHistoryStore = create<HistoryStore>((set) => ({
  sessions: seedSessions,
  addSession: (session) =>
    set((state) => ({
      sessions: [session, ...state.sessions],
    })),
}));
