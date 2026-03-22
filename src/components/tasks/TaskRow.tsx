import type { Task } from "../../types/tasks";

type TaskRowProps = {
  task: Task;
  isUpdating: boolean;
  onToggleDone: (task: Task, nextDone: boolean) => void;
  onOpenTask?: (task: Task) => void;
  onOpenTaskMenu?: (task: Task) => void;
};

function parseDate(dateIso: string) {
  const raw = dateIso.trim();
  if (!raw) return null;

  const parsedValue = raw.includes("T") ? raw : `${raw}T00:00:00`;
  const date = new Date(parsedValue);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getRelativeDueLabel(dateIso: string | null) {
  if (!dateIso) return "Sans date";

  const dueDate = parseDate(dateIso);
  if (!dueDate) return "Sans date";

  const today = startOfDay(new Date());
  const dueDay = startOfDay(dueDate);
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000);

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  if (diffDays === -1) return "Hier";

  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(dueDate);
}

export function TaskRow({ task, isUpdating, onToggleDone, onOpenTask, onOpenTaskMenu }: TaskRowProps) {
  const dueLabel = getRelativeDueLabel(task.due_at);

  return (
    <li className={`task-row${task.is_done ? " task-row--done" : ""}${isUpdating ? " task-row--updating" : ""}`}>
      <label className="task-row__checkbox-wrap">
        <input
          type="checkbox"
          aria-label={`Marquer \"${task.title}\" comme ${task.is_done ? "a faire" : "faite"}`}
          checked={task.is_done}
          onChange={(event) => onToggleDone(task, event.target.checked)}
          disabled={isUpdating}
        />
      </label>

      <div className="task-row__content">
        <p className="task-row__title">{task.title}</p>

        <div className="task-row__meta" aria-label="Informations de la tâche">
          {task.category ? <span className="task-row__chip">{task.category.name}</span> : null}
          <span className="task-row__date">{dueLabel}</span>
        </div>
      </div>

      <div className="task-row__actions">
        <button type="button" onClick={() => onOpenTask?.(task)} disabled={isUpdating} aria-label={`Ouvrir ${task.title}`}>
          Ouvrir
        </button>
        <button
          type="button"
          className="task-row__menu"
          onClick={() => onOpenTaskMenu?.(task)}
          disabled={isUpdating}
          aria-label={`Actions pour ${task.title}`}
        >
          ...
        </button>
      </div>
    </li>
  );
}
