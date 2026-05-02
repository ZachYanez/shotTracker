import {
  mapLocalNativeFrameSample,
  mapLocalSession,
  mapLocalShotEvent,
  mapSessionCalibration,
} from '@/lib/models/mappers';
import type {
  LocalNativeFrameSampleRow,
  LocalSessionRow,
  LocalShotEventRow,
  SessionCalibrationRow,
} from '@/types/api';
import type {
  NativeFrameTelemetrySample,
  SessionCalibrationPacket,
  SessionDetails,
  SessionSummary,
  ShotEvent,
} from '@/types/session';

import {
  calibrationQueries,
  nativeFrameSampleQueries,
  sessionQueries,
  shotEventQueries,
  syncQueries,
} from './queries';
import { getDatabase } from './sqlite';

type PersistSessionBundleInput = {
  session: SessionSummary;
  shotEvents: ShotEvent[];
  calibration?: SessionCalibrationPacket;
  nativeFrameSamples?: NativeFrameTelemetrySample[];
};

type PendingSyncCounts = {
  pendingSessions: number;
  pendingEvents: number;
};

function serializeJson(value: unknown) {
  if (value == null) {
    return null;
  }

  return JSON.stringify(value);
}

function toSessionParams(session: SessionSummary) {
  return [
    session.id,
    session.startedAt,
    session.endedAt ?? null,
    session.durationSeconds,
    session.drillType,
    session.totalAttempts,
    session.totalMakes,
    session.fgPct,
    session.currentStreak,
    session.bestStreak,
    session.status,
    session.syncState,
  ] as const;
}

function toNativeFrameSampleParams(sample: NativeFrameTelemetrySample) {
  return [
    sample.id,
    sample.sessionId,
    sample.timestampMs,
    sample.trigger,
    JSON.stringify(sample.eventTypes),
    JSON.stringify(sample.warnings),
    serializeJson(sample.shooter?.box),
    sample.shooter?.confidence ?? null,
    sample.shooter?.tracked ? 1 : 0,
    serializeJson(sample.ball?.box),
    serializeJson(sample.ball?.velocity),
    sample.ball?.confidence ?? null,
    sample.ball?.detected ? 1 : 0,
    serializeJson(sample.rim?.box),
    sample.rim?.confidence ?? null,
    sample.rim?.detected ? 1 : 0,
  ] as const;
}

export async function listLocalSessions(limit = 100) {
  const database = await getDatabase();
  const rows = await database.getAllAsync<LocalSessionRow>(sessionQueries.recentLocalSessions, limit);

  return rows.map(mapLocalSession);
}

export async function getLocalSessionDetails(sessionId: string): Promise<SessionDetails | null> {
  const database = await getDatabase();
  const [sessionRow, shotEventRows, calibrationRow, nativeFrameSampleRows] = await Promise.all([
    database.getFirstAsync<LocalSessionRow>(sessionQueries.localSessionById, sessionId),
    database.getAllAsync<LocalShotEventRow>(shotEventQueries.localShotEventsBySessionId, sessionId),
    database.getFirstAsync<SessionCalibrationRow>(calibrationQueries.localCalibrationBySessionId, sessionId),
    database.getAllAsync<LocalNativeFrameSampleRow>(
      nativeFrameSampleQueries.localNativeFrameSamplesBySessionId,
      sessionId,
    ),
  ]);

  if (!sessionRow) {
    return null;
  }

  return {
    session: mapLocalSession(sessionRow),
    shotEvents: shotEventRows.map(mapLocalShotEvent),
    calibration: calibrationRow ? mapSessionCalibration(calibrationRow) : undefined,
    nativeFrameSamples: nativeFrameSampleRows.map(mapLocalNativeFrameSample),
  };
}

export async function seedLocalSessionsIfEmpty(sessions: SessionSummary[]) {
  if (sessions.length === 0) {
    return;
  }

  const database = await getDatabase();
  const row = await database.getFirstAsync<{ count: number }>(sessionQueries.localSessionCount);

  if ((row?.count ?? 0) > 0) {
    return;
  }

  await database.withExclusiveTransactionAsync(async (transaction) => {
    for (const session of sessions) {
      await transaction.runAsync(sessionQueries.upsertLocalSession, ...toSessionParams(session));
    }
  });
}

export async function persistSessionBundle({
  session,
  shotEvents,
  calibration,
  nativeFrameSamples = [],
}: PersistSessionBundleInput) {
  const database = await getDatabase();

  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(sessionQueries.upsertLocalSession, ...toSessionParams(session));

    if (calibration) {
      await transaction.runAsync(
        calibrationQueries.upsertLocalSessionCalibration,
        `calibration-${session.id}`,
        session.id,
        JSON.stringify(calibration.hoopROI),
        serializeJson(calibration.shooterSeed),
        serializeJson(calibration.deviceInfo),
      );
    }

    for (const shotEvent of shotEvents) {
      await transaction.runAsync(
        shotEventQueries.insertLocalShotEvent,
        shotEvent.id,
        shotEvent.sessionId,
        shotEvent.timestampMs,
        shotEvent.eventType,
        shotEvent.confidence,
        shotEvent.clipPathLocal ?? null,
        shotEvent.clipPathRemote ?? null,
        session.syncState,
      );
    }

    for (const sample of nativeFrameSamples) {
      await transaction.runAsync(
        nativeFrameSampleQueries.insertLocalNativeFrameSample,
        ...toNativeFrameSampleParams(sample),
      );
    }
  });
}

export async function getPendingSyncCounts(): Promise<PendingSyncCounts> {
  const database = await getDatabase();
  const [sessionRow, shotEventRow] = await Promise.all([
    database.getFirstAsync<{ count: number }>(syncQueries.pendingLocalSessionCount),
    database.getFirstAsync<{ count: number }>(shotEventQueries.pendingLocalShotEventCount),
  ]);

  return {
    pendingSessions: sessionRow?.count ?? 0,
    pendingEvents: shotEventRow?.count ?? 0,
  };
}
