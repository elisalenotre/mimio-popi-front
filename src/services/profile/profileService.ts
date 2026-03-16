import { supabase } from "../../lib/supabaseClient";
import type { OnboardingAnswers } from "../../types/onboarding";

export type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  preferences: Record<string, unknown> | null;
  onboarding_completed?: boolean;
};

export async function getMyProfile() {
  const query = "id, email, display_name, preferences, onboarding_completed";
  const { data, error } = await supabase
    .from("profiles")
    .select(query)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const user = userData.user;
    if (!user) {
      throw new Error("Aucun utilisateur connecté pour initialiser le profil.");
    }

    const { data: createdProfile, error: createError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? null,
          onboarding_completed: false,
          preferences: {},
        },
        { onConflict: "id" }
      )
      .select(query)
      .single();

    if (createError) throw createError;
    return createdProfile as ProfileRow;
  }

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
    priorities: answers.priorities,
    priority: answers.priorities[0] ?? null,
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
    onboarding_completed: true,
  };

  await updateProfile({
    preferences: nextPreferences,
    onboarding_completed: true,
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