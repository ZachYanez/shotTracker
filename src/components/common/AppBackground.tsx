import type { PropsWithChildren } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';

import { palette } from '@/lib/theme';

export function AppBackground({ children }: PropsWithChildren) {
  return (
    <ImageBackground
      resizeMode="cover"
      source={require('../../../assets/images/basketballgym.png')}
      style={styles.background}>
      <View style={styles.scrim} />
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: palette.background,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 5, 8, 0.58)',
  },
});
