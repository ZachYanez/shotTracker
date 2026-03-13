import { StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/lib/theme';

type SessionStatRowProps = {
  label: string;
  value: string;
};

export function SessionStatRow({ label, value }: SessionStatRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: palette.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  label: {
    color: palette.textMuted,
    ...typography.body,
  },
  value: {
    color: palette.text,
    ...typography.headline,
  },
});
