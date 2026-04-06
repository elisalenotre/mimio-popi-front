import { getMyProfile } from "../profile/profileService";
import { normalizeStatuses, type UserStatuses } from "../../types/statuses";
import type { Preferences } from "../../types/preferences";

export async function getMyStatuses(): Promise<UserStatuses> {
  const profile = await getMyProfile();
  const preferences = (profile.preferences ?? {}) as Preferences;

  return normalizeStatuses(preferences.statuses);
}
