import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMyTasksMock, getMyTaskCategoriesMock, createTaskMock } = vi.hoisted(() => ({
  getMyTasksMock: vi.fn(),
  getMyTaskCategoriesMock: vi.fn(),
  createTaskMock: vi.fn(),
}));

vi.mock("../../services/taskService", () => ({
  getMyTasks: getMyTasksMock,
  getMyTaskCategories: getMyTaskCategoriesMock,
  createTask: createTaskMock,
}));

import TasksPage from "./TasksPage";

describe("TasksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getMyTasksMock.mockResolvedValue([]);
    getMyTaskCategoriesMock.mockResolvedValue([
      { id: "c-1", name: "General" },
      { id: "c-2", name: "Travail" },
    ]);
  });

  it("creates a minimal task with title only", async () => {
    const user = userEvent.setup();

    createTaskMock.mockResolvedValueOnce({
      id: "t-1",
      title: "Payer facture",
      due_at: null,
      is_done: false,
      category_id: null,
      created_at: "2026-03-16",
      category: null,
    });

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: "Mes taches" });

    await user.click(screen.getByRole("button", { name: "Ajouter une tache" }));
    await user.type(screen.getByLabelText("Titre"), "  Payer facture  ");
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    await waitFor(() => {
      expect(createTaskMock).toHaveBeenCalledWith({
        title: "Payer facture",
        categoryId: null,
        dueDate: null,
      });
    });

    expect(screen.getByText("Payer facture")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "" })).toHaveTextContent("Tache ajoutee.");
  });

  it("creates a task with category and date", async () => {
    const user = userEvent.setup();

    createTaskMock.mockResolvedValueOnce({
      id: "t-2",
      title: "Reviser",
      due_at: "2026-03-17",
      is_done: false,
      category_id: "c-2",
      created_at: "2026-03-16",
      category: { id: "c-2", name: "Travail" },
    });

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: "Mes taches" });

    await user.click(screen.getByRole("button", { name: "Ajouter une tache" }));
    await user.type(screen.getByLabelText("Titre"), "Reviser");
    await user.selectOptions(screen.getByLabelText("Categorie (optionnel)"), "c-2");
    await user.type(screen.getByLabelText("Date (optionnel)"), "2026-03-17");
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    await waitFor(() => {
      expect(createTaskMock).toHaveBeenCalledWith({
        title: "Reviser",
        categoryId: "c-2",
        dueDate: "2026-03-17",
      });
    });
  });

  it("blocks submit with blank title", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: "Mes taches" });

    await user.click(screen.getByRole("button", { name: "Ajouter une tache" }));
    await user.type(screen.getByLabelText("Titre"), "   ");
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(createTaskMock).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("Ajoute un titre pour creer ta tache.");
  });

  it("keeps form content and shows save error on api failure", async () => {
    const user = userEvent.setup();

    createTaskMock.mockRejectedValueOnce(new Error("network"));

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: "Mes taches" });

    await user.click(screen.getByRole("button", { name: "Ajouter une tache" }));
    const titleInput = screen.getByLabelText("Titre");
    await user.type(titleInput, "Acheter pain");
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    await waitFor(() => {
      expect(screen.getByText("Impossible d'ajouter la tache pour le moment. Reessaie.")).toBeInTheDocument();
    });

    expect(titleInput).toHaveValue("Acheter pain");
  });

  it("keeps add flow available if categories fail to load", async () => {
    const user = userEvent.setup();

    getMyTaskCategoriesMock.mockRejectedValueOnce(new Error("timeout"));
    createTaskMock.mockResolvedValueOnce({
      id: "t-3",
      title: "Course rapide",
      due_at: null,
      is_done: false,
      category_id: null,
      created_at: "2026-03-16",
      category: null,
    });

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: "Mes taches" });

    await user.click(screen.getByRole("button", { name: "Ajouter une tache" }));
    expect(screen.getByText("Categories indisponibles pour le moment. Tu peux quand meme ajouter une tache simple.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Titre"), "Course rapide");
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(createTaskMock).toHaveBeenCalledWith({
      title: "Course rapide",
      categoryId: null,
      dueDate: null,
    });
  });
});
