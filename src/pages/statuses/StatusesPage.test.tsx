import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMyStatusesMock } = vi.hoisted(() => ({
  getMyStatusesMock: vi.fn(),
}));

vi.mock("../../services/status/statusService", () => ({
  getMyStatuses: getMyStatusesMock,
}));

import StatusesPage from "./StatusesPage";

describe("StatusesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays exactly six statuses with their values", async () => {
    getMyStatusesMock.mockResolvedValueOnce({
      fatigue: 40,
      stress: 30,
      joie: 60,
      sante: 50,
      motivation: 45,
      finances: 55,
    });

    render(
      <MemoryRouter>
        <StatusesPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Les statuts" })).toBeInTheDocument();
    expect(screen.getAllByText(/^Statut$/)).toHaveLength(6);
    expect(screen.getByRole("heading", { name: "Fatigue" })).toBeInTheDocument();
    expect(screen.getByLabelText("Valeur Fatigue : 40 sur 100")).toHaveTextContent("40/100");
    expect(screen.getByLabelText("Valeur Stress : 30 sur 100")).toHaveTextContent("30/100");
    expect(screen.getByLabelText("Valeur Joie : 60 sur 100")).toHaveTextContent("60/100");
    expect(screen.getByLabelText("Valeur Santé : 50 sur 100")).toHaveTextContent("50/100");
    expect(screen.getByLabelText("Valeur Motivation : 45 sur 100")).toHaveTextContent("45/100");
    expect(screen.getByLabelText("Valeur Finances : 55 sur 100")).toHaveTextContent("55/100");
    expect(screen.getByRole("link", { name: "Stress" })).toHaveAttribute("href", "/statuses/stress");
  });

  it("shows a fallback when one status is unavailable", async () => {
    getMyStatusesMock.mockResolvedValueOnce({
      fatigue: 40,
      stress: null,
      joie: 60,
      sante: 50,
      motivation: 45,
      finances: 55,
    });

    render(
      <MemoryRouter>
        <StatusesPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Stress" })).toBeInTheDocument();
    expect(screen.getByLabelText("Valeur Stress : Non disponible")).toHaveTextContent("—");
    expect(screen.getAllByText("Non disponible").length).toBeGreaterThan(0);
  });

  it("shows a loading skeleton while statuses are being fetched", async () => {
    let resolveStatuses: ((value: Record<string, number>) => void) | undefined;
    getMyStatusesMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStatuses = resolve;
      })
    );

    render(
      <MemoryRouter>
        <StatusesPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText("Chargement des statuts")).toBeInTheDocument();

    resolveStatuses?.({
      fatigue: 40,
      stress: 30,
      joie: 60,
      sante: 50,
      motivation: 45,
      finances: 55,
    });

    expect(await screen.findByRole("heading", { name: "Fatigue" })).toBeInTheDocument();
  });

  it("shows an error and lets the user retry", async () => {
    const user = userEvent.setup();

    getMyStatusesMock.mockRejectedValueOnce(new Error("500"));
    getMyStatusesMock.mockResolvedValueOnce({
      fatigue: 40,
      stress: 30,
      joie: 60,
      sante: 50,
      motivation: 45,
      finances: 55,
    });

    render(
      <MemoryRouter>
        <StatusesPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Impossible de charger tes statuts." })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Réessayer" }));

    await waitFor(() => {
      expect(getMyStatusesMock).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByRole("heading", { name: "Fatigue" })).toBeInTheDocument();
  });
});
