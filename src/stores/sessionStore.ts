import { create } from 'zustand';

import { defaultSessionConfig } from '@/features/session/sessionConfig';
import type { HoopROI, LiveSessionStats, NativeWarning, SessionConfig, SessionSummary, ShooterSeed } from '@/types/session';

const initialHoopROI: HoopROI = {
  x: 0.62,
  y: 0.16,
  width: 0.18,
  height: 0.12,
};

const initialLiveStats: LiveSessionStats = {
  attempts: 0,
  makes: 0,
  fgPct: 0,
  currentStreak: 0,
  warnings: [],
};

type SessionStore = {
  isRunning: boolean;
  sessionConfig: SessionConfig;
  hoopROI: HoopROI;
  shooterSeed?: ShooterSeed;
  liveStats: LiveSessionStats;
  lastSummary?: SessionSummary;
  beginSession: () => void;
  finishSession: () => SessionSummary;
  recordMockShot: (made: boolean, warning?: NativeWarning) => void;
  setCalibration: (input: { hoopROI: HoopROI; shooterSeed?: ShooterSeed }) => void;
};

function buildSummary(liveStats: LiveSessionStats): SessionSummary {
  const startedAt = new Date().toISOString();

  return {
    id: `local-${Date.now()}`,
    startedAt,
    endedAt: startedAt,
    durationSeconds: 900,
    drillType: 'solo_session',
    totalAttempts: liveStats.attempts,
    totalMakes: liveStats.makes,
    fgPct: liveStats.fgPct,
    currentStreak: liveStats.currentStreak,
    bestStreak: liveStats.currentStreak,
    status: 'completed',
    syncState: 'pending',
  };
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  isRunning: false,
  sessionConfig: defaultSessionConfig,
  hoopROI: initialHoopROI,
  shooterSeed: {
    initialBox: {
      x: 0.2,
      y: 0.3,
      width: 0.28,
      height: 0.5,
    },
  },
  liveStats: initialLiveStats,
  lastSummary: undefined,
  beginSession: () =>
    set({
      isRunning: true,
      liveStats: initialLiveStats,
    }),
  finishSession: () => {
    const summary = buildSummary(get().liveStats);

    set({
      isRunning: false,
      liveStats: initialLiveStats,
      lastSummary: summary,
    });

    return summary;
  },
  recordMockShot: (made, warning) =>
    set((state) => {
      const attempts = state.liveStats.attempts + 1;
      const makes = state.liveStats.makes + (made ? 1 : 0);
      const currentStreak = made ? state.liveStats.currentStreak + 1 : 0;

      return {
        liveStats: {
          attempts,
          makes,
          fgPct: Number(((makes / attempts) * 100).toFixed(1)),
          currentStreak,
          warnings: warning ? [warning] : [],
        },
      };
    }),
  setCalibration: ({ hoopROI, shooterSeed }) =>
    set({
      hoopROI,
      shooterSeed,
    }),
}));
