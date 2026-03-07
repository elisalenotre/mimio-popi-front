import { supabase } from "../lib/supabaseClient";
import type { OnboardingAnswers } from "../types/onboarding";

type ProfileRow = {
  id: string;
  preferences: Record<string, unknown> | null;
  onboarding_completed?: boolean;
};

export async function getMyProfile() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, preferences, onboarding_completed")
    .single();

  if (error) throw error;
  return data as ProfileRow;
}

export async function saveOnboarding(answers: OnboardingAnswers) {
  const profile = await getMyProfile();
  const nextPreferences = {
    ...(profile.preferences ?? {}),
    pace: answers.pace,
    priority: answers.priority,
    energy: answers.energy,
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      preferences: nextPreferences,
      onboarding_completed: true,
    })
    .eq("id", profile.id);

  if (error) throw error;
}

export async function skipOnboarding() {
  const profile = await getMyProfile();
  const nextPreferences = {
    ...(profile.preferences ?? {}),
    onboarding_completed: false,
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      preferences: nextPreferences,
      onboarding_completed: false,
    })
    .eq("id", profile.id);

  if (error) throw error;
}