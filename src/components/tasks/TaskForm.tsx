import { useEffect, useMemo, useState } from "react";
import { getTaskTitleError, normalizeTaskTitle, TASK_TITLE_MAX_LENGTH } from "../../services/taskValidation/taskValidation";
import type { CreateTaskInput, TaskCategory } from "../../types/tasks";

type TaskFormProps = {
  categories: TaskCategory[];
  categoriesAvailable: boolean;
  mode?: "create" | "edit";
  initialValues?: {
    title?: string;
    notes?: string | null;
    categoryId?: string | null;
    dueDate?: string | null;
  };
  onSubmit: (payload: CreateTaskInput) => Promise<void>;
};

export function TaskForm({
  categories,
  categoriesAvailable,
  mode = "create",
  initialValues,
  onSubmit,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? "");
  const [dueDate, setDueDate] = useState(initialValues?.dueDate ?? "");
  const [titleTouched, setTitleTouched] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleError = useMemo(() => getTaskTitleError(title), [title]);
  const showTitleError = titleTouched && titleError;

  useEffect(() => {
    setTitle(initialValues?.title ?? "");
    setNotes(initialValues?.notes ?? "");
    setCategoryId(initialValues?.categoryId ?? "");
    setDueDate(initialValues?.dueDate ?? "");
    setTitleTouched(false);
    setError(null);
  }, [initialValues?.categoryId, initialValues?.dueDate, initialValues?.notes, initialValues?.title]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTitleTouched(true);

    const normalizedTitle = normalizeTaskTitle(title);
    const normalizedNotes = notes.trim();
    const validationError = getTaskTitleError(normalizedTitle);

    if (validationError) {
      return;
    }

    setError(null);

    try {
      setSubmitting(true);
      const payload: CreateTaskInput = {
        title: normalizedTitle,
        categoryId: categoryId || null,
        dueDate: dueDate || null,
      };

      if (mode === "edit" || normalizedNotes.length > 0) {
        payload.notes = normalizedNotes || null;
      }

      await onSubmit(payload);

      if (mode === "create") {
        setTitle("");
        setNotes("");
        setCategoryId("");
        setDueDate("");
        setTitleTouched(false);
      }
    } catch {
      setError(
        mode === "edit"
          ? "Impossible d'enregistrer les modifications. Réessaie."
          : "Impossible d'ajouter la tâche pour le moment. Reessaie."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label={mode === "edit" ? "Éditer une tâche" : "Ajouter une tâche"}>
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

      <label htmlFor="task-notes">
        Notes (optionnel)
        <textarea
          id="task-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          placeholder="Ajoute un contexte si besoin"
          disabled={submitting}
        />
      </label>

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
        {submitting ? (mode === "edit" ? "Enregistrement..." : "Ajout...") : mode === "edit" ? "Enregistrer" : "Ajouter"}
      </button>
    </form>
  );
}
