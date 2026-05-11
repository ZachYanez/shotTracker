import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Stack, useRouter } from 'expo-router';
import {
  Dimensions,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SessionCameraView } from '@/components/camera/SessionCameraView';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { getBasketballProcessorStatus } from '@/lib/camera/frameProcessor';
import { usePhoneStillness } from '@/lib/camera/usePhoneStillness';
import { palette, radius, spacing, typography } from '@/lib/theme';
import type { CalibrationReadinessStatus } from '@/types/session';
import { useSessionStore } from '@/stores/sessionStore';

const SCREEN_H = Dimensions.get('window').height;

type IntroModal = 'hoop' | 'shooter' | 'court' | null;

export default function CalibrateScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const processorStatus = getBasketballProcessorStatus();
  const [introModal, setIntroModal] = useState<IntroModal>(null);
  const prevStatusRef = useRef<CalibrationReadinessStatus | null>(null);
  const liveNavigationStartedRef = useRef(false);

  const {
    calibrationReadiness,
    hoopROI,
    ingestNativeFrameResult,
    latestFrameResult,
    resetCalibrationPreview,
    sessionConfig,
    setCalibration,
    setCalibrationPhoneStillness,
    shooterSeed,
  } = useSessionStore(
    useShallow((state) => ({
      calibrationReadiness: state.calibrationReadiness,
      hoopROI: state.hoopROI,
      ingestNativeFrameResult: state.ingestNativeFrameResult,
      latestFrameResult: state.latestFrameResult,
      resetCalibrationPreview: state.resetCalibrationPreview,
      sessionConfig: state.sessionConfig,
      setCalibration: state.setCalibration,
      setCalibrationPhoneStillness: state.setCalibrationPhoneStillness,
      shooterSeed: state.shooterSeed,
    })),
  );

  const phoneStillness = usePhoneStillness({
    active: true,
    stableTargetMs: calibrationReadiness.stableTargetMs,
  });

  const hasPlayerReference = (shooterSeed?.trackedHoopers?.length ?? 0) > 0;

  useEffect(() => {
    resetCalibrationPreview();
  }, [resetCalibrationPreview]);

  useEffect(() => {
    setCalibrationPhoneStillness(phoneStillness.holdMs);
  }, [phoneStillness.holdMs, setCalibrationPhoneStillness]);

  useEffect(() => {
    if (!hasPlayerReference) {
      router.replace('/session/new');
    }
  }, [hasPlayerReference, router]);

  useEffect(() => {
    const s = calibrationReadiness.status;
    if (prevStatusRef.current === null) {
      prevStatusRef.current = s;
      return;
    }

    const prev = prevStatusRef.current;
    if (prev === s) {
      return;
    }

    if (prev === 'steadying_phone' && s === 'aligning_hoop') {
      setIntroModal('hoop');
    } else if (prev === 'aligning_hoop' && s === 'staging_shooter') {
      setIntroModal('shooter');
    } else if (prev === 'steadying_phone' && s === 'staging_shooter') {
      setIntroModal('court');
    }

    prevStatusRef.current = s;
  }, [calibrationReadiness.status]);

  useEffect(() => {
    if (!calibrationReadiness.readyToStart || liveNavigationStartedRef.current) {
      return;
    }

    liveNavigationStartedRef.current = true;
    setIntroModal(null);
    setCalibration({ hoopROI, shooterSeed, manual: false });
    router.replace('/session/live');
  }, [calibrationReadiness.readyToStart, hoopROI, router, setCalibration, shooterSeed]);

  const modalCopy =
    introModal === 'hoop'
      ? {
          title: 'Keep the hoop visible',
          body: 'Point the back camera at the rim and keep it in frame while the hoop lock builds. Avoid bumping the phone.',
        }
      : introModal === 'shooter'
        ? {
            title: 'Step into frame',
            body: 'When the hoop lock is steady, stand in the shooter zone so the live tracker can match your outfit reference.',
          }
        : introModal === 'court'
          ? {
              title: 'Frame the court',
              body: 'Keep the rim in view and stay ready to step into the shooter zone. The hoop lock and player check run one after the other.',
            }
          : null;

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <SessionCameraView
        hoopROI={hoopROI}
        latestFrameResult={latestFrameResult}
        mode="calibration"
        onFrameResult={ingestNativeFrameResult}
        processorAvailable={processorStatus.available}
        sessionConfig={sessionConfig}
        shooterSeed={shooterSeed}
        style={styles.camera}
      />

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <View style={[styles.topRow, { paddingTop: insets.top > 0 ? 4 : 12 }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.topPill, pressed && styles.topPillPressed]}>
            <Text style={styles.topPillText}>← Back</Text>
          </Pressable>
        </View>

        <View style={[styles.hintCard, { marginBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <Text style={styles.hintEyebrow}>Setup</Text>
          <Text style={styles.hintBody}>{calibrationReadiness.recommendation}</Text>
        </View>
      </SafeAreaView>

      <Modal animationType="fade" transparent visible={Boolean(introModal && modalCopy)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>Next</Text>
            <Text style={styles.modalTitle}>{modalCopy?.title}</Text>
            <Text style={styles.modalBody}>{modalCopy?.body}</Text>
            <PrimaryButton onPress={() => setIntroModal(null)}>OK</PrimaryButton>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#07070e',
    flex: 1,
  },
  camera: {
    borderRadius: 0,
    borderWidth: 0,
    height: SCREEN_H,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  topRow: {
    alignItems: 'flex-start',
  },
  topPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  topPillPressed: {
    opacity: 0.75,
  },
  topPillText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  hintCard: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(10, 10, 18, 0.82)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  hintEyebrow: {
    color: palette.textSubtle,
    ...typography.overline,
  },
  hintBody: {
    color: palette.textMuted,
    ...typography.callout,
  },
  modalBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: palette.surface,
    borderColor: palette.borderStrong,
    borderRadius: 24,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.xl,
    width: '100%',
  },
  modalEyebrow: {
    color: palette.accent,
    ...typography.overline,
  },
  modalTitle: {
    color: palette.text,
    ...typography.title1,
  },
  modalBody: {
    color: palette.textMuted,
    ...typography.body,
  },
});
