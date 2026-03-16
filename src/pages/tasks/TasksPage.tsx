import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TaskForm } from "../../components/tasks/TaskForm";
import { TaskList } from "../../components/tasks/TaskList";
import { createTask, getMyTaskCategories, getMyTasks } from "../../services/taskService";
import type { CreateTaskInput, Task, TaskCategory } from "../../types/tasks";
import happyMascot from "../../assets/popi-mimio-very-happy.svg";
import "./TasksPage.css";

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [showMascotHint, setShowMascotHint] = useState(true);

  const [categoriesAvailable, setCategoriesAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [tasksResult, categoriesResult] = await Promise.allSettled([getMyTasks(), getMyTaskCategories()]);

        if (tasksResult.status === "fulfilled") {
          setTasks(tasksResult.value);
        } else {
          setError("Impossible de charger les taches pour le moment.");
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
    })();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowMascotHint(false);
    }, 15000);

    return () => window.clearTimeout(timer);
  }, []);

  const handleCreateTask = async (payload: CreateTaskInput) => {
    setError(null);
    setSuccess(null);

    const created = await createTask(payload);
    setTasks((current) => [created, ...current]);
    setSuccess("Tache ajoutee.");
    setIsAddPanelOpen(false);
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <main>
      <h1>Mes taches</h1>
      <p>Capture vite ce que tu dois faire pour alleger ta charge mentale.</p>

      <div className="tasks-mascot-wrap">
        {showMascotHint && (
          <p className="task-help-bubble" role="status" aria-live="polite">
            Hello!! Ajoute une nouvelle tache ici!!
          </p>
        )}

        <img className="tasks-mascot" src={happyMascot} alt="Mimio et Popi tres heureux" />
        <button
          type="button"
          className="task-add-mascot-button"
          aria-label="Ajouter une tache"
          onClick={() => {
            setShowMascotHint(false);
            setIsAddPanelOpen(true);
          }}
        >
          +
        </button>
      </div>

      <p>
        <Link to="/settings">Aller aux parametres</Link>
      </p>

      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}

      <hr />

      <section>
        <h2>Liste</h2>
        <TaskList tasks={tasks} />
      </section>

      {isAddPanelOpen && (
        <div className="task-modal-overlay" role="presentation" onClick={() => setIsAddPanelOpen(false)}>
          <section
            className="task-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Ajouter une tache"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="task-modal-header">
              <h2>Ajouter une tache</h2>
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
  );
}
