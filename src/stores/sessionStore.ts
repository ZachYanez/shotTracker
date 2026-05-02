import { Platform } from 'react-native';
import { create } from 'zustand';

import {
  advanceCalibrationTracker,
  createInitialCalibrationReadiness,
  createInitialCalibrationTracker,
  createManualCalibrationReadiness,
  snapshotCalibrationReadiness,
  type CalibrationTracker,
} from '@/features/session/calibrationReadiness';
import { defaultSessionConfig } from '@/features/session/sessionConfig';
import { persistSessionBundle } from '@/lib/db/localSessions';
import { createLocalId } from '@/lib/utils/id';
import { useSyncStore } from '@/stores/syncStore';
import type {
  CalibrationReadiness,
  HooperProfile,
  HoopROI,
  LiveSessionStats,
  NativeFrameResult,
  NativeFrameTelemetrySample,
  NativeWarning,
  SessionConfig,
  SessionSummary,
  ShotEvent,
  ShooterSeed,
} from '@/types/session';

const MAX_NATIVE_TELEMETRY_SAMPLES = 240;
const WARNING_TELEMETRY_THROTTLE_MS = 1000;

const initialHoopROI: HoopROI = {
  x: 0.62,
  y: 0.16,
  width: 0.18,
  height: 0.12,
};

const initialShooterSeed: ShooterSeed = {
  primaryHooperId: 'default-hooper',
  initialBox: {
    x: 0.2,
    y: 0.3,
    width: 0.28,
    height: 0.5,
  },
  trackedHoopers: [],
};

function createInitialLiveStats(): LiveSessionStats {
  return {
    attempts: 0,
    makes: 0,
    fgPct: 0,
    currentStreak: 0,
    bestStreak: 0,
    warnings: [],
  };
}

type ActiveSession = {
  id: string;
  startedAt: string;
  startedAtMs: number;
};

type ProcessedNativeEventMap = Record<string, true>;

type SessionStore = {
  isRunning: boolean;
  activeSession?: ActiveSession;
  sessionConfig: SessionConfig;
  hoopROI: HoopROI;
  shooterSeed?: ShooterSeed;
  liveStats: LiveSessionStats;
  shotEvents: ShotEvent[];
  nativeFrameSamples: NativeFrameTelemetrySample[];
  latestFrameResult?: NativeFrameResult;
  calibrationTracker: CalibrationTracker;
  calibrationReadiness: CalibrationReadiness;
  savedCalibrationReadiness?: CalibrationReadiness;
  processedNativeEvents: ProcessedNativeEventMap;
  lastNativeTelemetrySignature?: string;
  lastNativeTelemetryAtMs?: number;
  lastSummary?: SessionSummary;
  beginSession: () => void;
  finishSession: () => Promise<SessionSummary>;
  recordMockShot: (made: boolean) => void;
  recordProcessorWarning: (warning: NativeWarning) => void;
  ingestNativeFrameResult: (result: NativeFrameResult) => void;
  resetCalibrationPreview: () => void;
  scanHooperFromLatestFrame: () => void;
  clearScannedHoopers: () => void;
  setCalibration: (input: { hoopROI: HoopROI; shooterSeed?: ShooterSeed; manual?: boolean }) => void;
};

function createActiveSession(): ActiveSession {
  const startedAt = new Date().toISOString();

  return {
    id: createLocalId('session'),
    startedAt,
    startedAtMs: Date.parse(startedAt),
  };
}

function buildSummary(activeSession: ActiveSession | undefined, liveStats: LiveSessionStats): SessionSummary {
  const startedAt = activeSession?.startedAt ?? new Date().toISOString();
  const endedAt = new Date().toISOString();
  const durationSeconds = Math.max(
    1,
    Math.round((Date.parse(endedAt) - (activeSession?.startedAtMs ?? Date.now())) / 1000),
  );

  return {
    id: activeSession?.id ?? createLocalId('session'),
    startedAt,
    endedAt,
    durationSeconds,
    drillType: 'solo_session',
    totalAttempts: liveStats.attempts,
    totalMakes: liveStats.makes,
    fgPct: liveStats.fgPct,
    currentStreak: liveStats.currentStreak,
    bestStreak: liveStats.bestStreak,
    status: 'completed',
    syncState: 'pending',
  };
}

function calculateFgPct(makes: number, attempts: number) {
  if (attempts <= 0) {
    return 0;
  }

  return Number(((makes / attempts) * 100).toFixed(1));
}

function createShotEvent(
  sessionId: string,
  timestampMs: number,
  eventType: ShotEvent['eventType'],
  confidence: number,
): ShotEvent {
  return {
    id: createLocalId(eventType),
    sessionId,
    timestampMs,
    eventType,
    confidence,
  };
}

function createNativeFrameTelemetrySample(
  sessionId: string,
  result: NativeFrameResult,
  trigger: NativeFrameTelemetrySample['trigger'],
): NativeFrameTelemetrySample {
  return {
    id: createLocalId('frame'),
    sessionId,
    timestampMs: result.timestampMs,
    trigger,
    eventTypes: Array.from(new Set(result.events.map((event) => event.type))),
    warnings: result.warnings,
    shooter: result.shooter
      ? {
          tracked: result.shooter.tracked,
          box: result.shooter.box,
          confidence: result.shooter.confidence,
        }
      : undefined,
    ball: result.ball
      ? {
          detected: result.ball.detected,
          box: result.ball.box,
          velocity: result.ball.velocity,
          confidence: result.ball.confidence,
        }
      : undefined,
    rim: result.rim
      ? {
          detected: result.rim.detected,
          box: result.rim.box,
          confidence: result.rim.confidence,
        }
      : undefined,
  };
}

function createHooperProfileFromFrameResult(result: NativeFrameResult, existingCount: number): HooperProfile | null {
  if (!result.shooter?.tracked || !result.shooter.box) {
    return null;
  }

  return {
    id: createLocalId('hooper'),
    label: existingCount === 0 ? 'Primary hooper' : `Hooper ${existingCount + 1}`,
    scannedAt: new Date().toISOString(),
    initialBox: result.shooter.box,
    torsoColor: result.shooter.appearance?.torsoColor,
    confidence: result.shooter.confidence,
  };
}

function buildShooterSeedWithHooper(previousSeed: ShooterSeed | undefined, hooper: HooperProfile): ShooterSeed {
  const trackedHoopers = [...(previousSeed?.trackedHoopers ?? []), hooper];
  const primaryHooper = trackedHoopers[0];

  return {
    ...previousSeed,
    primaryHooperId: primaryHooper.id,
    initialBox: primaryHooper.initialBox,
    torsoColor: primaryHooper.torsoColor,
    trackedHoopers,
  };
}

function getTelemetrySignature(result: NativeFrameResult) {
  const eventTypes = result.events.map((event) => event.type).sort().join(',');
  const warnings = [...result.warnings].sort().join(',');

  return `${eventTypes}|${warnings}`;
}

function shouldKeepNativeTelemetrySample(
  result: NativeFrameResult,
  state: Pick<SessionStore, 'lastNativeTelemetryAtMs' | 'lastNativeTelemetrySignature'>,
) {
  if (result.events.length > 0) {
    return true;
  }

  if (result.warnings.length === 0) {
    return false;
  }

  const signature = getTelemetrySignature(result);
  const lastAt = state.lastNativeTelemetryAtMs ?? Number.NEGATIVE_INFINITY;

  return signature !== state.lastNativeTelemetrySignature || result.timestampMs - lastAt >= WARNING_TELEMETRY_THROTTLE_MS;
}

function normalizeFrameTimestampMs(timestampMs: number, activeSession?: ActiveSession) {
  if (!activeSession) {
    return Math.max(0, Math.round(timestampMs));
  }

  if (timestampMs > activeSession.startedAtMs) {
    return Math.max(0, Math.round(timestampMs - activeSession.startedAtMs));
  }

  return Math.max(0, Math.round(timestampMs));
}

function applyScoredEvent(stats: LiveSessionStats, eventType: ShotEvent['eventType']): LiveSessionStats {
  switch (eventType) {
    case 'attempt': {
      const attempts = stats.attempts + 1;
      return {
        ...stats,
        attempts,
        fgPct: calculateFgPct(stats.makes, attempts),
      };
    }
    case 'make': {
      const makes = stats.makes + 1;
      const currentStreak = stats.currentStreak + 1;
      return {
        ...stats,
        makes,
        currentStreak,
        bestStreak: Math.max(stats.bestStreak, currentStreak),
        fgPct: calculateFgPct(makes, stats.attempts),
      };
    }
    case 'miss':
      return {
        ...stats,
        currentStreak: 0,
      };
    case 'release':
    default:
      return stats;
  }
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  isRunning: false,
  activeSession: undefined,
  sessionConfig: defaultSessionConfig,
  hoopROI: initialHoopROI,
  shooterSeed: initialShooterSeed,
  liveStats: createInitialLiveStats(),
  shotEvents: [],
  nativeFrameSamples: [],
  latestFrameResult: undefined,
  calibrationReadiness: createInitialCalibrationReadiness(),
  savedCalibrationReadiness: undefined,
  processedNativeEvents: {},
  lastNativeTelemetrySignature: undefined,
  lastNativeTelemetryAtMs: undefined,
  lastSummary: undefined,
  calibrationTracker: createInitialCalibrationTracker(),
  beginSession: () => {
    if (get().isRunning) {
      return;
    }

    set({
      activeSession: createActiveSession(),
      isRunning: true,
      liveStats: createInitialLiveStats(),
      latestFrameResult: undefined,
      nativeFrameSamples: [],
      processedNativeEvents: {},
      lastNativeTelemetrySignature: undefined,
      lastNativeTelemetryAtMs: undefined,
      shotEvents: [],
    });
  },
  finishSession: async () => {
    const state = get();
    const summary = buildSummary(state.activeSession, state.liveStats);

    try {
      await persistSessionBundle({
        session: summary,
        shotEvents: state.shotEvents,
        nativeFrameSamples: state.nativeFrameSamples,
        calibration: {
          hoopROI: state.hoopROI,
          shooterSeed: state.shooterSeed,
          deviceInfo: {
            platform: Platform.OS,
            processEveryNthFrame: state.sessionConfig.processEveryNthFrame,
            targetFps: state.sessionConfig.targetFps,
            calibrationReadiness: state.savedCalibrationReadiness,
          },
        },
      });
      await useSyncStore.getState().refreshCounts();
    } catch (error) {
      console.warn('Session persistence failed', error);
    }

    set({
      activeSession: undefined,
      isRunning: false,
      liveStats: createInitialLiveStats(),
      latestFrameResult: undefined,
      nativeFrameSamples: [],
      processedNativeEvents: {},
      lastNativeTelemetrySignature: undefined,
      lastNativeTelemetryAtMs: undefined,
      shotEvents: [],
      lastSummary: summary,
    });

    return summary;
  },
  recordMockShot: (made) =>
    set((state) => {
      if (!state.activeSession) {
        return state;
      }

      const attempts = state.liveStats.attempts + 1;
      const makes = state.liveStats.makes + (made ? 1 : 0);
      const currentStreak = made ? state.liveStats.currentStreak + 1 : 0;
      const bestStreak = Math.max(state.liveStats.bestStreak, currentStreak);
      const timestampMs = Math.max(0, Date.now() - state.activeSession.startedAtMs);

      return {
        liveStats: {
          attempts,
          makes,
          fgPct: calculateFgPct(makes, attempts),
          currentStreak,
          bestStreak,
          warnings: [],
        },
        shotEvents: [
          ...state.shotEvents,
          createShotEvent(state.activeSession.id, timestampMs, 'attempt', 1),
          createShotEvent(state.activeSession.id, timestampMs + 1, made ? 'make' : 'miss', 1),
        ],
      };
    }),
  recordProcessorWarning: (warning) =>
    set((state) => ({
      liveStats: {
        ...state.liveStats,
        warnings: [warning],
      },
    })),
  ingestNativeFrameResult: (result) =>
    set((state) => {
      const nextCalibrationTracker = advanceCalibrationTracker(state.calibrationTracker, result);
      const normalizedTimestampMs = normalizeFrameTimestampMs(result.timestampMs, state.activeSession);
      const nextLatestFrameResult: NativeFrameResult = {
        ...result,
        timestampMs: normalizedTimestampMs,
      };

      if (!state.activeSession) {
        return {
          calibrationReadiness: nextCalibrationTracker.readiness,
          calibrationTracker: nextCalibrationTracker,
          latestFrameResult: nextLatestFrameResult,
        };
      }

      let nextLiveStats: LiveSessionStats = {
        ...state.liveStats,
        warnings: result.warnings,
      };
      let nextShotEvents = state.shotEvents;
      let nextProcessedNativeEvents = state.processedNativeEvents;
      let nextNativeFrameSamples = state.nativeFrameSamples;
      let nextLastNativeTelemetrySignature = state.lastNativeTelemetrySignature;
      let nextLastNativeTelemetryAtMs = state.lastNativeTelemetryAtMs;

      for (const event of result.events) {
        const eventKey = `${normalizedTimestampMs}:${event.type}`;

        if (nextProcessedNativeEvents[eventKey]) {
          continue;
        }

        if (nextProcessedNativeEvents === state.processedNativeEvents) {
          nextProcessedNativeEvents = { ...state.processedNativeEvents };
        }

        nextProcessedNativeEvents[eventKey] = true;
        nextShotEvents = [
          ...nextShotEvents,
          createShotEvent(state.activeSession.id, normalizedTimestampMs, event.type, event.confidence),
        ];
        nextLiveStats = applyScoredEvent(nextLiveStats, event.type);
      }

      if (shouldKeepNativeTelemetrySample(nextLatestFrameResult, state)) {
        const trigger = nextLatestFrameResult.events.length > 0 ? 'event' : 'warning';
        nextNativeFrameSamples = [
          ...state.nativeFrameSamples,
          createNativeFrameTelemetrySample(state.activeSession.id, nextLatestFrameResult, trigger),
        ].slice(-MAX_NATIVE_TELEMETRY_SAMPLES);
        nextLastNativeTelemetrySignature = getTelemetrySignature(nextLatestFrameResult);
        nextLastNativeTelemetryAtMs = normalizedTimestampMs;
      }

      return {
        calibrationReadiness: nextCalibrationTracker.readiness,
        calibrationTracker: nextCalibrationTracker,
        latestFrameResult: nextLatestFrameResult,
        liveStats: nextLiveStats,
        nativeFrameSamples: nextNativeFrameSamples,
        processedNativeEvents: nextProcessedNativeEvents,
        lastNativeTelemetrySignature: nextLastNativeTelemetrySignature,
        lastNativeTelemetryAtMs: nextLastNativeTelemetryAtMs,
        shotEvents: nextShotEvents,
      };
    }),
  resetCalibrationPreview: () =>
    set({
      latestFrameResult: undefined,
      calibrationReadiness: createInitialCalibrationReadiness(),
      calibrationTracker: createInitialCalibrationTracker(),
    }),
  scanHooperFromLatestFrame: () =>
    set((state) => {
      if (!state.latestFrameResult) {
        return state;
      }

      const hooper = createHooperProfileFromFrameResult(
        state.latestFrameResult,
        state.shooterSeed?.trackedHoopers?.length ?? 0,
      );

      if (!hooper) {
        return state;
      }

      return {
        shooterSeed: buildShooterSeedWithHooper(state.shooterSeed, hooper),
      };
    }),
  clearScannedHoopers: () =>
    set({
      shooterSeed: initialShooterSeed,
    }),
  setCalibration: ({ hoopROI, shooterSeed, manual }) =>
    set((state) => ({
      hoopROI,
      shooterSeed,
      savedCalibrationReadiness: manual
        ? createManualCalibrationReadiness(state.calibrationReadiness)
        : snapshotCalibrationReadiness(state.calibrationReadiness),
    })),
}));
