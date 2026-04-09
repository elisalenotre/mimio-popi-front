import { useEffect, useMemo, useState } from "react";
import { STATUS_DEFINITIONS } from "../../types/statuses";
import { ZERO_TASK_IMPACT } from "../../types/tasks";
import { getTaskTitleError, normalizeTaskTitle, TASK_TITLE_MAX_LENGTH } from "../../services/taskValidation/taskValidation";
import type { CreateTaskInput, TaskCategory } from "../../types/tasks";
import { estimateTaskImpactFromCategoryName } from "../../services/taskImpact/taskImpactEstimator";

type TaskFormProps = {
  categories: TaskCategory[];
  categoriesAvailable: boolean;
  categoriesError?: string | null;
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
  categoriesError = null,
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

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId]
  );

  const estimatedImpact = useMemo(() => {
    try {
      return estimateTaskImpactFromCategoryName(selectedCategory?.name);
    } catch {
      return { ...ZERO_TASK_IMPACT };
    }
  }, [selectedCategory?.name]);

  const impactCalculationError = useMemo(() => {
    try {
      estimateTaskImpactFromCategoryName(selectedCategory?.name);
      return null;
    } catch {
      return "Impossible d'estimer l'impact pour le moment.";
    }
  }, [selectedCategory?.name]);

  const formatDelta = (value: number) => {
    if (value > 0) return `+${value}`;
    return `${value}`;
  };

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
          ? "Popi n'a pas réussi à enregistrer les modifications. Réessaie."
          : "Popi n'a pas réussi à ajouter la tâche pour le moment. Réessaie."
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
        Catégorie (optionnel)
        <select
          id="task-category"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          disabled={!categoriesAvailable || submitting}
        >
          <option value="">Aucune catégorie</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {categoriesError && <p role="alert">{categoriesError}</p>}

      <section className="task-impact-estimate" aria-label="Impact estimé" aria-live="polite">
        <p className="task-impact-estimate__title">Impact estimé</p>
        <p className="task-impact-estimate__subtitle">Une estimation pour t'aider à choisir.</p>

        <ul className="task-impact-estimate__list">
          {STATUS_DEFINITIONS.map((definition) => {
            const delta = estimatedImpact[definition.key];
            const deltaClassName =
              delta > 0
                ? "task-impact-estimate__delta task-impact-estimate__delta--positive"
                : delta < 0
                  ? "task-impact-estimate__delta task-impact-estimate__delta--negative"
                  : "task-impact-estimate__delta task-impact-estimate__delta--neutral";

            return (
              <li key={definition.key} className="task-impact-estimate__item">
                <span>{definition.label}</span>
                <strong className={deltaClassName}>{`${definition.label}: ${formatDelta(delta)}`}</strong>
              </li>
            );
          })}
        </ul>

        {impactCalculationError && <p role="status">{impactCalculationError}</p>}
      </section>

      {categoriesAvailable && categories.length === 0 && <p role="status">Popi n'a trouvé aucune catégorie pour l'instant.</p>}

      {!categoriesAvailable && !categoriesError && <p role="status">Popi n'a trouvé aucune catégorie pour l'instant.</p>}

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
