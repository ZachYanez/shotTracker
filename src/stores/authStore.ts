import { create } from 'zustand';

type AuthStatus = 'signed_out' | 'signed_in';

type AuthStore = {
  status: AuthStatus;
  userId?: string;
  email?: string;
  displayName?: string;
  signInDemo: (email: string) => void;
  signOutDemo: () => void;
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
  signOutDemo: () =>
    set({
      status: 'signed_out',
      userId: undefined,
      email: undefined,
      displayName: undefined,
    }),
}));
