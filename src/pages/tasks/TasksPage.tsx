import { useEffect, useState } from "react";
import { TaskForm } from "../../components/tasks/TaskForm";
import { TaskList } from "../../components/tasks/TaskList";
import { AppNavbar } from "../../components/navbar/AppNavbar";
import { useOptionalAuth } from "../../contexts/AuthContext";
import {
  createTask,
  deleteTask,
  getMyTaskCategories,
  getMyTasks,
  initializeMyDefaultTaskCategories,
  setTaskDoneState,
  updateTask,
} from "../../services/task/taskService";
import type { CreateTaskInput, Task, TaskCategory } from "../../types/tasks";
import { StatusMiniPanel } from "../../components/statuses/StatusMiniPanel";
import happyMascot from "../../assets/popi-mimio-very-happy.svg";
import plusIcon from "../../assets/icons/Plus.svg";
import "./TasksPage.css";

const TASK_ORDER_STORAGE_PREFIX = "mimio-popi-task-order:";

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

function splitDueInputValue(dateIso: string | null) {
  if (!dateIso) {
    return { date: "", time: "" };
  }

  const raw = dateIso.trim();
  if (!raw) {
    return { date: "", time: "" };
  }

  if (!raw.includes("T")) {
    return { date: raw.slice(0, 10), time: "" };
  }

  const [datePart, timePart = ""] = raw.split("T");
  return {
    date: datePart.slice(0, 10),
    time: /^\d{2}:\d{2}/.test(timePart) ? timePart.slice(0, 5) : "",
  };
}

function getTaskOrderStorageKey(userId: string | undefined) {
  return `${TASK_ORDER_STORAGE_PREFIX}${userId ?? "anonymous"}`;
}

function readStoredTodoOrder(storageKey: string) {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      return [] as string[];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [] as string[];
  }
}

function mergeTodoOrder(tasks: Task[], currentOrder: string[]) {
  const todoTasks = tasks.filter((task) => !task.is_done);
  const todoIds = new Set(todoTasks.map((task) => task.id));
  const persistedIds = currentOrder.filter((taskId) => todoIds.has(taskId));
  const persistedIdSet = new Set(persistedIds);
  const remainingIds = todoTasks
    .filter((task) => !persistedIdSet.has(task.id))
    .sort(sortTodoTasks)
    .map((task) => task.id);

  return [...persistedIds, ...remainingIds];
}

function reorderTaskIds(taskIds: string[], draggedTaskId: string, targetTaskId: string) {
  if (draggedTaskId === targetTaskId) {
    return taskIds;
  }

  const nextOrder = [...taskIds];
  const draggedIndex = nextOrder.indexOf(draggedTaskId);
  const targetIndex = nextOrder.indexOf(targetTaskId);

  if (draggedIndex === -1 || targetIndex === -1) {
    return taskIds;
  }

  nextOrder.splice(draggedIndex, 1);
  nextOrder.splice(targetIndex, 0, draggedTaskId);
  return nextOrder;
}

function toDateInputValue(dateIso: string | null) {
  return splitDueInputValue(dateIso).date;
}

function toTimeInputValue(dateIso: string | null) {
  return splitDueInputValue(dateIso).time;
}

function normalizePseudo(raw: string | null | undefined) {
  if (!raw) return null;

  const normalized = raw.trim();
  if (!normalized) return null;

  if (normalized.length <= 24) {
    return normalized;
  }

  return `${normalized.slice(0, 24).trim()}...`;
}

export default function TasksPage() {
  const auth = useOptionalAuth();
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
  const [todoOrderIds, setTodoOrderIds] = useState<string[]>([]);
  const [hasLoadedTodoOrder, setHasLoadedTodoOrder] = useState(false);

  const [categoriesAvailable, setCategoriesAvailable] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [statusRefreshToken, setStatusRefreshToken] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [isClockVisible, setIsClockVisible] = useState(true);

  const userMetadata = auth?.user?.user_metadata as Record<string, unknown> | null | undefined;
  const pseudoFromMetadata =
    (typeof userMetadata?.display_name === "string" && userMetadata.display_name) ||
    (typeof userMetadata?.preferred_username === "string" && userMetadata.preferred_username) ||
    (typeof userMetadata?.full_name === "string" && userMetadata.full_name) ||
    (typeof userMetadata?.name === "string" && userMetadata.name) ||
    null;

  const pseudoFromEmail = auth?.user?.email ? auth.user.email.split("@")[0] : null;
  const pseudo = normalizePseudo(pseudoFromMetadata ?? pseudoFromEmail);
  const bubblePseudoSuffix = pseudo ? `${pseudo}` : "";
  const taskOrderStorageKey = getTaskOrderStorageKey(auth?.user?.id);

  const loadTaskData = async () => {
    setLoading(true);
    setLoadingError(null);
    setError(null);
    setCategoriesError(null);

    let initError = false;
    try {
      await initializeMyDefaultTaskCategories();
    } catch {
      initError = true;
    }

    try {
      const [tasksResult, categoriesResult] = await Promise.allSettled([getMyTasks(), getMyTaskCategories()]);

      if (tasksResult.status === "fulfilled") {
        setTasks(tasksResult.value);
      } else {
        setLoadingError("Popi n'arrive pas à charger tes tâches pour l'instant. Réessaie dans un petit moment.");
      }

      if (categoriesResult.status === "fulfilled") {
        setCategories(categoriesResult.value);
        setCategoriesAvailable(true);
        setCategoriesError(null);
      } else {
        setCategoriesAvailable(false);
        setCategoriesError("Popi n'arrive pas à charger les catégories pour le moment.");
      }

      if (initError) {
        setError("Popi n'a pas pu préparer tes catégories. Réessaie dans un instant.");
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

  useEffect(() => {
    setTodoOrderIds(readStoredTodoOrder(taskOrderStorageKey));
    setHasLoadedTodoOrder(true);
  }, [taskOrderStorageKey]);

  useEffect(() => {
    if (!hasLoadedTodoOrder || loading || typeof window === "undefined") {
      return;
    }

    const nextOrder = mergeTodoOrder(tasks, todoOrderIds);

    if (nextOrder.length !== todoOrderIds.length || nextOrder.some((taskId, index) => taskId !== todoOrderIds[index])) {
      setTodoOrderIds(nextOrder);
      return;
    }

    window.localStorage.setItem(taskOrderStorageKey, JSON.stringify(nextOrder));
  }, [hasLoadedTodoOrder, loading, taskOrderStorageKey, tasks, todoOrderIds]);

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
    const categoryWasRemoved = Boolean(payload.categoryId && created.category_id === null);
    setSuccess(
      categoryWasRemoved
        ? "Mimio a ajouté ta tâche, mais la catégorie n'existait plus alors je l'ai retirée."
        : "Mimio a ajouté ta tâche avec soin."
    );
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
      const categoryWasRemoved = Boolean(payload.categoryId && updated.category_id === null);
      setSuccess(
        categoryWasRemoved
          ? "Mimio a enregistré les changements, mais la catégorie n'existait plus alors je l'ai retirée."
          : "Mimio a bien noté les changements."
      );
      setEditingTask(null);
    } catch {
      try {
        const latestTasks = await getMyTasks();
        setTasks(latestTasks);
      } catch {
        // Keeps current local list when refresh fails.
      }

      setError("Popi n'a pas réussi à enregistrer tes modifications. Réessaie.");
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
      const result = await setTaskDoneState(task.id, nextDone);
      setTasks((current) => current.map((item) => (item.id === task.id ? result.task : item)));

      // Statuses can change on both check and uncheck flows.
      setStatusRefreshToken((current) => current + 1);

      setSuccess(nextDone ? "Petit pas, grands effets." : "Hop, Mimio remet cette tâche à faire.");
    } catch {
      setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, is_done: task.is_done } : item)));
      setError("Impossible de mettre à jour tes statuts. Réessaie.");
    } finally {
      setUpdatingTaskIds((current) => current.filter((id) => id !== task.id));
    }
  };

  const handleEditTask = (task: Task) => {
    setError(null);
    setSuccess(null);
    setEditingTask(task);
  };

  const handleReorderTodoTasks = (draggedTaskId: string, targetTaskId: string) => {
    setTodoOrderIds((current) => {
      const nextBaseOrder = mergeTodoOrder(tasks, current);
      const nextOrder = reorderTaskIds(nextBaseOrder, draggedTaskId, targetTaskId);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(taskOrderStorageKey, JSON.stringify(nextOrder));
      }

      return nextOrder;
    });
    setSuccess("Mimio a réorganisé tes tâches à faire.");
    setError(null);
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

        setSuccess("Oups, cette tâche n'existe plus. Mimio a rafraîchi la liste.");
      } else {
        setTasks((current) => current.filter((task) => task.id !== taskId));
        if (editingTask?.id === taskId) {
          setEditingTask(null);
        }
        setSuccess("Pouf, Mimio a supprimé la tâche.");
      }

      setTaskPendingDelete(null);
    } catch {
      setError("Popi n'a pas réussi à supprimer la tâche pour le moment. Réessaie.");
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
            <p>Popi et Mimio t'aident à garder le cap: ajoute tes tâches en cliquant sur le "+" dans la main de Mimio.</p>
          </section>

          <aside className="tasks-page-status" aria-label="Aperçu statuts">
            <StatusMiniPanel refreshToken={statusRefreshToken} />
          </aside>

          <main className="tasks-page-main" aria-label="Bloc liste des tâches">
            <h2 className="tasks-main-title">Liste des tâches</h2>
            <div className="tasks-loader" role="status" aria-live="polite">
              <p>Popi et Mimio préparent tes tâches...</p>
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
          <p>Popi et Mimio t'aident à garder le cap: ajoute tes tâches en cliquant sur le "+" dans la main de Mimio.</p>
        </section>

        <aside className="tasks-page-status" aria-label="Aperçu statuts">
          <StatusMiniPanel refreshToken={statusRefreshToken} />
        </aside>

        <main className="tasks-page-main" aria-label="Bloc liste des tâches">
        <h2 className="tasks-main-title">Liste des tâches</h2>
        <div className="tasks-mascot-wrap">
          {showMascotHint && (
            <p className="task-help-bubble" role="status" aria-live="polite">
              Hé, par ici, {bubblePseudoSuffix} ! Clique dans ma main pour créer une tâche !
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
          todoOrderIds={todoOrderIds}
          updatingTaskIds={Array.from(new Set([...updatingTaskIds, ...deletingTaskIds]))}
          onAddTask={() => {
            setShowMascotHint(false);
            setIsAddPanelOpen(true);
          }}
          onToggleDone={handleToggleDone}
          onEditTask={handleEditTask}
          onDeleteTask={handleRequestDeleteTask}
          onReorderTodoTasks={handleReorderTodoTasks}
        />

        {isClockVisible ? (
          <button
            type="button"
            className="task-clock"
            aria-label="Masquer l'horloge de Popi"
            onClick={() => setIsClockVisible(false)}
          >
            <span className="task-clock__day">{dayLabel}</span>
            <span className="task-clock__time">{timeLabel}</span>
          </button>
        ) : (
          <button
            type="button"
            className="task-clock-toggle"
            aria-label="Afficher l'horloge de Popi"
            onClick={() => setIsClockVisible(true)}
          >
            Voir l'heure
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
                categoriesError={categoriesError}
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
                  dueTime: toTimeInputValue(editingTask.due_at),
                }}
                categories={categories}
                categoriesAvailable={categoriesAvailable}
                categoriesError={categoriesError}
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
