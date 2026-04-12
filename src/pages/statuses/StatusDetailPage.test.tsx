import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMyStatusesMock } = vi.hoisted(() => ({
  getMyStatusesMock: vi.fn(),
}));

vi.mock("../../services/status/statusService", () => ({
  getMyStatuses: getMyStatusesMock,
}));

import StatusDetailPage from "./StatusDetailPage";

function renderStatusDetail(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/statuses/:statusKey" element={<StatusDetailPage />} />
        <Route path="/" element={<div>Dashboard statuts</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("StatusDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le detail de stress avec valeur, niveau et conseils doux", async () => {
    getMyStatusesMock.mockResolvedValueOnce({
      fatigue: 40,
      stress: 72,
      joie: 60,
      sante: 50,
      motivation: 45,
      finances: 55,
    });

    renderStatusDetail("/statuses/stress");

    expect(await screen.findByRole("heading", { name: "Stress" })).toBeInTheDocument();
    expect(screen.getByText("72/100")).toBeInTheDocument();
    expect(screen.getByText("Interprétation: Élevé")).toBeInTheDocument();
    expect(
      screen.getByText("Le stress reflète la pression ressentie et la charge mentale du moment. Il indique surtout un besoin d'espace, de clarte ou de soutien.")
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Conseils doux" })).toBeInTheDocument();
  });

  it("calcule les niveaux faible, modere et eleve selon la valeur", async () => {
    getMyStatusesMock.mockResolvedValue({
      fatigue: 20,
      stress: 30,
      joie: 80,
      sante: 50,
      motivation: 50,
      finances: 55,
    });

    const fatigueView = renderStatusDetail("/statuses/fatigue");
    expect(await screen.findByText("Interprétation: Faible")).toBeInTheDocument();
    fatigueView.unmount();

    const motivationView = renderStatusDetail("/statuses/motivation");
    expect(await screen.findByText("Interprétation: Modéré")).toBeInTheDocument();
    motivationView.unmount();

    renderStatusDetail("/statuses/joie");
    expect(await screen.findByText("Interprétation: Élevé")).toBeInTheDocument();
  });

  it("affiche des conseils adaptes pour une fatigue elevee", async () => {
    getMyStatusesMock.mockResolvedValueOnce({
      fatigue: 85,
      stress: 30,
      joie: 60,
      sante: 50,
      motivation: 45,
      finances: 55,
    });

    renderStatusDetail("/statuses/fatigue");

    expect(await screen.findByRole("heading", { name: "Fatigue" })).toBeInTheDocument();
    expect(screen.getByText("Prevoir une micro-pause (5 minutes).")).toBeInTheDocument();
    expect(screen.getByText("Choisir une tache legere.")).toBeInTheDocument();
  });

  it("affiche la definition et des conseils generiques quand la valeur est indisponible", async () => {
    getMyStatusesMock.mockResolvedValueOnce({
      fatigue: 40,
      stress: 30,
      joie: 60,
      sante: 50,
      motivation: 45,
      finances: null,
    });

    renderStatusDetail("/statuses/finances");

    expect(await screen.findByRole("heading", { name: "Finances" })).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.getByText("Impossible de charger la valeur pour le moment.")).toBeInTheDocument();
    expect(
      screen.getByText("Les finances refletent ton ressenti sur l'equilibre de ton budget actuel. C'est un indicateur de confort et de charge mentale liee a l'argent.")
    ).toBeInTheDocument();
    expect(screen.getByText("Faire un petit point budget en mode bienveillance.")).toBeInTheDocument();
  });

  it("affiche une erreur pour un statut invalide", () => {
    renderStatusDetail("/statuses/invalide");

    expect(screen.getByRole("heading", { name: "Statut introuvable" })).toBeInTheDocument();
    expect(screen.getByText("Ce statut n'est pas reconnu. Retour aux statuts en cours...")).toBeInTheDocument();
  });
});
