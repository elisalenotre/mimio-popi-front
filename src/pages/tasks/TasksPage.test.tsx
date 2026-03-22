import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getMyTasksMock,
  getMyTaskCategoriesMock,
  initializeMyDefaultTaskCategoriesMock,
  createTaskMock,
  setTaskDoneStateMock,
  updateTaskMock,
  deleteTaskMock,
} = vi.hoisted(() => ({
  getMyTasksMock: vi.fn(),
  getMyTaskCategoriesMock: vi.fn(),
  initializeMyDefaultTaskCategoriesMock: vi.fn(),
  createTaskMock: vi.fn(),
  setTaskDoneStateMock: vi.fn(),
  updateTaskMock: vi.fn(),
  deleteTaskMock: vi.fn(),
}));

vi.mock("../../services/task/taskService", () => ({
  getMyTasks: getMyTasksMock,
  getMyTaskCategories: getMyTaskCategoriesMock,
  initializeMyDefaultTaskCategories: initializeMyDefaultTaskCategoriesMock,
  createTask: createTaskMock,
  setTaskDoneState: setTaskDoneStateMock,
  updateTask: updateTaskMock,
  deleteTask: deleteTaskMock,
}));

import TasksPage from "./TasksPage";

describe("TasksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getMyTasksMock.mockResolvedValue([]);
    initializeMyDefaultTaskCategoriesMock.mockResolvedValue(undefined);
    getMyTaskCategoriesMock.mockResolvedValue([
      { id: "c-1", name: "General" },
      { id: "c-2", name: "Travail" },
    ]);

    setTaskDoneStateMock.mockImplementation(async (taskId: string, isDone: boolean) => ({
      id: taskId,
      title: "Mise a jour",
      due_at: null,
      is_done: isDone,
      category_id: null,
      created_at: "2026-03-16",
      category: null,
    }));

    updateTaskMock.mockImplementation(async (taskId: string, payload: { title: string; notes?: string | null; categoryId: string | null; dueDate: string | null }) => ({
      id: taskId,
      title: payload.title,
      notes: payload.notes ?? null,
      due_at: payload.dueDate,
      is_done: false,
      category_id: payload.categoryId,
      created_at: "2026-03-16",
      category: payload.categoryId ? { id: payload.categoryId, name: "Travail" } : null,
    }));

    deleteTaskMock.mockResolvedValue("deleted");
  });

  it("edits task fields and persists updates in the list", async () => {
    const user = userEvent.setup();

    getMyTasksMock.mockResolvedValueOnce([
      {
        id: "t-edit-1",
        title: "Titre initial",
        due_at: null,
        is_done: false,
        category_id: null,
        created_at: "2026-03-16",
        category: null,
      },
    ]);

    updateTaskMock.mockResolvedValueOnce({
      id: "t-edit-1",
      title: "Titre mis a jour",
      due_at: "2026-03-22",
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

    await screen.findByText("Titre initial");

    await user.click(screen.getByRole("button", { name: "Actions pour Titre initial" }));
    await user.click(screen.getByRole("menuitem", { name: "Éditer" }));

    const titleInput = screen.getByLabelText("Titre");
    await user.clear(titleInput);
    await user.type(titleInput, "  Titre mis a jour  ");
    await user.selectOptions(screen.getByLabelText("Categorie (optionnel)"), "c-2");
    await user.type(screen.getByLabelText("Date (optionnel)"), "2026-03-22");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(updateTaskMock).toHaveBeenCalledWith("t-edit-1", {
        title: "Titre mis a jour",
        notes: null,
        categoryId: "c-2",
        dueDate: "2026-03-22",
      });
    });

    expect(await screen.findByText("Titre mis a jour")).toBeInTheDocument();
    expect(screen.getByText("Modifications enregistrées.")).toBeInTheDocument();
  });

  it("shows init categories error and keeps add flow available", async () => {
    const user = userEvent.setup();

    initializeMyDefaultTaskCategoriesMock.mockRejectedValueOnce(new Error("network"));
    createTaskMock.mockResolvedValueOnce({
      id: "t-99",
      title: "Tache sans categorie",
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

    expect(await screen.findByRole("alert")).toHaveTextContent("Impossible d'initialiser tes catégories. Réessaie.");

    await user.click(screen.getAllByRole("button", { name: "Ajouter une tâche" })[0]);
    await user.type(screen.getByLabelText("Titre"), "Tache sans categorie");
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    await waitFor(() => {
      expect(createTaskMock).toHaveBeenCalledWith({
        title: "Tache sans categorie",
        categoryId: null,
        dueDate: null,
      });
    });
  });

  it("prevents edit save with blank title", async () => {
    const user = userEvent.setup();

    getMyTasksMock.mockResolvedValueOnce([
      {
        id: "t-edit-2",
        title: "A garder",
        due_at: null,
        is_done: false,
        category_id: null,
        created_at: "2026-03-16",
        category: null,
      },
    ]);

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await screen.findByText("A garder");

    await user.click(screen.getByRole("button", { name: "Actions pour A garder" }));
    await user.click(screen.getByRole("menuitem", { name: "Éditer" }));
    const titleInput = screen.getByLabelText("Titre");
    await user.clear(titleInput);
    await user.type(titleInput, "   ");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(updateTaskMock).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Le titre ne peut pas être vide.");
  });

  it("keeps edit form values and refreshes tasks when save fails", async () => {
    const user = userEvent.setup();

    getMyTasksMock.mockResolvedValueOnce([
      {
        id: "t-edit-3",
        title: "Version locale",
        due_at: null,
        is_done: false,
        category_id: null,
        created_at: "2026-03-16",
        category: null,
      },
    ]);
    getMyTasksMock.mockResolvedValueOnce([
      {
        id: "t-edit-3",
        title: "Version distante",
        due_at: null,
        is_done: false,
        category_id: null,
        created_at: "2026-03-16",
        category: null,
      },
    ]);

    updateTaskMock.mockRejectedValueOnce(new Error("conflict"));

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await screen.findByText("Version locale");

    await user.click(screen.getByRole("button", { name: "Actions pour Version locale" }));
    await user.click(screen.getByRole("menuitem", { name: "Éditer" }));
    const titleInput = screen.getByLabelText("Titre");
    await user.clear(titleInput);
    await user.type(titleInput, "Nouvelle tentative");
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(getMyTasksMock).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText("Version distante")).toBeInTheDocument();
    expect(screen.getAllByText("Impossible d'enregistrer les modifications. Réessaie.").length).toBeGreaterThan(0);
    expect(titleInput).toHaveValue("Nouvelle tentative");
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

    await screen.findByRole("heading", { name: "Mes tâches" });

    await user.click(screen.getAllByRole("button", { name: "Ajouter une tâche" })[0]);
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
    expect(screen.getByText("tâche ajoutee.")).toBeInTheDocument();
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

    await screen.findByRole("heading", { name: "Mes tâches" });

    await user.click(screen.getAllByRole("button", { name: "Ajouter une tâche" })[0]);
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

    await screen.findByRole("heading", { name: "Mes tâches" });

    await user.click(screen.getAllByRole("button", { name: "Ajouter une tâche" })[0]);
    await user.type(screen.getByLabelText("Titre"), "   ");
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(createTaskMock).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert")[0]).toHaveTextContent("Le titre ne peut pas être vide.");
  });

  it("keeps form content and shows save error on api failure", async () => {
    const user = userEvent.setup();

    createTaskMock.mockRejectedValueOnce(new Error("network"));

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: "Mes tâches" });

    await user.click(screen.getAllByRole("button", { name: "Ajouter une tâche" })[0]);
    const titleInput = screen.getByLabelText("Titre");
    await user.type(titleInput, "Acheter pain");
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    await waitFor(() => {
      expect(screen.getByText("Impossible d'ajouter la tâche pour le moment. Reessaie.")).toBeInTheDocument();
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

    await screen.findByRole("heading", { name: "Mes tâches" });

    await user.click(screen.getAllByRole("button", { name: "Ajouter une tâche" })[0]);
    expect(screen.getByText("Categories indisponibles pour le moment. Tu peux quand meme ajouter une tâche simple.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Titre"), "Course rapide");
    await user.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(createTaskMock).toHaveBeenCalledWith({
      title: "Course rapide",
      categoryId: null,
      dueDate: null,
    });
  });

  it("shows loading error and allows retry", async () => {
    const user = userEvent.setup();

    getMyTasksMock.mockRejectedValueOnce(new Error("network"));
    getMyTasksMock.mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await screen.findByText("Impossible de charger tes tâches. Réessaie.");
    await user.click(screen.getByRole("button", { name: "Réessayer" }));

    await waitFor(() => {
      expect(getMyTasksMock).toHaveBeenCalledTimes(2);
    });
  });

  it("deletes a task after confirmation and removes it from the list", async () => {
    const user = userEvent.setup();

    getMyTasksMock.mockResolvedValueOnce([
      {
        id: "t-del-1",
        title: "Tache a supprimer",
        due_at: null,
        is_done: false,
        category_id: null,
        created_at: "2026-03-16",
        category: null,
      },
    ]);

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await screen.findByText("Tache a supprimer");

    await user.click(screen.getByRole("button", { name: "Actions pour Tache a supprimer" }));
    await user.click(screen.getByRole("menuitem", { name: "Supprimer" }));
    expect(screen.getByRole("heading", { name: "Supprimer cette tâche ?" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Supprimer" }));

    await waitFor(() => {
      expect(deleteTaskMock).toHaveBeenCalledWith("t-del-1");
    });

    expect(screen.queryByText("Tache a supprimer")).not.toBeInTheDocument();
    expect(screen.getByText("Tâche supprimée.")).toBeInTheDocument();
  });

  it("keeps task visible when deletion is cancelled", async () => {
    const user = userEvent.setup();

    getMyTasksMock.mockResolvedValueOnce([
      {
        id: "t-del-2",
        title: "Tache conservee",
        due_at: null,
        is_done: false,
        category_id: null,
        created_at: "2026-03-16",
        category: null,
      },
    ]);

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await screen.findByText("Tache conservee");

    await user.click(screen.getByRole("button", { name: "Actions pour Tache conservee" }));
    await user.click(screen.getByRole("menuitem", { name: "Supprimer" }));
    await user.click(screen.getByRole("button", { name: "Annuler" }));

    expect(deleteTaskMock).not.toHaveBeenCalled();
    expect(screen.getByText("Tache conservee")).toBeInTheDocument();
  });

  it("shows error and keeps task visible when delete fails", async () => {
    const user = userEvent.setup();

    getMyTasksMock.mockResolvedValueOnce([
      {
        id: "t-del-3",
        title: "Tache fragile",
        due_at: null,
        is_done: false,
        category_id: null,
        created_at: "2026-03-16",
        category: null,
      },
    ]);

    deleteTaskMock.mockRejectedValueOnce(new Error("network"));

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await screen.findByText("Tache fragile");

    await user.click(screen.getByRole("button", { name: "Actions pour Tache fragile" }));
    await user.click(screen.getByRole("menuitem", { name: "Supprimer" }));
    await user.click(screen.getByRole("button", { name: "Supprimer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Impossible de supprimer la tâche pour le moment. Réessaie.");
    expect(screen.getByText("Tache fragile")).toBeInTheDocument();
  });

  it("updates done state when checking a task", async () => {
    const user = userEvent.setup();

    getMyTasksMock.mockResolvedValueOnce([
      {
        id: "t-9",
        title: "Tache a faire",
        due_at: "2026-03-17",
        is_done: false,
        category_id: null,
        created_at: "2026-03-16",
        category: null,
      },
    ]);

    setTaskDoneStateMock.mockResolvedValueOnce({
      id: "t-9",
      title: "Tache a faire",
      due_at: "2026-03-17",
      is_done: true,
      category_id: null,
      created_at: "2026-03-16",
      category: null,
    });

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    await screen.findByText("Tache a faire");

    await user.click(screen.getByRole("checkbox", { name: 'Marquer "Tache a faire" comme faite' }));

    await waitFor(() => {
      expect(setTaskDoneStateMock).toHaveBeenCalledWith("t-9", true);
    });

    expect(await screen.findByText("Bravo, c'est fait.")).toBeInTheDocument();
  });

  it("updates done state when unchecking a done task", async () => {
    const user = userEvent.setup();

    getMyTasksMock.mockResolvedValueOnce([
      {
        id: "t-10",
        title: "Tache deja faite",
        due_at: "2026-03-17",
        is_done: true,
        category_id: null,
        created_at: "2026-03-16",
        category: null,
      },
    ]);

    setTaskDoneStateMock.mockResolvedValueOnce({
      id: "t-10",
      title: "Tache deja faite",
      due_at: "2026-03-17",
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

    const checkbox = await screen.findByRole("checkbox", { name: 'Marquer "Tache deja faite" comme a faire' });
    expect(checkbox).toBeChecked();

    await user.click(checkbox);

    await waitFor(() => {
      expect(setTaskDoneStateMock).toHaveBeenCalledWith("t-10", false);
    });

    expect(await screen.findByText("Tâche remise à faire.")).toBeInTheDocument();
  });

  it("rolls back checked state and shows error when toggle update fails", async () => {
    const user = userEvent.setup();

    getMyTasksMock.mockResolvedValueOnce([
      {
        id: "t-11",
        title: "Tache fragile",
        due_at: null,
        is_done: false,
        category_id: null,
        created_at: "2026-03-16",
        category: null,
      },
    ]);

    setTaskDoneStateMock.mockRejectedValueOnce(new Error("network"));

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    const checkbox = await screen.findByRole("checkbox", { name: 'Marquer "Tache fragile" comme faite' });
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);

    await waitFor(() => {
      expect(setTaskDoneStateMock).toHaveBeenCalledWith("t-11", true);
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Impossible de mettre à jour la tâche. Réessaie.");

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: 'Marquer "Tache fragile" comme faite' })).not.toBeChecked();
    });
  });

  it("prevents duplicate toggle calls while the task update is pending", async () => {
    const user = userEvent.setup();

    getMyTasksMock.mockResolvedValueOnce([
      {
        id: "t-12",
        title: "Tache anti spam",
        due_at: null,
        is_done: false,
        category_id: null,
        created_at: "2026-03-16",
        category: null,
      },
    ]);

    let resolveUpdate!: (value: {
      id: string;
      title: string;
      due_at: string | null;
      is_done: boolean;
      category_id: string | null;
      created_at: string;
      category: null;
    }) => void;

    setTaskDoneStateMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        })
    );

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>
    );

    const checkbox = await screen.findByRole("checkbox", { name: 'Marquer "Tache anti spam" comme faite' });

    await user.click(checkbox);
    expect(setTaskDoneStateMock).toHaveBeenCalledTimes(1);

    expect(screen.getByRole("checkbox", { name: 'Marquer "Tache anti spam" comme a faire' })).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: 'Marquer "Tache anti spam" comme a faire' }));
    expect(setTaskDoneStateMock).toHaveBeenCalledTimes(1);

    resolveUpdate({
      id: "t-12",
      title: "Tache anti spam",
      due_at: null,
      is_done: true,
      category_id: null,
      created_at: "2026-03-16",
      category: null,
    });

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: 'Marquer "Tache anti spam" comme a faire' })).not.toBeDisabled();
    });
  });
});
