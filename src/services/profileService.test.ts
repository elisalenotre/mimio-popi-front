import { beforeEach, describe, expect, it, vi } from "vitest";

const { selectMock, singleMock, maybeSingleMock, updateMock, eqMock, upsertMock, fromMock, getUserMock } = vi.hoisted(() => ({
  selectMock: vi.fn(),
  singleMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  updateMock: vi.fn(),
  eqMock: vi.fn(),
  upsertMock: vi.fn(),
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
}));

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: fromMock,
    auth: {
      getUser: getUserMock,
    },
  },
}));

import {
  getMyProfile,
  resetOnboardingFlag,
  saveOnboarding,
  skipOnboarding,
  updateProfile,
} from "./profileService";

describe("profileService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    selectMock.mockReturnValue({ single: singleMock, maybeSingle: maybeSingleMock });
    updateMock.mockReturnValue({ eq: eqMock });
    upsertMock.mockReturnValue({ select: selectMock });

    fromMock.mockReturnValue({
      select: selectMock,
      update: updateMock,
      upsert: upsertMock,
    });
  });

  it("getMyProfile returns selected profile row", async () => {
    const profile = {
      id: "user-1",
      email: "user@example.com",
      display_name: "User",
      preferences: {},
      onboarding_completed: false,
    };
    maybeSingleMock.mockResolvedValueOnce({ data: profile, error: null });

    const result = await getMyProfile();

    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(selectMock).toHaveBeenCalledWith("id, email, display_name, preferences, onboarding_completed");
    expect(result).toEqual(profile);
  });

  it("getMyProfile creates a profile when none exists", async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: null, error: null });
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: "new-user-id",
          email: "new@example.com",
        },
      },
      error: null,
    });

    const createdProfile = {
      id: "new-user-id",
      email: "new@example.com",
      display_name: null,
      preferences: {},
      onboarding_completed: false,
    };
    singleMock.mockResolvedValueOnce({ data: createdProfile, error: null });

    const result = await getMyProfile();

    expect(upsertMock).toHaveBeenCalledWith(
      {
        id: "new-user-id",
        email: "new@example.com",
        onboarding_completed: false,
        preferences: {},
      },
      { onConflict: "id" }
    );
    expect(result).toEqual(createdProfile);
  });

  it("updateProfile updates current user profile by id", async () => {
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        id: "user-42",
        email: "x@example.com",
        display_name: null,
        preferences: null,
      },
      error: null,
    });
    eqMock.mockResolvedValueOnce({ error: null });

    await updateProfile({ display_name: "Elisa" });

    expect(updateMock).toHaveBeenCalledWith({ display_name: "Elisa" });
    expect(eqMock).toHaveBeenCalledWith("id", "user-42");
  });

  it("saveOnboarding merges preferences and sets onboarding_completed true", async () => {
    const profile = {
      id: "user-2",
      email: "user2@example.com",
      display_name: null,
      preferences: { theme: "sun" },
    };
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        ...profile,
      },
      error: null,
    });
    maybeSingleMock.mockResolvedValueOnce({ data: profile, error: null });
    eqMock.mockResolvedValueOnce({ error: null });

    await saveOnboarding({ pace: "normal", priorities: ["balance", "work"], energy: "medium" });

    expect(updateMock).toHaveBeenCalledWith({
      preferences: {
        theme: "sun",
        pace: "normal",
        priorities: ["balance", "work"],
        priority: "balance",
        energy: "medium",
        onboarding_completed: true,
      },
      onboarding_completed: true,
    });
    expect(eqMock).toHaveBeenCalledWith("id", "user-2");
  });

  it("skipOnboarding keeps existing preferences and marks onboarding done", async () => {
    const profile = {
      id: "user-3",
      email: "user3@example.com",
      display_name: null,
      preferences: { locale: "fr" },
    };
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        ...profile,
      },
      error: null,
    });
    maybeSingleMock.mockResolvedValueOnce({ data: profile, error: null });
    eqMock.mockResolvedValueOnce({ error: null });

    await skipOnboarding();

    expect(updateMock).toHaveBeenCalledWith({
      preferences: {
        locale: "fr",
        onboarding_completed: true,
      },
      onboarding_completed: true,
    });
  });

  it("resetOnboardingFlag marks onboarding as false", async () => {
    const profile = {
      id: "user-4",
      email: "user4@example.com",
      display_name: null,
      preferences: { pace: "fast" },
    };
    maybeSingleMock.mockResolvedValueOnce({
      data: {
        ...profile,
      },
      error: null,
    });
    maybeSingleMock.mockResolvedValueOnce({ data: profile, error: null });
    eqMock.mockResolvedValueOnce({ error: null });

    await resetOnboardingFlag();

    expect(updateMock).toHaveBeenCalledWith({
      preferences: {
        pace: "fast",
        onboarding_completed: false,
      },
      onboarding_completed: false,
    });
  });
});
