import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { ScreenShell } from '@/components/common/ScreenShell';
import { palette } from '@/lib/theme';

export default function NotFoundScreen() {
  return (
    <ScreenShell title="Screen not found" subtitle="The route exists in neither the MVP map nor the router tree.">
      <Link href="/(tabs)/today" style={styles.link}>
        Go back to Today
      </Link>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  link: {
    color: palette.accent,
    fontSize: 16,
    fontWeight: '700',
  },
});
