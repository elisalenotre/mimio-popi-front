import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskForm } from "./TaskForm";

describe("TaskForm impact estimate", () => {
  it("shows neutral impact when no category is selected", () => {
    render(
      <TaskForm
        categories={[
          { id: "c-1", name: "Travail" },
          { id: "c-2", name: "Santé" },
        ]}
        categoriesAvailable={true}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByText("Impact estimé")).toBeInTheDocument();
    expect(screen.getByText("Une estimation pour t'aider à choisir.")).toBeInTheDocument();
    expect(screen.getByText("Fatigue: 0")).toBeInTheDocument();
    expect(screen.getByText("Stress: 0")).toBeInTheDocument();
    expect(screen.getByText("Joie: 0")).toBeInTheDocument();
    expect(screen.getByText("Santé: 0")).toBeInTheDocument();
    expect(screen.getByText("Motivation: 0")).toBeInTheDocument();
    expect(screen.getByText("Finances: 0")).toBeInTheDocument();
  });

  it("updates impact estimate when category changes", async () => {
    const user = userEvent.setup();

    render(
      <TaskForm
        categories={[
          { id: "c-travail", name: "Travail" },
          { id: "c-sante", name: "Santé" },
        ]}
        categoriesAvailable={true}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />
    );

    await user.selectOptions(screen.getByLabelText("Catégorie (optionnel)"), "c-travail");

    expect(screen.getByText("Fatigue: +4")).toBeInTheDocument();
    expect(screen.getByText("Stress: +3")).toBeInTheDocument();
    expect(screen.getByText("Joie: -1")).toBeInTheDocument();
    expect(screen.getByText("Santé: 0")).toBeInTheDocument();
    expect(screen.getByText("Motivation: +2")).toBeInTheDocument();
    expect(screen.getByText("Finances: +1")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Catégorie (optionnel)"), "c-sante");

    expect(screen.getByText("Fatigue: -2")).toBeInTheDocument();
    expect(screen.getByText("Stress: -1")).toBeInTheDocument();
    expect(screen.getByText("Joie: +1")).toBeInTheDocument();
    expect(screen.getByText("Santé: +3")).toBeInTheDocument();
    expect(screen.getByText("Motivation: +1")).toBeInTheDocument();
    expect(screen.getByText("Finances: 0")).toBeInTheDocument();
  });

  it("falls back to neutral impact for unknown category mappings", async () => {
    const user = userEvent.setup();

    render(
      <TaskForm
        categories={[
          { id: "c-unknown", name: "UnknownCategory" },
        ]}
        categoriesAvailable={true}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />
    );

    await user.selectOptions(screen.getByLabelText("Catégorie (optionnel)"), "c-unknown");

    expect(screen.getByText("Fatigue: 0")).toBeInTheDocument();
    expect(screen.getByText("Stress: 0")).toBeInTheDocument();
    expect(screen.getByText("Joie: 0")).toBeInTheDocument();
    expect(screen.getByText("Santé: 0")).toBeInTheDocument();
    expect(screen.getByText("Motivation: 0")).toBeInTheDocument();
    expect(screen.getByText("Finances: 0")).toBeInTheDocument();
  });
});
