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
  SyncState,
  ShotEvent,
} from '@/types/session';
import { createUuid } from '@/lib/utils/id';

import {
  calibrationQueries,
  localSettingsQueries,
  nativeFrameSampleQueries,
  sessionQueries,
  shotEventQueries,
  syncQueries,
} from './queries';
import { getDatabase } from './sqlite';

const SUPPRESS_SESSION_SEED_KEY = 'suppress_session_seed';

export async function deleteAllLocalSessionData() {
  const database = await getDatabase();

  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync('DELETE FROM local_native_frame_samples;');
    await transaction.runAsync('DELETE FROM local_shot_events;');
    await transaction.runAsync('DELETE FROM local_session_calibrations;');
    await transaction.runAsync('DELETE FROM local_sessions;');
    await transaction.runAsync(localSettingsQueries.upsert, SUPPRESS_SESSION_SEED_KEY, '1');
  });
}

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

export type PendingRemoteShotEvent = ShotEvent & {
  remoteId: string;
};

export type PendingRemoteSessionBundle = {
  session: SessionSummary;
  remoteSessionId: string;
  shotEvents: PendingRemoteShotEvent[];
  calibration?: SessionCalibrationPacket & {
    remoteId: string;
  };
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
    null,
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

function ensureRemoteId(existingId: string | null | undefined) {
  return existingId ?? createUuid();
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
  const suppressRow = await database.getFirstAsync<{ value: string }>(
    localSettingsQueries.getValue,
    SUPPRESS_SESSION_SEED_KEY,
  );

  if (suppressRow?.value === '1') {
    return;
  }

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
        null,
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

export async function listPendingRemoteSessionBundles(): Promise<PendingRemoteSessionBundle[]> {
  const database = await getDatabase();
  const sessionRows = await database.getAllAsync<LocalSessionRow>(sessionQueries.pendingLocalSessions);
  const bundles: PendingRemoteSessionBundle[] = [];

  for (const sessionRow of sessionRows) {
    const remoteSessionId = ensureRemoteId(sessionRow.remote_id);

    if (!sessionRow.remote_id) {
      await database.runAsync(sessionQueries.setLocalSessionRemoteId, remoteSessionId, sessionRow.id);
      sessionRow.remote_id = remoteSessionId;
    }

    const [shotEventRows, calibrationRow] = await Promise.all([
      database.getAllAsync<LocalShotEventRow>(shotEventQueries.localShotEventsBySessionId, sessionRow.id),
      database.getFirstAsync<SessionCalibrationRow>(calibrationQueries.localCalibrationBySessionId, sessionRow.id),
    ]);

    const shotEvents: PendingRemoteShotEvent[] = [];

    for (const shotEventRow of shotEventRows) {
      const remoteShotEventId = ensureRemoteId(shotEventRow.remote_id);

      if (!shotEventRow.remote_id) {
        await database.runAsync(shotEventQueries.setLocalShotEventRemoteId, remoteShotEventId, shotEventRow.id);
        shotEventRow.remote_id = remoteShotEventId;
      }

      shotEvents.push({
        ...mapLocalShotEvent(shotEventRow),
        remoteId: remoteShotEventId,
      });
    }

    let calibration: PendingRemoteSessionBundle['calibration'];

    if (calibrationRow) {
      const remoteCalibrationId = ensureRemoteId(calibrationRow.remote_id);

      if (!calibrationRow.remote_id) {
        await database.runAsync(
          calibrationQueries.setLocalSessionCalibrationRemoteId,
          remoteCalibrationId,
          calibrationRow.id,
        );
        calibrationRow.remote_id = remoteCalibrationId;
      }

      calibration = {
        ...mapSessionCalibration(calibrationRow),
        remoteId: remoteCalibrationId,
      };
    }

    bundles.push({
      session: mapLocalSession(sessionRow),
      remoteSessionId,
      shotEvents,
      calibration,
    });
  }

  return bundles;
}

export async function updateLocalSessionBundleSyncState(sessionId: string, syncState: SyncState) {
  const database = await getDatabase();

  await database.withExclusiveTransactionAsync(async (transaction) => {
    await transaction.runAsync(sessionQueries.updateLocalSessionSyncState, syncState, sessionId);
    await transaction.runAsync(shotEventQueries.updateLocalShotEventsSyncStateBySessionId, syncState, sessionId);
  });
}
