import { useMemo, useState } from "react";
import { getTaskTitleError, normalizeTaskTitle, TASK_TITLE_MAX_LENGTH } from "../../services/taskValidation/taskValidation";
import type { CreateTaskInput, TaskCategory } from "../../types/tasks";

type TaskFormProps = {
  categories: TaskCategory[];
  categoriesAvailable: boolean;
  onSubmit: (payload: CreateTaskInput) => Promise<void>;
};

export function TaskForm({ categories, categoriesAvailable, onSubmit }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleError = useMemo(() => getTaskTitleError(title), [title]);
  const showTitleError = titleTouched && titleError;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTitleTouched(true);

    const normalizedTitle = normalizeTaskTitle(title);
    const validationError = getTaskTitleError(normalizedTitle);

    if (validationError) {
      return;
    }

    setError(null);

    try {
      setSubmitting(true);
      await onSubmit({
        title: normalizedTitle,
        categoryId: categoryId || null,
        dueDate: dueDate || null,
      });

      setTitle("");
      setCategoryId("");
      setDueDate("");
      setTitleTouched(false);
    } catch {
      setError("Impossible d'ajouter la tâche pour le moment. Reessaie.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Ajouter une tâche">
      <label htmlFor="task-title">
        Titre
        <input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={TASK_TITLE_MAX_LENGTH}
          placeholder="Ex: Avancer sur le projet ou 18h30 rendez-vous chez le médecin"
        />
      </label>

      {showTitleError && <p role="alert">{titleError}</p>}

      <label htmlFor="task-category">
        Categorie (optionnel)
        <select
          id="task-category"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          disabled={!categoriesAvailable || submitting}
        >
          <option value="">Aucune</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {!categoriesAvailable && (
        <p role="status">Categories indisponibles pour le moment. Tu peux quand meme ajouter une tâche simple.</p>
      )}

      <label htmlFor="task-due-date">
        Date (optionnel)
        <input
          id="task-due-date"
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
          disabled={submitting}
        />
      </label>

      {dueDate && (
        <button type="button" onClick={() => setDueDate("")} disabled={submitting}>
          Effacer la date
        </button>
      )}

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Ajout..." : "Ajouter"}
      </button>
    </form>
  );
}
