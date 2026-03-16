import type { Task } from "../../types/tasks";

type TaskListProps = {
  tasks: Task[];
};

function formatDueDate(dateIso: string | null) {
  if (!dateIso) return "Sans date";

  const date = new Date(`${dateIso}T00:00:00`);
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
