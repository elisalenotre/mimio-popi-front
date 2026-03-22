import { useEffect, useState } from "react";
import { TaskForm } from "../../components/tasks/TaskForm";
import { TaskList } from "../../components/tasks/TaskList";
import { AppNavbar } from "../../components/navbar/AppNavbar";
import { createTask, deleteTask, getMyTaskCategories, getMyTasks, setTaskDoneState, updateTask } from "../../services/task/taskService";
import type { CreateTaskInput, Task, TaskCategory } from "../../types/tasks";
import happyMascot from "../../assets/popi-mimio-very-happy.svg";
import plusIcon from "../../assets/icons/Plus.svg";
import "./TasksPage.css";

function toDateInputValue(dateIso: string | null) {
  if (!dateIso) return "";

  const raw = dateIso.trim();
  if (!raw) return "";

  return raw.includes("T") ? raw.slice(0, 10) : raw;
}

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [updatingTaskIds, setUpdatingTaskIds] = useState<string[]>([]);
  const [deletingTaskIds, setDeletingTaskIds] = useState<string[]>([]);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskPendingDelete, setTaskPendingDelete] = useState<Task | null>(null);
  const [showMascotHint, setShowMascotHint] = useState(true);

  const [categoriesAvailable, setCategoriesAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [isClockVisible, setIsClockVisible] = useState(true);

  const loadTaskData = async () => {
    setLoading(true);
    setLoadingError(null);

    try {
      const [tasksResult, categoriesResult] = await Promise.allSettled([getMyTasks(), getMyTaskCategories()]);

      if (tasksResult.status === "fulfilled") {
        setTasks(tasksResult.value);
      } else {
        setLoadingError("Impossible de charger tes tâches. Réessaie.");
      }

      if (categoriesResult.status === "fulfilled") {
        setCategories(categoriesResult.value);
        setCategoriesAvailable(true);
      } else {
        setCategoriesAvailable(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTaskData();
    // Runs once at mount to get initial task data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowMascotHint(false);
    }, 15000);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const dayLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  const timeLabel = new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);

  const handleCreateTask = async (payload: CreateTaskInput) => {
    setError(null);
    setSuccess(null);

    const created = await createTask(payload);
    setTasks((current) => [created, ...current.filter((task) => task.id !== created.id)]);
    setSuccess("tâche ajoutee.");
    setIsAddPanelOpen(false);
  };

  const handleUpdateTask = async (payload: CreateTaskInput) => {
    if (!editingTask) {
      return;
    }

    if (updatingTaskIds.includes(editingTask.id)) {
      return;
    }

    setError(null);
    setSuccess(null);
    setUpdatingTaskIds((current) => (current.includes(editingTask.id) ? current : [...current, editingTask.id]));

    try {
      const updated = await updateTask(editingTask.id, {
        title: payload.title,
        notes: payload.notes,
        categoryId: payload.categoryId,
        dueDate: payload.dueDate,
      });

      setTasks((current) => current.map((item) => (item.id === editingTask.id ? updated : item)));
      setSuccess("Modifications enregistrées.");
      setEditingTask(null);
    } catch {
      try {
        const latestTasks = await getMyTasks();
        setTasks(latestTasks);
      } catch {
        // Keeps current local list when refresh fails.
      }

      setError("Impossible d'enregistrer les modifications. Réessaie.");
      throw new Error("task-update-failed");
    } finally {
      setUpdatingTaskIds((current) => current.filter((id) => id !== editingTask.id));
    }
  };

  const handleToggleDone = async (task: Task, nextDone: boolean) => {
    if (updatingTaskIds.includes(task.id)) {
      return;
    }

    setError(null);
    setSuccess(null);
    setUpdatingTaskIds((current) => (current.includes(task.id) ? current : [...current, task.id]));

    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, is_done: nextDone } : item)));

    try {
      const updated = await setTaskDoneState(task.id, nextDone);
      setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
      setSuccess(nextDone ? "Bravo, c'est fait." : "Tâche remise à faire.");
    } catch {
      setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, is_done: task.is_done } : item)));
      setError("Impossible de mettre à jour la tâche. Réessaie.");
    } finally {
      setUpdatingTaskIds((current) => current.filter((id) => id !== task.id));
    }
  };

  const handleEditTask = (task: Task) => {
    setError(null);
    setSuccess(null);
    setEditingTask(task);
  };

  const handleRequestDeleteTask = (task: Task) => {
    if (deletingTaskIds.includes(task.id)) {
      return;
    }

    setError(null);
    setSuccess(null);
    setTaskPendingDelete(task);
  };

  const handleConfirmDeleteTask = async () => {
    if (!taskPendingDelete) {
      return;
    }

    const taskId = taskPendingDelete.id;
    if (deletingTaskIds.includes(taskId)) {
      return;
    }

    setError(null);
    setSuccess(null);
    setDeletingTaskIds((current) => (current.includes(taskId) ? current : [...current, taskId]));

    try {
      const deleteResult = await deleteTask(taskId);

      if (deleteResult === "missing") {
        try {
          const latestTasks = await getMyTasks();
          setTasks(latestTasks);
        } catch {
          // Keeps current local list when refresh fails.
        }

        setSuccess("Cette tâche n'existe plus. La liste a été actualisée.");
      } else {
        setTasks((current) => current.filter((task) => task.id !== taskId));
        if (editingTask?.id === taskId) {
          setEditingTask(null);
        }
        setSuccess("Tâche supprimée.");
      }

      setTaskPendingDelete(null);
    } catch {
      setError("Impossible de supprimer la tâche pour le moment. Réessaie.");
    } finally {
      setDeletingTaskIds((current) => current.filter((id) => id !== taskId));
    }
  };

  if (loading) {
    return (
      <>
        <AppNavbar />
        <div className="tasks-page-layout">
          <section className="tasks-page-header" aria-label="Bloc mes tâches">
            <h1>Mes tâches</h1>
            <p>Saisis les choses que tu aimerais accomplir aujourd'hui en cliquant sur le "+" dans la main de Mimio.</p>
          </section>

          <aside className="tasks-page-status" aria-label="Colonne statut">
            <h3>Statut</h3>
            <p>Bientot disponible.</p>
          </aside>

          <main className="tasks-page-main" aria-label="Bloc liste des tâches">
            <h2 className="tasks-main-title">Liste des tâches</h2>
            <div className="tasks-loader" role="status" aria-live="polite">
              <p>Chargement de tes tâches...</p>
            </div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <AppNavbar />
      <div className="tasks-page-layout">
        <section className="tasks-page-header" aria-label="Bloc mes tâches">
          <h1>Mes tâches</h1>
          <p>Saisis les choses que tu aimerais accomplir aujourd'hui en cliquant sur le "+" dans la main de Mimio.</p>
        </section>

        <aside className="tasks-page-status" aria-label="Colonne statut">
          <h3>Statut</h3>
          <p>Zone reservee pour les indicateurs a venir.</p>
        </aside>

        <main className="tasks-page-main" aria-label="Bloc liste des tâches">
        <h2 className="tasks-main-title">Liste des tâches</h2>
        <div className="tasks-mascot-wrap">
          {showMascotHint && (
            <p className="task-help-bubble" role="status" aria-live="polite">
              Pour ajouter une nouvelle tâche, c'est par ici par ici!
            </p>
          )}

          <img className="tasks-mascot" src={happyMascot} alt="Mimio et Popi tres heureux" />
          <button
            type="button"
            className="task-add-mascot-button"
            aria-label="Ajouter une tâche"
            onClick={() => {
              setShowMascotHint(false);
              setIsAddPanelOpen(true);
            }}
          >
            <img className="task-add-mascot-button__icon" src={plusIcon} alt="" aria-hidden="true" />
          </button>
        </div>

        {loadingError ? (
          <div className="tasks-error-state" role="alert">
            <p>{loadingError}</p>
            <button type="button" onClick={() => void loadTaskData()}>
              Réessayer
            </button>
          </div>
        ) : null}

        {error && <p role="alert">{error}</p>}
        {success && <p role="status">{success}</p>}

        <TaskList
          tasks={tasks}
          updatingTaskIds={Array.from(new Set([...updatingTaskIds, ...deletingTaskIds]))}
          onAddTask={() => {
            setShowMascotHint(false);
            setIsAddPanelOpen(true);
          }}
          onToggleDone={handleToggleDone}
          onEditTask={handleEditTask}
          onDeleteTask={handleRequestDeleteTask}
        />

        {isClockVisible ? (
          <button
            type="button"
            className="task-clock"
            aria-label="Masquer le jour et l'heure"
            onClick={() => setIsClockVisible(false)}
          >
            <span className="task-clock__day">{dayLabel}</span>
            <span className="task-clock__time">{timeLabel}</span>
          </button>
        ) : (
          <button
            type="button"
            className="task-clock-toggle"
            aria-label="Afficher le jour et l'heure"
            onClick={() => setIsClockVisible(true)}
          >
            Heure
          </button>
        )}

        {isAddPanelOpen && (
          <div className="task-modal-overlay" role="presentation" onClick={() => setIsAddPanelOpen(false)}>
            <section
              className="task-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Ajouter une tâche"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="task-modal-header">
                <h2>Ajouter une tâche</h2>
                <button type="button" onClick={() => setIsAddPanelOpen(false)}>
                  Fermer
                </button>
              </div>

              <TaskForm
                categories={categories}
                categoriesAvailable={categoriesAvailable}
                onSubmit={handleCreateTask}
              />
            </section>
          </div>
        )}

        {editingTask && (
          <div className="task-modal-overlay" role="presentation" onClick={() => setEditingTask(null)}>
            <section
              className="task-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Éditer une tâche"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="task-modal-header">
                <h2>Éditer la tâche</h2>
                <button type="button" onClick={() => setEditingTask(null)}>
                  Fermer
                </button>
              </div>

              <TaskForm
                mode="edit"
                initialValues={{
                  title: editingTask.title,
                  notes: editingTask.notes,
                  categoryId: editingTask.category_id,
                  dueDate: toDateInputValue(editingTask.due_at),
                }}
                categories={categories}
                categoriesAvailable={categoriesAvailable}
                onSubmit={handleUpdateTask}
              />
            </section>
          </div>
        )}

        {taskPendingDelete && (
          <div className="task-modal-overlay" role="presentation" onClick={() => setTaskPendingDelete(null)}>
            <section
              className="task-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Supprimer cette tâche ?"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="task-modal-header">
                <h2>Supprimer cette tâche ?</h2>
              </div>

              <p>Tu es sûr·e ? Cette action est définitive.</p>

              <div className="task-row__actions task-delete-confirm-actions">
                <button type="button" onClick={() => setTaskPendingDelete(null)} disabled={deletingTaskIds.includes(taskPendingDelete.id)}>
                  Annuler
                </button>
                <button type="button" onClick={() => void handleConfirmDeleteTask()} disabled={deletingTaskIds.includes(taskPendingDelete.id)}>
                  Supprimer
                </button>
              </div>
            </section>
          </div>
        )}
        </main>
      </div>
    </>
  );
}
