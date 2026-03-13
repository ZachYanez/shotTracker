import { useEffect } from 'react';

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { HoopOverlay } from '@/components/camera/HoopOverlay';
import { LiveStatsHUD } from '@/components/camera/LiveStatsHUD';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenShell } from '@/components/common/ScreenShell';
import { SectionCard } from '@/components/common/SectionCard';
import { getBasketballProcessorStatus } from '@/lib/camera/frameProcessor';
import { palette, radius, spacing } from '@/lib/theme';
import { useHistoryStore } from '@/stores/historyStore';
import { useSessionStore } from '@/stores/sessionStore';

export default function LiveSessionScreen() {
  const router = useRouter();
  const addSession = useHistoryStore((state) => state.addSession);
  const processorStatus = getBasketballProcessorStatus();
  const { beginSession, finishSession, hoopROI, isRunning, liveStats, recordMockShot } = useSessionStore(
    (state) => ({
      beginSession: state.beginSession,
      finishSession: state.finishSession,
      hoopROI: state.hoopROI,
      isRunning: state.isRunning,
      liveStats: state.liveStats,
      recordMockShot: state.recordMockShot,
    }),
  );

  useEffect(() => {
    beginSession();
  }, [beginSession]);

  return (
    <ScreenShell
      title="Live Session"
      subtitle={
        processorStatus.available
          ? 'The native processor is ready to drive live attempt and make detection.'
          : 'The native processor is missing, so this screen is running in demo mode with mock shot controls.'
      }>
      <SectionCard eyebrow="Camera" title={isRunning ? 'Session running' : 'Session stopped'}>
        <View style={styles.preview}>
          <View style={styles.previewTopBar}>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.livePillText}>Live session</Text>
            </View>
            <Text style={styles.previewMeta}>{processorStatus.modeLabel}</Text>
          </View>
          <HoopOverlay hoopROI={hoopROI} />
          <View style={styles.hud}>
            <LiveStatsHUD stats={liveStats} />
          </View>
        </View>
        {!processorStatus.available ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Native detection unavailable</Text>
            <Text style={styles.noticeBody}>{processorStatus.description}</Text>
          </View>
        ) : null}
      </SectionCard>

      <SectionCard eyebrow="Controls" title={processorStatus.available ? 'Session controls' : 'Simulation controls'}>
        <View style={styles.controls}>
          <PrimaryButton onPress={() => recordMockShot(true)}>Record Make</PrimaryButton>
          <PrimaryButton onPress={() => recordMockShot(false)} variant="secondary">
            Record Miss
          </PrimaryButton>
          <PrimaryButton onPress={() => recordMockShot(false, 'hoop_lost')} variant="secondary">
            Trigger Hoop Lost
          </PrimaryButton>
          <PrimaryButton
            onPress={() => {
              const summary = finishSession();
              addSession(summary);
              router.replace('/session/summary');
            }}>
            Finish Session
          </PrimaryButton>
        </View>
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  preview: {
    backgroundColor: palette.backgroundElevated,
    borderColor: palette.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    height: 320,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    position: 'relative',
  },
  previewTopBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: spacing.md,
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    zIndex: 2,
  },
  livePill: {
    alignItems: 'center',
    backgroundColor: 'rgba(5,5,5,0.72)',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  liveDot: {
    backgroundColor: palette.accent,
    borderRadius: radius.pill,
    height: 8,
    width: 8,
  },
  livePillText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  previewMeta: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: radius.pill,
    color: palette.textMuted,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  hud: {
    padding: spacing.md,
  },
  controls: {
    gap: spacing.sm,
  },
  noticeCard: {
    backgroundColor: 'rgba(255, 189, 82, 0.10)',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  noticeTitle: {
    color: palette.warning,
    fontSize: 14,
    fontWeight: '700',
  },
  noticeBody: {
    color: palette.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
});
