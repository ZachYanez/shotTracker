import { useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';

export function useShotTrackerCameraPermissions() {
  const camera = useCameraPermission();
  const microphone = useMicrophonePermission();

  return {
    camera,
    microphone,
    canStartSession: camera.hasPermission,
  };
}
