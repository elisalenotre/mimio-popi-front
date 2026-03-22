import { useEffect, useState } from "react";
import { TaskForm } from "../../components/tasks/TaskForm";
import { TaskList } from "../../components/tasks/TaskList";
import { AppNavbar } from "../../components/navbar/AppNavbar";
import { createTask, getMyTaskCategories, getMyTasks, setTaskDoneState } from "../../services/task/taskService";
import type { CreateTaskInput, Task, TaskCategory } from "../../types/tasks";
import happyMascot from "../../assets/popi-mimio-very-happy.svg";
import plusIcon from "../../assets/icons/Plus.svg";
import "./TasksPage.css";

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [updatingTaskIds, setUpdatingTaskIds] = useState<string[]>([]);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
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

  const handleOpenTask = (task: Task) => {
    setSuccess(`Ouverture de \"${task.title}\" bientot disponible.`);
  };

  const handleOpenTaskMenu = (task: Task) => {
    setSuccess(`Menu d'actions pour \"${task.title}\" bientot disponible.`);
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
          updatingTaskIds={updatingTaskIds}
          onAddTask={() => {
            setShowMascotHint(false);
            setIsAddPanelOpen(true);
          }}
          onToggleDone={handleToggleDone}
          onOpenTask={handleOpenTask}
          onOpenTaskMenu={handleOpenTaskMenu}
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
        </main>
      </div>
    </>
  );
}
