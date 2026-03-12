import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { navigateMock, signUpWithEmailMock, signInWithGoogleMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  signUpWithEmailMock: vi.fn(),
  signInWithGoogleMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../../services/authService", () => ({
  signUpWithEmail: signUpWithEmailMock,
  signInWithGoogle: signInWithGoogleMock,
}));

import SignUpPage from "./SignUpPage";

describe("SignUpPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows mismatch error when password confirmation differs", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "Password123");
    await user.type(screen.getByLabelText("Confirmation du mot de passe"), "Password124");
    await user.click(screen.getByRole("button", { name: "Créer mon compte" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Les mots de passe ne correspondent pas.");
    expect(signUpWithEmailMock).not.toHaveBeenCalled();
  });

  it("navigates to login with checkEmail query on success", async () => {
    const user = userEvent.setup();
    signUpWithEmailMock.mockResolvedValueOnce({ data: {}, error: null });

    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("Email"), "  user@example.com ");
    await user.type(screen.getByLabelText("Mot de passe"), "Password123");
    await user.type(screen.getByLabelText("Confirmation du mot de passe"), "Password123");
    await user.click(screen.getByRole("button", { name: "Créer mon compte" }));

    expect(signUpWithEmailMock).toHaveBeenCalledWith("user@example.com", "Password123");
    expect(navigateMock).toHaveBeenCalledWith("/login?checkEmail=1&email=user%40example.com", {
      replace: true,
    });
  });

  it("maps already-used email errors to friendly message", async () => {
    const user = userEvent.setup();
    signUpWithEmailMock.mockResolvedValueOnce({
      data: null,
      error: { message: "User already registered" },
    });

    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Mot de passe"), "Password123");
    await user.type(screen.getByLabelText("Confirmation du mot de passe"), "Password123");
    await user.click(screen.getByRole("button", { name: "Créer mon compte" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Cet email est déjà utilisé. Tu peux plutôt te connecter."
    );
  });
});
