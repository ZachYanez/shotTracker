import { useEffect } from 'react';

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CalibrationReadinessCard } from '@/components/camera/CalibrationReadinessCard';
import { LiveStatsHUD } from '@/components/camera/LiveStatsHUD';
import { SessionCameraView } from '@/components/camera/SessionCameraView';
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
  const {
    beginSession,
    calibrationReadiness,
    finishSession,
    hoopROI,
    ingestNativeFrameResult,
    isRunning,
    latestFrameResult,
    liveStats,
    recordMockShot,
    recordProcessorWarning,
    savedCalibrationReadiness,
    sessionConfig,
    shooterSeed,
  } =
    useSessionStore((state) => ({
      beginSession: state.beginSession,
      calibrationReadiness: state.calibrationReadiness,
      finishSession: state.finishSession,
      hoopROI: state.hoopROI,
      ingestNativeFrameResult: state.ingestNativeFrameResult,
      isRunning: state.isRunning,
      latestFrameResult: state.latestFrameResult,
      liveStats: state.liveStats,
      recordMockShot: state.recordMockShot,
      recordProcessorWarning: state.recordProcessorWarning,
      savedCalibrationReadiness: state.savedCalibrationReadiness,
      sessionConfig: state.sessionConfig,
      shooterSeed: state.shooterSeed,
    }));

  useEffect(() => {
    beginSession();
  }, [beginSession]);

  return (
    <ScreenShell
      title="Live Session"
      subtitle={
        processorStatus.available
          ? 'Native pose, release, and early trajectory-based outcome detection are live. Keep manual scoring available as an override while the model is being tuned.'
          : 'The native processor is missing, so this screen is running in demo mode with mock shot controls.'
      }>
      <SectionCard eyebrow="Camera" title={isRunning ? 'Session running' : 'Session stopped'}>
        <SessionCameraView
          hoopROI={hoopROI}
          latestFrameResult={latestFrameResult}
          mode="live"
          onFrameResult={ingestNativeFrameResult}
          processorAvailable={processorStatus.available}
          sessionConfig={sessionConfig}
          shooterSeed={shooterSeed}
          style={styles.preview}
        />
        <View style={styles.hud}>
          <LiveStatsHUD stats={liveStats} />
        </View>
        {!processorStatus.available ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Native detection unavailable</Text>
            <Text style={styles.noticeBody}>{processorStatus.description}</Text>
          </View>
        ) : null}
      </SectionCard>

      {savedCalibrationReadiness ? (
        <SectionCard eyebrow="Calibration" title="Session lock">
          <CalibrationReadinessCard
            readiness={processorStatus.available ? calibrationReadiness : savedCalibrationReadiness}
            title={processorStatus.available ? 'Current tracking lock' : 'Saved setup'}
          />
        </SectionCard>
      ) : null}

      <SectionCard eyebrow="Controls" title={processorStatus.available ? 'Manual override' : 'Simulation controls'}>
        <View style={styles.controls}>
          {processorStatus.available ? (
            <View style={styles.noticeCard}>
              <Text style={styles.noticeTitle}>Hybrid testing mode</Text>
              <Text style={styles.noticeBody}>
                Native Vision tracking now writes shooter lock, release events, and first-pass attempt and make/miss events. Use the controls below to override edge cases while the detector is still being tuned.
              </Text>
            </View>
          ) : null}
          <>
            <PrimaryButton onPress={() => recordMockShot(true)}>Record Make</PrimaryButton>
            <PrimaryButton onPress={() => recordMockShot(false)} variant="secondary">
              Record Miss
            </PrimaryButton>
          </>
          {!processorStatus.available ? (
            <>
              <PrimaryButton onPress={() => recordProcessorWarning('hoop_lost')} variant="secondary">
                Trigger Hoop Lost
              </PrimaryButton>
            </>
          ) : null}
          <PrimaryButton
            onPress={async () => {
              const summary = await finishSession();
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
    height: 448,
  },
  hud: {
    marginTop: spacing.sm,
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
