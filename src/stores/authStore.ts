import { create } from 'zustand';

import { getSupabaseClient } from '@/lib/supabase/client';

type AuthStatus = 'signed_out' | 'signed_in';

type AuthStore = {
  status: AuthStatus;
  userId?: string;
  email?: string;
  displayName?: string;
  signInDemo: (email: string) => void;
  signInSupabase: (user: { id: string; email?: string }) => void;
  signOutDemo: () => void;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  status: 'signed_out',
  signInDemo: (email) =>
    set({
      status: 'signed_in',
      userId: 'demo-user',
      email,
      displayName: 'Demo Shooter',
    }),
  signInSupabase: (user) =>
    set({
      status: 'signed_in',
      userId: user.id,
      email: user.email,
      displayName: user.email?.split('@')[0] ?? 'Shooter',
    }),
  signOutDemo: () =>
    set({
      status: 'signed_out',
      userId: undefined,
      email: undefined,
      displayName: undefined,
    }),
  hydrate: async () => {
    const client = getSupabaseClient();

    if (!client) {
      return;
    }

    const {
      data: { session },
      error,
    } = await client.auth.getSession();

    if (error) {
      console.warn('Auth hydration failed', error);
      return;
    }

    if (!session?.user) {
      return;
    }

    set({
      status: 'signed_in',
      userId: session.user.id,
      email: session.user.email,
      displayName: session.user.email?.split('@')[0] ?? 'Shooter',
    });
  },
}));
