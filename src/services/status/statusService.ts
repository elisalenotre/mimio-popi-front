import { getMyProfile, updateProfile } from "../profile/profileService";
import {
  DAILY_STATUS_BASELINE,
  DEFAULT_USER_STATUSES,
  getStatusDayKey,
  normalizeStatuses,
  type UserStatuses,
} from "../../types/statuses";
import type { Preferences } from "../../types/preferences";

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

  return normalizeStatuses(preferences.statuses);
}
