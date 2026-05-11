import {
  listPendingRemoteSessionBundles,
  updateLocalSessionBundleSyncState,
  type PendingRemoteSessionBundle,
} from '@/lib/db/localSessions';

import { getSupabaseClient } from './client';

export type SessionSyncResult = {
  syncedSessions: number;
  failedSessions: number;
  syncedEvents: number;
};

function buildRemoteSessionPayload(bundle: PendingRemoteSessionBundle, userId: string) {
  return {
    id: bundle.remoteSessionId,
    user_id: userId,
    started_at: bundle.session.startedAt,
    ended_at: bundle.session.endedAt ?? null,
    duration_seconds: bundle.session.durationSeconds,
    drill_type: bundle.session.drillType,
    total_attempts: bundle.session.totalAttempts,
    total_makes: bundle.session.totalMakes,
    current_streak: bundle.session.currentStreak,
    best_streak: bundle.session.bestStreak,
    source: 'mobile',
    status: bundle.session.status,
    model_version: null,
  };
}

function buildRemoteShotEventPayload(bundle: PendingRemoteSessionBundle, userId: string) {
  return bundle.shotEvents.map((event) => ({
    id: event.remoteId,
    session_id: bundle.remoteSessionId,
    user_id: userId,
    timestamp_ms: event.timestampMs,
    event_type: event.eventType,
    confidence: event.confidence,
    clip_path: event.clipPathRemote ?? null,
  }));
}

function buildRemoteCalibrationPayload(bundle: PendingRemoteSessionBundle) {
  if (!bundle.calibration) {
    return null;
  }

  return {
    id: bundle.calibration.remoteId,
    session_id: bundle.remoteSessionId,
    hoop_roi: bundle.calibration.hoopROI,
    shooter_seed: bundle.calibration.shooterSeed ?? null,
    device_info: bundle.calibration.deviceInfo ?? null,
  };
}

export async function syncPendingSessionsToSupabase(): Promise<SessionSyncResult> {
  const client = getSupabaseClient();

  if (!client) {
    throw new Error('Supabase is not configured.');
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('Sign in before syncing sessions.');
  }

  const bundles = await listPendingRemoteSessionBundles();
  const result: SessionSyncResult = {
    syncedSessions: 0,
    failedSessions: 0,
    syncedEvents: 0,
  };

  for (const bundle of bundles) {
    await updateLocalSessionBundleSyncState(bundle.session.id, 'syncing');

    try {
      const sessionPayload = buildRemoteSessionPayload(bundle, user.id);
      const { error: sessionError } = await client.from('sessions').upsert(sessionPayload);

      if (sessionError) {
        throw sessionError;
      }

      const shotEventPayload = buildRemoteShotEventPayload(bundle, user.id);

      if (shotEventPayload.length > 0) {
        const { error: shotEventError } = await client.from('shot_events').upsert(shotEventPayload);

        if (shotEventError) {
          throw shotEventError;
        }
      }

      const calibrationPayload = buildRemoteCalibrationPayload(bundle);

      if (calibrationPayload) {
        const { error: calibrationError } = await client
          .from('session_calibrations')
          .upsert(calibrationPayload);

        if (calibrationError) {
          throw calibrationError;
        }
      }

      await updateLocalSessionBundleSyncState(bundle.session.id, 'synced');
      result.syncedSessions += 1;
      result.syncedEvents += bundle.shotEvents.length;
    } catch (error) {
      await updateLocalSessionBundleSyncState(bundle.session.id, 'failed');
      result.failedSessions += 1;
      console.warn('Supabase session sync failed', error);
    }
  }

  return result;
}
