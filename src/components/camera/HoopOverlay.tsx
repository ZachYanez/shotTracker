import { StyleSheet, Text, View } from 'react-native';

import { palette } from '@/lib/theme';
import type { HoopROI } from '@/types/session';

type HoopOverlayProps = {
  hoopROI: HoopROI;
};

export function HoopOverlay({ hoopROI }: HoopOverlayProps) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.overlay,
        {
          left: `${hoopROI.x * 100}%`,
          top: `${hoopROI.y * 100}%`,
          width: `${hoopROI.width * 100}%`,
          height: `${hoopROI.height * 100}%`,
        },
      ]}>
      <Text style={styles.label}>Hoop ROI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    borderColor: palette.warning,
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 2,
    position: 'absolute',
  },
  label: {
    backgroundColor: palette.warning,
    color: '#2d1b00',
    fontSize: 11,
    fontWeight: '700',
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: 'absolute',
    top: -12,
  },
});
