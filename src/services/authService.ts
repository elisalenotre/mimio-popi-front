import { supabase } from "../lib/supabaseClient";

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    // optionnel pour rediriger l'utilisateur après la confirmation de son email
    //{ emailRedirectTo: `${window.location.origin}/auth/callback` }
  });
}

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}