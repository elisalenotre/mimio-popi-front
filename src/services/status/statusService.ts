import { getMyProfile, updateProfile } from "../profile/profileService";
import { supabase } from "../../lib/supabaseClient";
import {
  DAILY_STATUS_BASELINE,
  DEFAULT_USER_STATUSES,
  getStatusDayKey,
  normalizeStatuses,
  type UserStatuses,
} from "../../types/statuses";
import type { Preferences } from "../../types/preferences";

async function hasTodoTasksForCurrentUser() {
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    // Keep existing statuses when auth state is unavailable.
    return true;
  }

  const { count, error } = await supabase
    .from("tasks")
    .select("id", { head: true, count: "exact" })
    .eq("user_id", authData.user.id)
    .eq("is_done", false);

  if (error) {
    // Do not force-reset statuses if tasks lookup fails.
    return true;
  }

  return (count ?? 0) > 0;
}

function isBaselineStatuses(statuses: UserStatuses) {
  return Object.entries(DEFAULT_USER_STATUSES).every(([key, value]) => statuses[key as keyof UserStatuses] === value);
}

export async function getMyStatuses(): Promise<UserStatuses> {
  const profile = await getMyProfile();
  const preferences = (profile.preferences ?? {}) as Preferences;

  const currentDayKey = getStatusDayKey();
  if (preferences.statuses_day_key !== currentDayKey || preferences.statuses_daily_base !== DAILY_STATUS_BASELINE) {
    await updateProfile({
      preferences: {
        ...preferences,
        statuses: { ...DEFAULT_USER_STATUSES },
        statuses_day_key: currentDayKey,
        statuses_daily_base: DAILY_STATUS_BASELINE,
      },
    });

    return { ...DEFAULT_USER_STATUSES };
  }

  const normalizedStatuses = normalizeStatuses(preferences.statuses);
  const hasTodoTasks = await hasTodoTasksForCurrentUser();

  if (!hasTodoTasks) {
    if (!isBaselineStatuses(normalizedStatuses)) {
      await updateProfile({
        preferences: {
          ...preferences,
          statuses: { ...DEFAULT_USER_STATUSES },
          statuses_day_key: currentDayKey,
          statuses_daily_base: DAILY_STATUS_BASELINE,
        },
      });
    }

    return { ...DEFAULT_USER_STATUSES };
  }

  return normalizedStatuses;
}
