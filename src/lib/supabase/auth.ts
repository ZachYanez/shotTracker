import { getSupabaseClient } from './client';

export async function signInWithEmail(email: string, password: string) {
  const client = getSupabaseClient();

  if (!client) {
    return { data: null, error: new Error('Missing Supabase environment variables.') };
  }

  return client.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  const client = getSupabaseClient();

  if (!client) {
    return { data: null, error: new Error('Missing Supabase environment variables.') };
  }

  return client.auth.signUp({ email, password });
}

export async function signOut() {
  const client = getSupabaseClient();

  if (!client) {
    return { error: null };
  }

  return client.auth.signOut();
}
