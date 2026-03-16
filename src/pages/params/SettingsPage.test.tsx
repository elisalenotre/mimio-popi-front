import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { navigateMock, getMyProfileMock, updateProfileMock, resetOnboardingFlagMock, signOutMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  getMyProfileMock: vi.fn(),
  updateProfileMock: vi.fn(),
  resetOnboardingFlagMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../services/profileService", () => ({
  getMyProfile: getMyProfileMock,
  updateProfile: updateProfileMock,
  resetOnboardingFlag: resetOnboardingFlagMock,
}));

vi.mock("../../services/authService", () => ({
  signOut: signOutMock,
}));

import SettingsPage from "./SettingsPage";

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads and displays profile values", async () => {
    getMyProfileMock.mockResolvedValueOnce({
      id: "u-1",
      email: "u@example.com",
      display_name: "Elisa",
      preferences: {
        mascot_message_intensity: "discrete",
        help_texts_enabled: false,
      },
    });

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Profil / Paramètres" })).toBeInTheDocument();
    expect(screen.getByLabelText("Pseudo")).toHaveValue("Elisa");
    expect(screen.getByRole("combobox")).toHaveValue("discrete");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("shows back-home link", async () => {
    getMyProfileMock.mockResolvedValueOnce({
      id: "u-0",
      email: "u0@example.com",
      display_name: "Elisa",
      preferences: {},
    });

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: "Profil / Paramètres" });
    expect(screen.getByRole("link", { name: "Retour à l’accueil" })).toHaveAttribute("href", "/");
  });

  it("saves normalized display name and preferences", async () => {
    const user = userEvent.setup();

    getMyProfileMock
      .mockResolvedValueOnce({
        id: "u-2",
        email: "u2@example.com",
        display_name: null,
        preferences: {
          onboarding_completed: true,
          custom_flag: "keep",
        },
      })
      .mockResolvedValueOnce({
        id: "u-2",
        email: "u2@example.com",
        display_name: null,
        preferences: {
          onboarding_completed: true,
          custom_flag: "keep",
        },
      });

    updateProfileMock.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: "Profil / Paramètres" });

    const input = screen.getByLabelText("Pseudo");
    await user.type(input, "  New Name  ");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith({
        display_name: "New Name",
        preferences: {
          onboarding_completed: true,
          custom_flag: "keep",
          mascot_message_intensity: "normal",
          help_texts_enabled: true,
        },
      });
    });
  });

  it("can reset onboarding and logout", async () => {
    const user = userEvent.setup();

    getMyProfileMock.mockResolvedValueOnce({
      id: "u-3",
      email: "u3@example.com",
      display_name: "User",
      preferences: {},
    });
    resetOnboardingFlagMock.mockResolvedValueOnce(undefined);
    signOutMock.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: "Profil / Paramètres" });

    await user.click(screen.getByRole("button", { name: "Mettre à jour mes réponses (refaire l’onboarding)" }));
    expect(resetOnboardingFlagMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/onboarding", { replace: true });

    await user.click(screen.getByRole("button", { name: "Se déconnecter" }));
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/login", { replace: true });
  });
});
