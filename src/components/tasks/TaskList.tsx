import type { Task } from "../../types/tasks";

type TaskListProps = {
  tasks: Task[];
};

function formatDueDate(dateIso: string | null) {
  if (!dateIso) return "Sans date";

  const raw = dateIso.trim();
  if (!raw) return "Sans date";

  const parsedValue = raw.includes("T") ? raw : `${raw}T00:00:00`;
  const date = new Date(parsedValue);

  if (Number.isNaN(date.getTime())) {
    return "Sans date";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(date);
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return <p>Aucune tâche pour le moment.</p>;
  }

  return (
    <ul aria-label="Liste des tâches">
      {tasks.map((task) => (
        <li key={task.id}>
          <strong>{task.title}</strong>
          <p>{task.category?.name ?? "Aucune categorie"}</p>
          <p>{formatDueDate(task.due_at)}</p>
          {!task.is_done && <p>Statut: a faire</p>}
        </li>
      ))}
    </ul>
  );
}
