import { useEffect } from 'react';

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CalibrationReadinessCard } from '@/components/camera/CalibrationReadinessCard';
import { OutfitScanPanel } from '@/components/camera/OutfitScanPanel';
import { SessionCameraView } from '@/components/camera/SessionCameraView';
import { ShooterGuide } from '@/components/camera/ShooterGuide';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenShell } from '@/components/common/ScreenShell';
import { SectionCard } from '@/components/common/SectionCard';
import { calibrationChecklist } from '@/features/session/sessionConfig';
import { getBasketballProcessorStatus } from '@/lib/camera/frameProcessor';
import { palette, spacing, typography } from '@/lib/theme';
import { useSessionStore } from '@/stores/sessionStore';

export default function CalibrateScreen() {
  const router = useRouter();
  const processorStatus = getBasketballProcessorStatus();
  const {
    calibrationReadiness,
    hoopROI,
    ingestNativeFrameResult,
    latestFrameResult,
    resetCalibrationPreview,
    scanHooperFromLatestFrame,
    sessionConfig,
    setCalibration,
    shooterSeed,
    clearScannedHoopers,
  } =
    useSessionStore((state) => ({
      calibrationReadiness: state.calibrationReadiness,
      clearScannedHoopers: state.clearScannedHoopers,
      hoopROI: state.hoopROI,
      ingestNativeFrameResult: state.ingestNativeFrameResult,
      latestFrameResult: state.latestFrameResult,
      resetCalibrationPreview: state.resetCalibrationPreview,
      scanHooperFromLatestFrame: state.scanHooperFromLatestFrame,
      sessionConfig: state.sessionConfig,
      setCalibration: state.setCalibration,
      shooterSeed: state.shooterSeed,
    }));
  const canStartLive = processorStatus.available && calibrationReadiness.readyToStart;

  useEffect(() => {
    resetCalibrationPreview();
  }, [resetCalibrationPreview]);

  const continueToLive = (manual = false) => {
    setCalibration({ hoopROI, shooterSeed, manual });
    router.push('/session/live');
  };

  return (
    <ScreenShell
      title="Calibrate"
      subtitle="Lock the rim, settle the scene, and stage one shooter before the live session starts.">
      <SectionCard eyebrow="Setup" title="Shooter guidance">
        <ShooterGuide steps={calibrationChecklist} />
      </SectionCard>

      <SectionCard eyebrow="Preview" title="Live framing">
        <SessionCameraView
          hoopROI={hoopROI}
          latestFrameResult={latestFrameResult}
          mode="calibration"
          onFrameResult={ingestNativeFrameResult}
          processorAvailable={processorStatus.available}
          sessionConfig={sessionConfig}
          shooterSeed={shooterSeed}
        />
        <OutfitScanPanel
          latestFrameResult={latestFrameResult}
          onClear={clearScannedHoopers}
          onScan={scanHooperFromLatestFrame}
          shooterSeed={shooterSeed}
        />
        {processorStatus.available ? (
          <>
            <CalibrationReadinessCard readiness={calibrationReadiness} />
            <View style={styles.actions}>
              <PrimaryButton disabled={!canStartLive} onPress={() => continueToLive(false)}>
                {canStartLive ? 'Start Live Session' : 'Waiting For Stable Lock'}
              </PrimaryButton>
              {!canStartLive ? (
                <PrimaryButton onPress={() => continueToLive(true)} variant="secondary">
                  Use Rough Framing Instead
                </PrimaryButton>
              ) : null}
            </View>
          </>
        ) : (
          <View style={styles.fallbackCard}>
            <Text style={styles.fallbackTitle}>Native tracking not loaded</Text>
            <Text style={styles.fallbackBody}>
              {processorStatus.description} You can still save this framing and continue in manual demo mode.
            </Text>
            <PrimaryButton onPress={() => continueToLive(true)}>Continue With Rough Framing</PrimaryButton>
          </View>
        )}
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
  },
  fallbackCard: {
    backgroundColor: 'rgba(255, 189, 82, 0.10)',
    borderColor: 'rgba(255, 189, 82, 0.18)',
    borderRadius: 18,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  fallbackTitle: {
    color: palette.warning,
    ...typography.headline,
  },
  fallbackBody: {
    color: palette.textMuted,
    ...typography.body,
  },
});
