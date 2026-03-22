import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TaskList } from "./TaskList";
import type { Task } from "../../types/tasks";

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: "task-id",
    title: "Titre",
    due_at: null,
    is_done: false,
    category_id: null,
    created_at: "2026-03-16T10:00:00.000Z",
    category: null,
    ...overrides,
  };
}

describe("TaskList", () => {
  it("shows empty state and add CTA", async () => {
    const user = userEvent.setup();
    const onAddTask = vi.fn();

    render(<TaskList tasks={[]} onAddTask={onAddTask} onToggleDone={vi.fn()} />);

    expect(screen.getByText("Tu n'as rien a faire pour l'instant.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ajouter une tâche" }));
    expect(onAddTask).toHaveBeenCalledTimes(1);
  });

  it("separates todo and done tasks", () => {
    const tasks: Task[] = [
      makeTask({ id: "done-1", title: "Fait", is_done: true }),
      makeTask({ id: "todo-1", title: "A faire", is_done: false }),
    ];

    render(<TaskList tasks={tasks} onAddTask={vi.fn()} onToggleDone={vi.fn()} />);

    const todoSection = screen.getByRole("region", { name: "Tâches à faire" });
    const doneSection = screen.getByRole("region", { name: "Tâches faites" });

    expect(todoSection).toHaveTextContent("A faire");
    expect(todoSection).toHaveTextContent("A faire");
    expect(doneSection).toHaveTextContent("Faites");
    expect(doneSection).toHaveTextContent("Fait");
  });

  it("sorts todo tasks by nearest due date then without date", () => {
    const tasks: Task[] = [
      makeTask({ id: "todo-3", title: "Sans date", due_at: null }),
      makeTask({ id: "todo-2", title: "Date proche", due_at: "2026-03-17" }),
      makeTask({ id: "todo-1", title: "Date plus loin", due_at: "2026-03-20" }),
    ];

    render(<TaskList tasks={tasks} onAddTask={vi.fn()} onToggleDone={vi.fn()} />);

    const todoSection = screen.getByRole("region", { name: "Tâches à faire" });
    const labels = Array.from(todoSection.querySelectorAll(".task-row__title")).map((node) => node.textContent);

    expect(labels).toEqual(["Date proche", "Date plus loin", "Sans date"]);
  });

  it("closes task actions menu when pressing Escape", async () => {
    const user = userEvent.setup();

    const tasks: Task[] = [
      makeTask({ id: "todo-esc", title: "Action clavier" }),
    ];

    render(<TaskList tasks={tasks} onAddTask={vi.fn()} onToggleDone={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Actions pour Action clavier" }));
    expect(screen.getByRole("menu", { name: "Menu actions Action clavier" })).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu", { name: "Menu actions Action clavier" })).not.toBeInTheDocument();
  });
});
