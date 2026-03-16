import { supabase } from "../../lib/supabaseClient";

function getAuthCallbackUrl() {
  const configuredSiteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
  const baseUrl = configuredSiteUrl ? configuredSiteUrl.replace(/\/+$/, "") : window.location.origin;
  return `${baseUrl}/auth/callback`;
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl(),
    },
  });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackUrl(),
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function requestPasswordReset(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthCallbackUrl(),
  });
}

export async function updatePassword(newPassword: string) {
  return supabase.auth.updateUser({ password: newPassword });
}