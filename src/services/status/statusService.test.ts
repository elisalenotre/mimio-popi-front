import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMyProfileMock } = vi.hoisted(() => ({
  getMyProfileMock: vi.fn(),
}));

vi.mock("../profile/profileService", () => ({
  getMyProfile: getMyProfileMock,
}));

import { getMyStatuses } from "./statusService";

describe("statusService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns default statuses on first use when no statuses are stored", async () => {
    getMyProfileMock.mockResolvedValueOnce({
      id: "user-1",
      email: "user@example.com",
      display_name: "Elisa",
      preferences: {},
    });

    await expect(getMyStatuses()).resolves.toEqual({
      fatigue: 50,
      stress: 50,
      joie: 50,
      sante: 50,
      motivation: 50,
      finances: 50,
    });
  });

  it("keeps unavailable values and clamps out-of-range numbers", async () => {
    getMyProfileMock.mockResolvedValueOnce({
      id: "user-2",
      email: "user2@example.com",
      display_name: "Elisa",
      preferences: {
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
  });
});
