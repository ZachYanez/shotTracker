import { useState } from 'react';

import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ScreenShell } from '@/components/common/ScreenShell';
import { SectionCard } from '@/components/common/SectionCard';
import { signInWithEmail } from '@/lib/supabase/auth';
import { palette, radius, spacing } from '@/lib/theme';
import { useAuthStore } from '@/stores/authStore';

export default function SignInScreen() {
  const router = useRouter();
  const signInDemo = useAuthStore((state) => state.signInDemo);
  const [email, setEmail] = useState('player@shottracker.dev');
  const [password, setPassword] = useState('password123');

  const hasSupabaseEnv = Boolean(
    process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  );

  const handleSignIn = async () => {
    if (!hasSupabaseEnv) {
      signInDemo(email);
      router.replace('/(tabs)/today');
      return;
    }

    const result = await signInWithEmail(email, password);

    if (result.error) {
      Alert.alert('Sign in failed', result.error.message);
      return;
    }

    signInDemo(email);
    router.replace('/(tabs)/today');
  };

  return (
    <ScreenShell title="Sign In" subtitle="Welcome back to your solo-session dashboard.">
      <SectionCard eyebrow="Auth" title="Continue with email">
        <View style={styles.heroRow}>
          <View style={styles.heroItem}>
            <Text style={styles.heroValue}>Local-first</Text>
            <Text style={styles.heroLabel}>History stays available before sync completes.</Text>
          </View>
          <View style={styles.heroItem}>
            <Text style={styles.heroValue}>Solo mode</Text>
            <Text style={styles.heroLabel}>The MVP stays focused on one shooter and one hoop.</Text>
          </View>
        </View>
        <View style={styles.form}>
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={palette.textMuted}
            style={styles.input}
            value={email}
          />
          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={palette.textMuted}
            secureTextEntry
            style={styles.input}
            value={password}
          />
          <PrimaryButton onPress={() => void handleSignIn()}>Sign In</PrimaryButton>
          <PrimaryButton onPress={() => router.push('/sign-up')} variant="secondary">
            Create Account
          </PrimaryButton>
          {!hasSupabaseEnv ? (
            <Text style={styles.notice}>
              EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are missing, so this screen falls back
              to demo auth.
            </Text>
          ) : null}
        </View>
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  heroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroItem: {
    backgroundColor: palette.surfaceSoft,
    borderRadius: radius.md,
    flex: 1,
    minHeight: 100,
    padding: spacing.lg,
  },
  heroValue: {
    color: palette.text,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  heroLabel: {
    color: palette.textMuted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  fieldLabel: {
    color: palette.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: palette.surfaceSoft,
    borderColor: palette.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    color: palette.text,
    fontSize: 16,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  notice: {
    color: palette.warning,
    fontSize: 13,
    lineHeight: 20,
  },
});
