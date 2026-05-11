import { useState } from 'react';

import { useRunOnJS } from 'react-native-worklets-core';
import {
  Camera,
  Templates,
  runAtTargetFps,
  type CameraPosition,
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
import { PrimaryButton } from '../common/PrimaryButton';

type SessionCameraViewProps = {
  mode: 'calibration' | 'live';
  hoopROI: HoopROI;
  shooterSeed?: ShooterSeed;
  sessionConfig: SessionConfig;
  latestFrameResult?: NativeFrameResult;
  processorAvailable: boolean;
  onFrameResult: (result: NativeFrameResult) => void;
  cameraPosition?: CameraPosition;
  showOverlays?: boolean;
  style?: StyleProp<ViewStyle>;
};

type PreviewPhase = 'warming' | 'ready' | 'error';

export function SessionCameraView({
  mode,
  hoopROI,
  shooterSeed,
  sessionConfig,
  latestFrameResult,
  processorAvailable,
  onFrameResult,
  cameraPosition = 'back',
  showOverlays = true,
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
  const [hasGrantedCameraAccess, setHasGrantedCameraAccess] = useState(false);
  const isNativeCameraSupported = Platform.OS === 'ios' || Platform.OS === 'android';
  const canUseCamera = canStartSession || hasGrantedCameraAccess;
  const device = useCameraDevice(
    cameraPosition,
    cameraPosition === 'back' ? { physicalDevices: ['wide-angle-camera'] } : undefined,
  );
  const canRenderCamera = isNativeCameraSupported && canUseCamera && Boolean(device);
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

  const handleRequestCameraAccess = async () => {
    const result = await requestCameraAccess();

    if (result) {
      setHasGrantedCameraAccess(true);
      setCameraError(null);
      setPreviewPhase('warming');
    }
  };

  const rim = latestFrameResult?.rim;
  /** Native plugin always reports `rim` with a box when using hoopROI fallback (iOS reference). Show it so “locking” is visible, not only after detected/refined. */
  const hasRimPayload = cameraPosition === 'back' && Boolean(rim?.detected && rim.box);
  const showFallbackHoopGuide = cameraPosition === 'back' && !hasRimPayload;

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

      {canRenderCamera ? (
        <>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device!}
            enableBufferCompression
            enableFpsGraph={false}
            format={format}
            fps={sessionConfig.targetFps}
            frameProcessor={processorAvailable && showOverlays ? frameProcessor : undefined}
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
          <View style={styles.detectionLayer} pointerEvents="none">
            {showFallbackHoopGuide ? (
              <BoundingBoxOverlay box={hoopROI} dashed label="Hoop search" tone="warning" />
            ) : null}
            {hasRimPayload && rim?.box ? (
              <BoundingBoxOverlay
                box={rim.box}
                dashed={normalizeRimSource(rim) === 'reference'}
                label={rimOverlayLabel(rim)}
                tone={rimOverlayTone(rim)}
              />
            ) : null}
            {cameraPosition === 'back' &&
            latestFrameResult?.shooter?.tracked &&
            latestFrameResult.shooter.box ? (
              <BoundingBoxOverlay box={latestFrameResult.shooter.box} label="Player" tone="accent" />
            ) : null}
          </View>
        </>
      ) : null}

      {!canRenderCamera ? (
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
              <PrimaryButton onPress={() => void handleRequestCameraAccess()}>Grant Camera Access</PrimaryButton>
              <PrimaryButton onPress={() => openSystemSettings()} variant="secondary" disabled={!needsSettings}>
                Open Settings
              </PrimaryButton>
            </View>
          ) : null}
        </View>
      ) : null}

    </View>
  );
}

function normalizeRimSource(rim: NonNullable<NativeFrameResult['rim']>): 'reference' | 'detected' | 'refined' {
  if (rim.source === 'detected' || rim.source === 'refined') {
    return rim.source;
  }

  return 'reference';
}

function rimOverlayLabel(rim: NonNullable<NativeFrameResult['rim']>) {
  switch (normalizeRimSource(rim)) {
    case 'refined':
      return 'Hoop locked';
    case 'detected':
      return 'Locking hoop…';
    case 'reference':
    default:
      return 'Scanning rim…';
  }
}

function rimOverlayTone(rim: NonNullable<NativeFrameResult['rim']>): 'accent' | 'success' | 'warning' | 'neutral' {
  switch (normalizeRimSource(rim)) {
    case 'refined':
      return 'success';
    case 'detected':
      return 'accent';
    case 'reference':
    default:
      return 'warning';
  }
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
  detectionLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
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
});
