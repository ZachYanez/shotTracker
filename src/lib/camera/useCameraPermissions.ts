import { Linking } from 'react-native';
import { Camera, type CameraPermissionStatus, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';

export function useShotTrackerCameraPermissions() {
  const camera = useCameraPermission();
  const microphone = useMicrophonePermission();
  const cameraStatus = Camera.getCameraPermissionStatus();

  return {
    camera,
    microphone,
    cameraStatus,
    canStartSession: camera.hasPermission,
    needsSettings: cameraStatus === 'denied' || cameraStatus === 'restricted',
    requestCameraAccess: camera.requestPermission,
    requestSessionPermissions: async () => {
      const hasCameraAccess = await camera.requestPermission();

      if (!microphone.hasPermission) {
        await microphone.requestPermission();
      }

      return hasCameraAccess;
    },
    openSystemSettings: () => Linking.openSettings(),
  };
}
