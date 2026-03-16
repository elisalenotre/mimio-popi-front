import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { navigateMock, signInWithEmailMock, signInWithGoogleMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  signInWithEmailMock: vi.fn(),
  signInWithGoogleMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../services/auth/authService", () => ({
  signInWithEmail: signInWithEmailMock,
  signInWithGoogle: signInWithGoogleMock,
}));

import LoginPage from "./LoginPage";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/login");
  });

  it("shows validation error when email is missing", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Email obligatoire.");
    expect(signInWithEmailMock).not.toHaveBeenCalled();
  });

  it("submits normalized email and navigates on success", async () => {
    const user = userEvent.setup();
    signInWithEmailMock.mockResolvedValueOnce({ data: {}, error: null });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Mot de passe");

    await user.type(emailInput, "  test@example.com  ");
    await user.type(passwordInput, "Password123");
    await user.click(screen.getByRole("button", { name: "Se connecter" }));

    expect(signInWithEmailMock).toHaveBeenCalledWith("test@example.com", "Password123");
    expect(navigateMock).toHaveBeenCalledWith("/", { replace: true });
  });

  it("shows Google auth error when service returns an error", async () => {
    const user = userEvent.setup();
    signInWithGoogleMock.mockResolvedValueOnce({
      data: null,
      error: { message: "oauth down" },
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: "Continuer avec Google" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Connexion Google indisponible pour le moment. Réessaie dans un instant."
    );
  });
});
