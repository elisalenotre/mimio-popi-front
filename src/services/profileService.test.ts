import { beforeEach, describe, expect, it, vi } from "vitest";

const { selectMock, singleMock, updateMock, eqMock, fromMock } = vi.hoisted(() => ({
  selectMock: vi.fn(),
  singleMock: vi.fn(),
  updateMock: vi.fn(),
  eqMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("../lib/supabaseClient", () => ({
  supabase: {
    from: fromMock,
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

    selectMock.mockReturnValue({ single: singleMock });
    updateMock.mockReturnValue({ eq: eqMock });

    fromMock.mockReturnValue({
      select: selectMock,
      update: updateMock,
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
    singleMock.mockResolvedValueOnce({ data: profile, error: null });

    const result = await getMyProfile();

    expect(fromMock).toHaveBeenCalledWith("profiles");
    expect(selectMock).toHaveBeenCalledWith("id, email, display_name, preferences, onboarding_completed");
    expect(result).toEqual(profile);
  });

  it("updateProfile updates current user profile by id", async () => {
    singleMock.mockResolvedValueOnce({
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
    singleMock.mockResolvedValueOnce({
      data: {
        ...profile,
      },
      error: null,
    });
    singleMock.mockResolvedValueOnce({ data: profile, error: null });
    eqMock.mockResolvedValueOnce({ error: null });

    await saveOnboarding({ pace: "normal", priority: "balance", energy: "medium" });

    expect(updateMock).toHaveBeenCalledWith({
      preferences: {
        theme: "sun",
        pace: "normal",
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
    singleMock.mockResolvedValueOnce({
      data: {
        ...profile,
      },
      error: null,
    });
    singleMock.mockResolvedValueOnce({ data: profile, error: null });
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
    singleMock.mockResolvedValueOnce({
      data: {
        ...profile,
      },
      error: null,
    });
    singleMock.mockResolvedValueOnce({ data: profile, error: null });
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
