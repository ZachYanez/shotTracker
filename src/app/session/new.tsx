import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { SessionCameraView } from '@/components/camera/SessionCameraView';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenShell } from '@/components/common/ScreenShell';
import { SectionCard } from '@/components/common/SectionCard';
import { getBasketballProcessorStatus } from '@/lib/camera/frameProcessor';
import { palette, spacing, typography } from '@/lib/theme';
import { useSessionStore } from '@/stores/sessionStore';

export default function NewSessionScreen() {
  const router = useRouter();
  const processorStatus = getBasketballProcessorStatus();
  const [countdown, setCountdown] = useState(5);
  const hasAutoCapturedRef = useRef(false);
  const {
    capturePlayerReference,
    clearScannedHoopers,
    hoopROI,
    ingestNativeFrameResult,
    latestFrameResult,
    resetCalibrationPreview,
    sessionConfig,
    shooterSeed,
  } = useSessionStore(
    useShallow((state) => ({
      capturePlayerReference: state.capturePlayerReference,
      clearScannedHoopers: state.clearScannedHoopers,
      hoopROI: state.hoopROI,
      ingestNativeFrameResult: state.ingestNativeFrameResult,
      latestFrameResult: state.latestFrameResult,
      resetCalibrationPreview: state.resetCalibrationPreview,
      sessionConfig: state.sessionConfig,
      shooterSeed: state.shooterSeed,
    })),
  );
  const referenceCount = shooterSeed?.trackedHoopers?.length ?? 0;
  const hasReference = referenceCount > 0;

  useEffect(() => {
    resetCalibrationPreview();
  }, [resetCalibrationPreview]);

  useEffect(() => {
    if (hasReference) {
      return undefined;
    }

    hasAutoCapturedRef.current = false;
    setCountdown(5);

    const id = setInterval(() => {
      setCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [hasReference]);

  useEffect(() => {
    if (hasReference || countdown > 0 || hasAutoCapturedRef.current) {
      return;
    }

    hasAutoCapturedRef.current = true;
    capturePlayerReference();
  }, [capturePlayerReference, countdown, hasReference]);

  const handleRetakeReference = () => {
    clearScannedHoopers();
    hasAutoCapturedRef.current = false;
    setCountdown(5);
  };

  return (
    <ScreenShell title="Before You Start" subtitle="Capture the player reference before setting up the court camera.">
      <SectionCard eyebrow="Player Reference" title={hasReference ? 'Reference captured' : 'Take a full-body selfie'}>
        <Text style={styles.copy}>
          Stand far enough back that your full body is visible. ShotTracker uses this reference to keep the
          session locked on you once the camera moves to the court view.
        </Text>
        <SessionCameraView
          cameraPosition="front"
          hoopROI={hoopROI}
          latestFrameResult={latestFrameResult}
          mode="calibration"
          onFrameResult={ingestNativeFrameResult}
          processorAvailable={processorStatus.available}
          sessionConfig={sessionConfig}
          showOverlays={false}
          shooterSeed={shooterSeed}
          style={styles.referenceCamera}
        />
        {!hasReference ? (
          <View style={styles.countdownBadge}>
            <Text style={styles.countdownEyebrow}>Auto capture</Text>
            <Text style={styles.countdownNumber}>{countdown}</Text>
            <Text style={styles.countdownBody}>Step back. Hands free.</Text>
          </View>
        ) : null}
        <View style={[styles.referenceStatus, hasReference ? styles.referenceStatusReady : null]}>
          <View style={[styles.checkBadge, hasReference ? styles.checkBadgeReady : null]}>
            <Text style={[styles.checkText, hasReference ? styles.checkTextReady : null]}>
              {hasReference ? '✓' : '1'}
            </Text>
          </View>
          <View style={styles.referenceCopy}>
            <Text style={styles.referenceTitle}>{hasReference ? 'Player reference ready' : 'Frame your full body'}</Text>
            <Text style={styles.referenceBody}>
              {hasReference
                ? 'You can continue to the court-camera setup.'
                : processorStatus.available
                  ? `Step back into frame. Capture happens automatically in ${countdown}s.`
                  : `Step back into frame. A reference guide saves automatically in ${countdown}s.`}
            </Text>
          </View>
        </View>
        <View style={styles.actions}>
          {hasReference ? (
            <PrimaryButton onPress={handleRetakeReference} variant="secondary">
              Retake Reference
            </PrimaryButton>
          ) : null}
        </View>
      </SectionCard>

      <SectionCard eyebrow="Next" title="Court-camera setup">
        <View style={styles.steps}>
          {[
            ['1', 'Stabilize the camera', 'Set the phone on a tripod or ledge pointed at the hoop.'],
            ['2', 'Lock the hoop', 'ShotTracker scans the rim and confirms the shot anchor.'],
            [
              '3',
              'Match the player',
              'Step into frame so the live tracker can match your reference. Live tracking starts automatically once hoop and player locks complete.',
            ],
          ].map(([number, title, body]) => (
            <View key={number} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{number}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{title}</Text>
                <Text style={styles.stepBody}>{body}</Text>
              </View>
            </View>
          ))}
        </View>
        <PrimaryButton disabled={!hasReference} onPress={() => router.push('/session/calibrate')}>
          Continue
        </PrimaryButton>
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  copy: {
    color: palette.textMuted,
    ...typography.body,
  },
  countdownBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(5, 5, 8, 0.78)',
    borderColor: palette.borderStrong,
    borderRadius: 22,
    borderWidth: 1,
    gap: spacing.xxs,
    marginTop: -144,
    minWidth: 156,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  countdownBody: {
    color: palette.textMuted,
    ...typography.caption,
  },
  countdownEyebrow: {
    color: palette.accent,
    ...typography.overline,
  },
  countdownNumber: {
    color: palette.text,
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 58,
  },
  actions: {
    gap: spacing.sm,
  },
  checkBadge: {
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  checkBadgeReady: {
    backgroundColor: palette.success,
    borderColor: palette.success,
  },
  checkText: {
    color: palette.textSubtle,
    fontSize: 14,
    fontWeight: '800',
  },
  checkTextReady: {
    color: '#06130d',
  },
  referenceBody: {
    color: palette.textMuted,
    ...typography.callout,
  },
  referenceCamera: {
    height: 500,
  },
  referenceCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  referenceStatus: {
    alignItems: 'center',
    backgroundColor: palette.surfaceMuted,
    borderColor: palette.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  referenceStatusReady: {
    backgroundColor: palette.successSoft,
    borderColor: 'rgba(0, 208, 132, 0.35)',
  },
  referenceTitle: {
    color: palette.text,
    ...typography.headline,
  },
  steps: {
    gap: spacing.md,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  stepNumber: {
    alignItems: 'center',
    backgroundColor: palette.accentSoft,
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  stepNumberText: {
    color: palette.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  stepContent: {
    flex: 1,
    gap: spacing.xxs,
  },
  stepTitle: {
    color: palette.text,
    ...typography.headline,
  },
  stepBody: {
    color: palette.textMuted,
    ...typography.callout,
  },
});
