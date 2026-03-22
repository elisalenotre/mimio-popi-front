import { useMemo, useState } from "react";
import type { Task } from "../../types/tasks";
import { TaskRow } from "./TaskRow";
import "./TaskList.css";

type TaskListProps = {
  tasks: Task[];
  updatingTaskIds?: string[];
  onAddTask: () => void;
  onToggleDone: (task: Task, nextDone: boolean) => void;
  onEditTask?: (task: Task) => void;
  onOpenTaskMenu?: (task: Task) => void;
};

function getSortableDueTime(dateIso: string | null) {
  if (!dateIso) return Number.POSITIVE_INFINITY;

  const raw = dateIso.trim();
  if (!raw) return Number.POSITIVE_INFINITY;

  const parsedValue = raw.includes("T") ? raw : `${raw}T00:00:00`;
  const date = new Date(parsedValue);

  if (Number.isNaN(date.getTime())) {
    return Number.POSITIVE_INFINITY;
  }

  return date.getTime();
}

function sortTodoTasks(a: Task, b: Task) {
  const dueA = getSortableDueTime(a.due_at);
  const dueB = getSortableDueTime(b.due_at);

  if (dueA !== dueB) {
    return dueA - dueB;
  }

  return b.created_at.localeCompare(a.created_at);
}

export function TaskList({
  tasks,
  updatingTaskIds = [],
  onAddTask,
  onToggleDone,
  onEditTask,
  onOpenTaskMenu,
}: TaskListProps) {
  const [showDoneTasks, setShowDoneTasks] = useState(true);

  const { todoTasks, doneTasks } = useMemo(() => {
    const todos = tasks.filter((task) => !task.is_done).sort(sortTodoTasks);
    const done = tasks.filter((task) => task.is_done).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return {
      todoTasks: todos,
      doneTasks: done,
    };
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <div className="task-list-wrap task-list-empty" role="status" aria-live="polite">
        <p>Tu n'as rien a faire pour l'instant.</p>
        <button type="button" onClick={onAddTask}>
          Ajouter une tâche
        </button>
      </div>
    );
  }

  return (
    <div className="task-list-wrap" aria-label="Liste des tâches">
      {todoTasks.length === 0 && <p className="task-list-feedback">Tout est fait, bien joue.</p>}

      <div className="task-list-sections">
        <section className="task-list-section" aria-label="Tâches à faire">
          <div className="task-list-section__head">
            <h3>A faire</h3>
            <span className="task-list-count">{todoTasks.length}</span>
          </div>

          {todoTasks.length === 0 ? (
            <p>Aucune tâche a faire.</p>
          ) : (
            <ul className="task-list">
              {todoTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isUpdating={updatingTaskIds.includes(task.id)}
                  onToggleDone={onToggleDone}
                  onEditTask={onEditTask}
                  onOpenTaskMenu={onOpenTaskMenu}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="task-list-section" aria-label="Tâches faites">
          <div className="task-list-section__head">
            <h3>Faites</h3>
            <span className="task-list-count">{doneTasks.length}</span>
          </div>

          {doneTasks.length > 0 && (
            <button
              type="button"
              className="task-list-section__toggle"
              onClick={() => setShowDoneTasks((current) => !current)}
              aria-expanded={showDoneTasks}
            >
              {showDoneTasks ? "Masquer les tâches faites" : "Afficher les tâches faites"}
            </button>
          )}

          {doneTasks.length === 0 ? (
            <p>Pas encore de tâche faite.</p>
          ) : (
            showDoneTasks && (
              <ul className="task-list">
                {doneTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isUpdating={updatingTaskIds.includes(task.id)}
                    onToggleDone={onToggleDone}
                    onEditTask={onEditTask}
                    onOpenTaskMenu={onOpenTaskMenu}
                  />
                ))}
              </ul>
            )
          )}
        </section>
      </div>
    </div>
  );
}
