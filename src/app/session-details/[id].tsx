import { useEffect, useState } from 'react';

import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenShell } from '@/components/common/ScreenShell';
import { SectionCard } from '@/components/common/SectionCard';
import { formatCalibrationStatusLabel } from '@/features/session/calibrationReadiness';
import { SessionStatRow } from '@/components/sessions/SessionStatRow';
import { getLocalSessionDetails } from '@/lib/db/localSessions';
import { palette, spacing, typography } from '@/lib/theme';
import type { NativeFrameTelemetrySample, SessionDetails, ShotEvent, ShotEventType } from '@/types/session';

type LoadState = 'loading' | 'ready' | 'not_found' | 'error';

function formatSessionStatus(status: SessionDetails['session']['status']) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatStorageLabel(syncState: SessionDetails['session']['syncState']) {
  return syncState === 'synced' ? 'Cloud' : 'Local';
}

function formatOffset(timestampMs: number) {
  const totalSeconds = Math.max(0, Math.round(timestampMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `+${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatShotEventLabel(eventType: ShotEventType) {
  switch (eventType) {
    case 'attempt':
      return 'Attempt';
    case 'make':
      return 'Make';
    case 'miss':
      return 'Miss';
    case 'release':
      return 'Release';
    default:
      return eventType;
  }
}

function formatSignal(confidence?: number) {
  if (typeof confidence !== 'number') {
    return 'n/a';
  }

  return `${Math.round(confidence * 100)}%`;
}

function formatTelemetryTitle(sample: NativeFrameTelemetrySample) {
  if (sample.eventTypes.length > 0) {
    return sample.eventTypes.map(formatShotEventLabel).join(', ');
  }

  if (sample.warnings.length > 0) {
    return sample.warnings.join(', ');
  }

  return sample.trigger === 'event' ? 'Native event' : 'Native warning';
}

function formatTelemetrySignals(sample: NativeFrameTelemetrySample) {
  const ballVelocity = sample.ball?.velocity
    ? ` · vx ${sample.ball.velocity.x.toFixed(2)}, vy ${sample.ball.velocity.y.toFixed(2)}`
    : '';

  return `Shooter ${formatSignal(sample.shooter?.confidence)} · Ball ${formatSignal(
    sample.ball?.confidence,
  )}${ballVelocity} · Rim ${formatSignal(sample.rim?.confidence)}`;
}

function buildEventCounts(events: ShotEvent[]) {
  return events.reduce(
    (counts, event) => {
      counts[event.eventType] += 1;
      return counts;
    },
    {
      attempt: 0,
      make: 0,
      miss: 0,
      release: 0,
    } satisfies Record<ShotEventType, number>,
  );
}

function formatHoopROI(details: NonNullable<SessionDetails['calibration']>) {
  const { hoopROI } = details;

  return `${Math.round(hoopROI.x * 100)}% x, ${Math.round(hoopROI.y * 100)}% y, ${Math.round(
    hoopROI.width * 100,
  )}% w, ${Math.round(hoopROI.height * 100)}% h`;
}

function formatProcessorConfig(details: NonNullable<SessionDetails['calibration']>) {
  const targetFps = details.deviceInfo?.targetFps;
  const processEveryNthFrame = details.deviceInfo?.processEveryNthFrame;
  const platform = details.deviceInfo?.platform;
  const parts: string[] = [];

  if (typeof platform === 'string') {
    parts.push(platform);
  }

  if (typeof targetFps === 'number') {
    parts.push(`${targetFps} fps`);
  }

  if (typeof processEveryNthFrame === 'number') {
    parts.push(`every ${processEveryNthFrame} frame${processEveryNthFrame === 1 ? '' : 's'}`);
  }

  return parts.length > 0 ? parts.join(' / ') : 'Stored locally';
}

function getStoredCalibrationReadiness(details: NonNullable<SessionDetails['calibration']>) {
  return details.deviceInfo?.calibrationReadiness;
}

export default function SessionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const sessionId = Array.isArray(id) ? id[0] : id;
  const [details, setDetails] = useState<SessionDetails | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      if (!sessionId) {
        if (isMounted) {
          setDetails(null);
          setLoadState('not_found');
        }
        return;
      }

      setLoadState('loading');

      try {
        const nextDetails = await getLocalSessionDetails(sessionId);

        if (!isMounted) {
          return;
        }

        if (!nextDetails) {
          setDetails(null);
          setLoadState('not_found');
          return;
        }

        setDetails(nextDetails);
        setLoadState('ready');
      } catch (error) {
        console.warn('Session detail load failed', error);

        if (!isMounted) {
          return;
        }

        setDetails(null);
        setLoadState('error');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [reloadToken, sessionId]);

  if (loadState === 'loading') {
    return (
      <ScreenShell title="Session" subtitle="Loading stored session data.">
        <SectionCard title="Reading local data">
          <View style={styles.loadingState}>
            <ActivityIndicator color={palette.accent} />
            <Text style={styles.copy}>Loading session summary, shot events, and calibration data from SQLite.</Text>
          </View>
        </SectionCard>
      </ScreenShell>
    );
  }

  if (loadState === 'error') {
    return (
      <ScreenShell title="Session" subtitle="We couldn't load this stored session.">
        <SectionCard title="Read failed">
          <Text style={styles.copy}>
            The session exists in navigation history, but the local detail read did not complete.
          </Text>
          <PrimaryButton onPress={() => setReloadToken((value) => value + 1)} variant="secondary">
            Try Again
          </PrimaryButton>
        </SectionCard>
      </ScreenShell>
    );
  }

  if (!details) {
    return (
      <ScreenShell title="Session" subtitle="This session couldn't be found.">
        <SectionCard title="Not available">
          <Text style={styles.copy}>This session may have been removed or was never written to local storage.</Text>
        </SectionCard>
      </ScreenShell>
    );
  }

  const { session, shotEvents, calibration } = details;
  const eventCounts = buildEventCounts(shotEvents);
  const recentEvents = [...shotEvents].slice(-12).reverse();
  const recentNativeSamples = [...details.nativeFrameSamples].slice(-8).reverse();
  const captureSpan = shotEvents.at(-1)?.timestampMs ?? 0;
  const storedReadiness = calibration ? getStoredCalibrationReadiness(calibration) : undefined;
  const dateLabel = new Date(session.startedAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScreenShell title={`${session.fgPct.toFixed(0)}% shooting`} subtitle={dateLabel}>
      <View style={styles.metricStrip}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{session.fgPct.toFixed(1)}%</Text>
          <Text style={styles.metricLabel}>FG%</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{session.totalMakes}/{session.totalAttempts}</Text>
          <Text style={styles.metricLabel}>Shots</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{session.bestStreak}</Text>
          <Text style={styles.metricLabel}>Best streak</Text>
        </View>
      </View>

      <SectionCard title="Details">
        <SessionStatRow label="Duration" value={`${Math.round(session.durationSeconds / 60)} min`} />
        <SessionStatRow label="Best streak" value={session.bestStreak.toString()} />
        <SessionStatRow label="Stored events" value={shotEvents.length.toString()} />
        <SessionStatRow label="Debug samples" value={details.nativeFrameSamples.length.toString()} />
        <SessionStatRow label="Capture span" value={formatOffset(captureSpan)} />
        <SessionStatRow label="Status" value={formatSessionStatus(session.status)} />
        <SessionStatRow label="Saved" value={formatStorageLabel(session.syncState)} />
      </SectionCard>

      <SectionCard eyebrow="Events" title="Event breakdown">
        <View style={styles.eventGrid}>
          <View style={styles.eventCard}>
            <Text style={styles.eventValue}>{eventCounts.attempt}</Text>
            <Text style={styles.eventLabel}>Attempts</Text>
          </View>
          <View style={styles.eventCard}>
            <Text style={styles.eventValue}>{eventCounts.make}</Text>
            <Text style={styles.eventLabel}>Makes</Text>
          </View>
          <View style={styles.eventCard}>
            <Text style={styles.eventValue}>{eventCounts.miss}</Text>
            <Text style={styles.eventLabel}>Misses</Text>
          </View>
          <View style={styles.eventCard}>
            <Text style={styles.eventValue}>{eventCounts.release}</Text>
            <Text style={styles.eventLabel}>Releases</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard eyebrow="Calibration" title="Stored setup">
        {calibration ? (
          <View style={styles.detailStack}>
            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Hoop ROI</Text>
              <Text style={styles.detailBody}>{formatHoopROI(calibration)}</Text>
            </View>
            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Shooter seed</Text>
              <Text style={styles.detailBody}>
                {calibration.shooterSeed?.initialBox ? 'Initial shooter box saved' : 'No shooter seed saved'}
              </Text>
            </View>
            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Processor config</Text>
              <Text style={styles.detailBody}>{formatProcessorConfig(calibration)}</Text>
            </View>
            {storedReadiness ? (
              <View style={styles.detailBlock}>
                <Text style={styles.detailTitle}>Calibration quality</Text>
                <Text style={styles.detailBody}>
                  {formatCalibrationStatusLabel(storedReadiness)} · {Math.round(storedReadiness.readinessScore * 100)}%
                  {' '}ready
                </Text>
              </View>
            ) : null}
            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Captured</Text>
              <Text style={styles.detailBody}>
                {new Date(calibration.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.copy}>No calibration packet was stored for this session.</Text>
        )}
      </SectionCard>

      <SectionCard eyebrow="Native" title="Debug samples">
        {recentNativeSamples.length > 0 ? (
          <View style={styles.timeline}>
            {recentNativeSamples.map((sample) => (
              <View key={sample.id} style={styles.timelineRow}>
                <View style={styles.timelineType}>
                  <Text style={styles.timelineTypeLabel}>{sample.trigger}</Text>
                </View>
                <View style={styles.timelineMeta}>
                  <Text style={styles.timelineTime}>
                    {formatOffset(sample.timestampMs)} · {formatTelemetryTitle(sample)}
                  </Text>
                  <Text style={styles.timelineConfidence}>{formatTelemetrySignals(sample)}</Text>
                  {sample.warnings.length > 0 ? (
                    <Text style={styles.timelineConfidence}>Warnings: {sample.warnings.join(', ')}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.copy}>
            No native debug frames were captured. New sessions capture event frames and throttled warning frames.
          </Text>
        )}
      </SectionCard>

      <SectionCard eyebrow="Timeline" title="Recent stored events">
        {recentEvents.length > 0 ? (
          <View style={styles.timeline}>
            {recentEvents.map((event) => (
              <View key={event.id} style={styles.timelineRow}>
                <View style={styles.timelineType}>
                  <Text style={styles.timelineTypeLabel}>{formatShotEventLabel(event.eventType)}</Text>
                </View>
                <View style={styles.timelineMeta}>
                  <Text style={styles.timelineTime}>{formatOffset(event.timestampMs)}</Text>
                  <Text style={styles.timelineConfidence}>{Math.round(event.confidence * 100)}% confidence</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.copy}>This session has summary data, but no stored shot-event rows yet.</Text>
        )}
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  metricStrip: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metricCard: {
    backgroundColor: palette.surface,
    borderColor: palette.border,
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    padding: spacing.md,
  },
  metricValue: {
    color: palette.text,
    ...typography.stat,
  },
  metricLabel: {
    color: palette.textSubtle,
    marginTop: spacing.xxs,
    ...typography.overline,
  },
  copy: {
    color: palette.textMuted,
    ...typography.body,
  },
  loadingState: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  eventGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  eventCard: {
    backgroundColor: palette.surfaceSoft,
    borderRadius: 14,
    flex: 1,
    minWidth: '46%',
    padding: spacing.md,
  },
  eventValue: {
    color: palette.text,
    ...typography.stat,
  },
  eventLabel: {
    color: palette.textSubtle,
    marginTop: spacing.xxs,
    ...typography.overline,
  },
  detailStack: {
    gap: spacing.md,
  },
  detailBlock: {
    gap: spacing.xxs,
  },
  detailTitle: {
    color: palette.textSubtle,
    ...typography.overline,
  },
  detailBody: {
    color: palette.text,
    ...typography.body,
  },
  timeline: {
    gap: spacing.sm,
  },
  timelineRow: {
    alignItems: 'center',
    backgroundColor: palette.surfaceSoft,
    borderRadius: 14,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  timelineType: {
    alignItems: 'center',
    backgroundColor: palette.accentSoft,
    borderRadius: 999,
    justifyContent: 'center',
    minWidth: 84,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  timelineTypeLabel: {
    color: palette.accent,
    ...typography.caption,
  },
  timelineMeta: {
    flex: 1,
    gap: spacing.xxs,
  },
  timelineTime: {
    color: palette.text,
    ...typography.headline,
  },
  timelineConfidence: {
    color: palette.textMuted,
    ...typography.callout,
  },
});
