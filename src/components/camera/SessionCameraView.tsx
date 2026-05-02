import { useMemo, useState } from 'react';

import { useRunOnJS } from 'react-native-worklets-core';
import {
  Camera,
  Templates,
  runAtTargetFps,
  useCameraDevice,
  useCameraFormat,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { processBasketballFrame } from '@/lib/camera/frameProcessor';
import { useShotTrackerCameraPermissions } from '@/lib/camera/useCameraPermissions';
import { palette, radius, spacing, typography } from '@/lib/theme';
import type { HoopROI, NativeFrameResult, SessionConfig, ShooterSeed } from '@/types/session';

import { BoundingBoxOverlay } from './BoundingBoxOverlay';
import { HoopOverlay } from './HoopOverlay';
import { PrimaryButton } from '../common/PrimaryButton';

type SessionCameraViewProps = {
  mode: 'calibration' | 'live';
  hoopROI: HoopROI;
  shooterSeed?: ShooterSeed;
  sessionConfig: SessionConfig;
  latestFrameResult?: NativeFrameResult;
  processorAvailable: boolean;
  onFrameResult: (result: NativeFrameResult) => void;
  style?: StyleProp<ViewStyle>;
};

type PreviewPhase = 'warming' | 'ready' | 'error';

function formatSignal(confidence?: number) {
  if (typeof confidence !== 'number') {
    return 'idle';
  }

  return `${Math.round(confidence * 100)}%`;
}

export function SessionCameraView({
  mode,
  hoopROI,
  shooterSeed,
  sessionConfig,
  latestFrameResult,
  processorAvailable,
  onFrameResult,
  style,
}: SessionCameraViewProps) {
  const {
    canStartSession,
    cameraStatus,
    needsSettings,
    requestCameraAccess,
    openSystemSettings,
  } = useShotTrackerCameraPermissions();
  const [previewPhase, setPreviewPhase] = useState<PreviewPhase>('warming');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const isNativeCameraSupported = Platform.OS === 'ios' || Platform.OS === 'android';
  const device = useCameraDevice('back', {
    physicalDevices: ['wide-angle-camera'],
  });
  const format = useCameraFormat(device, [{ fps: sessionConfig.targetFps }, ...Templates.FrameProcessing]);
  const runOnFrameResult = useRunOnJS(onFrameResult, [onFrameResult]);
  const processFps = Math.max(1, Math.floor(sessionConfig.targetFps / sessionConfig.processEveryNthFrame));
  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';

      runAtTargetFps(processFps, () => {
        'worklet';
        const result = processBasketballFrame(frame, {
          hoopROI,
          sessionConfig,
          shooterSeed,
        });

        if (result != null) {
          void runOnFrameResult(result);
        }
      });
    },
    [hoopROI, processFps, runOnFrameResult, sessionConfig, shooterSeed],
  );

  const statusItems = useMemo(() => {
    const rimLocked = latestFrameResult?.rim?.detected ?? false;
    const shooterLocked = latestFrameResult?.shooter?.tracked ?? false;
    const ballTracked = latestFrameResult?.ball?.detected ?? false;
    const scannedHooperCount = shooterSeed?.trackedHoopers?.length ?? 0;

    return [
      {
        label: 'Scene',
        value: previewPhase === 'ready' ? 'Live' : previewPhase === 'error' ? 'Check camera' : 'Warming',
        active: previewPhase === 'ready',
      },
      {
        label: 'Hoop',
        value: rimLocked ? 'Locked' : mode === 'calibration' ? 'Aligning' : 'Reference',
        active: rimLocked,
      },
      {
        label: 'Shooter',
        value:
          scannedHooperCount > 0
            ? `${scannedHooperCount} scanned`
            : shooterLocked
              ? mode === 'calibration'
                ? 'Seeded'
                : 'Locked'
              : mode === 'calibration'
                ? 'Stage zone'
                : 'Searching',
        active: shooterLocked || scannedHooperCount > 0,
      },
      {
        label: 'Ball',
        value: ballTracked ? 'Tracking' : 'Idle',
        active: ballTracked,
      },
    ];
  }, [latestFrameResult, mode, previewPhase, shooterSeed]);

  const guidance = useMemo(() => {
    if (!isNativeCameraSupported) {
      return 'VisionCamera previews are only available on iOS and Android development builds.';
    }

    if (!canStartSession) {
      return 'Grant camera access to start live alignment and local shot analysis.';
    }

    if (previewPhase === 'error') {
      return cameraError ?? 'The camera preview failed to start.';
    }

    if (previewPhase !== 'ready') {
      return 'Preparing the wide-angle camera and warming the live preview.';
    }

    if (!processorAvailable) {
      return 'Camera preview is live. Rebuild the development app to load the native frame processor; until then, manual scoring stays enabled.';
    }

    if (mode === 'calibration') {
      if (!latestFrameResult?.rim?.detected) {
        return 'Keep the rim inside the guide and hold the phone steady until the scene stabilizes.';
      }

      if (!latestFrameResult?.shooter?.tracked) {
        return 'Stage one shooter in the zone and hold still so the live tracker has a clean starting point.';
      }

      return 'Rim lock and shooter seeding are flowing through the native bridge. Save this framing when the hold timer settles.';
    }

    if (latestFrameResult?.ball?.detected) {
      return 'Ball tracking is active. Native attempt and make/miss events can now flow straight into the session store.';
    }

    if (latestFrameResult?.events.some((event) => event.type === 'release')) {
      return 'Release motion detected. Hold the frame steady while the trajectory and rim-crossing logic confirms the shot.';
    }

    return 'Tracking the shooter and watching for release plus rim-path confirmation.';
  }, [
    cameraError,
    canStartSession,
    isNativeCameraSupported,
    latestFrameResult,
    mode,
    previewPhase,
    processorAvailable,
  ]);

  return (
    <View style={[styles.frame, style]}>
      <View style={styles.backgroundTexture}>
        <View style={[styles.gridLineVertical, { left: '20%' }]} />
        <View style={[styles.gridLineVertical, { left: '50%' }]} />
        <View style={[styles.gridLineVertical, { left: '80%' }]} />
        <View style={[styles.gridLineHorizontal, { top: '24%' }]} />
        <View style={[styles.gridLineHorizontal, { top: '50%' }]} />
        <View style={[styles.gridLineHorizontal, { top: '76%' }]} />
      </View>

      {isNativeCameraSupported && canStartSession && device ? (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          enableBufferCompression
          enableFpsGraph={processorAvailable && mode === 'live' && __DEV__}
          format={format}
          fps={sessionConfig.targetFps}
          frameProcessor={processorAvailable ? frameProcessor : undefined}
          isActive
          onError={(error) => {
            setCameraError(error.message);
            setPreviewPhase('error');
          }}
          onInitialized={() => {
            setCameraError(null);
            setPreviewPhase('warming');
          }}
          onPreviewStarted={() => {
            setCameraError(null);
            setPreviewPhase('ready');
          }}
          pixelFormat="yuv"
          resizeMode="cover"
          videoHdr={false}
          videoStabilizationMode="off"
        />
      ) : null}

      <View style={styles.scanTint} />
      <View style={styles.vignette} />

      {isNativeCameraSupported && canStartSession && device ? (
        <>
          <HoopOverlay hoopROI={hoopROI} />
          {mode === 'calibration' && (shooterSeed?.trackedHoopers?.length ?? 0) > 0
            ? shooterSeed?.trackedHoopers?.map((hooper, index) =>
                hooper.initialBox ? (
                  <BoundingBoxOverlay
                    key={hooper.id}
                    box={hooper.initialBox}
                    dashed
                    label={index === 0 ? 'Primary scan' : `Hooper ${index + 1}`}
                    tone={index === 0 ? 'success' : 'neutral'}
                  />
                ) : null,
              )
            : null}
          {mode === 'calibration' && (shooterSeed?.trackedHoopers?.length ?? 0) === 0 && shooterSeed?.initialBox ? (
            <BoundingBoxOverlay
              box={shooterSeed.initialBox}
              dashed
              label="Shooter zone"
              tone="neutral"
            />
          ) : null}
          {latestFrameResult?.rim?.box ? (
            <BoundingBoxOverlay box={latestFrameResult.rim.box} label="Rim lock" tone="warning" />
          ) : null}
          {latestFrameResult?.shooter?.box ? (
            <BoundingBoxOverlay
              box={latestFrameResult.shooter.box}
              label={mode === 'calibration' ? 'Shooter seed' : 'Shooter lock'}
              tone="success"
            />
          ) : null}
          {latestFrameResult?.ball?.box ? (
            <BoundingBoxOverlay box={latestFrameResult.ball.box} label="Ball" tone="accent" />
          ) : null}
        </>
      ) : (
        <View style={styles.fallbackPanel}>
          <Text style={styles.fallbackEyebrow}>
            {isNativeCameraSupported ? 'Camera access required' : 'Unsupported platform'}
          </Text>
          <Text style={styles.fallbackTitle}>
            {isNativeCameraSupported ? 'Turn on the camera preview' : 'Preview unavailable here'}
          </Text>
          <Text style={styles.fallbackBody}>
            {isNativeCameraSupported
              ? `Current status: ${cameraStatus}. Grant access to start the live calibration and tracking loop.`
              : 'Use an iPhone or Android development build to view the live camera surface and frame processor overlays.'}
          </Text>
          {isNativeCameraSupported ? (
            <View style={styles.fallbackActions}>
              <PrimaryButton onPress={() => void requestCameraAccess()}>Grant Camera Access</PrimaryButton>
              <PrimaryButton onPress={() => openSystemSettings()} variant="secondary" disabled={!needsSettings}>
                Open Settings
              </PrimaryButton>
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.topBar}>
        <Text style={styles.modeTag}>{mode === 'calibration' ? 'Calibration Loop' : 'Live Track'}</Text>
        <View style={styles.headerChips}>
          <Text style={styles.metaChip}>{processorAvailable ? 'Native bridge live' : 'JS camera shell'}</Text>
          <Text style={styles.metaChip}>{sessionConfig.targetFps} fps</Text>
        </View>
      </View>

      <View style={styles.statusRail}>
        {statusItems.map((item) => (
          <View key={item.label} style={[styles.statusCard, item.active ? styles.statusCardActive : null]}>
            <Text style={styles.statusLabel}>{item.label}</Text>
            <Text style={styles.statusValue}>{item.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.signalDeck}>
        <View style={styles.signalPill}>
          <Text style={styles.signalLabel}>Shooter</Text>
          <Text style={styles.signalValue}>{formatSignal(latestFrameResult?.shooter?.confidence)}</Text>
        </View>
        <View style={styles.signalPill}>
          <Text style={styles.signalLabel}>Rim</Text>
          <Text style={styles.signalValue}>{formatSignal(latestFrameResult?.rim?.confidence)}</Text>
        </View>
      </View>

      <View style={styles.guideCard}>
        <Text style={styles.guideEyebrow}>{mode === 'calibration' ? 'Guidance' : 'Tracking'}</Text>
        <Text style={styles.guideCopy}>{guidance}</Text>
        {latestFrameResult?.warnings.length ? (
          <Text style={styles.warningText}>Warning: {latestFrameResult.warnings.join(', ')}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: '#050507',
    borderColor: palette.borderStrong,
    borderRadius: radius.xl,
    borderWidth: 1,
    height: 420,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundTexture: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#09090b',
  },
  gridLineVertical: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: 1,
  },
  gridLineHorizontal: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  scanTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 12, 9, 0.10)',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.14)',
    shadowColor: '#000000',
    shadowOpacity: 0.7,
    shadowRadius: 32,
  },
  fallbackPanel: {
    alignItems: 'flex-start',
    alignSelf: 'center',
    backgroundColor: 'rgba(7,7,9,0.86)',
    borderColor: palette.borderStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginVertical: 'auto',
    padding: spacing.lg,
    width: '84%',
    zIndex: 3,
  },
  fallbackEyebrow: {
    color: palette.accent,
    ...typography.overline,
  },
  fallbackTitle: {
    color: palette.text,
    ...typography.title2,
  },
  fallbackBody: {
    color: palette.textMuted,
    ...typography.body,
  },
  fallbackActions: {
    gap: spacing.sm,
    width: '100%',
  },
  topBar: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: spacing.md,
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    zIndex: 3,
  },
  modeTag: {
    backgroundColor: 'rgba(255, 56, 92, 0.12)',
    borderRadius: radius.pill,
    color: palette.accent,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  headerChips: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  metaChip: {
    backgroundColor: 'rgba(5,5,5,0.62)',
    borderRadius: radius.pill,
    color: palette.text,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
  },
  statusRail: {
    bottom: 112,
    gap: spacing.xs,
    left: spacing.md,
    position: 'absolute',
    width: 104,
    zIndex: 3,
  },
  statusCard: {
    backgroundColor: 'rgba(6,6,8,0.72)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  statusCardActive: {
    borderColor: 'rgba(52, 199, 89, 0.45)',
  },
  statusLabel: {
    color: palette.textSubtle,
    ...typography.overline,
  },
  statusValue: {
    color: palette.text,
    ...typography.caption,
  },
  signalDeck: {
    gap: spacing.xs,
    position: 'absolute',
    right: spacing.md,
    top: 88,
    zIndex: 3,
  },
  signalPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(6,6,8,0.72)',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 2,
    minWidth: 96,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  signalLabel: {
    color: palette.textSubtle,
    ...typography.overline,
  },
  signalValue: {
    color: palette.text,
    ...typography.caption,
  },
  guideCard: {
    backgroundColor: 'rgba(5,5,5,0.82)',
    borderTopColor: 'rgba(255,255,255,0.08)',
    borderTopWidth: 1,
    bottom: 0,
    gap: spacing.xxs,
    left: 0,
    padding: spacing.md,
    position: 'absolute',
    right: 0,
    zIndex: 3,
  },
  guideEyebrow: {
    color: palette.warning,
    ...typography.overline,
  },
  guideCopy: {
    color: palette.text,
    ...typography.body,
  },
  warningText: {
    color: palette.warning,
    ...typography.callout,
  },
});
