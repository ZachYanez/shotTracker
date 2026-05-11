import type { PropsWithChildren, ReactNode } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { palette, spacing, typography } from '@/lib/theme';
import { AppBackground } from './AppBackground';

type ScreenShellProps = PropsWithChildren<{
  title: string;
  eyebrow?: string;
  subtitle?: string;
  headerRight?: ReactNode;
}>;

export function ScreenShell({ title, eyebrow, subtitle, headerRight, children }: ScreenShellProps) {
  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {headerRight}
          </View>
          {children}
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
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
  eyebrow: {
    color: palette.textSubtle,
    ...typography.overline,
  },
  title: {
    color: palette.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1.2,
    lineHeight: 38,
  },
  subtitle: {
    color: palette.textMuted,
    ...typography.body,
    maxWidth: 540,
  },
});
