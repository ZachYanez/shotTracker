import type { PropsWithChildren, ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/lib/theme';

type ScreenShellProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
}>;

export function ScreenShell({ title, subtitle, headerRight, children }: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {headerRight}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: palette.background,
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: 120,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  header: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  title: {
    color: palette.text,
    ...typography.largeTitle,
  },
  subtitle: {
    color: palette.textMuted,
    ...typography.body,
    maxWidth: 540,
  },
});
