import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requestPasswordResetMock } = vi.hoisted(() => ({
  requestPasswordResetMock: vi.fn(),
}));

vi.mock("../../services/authService", () => ({
  requestPasswordReset: requestPasswordResetMock,
}));

import ForgotPasswordPage from "./ForgotPasswordPage";

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation error for invalid email", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("Email"), "invalid");
    await user.click(screen.getByRole("button", { name: "Envoyer le lien" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Oups, cet email ne semble pas valide.");
    expect(requestPasswordResetMock).not.toHaveBeenCalled();
  });

  it("shows confirmation and allows resend after successful request", async () => {
    const user = userEvent.setup();
    requestPasswordResetMock.mockResolvedValue({ data: {}, error: null });

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("Email"), "  user@example.com ");
    await user.click(screen.getByRole("button", { name: "Envoyer le lien" }));

    expect(requestPasswordResetMock).toHaveBeenCalledWith("user@example.com");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Si un compte existe avec cet email, tu recevras un lien de réinitialisation."
    );

    await user.click(screen.getByRole("button", { name: "Renvoyer l’email" }));
    expect(requestPasswordResetMock).toHaveBeenCalledTimes(2);
  });

  it("shows API error message when request fails", async () => {
    const user = userEvent.setup();
    requestPasswordResetMock.mockRejectedValueOnce(new Error("network"));

    render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.click(screen.getByRole("button", { name: "Envoyer le lien" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Impossible d’envoyer le lien pour le moment. Vérifie ta connexion et réessaie."
    );
  });
});
