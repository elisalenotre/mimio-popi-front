import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getMyProfileMock, updateProfileMock } = vi.hoisted(() => ({
  getMyProfileMock: vi.fn(),
  updateProfileMock: vi.fn(),
}));

vi.mock("../profile/profileService", () => ({
  getMyProfile: getMyProfileMock,
  updateProfile: updateProfileMock,
}));

import { getMyStatuses } from "./statusService";
import { DAILY_STATUS_BASELINE, getStatusDayKey } from "../../types/statuses";

describe("statusService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-09T10:00:00.000Z"));
    updateProfileMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns default statuses on first use when no statuses are stored", async () => {
    getMyProfileMock.mockResolvedValueOnce({
      id: "user-1",
      email: "user@example.com",
      display_name: "Elisa",
      preferences: {},
    });

    await expect(getMyStatuses()).resolves.toEqual({
      fatigue: 30,
      stress: 30,
      joie: 30,
      sante: 30,
      motivation: 30,
      finances: 30,
    });

    expect(updateProfileMock).toHaveBeenCalledWith({
      preferences: {
        statuses: {
          fatigue: 30,
          stress: 30,
          joie: 30,
          sante: 30,
          motivation: 30,
          finances: 30,
        },
        statuses_day_key: getStatusDayKey(new Date("2026-04-09T10:00:00.000Z")),
        statuses_daily_base: DAILY_STATUS_BASELINE,
      },
    });
  });

  it("keeps unavailable values and clamps out-of-range numbers", async () => {
    getMyProfileMock.mockResolvedValueOnce({
      id: "user-2",
      email: "user2@example.com",
      display_name: "Elisa",
      preferences: {
        statuses_day_key: getStatusDayKey(new Date("2026-04-09T10:00:00.000Z")),
        statuses_daily_base: DAILY_STATUS_BASELINE,
        statuses: {
          fatigue: 120,
          stress: -5,
          joie: 60,
          sante: 50,
          motivation: 45,
          finances: null,
        },
      },
    });

    await expect(getMyStatuses()).resolves.toEqual({
      fatigue: 100,
      stress: 0,
      joie: 60,
      sante: 50,
      motivation: 45,
      finances: null,
    });

    expect(updateProfileMock).not.toHaveBeenCalled();
  });

  it("resets stale daily statuses when the stored day is outdated", async () => {
    getMyProfileMock.mockResolvedValueOnce({
      id: "user-3",
      email: "user3@example.com",
      display_name: "Elisa",
      preferences: {
        statuses_day_key: "2026-04-08",
        statuses: {
          fatigue: 80,
          stress: 70,
          joie: 65,
          sante: 40,
          motivation: 50,
          finances: 35,
        },
      },
    });

    await expect(getMyStatuses()).resolves.toEqual({
      fatigue: 30,
      stress: 30,
      joie: 30,
      sante: 30,
      motivation: 30,
      finances: 30,
    });
  });

  it("migrates current-day statuses when baseline metadata is outdated", async () => {
    getMyProfileMock.mockResolvedValueOnce({
      id: "user-4",
      email: "user4@example.com",
      display_name: "Elisa",
      preferences: {
        statuses_day_key: getStatusDayKey(new Date("2026-04-09T10:00:00.000Z")),
        statuses_daily_base: 0,
        statuses: {
          fatigue: 8,
          stress: 6,
          joie: 1,
          sante: 0,
          motivation: 4,
          finances: 2,
        },
      },
    });

    await expect(getMyStatuses()).resolves.toEqual({
      fatigue: 30,
      stress: 30,
      joie: 30,
      sante: 30,
      motivation: 30,
      finances: 30,
    });

    expect(updateProfileMock).toHaveBeenCalledWith({
      preferences: expect.objectContaining({
        statuses_day_key: getStatusDayKey(new Date("2026-04-09T10:00:00.000Z")),
        statuses_daily_base: DAILY_STATUS_BASELINE,
        statuses: {
          fatigue: 30,
          stress: 30,
          joie: 30,
          sante: 30,
          motivation: 30,
          finances: 30,
        },
      }),
    });
  });
});
