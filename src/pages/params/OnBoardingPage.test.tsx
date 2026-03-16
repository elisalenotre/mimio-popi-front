import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { navigateMock, saveOnboardingMock, skipOnboardingMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  saveOnboardingMock: vi.fn(),
  skipOnboardingMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../services/profile/profileService", () => ({
  saveOnboarding: saveOnboardingMock,
  skipOnboarding: skipOnboardingMock,
}));

import OnboardingPage from "./OnBoardingPage";

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps next disabled until a choice is made on step 1", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    const nextButton = screen.getByRole("button", { name: "Suivant" });
    expect(nextButton).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "Normal" }));
    expect(nextButton).toBeEnabled();
  });

  it("completes onboarding and saves answers", async () => {
    const user = userEvent.setup();
    saveOnboardingMock.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("radio", { name: "Normal" }));
    await user.click(screen.getByRole("button", { name: "Suivant" }));

    await user.click(screen.getByRole("checkbox", { name: "Équilibre" }));
    await user.click(screen.getByRole("checkbox", { name: "Travail" }));
    await user.click(screen.getByRole("button", { name: "Suivant" }));

    await user.click(screen.getByRole("radio", { name: "Moyenne" }));
    await user.click(screen.getByRole("button", { name: "Valider" }));

    expect(saveOnboardingMock).toHaveBeenCalledWith({
      pace: "normal",
      priorities: ["balance", "work"],
      energy: "medium",
    });
    expect(navigateMock).toHaveBeenCalledWith("/settings", { replace: true });
  });

  it("limits priorities to two choices", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("radio", { name: "Normal" }));
    await user.click(screen.getByRole("button", { name: "Suivant" }));

    await user.click(screen.getByRole("checkbox", { name: "Études" }));
    await user.click(screen.getByRole("checkbox", { name: "Travail" }));

    expect(screen.getByRole("checkbox", { name: "Équilibre" })).toBeDisabled();
  });

  it("skips onboarding and redirects home", async () => {
    const user = userEvent.setup();
    skipOnboardingMock.mockResolvedValueOnce(undefined);

    render(
      <MemoryRouter>
        <OnboardingPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Tu pourras le faire plus tard." }));

    expect(skipOnboardingMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith("/", { replace: true });
  });
});
