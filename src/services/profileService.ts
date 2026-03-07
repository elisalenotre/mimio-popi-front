import { supabase } from "../lib/supabaseClient";
import type { OnboardingAnswers } from "../types/onboarding";

export type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  preferences: Record<string, unknown> | null;
  onboarding_completed?: boolean;
};

export async function getMyProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, preferences, onboarding_completed")
    .single();

  if (error) throw error;
  return data as ProfileRow;
}

export async function updateProfile(payload: {
  display_name?: string | null;
  preferences?: Record<string, unknown> | null;
  onboarding_completed?: boolean;
}) {
  const { error } = await supabase.from("profiles").update(payload).eq("id", (await getMyProfile()).id);
  if (error) throw error;
}

export async function saveOnboarding(answers: OnboardingAnswers) {
  const profile = await getMyProfile();
  const nextPreferences = {
    ...(profile.preferences ?? {}),
    pace: answers.pace,
    priority: answers.priority,
    energy: answers.energy,
    onboarding_completed: true,
  };

  await updateProfile({
    preferences: nextPreferences,
    onboarding_completed: true,
  });
}

export async function skipOnboarding() {
  const profile = await getMyProfile();
  const nextPreferences = {
    ...(profile.preferences ?? {}),
    onboarding_completed: false,
  };

  await updateProfile({
    preferences: nextPreferences,
    onboarding_completed: false,
  });
}

export async function resetOnboardingFlag() {
  const profile = await getMyProfile();
  const nextPreferences = {
    ...(profile.preferences ?? {}),
    onboarding_completed: false,
  };

  await updateProfile({
    preferences: nextPreferences,
    onboarding_completed: false,
  });
}