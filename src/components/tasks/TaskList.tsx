import { useMemo, useState } from "react";
import type { Task } from "../../types/tasks";
import { TaskRow } from "./TaskRow";
import "./TaskList.css";

type TaskListProps = {
  tasks: Task[];
  todoOrderIds?: string[];
  updatingTaskIds?: string[];
  onAddTask: () => void;
  onToggleDone: (task: Task, nextDone: boolean) => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
  onReorderTodoTasks?: (draggedTaskId: string, targetTaskId: string) => void;
};

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

export function TaskList({
  tasks,
  todoOrderIds = [],
  updatingTaskIds = [],
  onAddTask,
  onToggleDone,
  onEditTask,
  onDeleteTask,
  onReorderTodoTasks,
}: TaskListProps) {
  const [showDoneTasks, setShowDoneTasks] = useState(true);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetTaskId, setDropTargetTaskId] = useState<string | null>(null);

  const { todoTasks, doneTasks } = useMemo(() => {
    const todoOrderIndex = new Map(todoOrderIds.map((taskId, index) => [taskId, index]));

    const todos = tasks.filter((task) => !task.is_done).sort((a, b) => {
      const orderA = todoOrderIndex.get(a.id);
      const orderB = todoOrderIndex.get(b.id);

      if (orderA !== undefined && orderB !== undefined && orderA !== orderB) {
        return orderA - orderB;
      }

      if (orderA !== undefined) {
        return -1;
      }

      if (orderB !== undefined) {
        return 1;
      }

      return sortTodoTasks(a, b);
    });

    const done = tasks.filter((task) => task.is_done).sort((a, b) => b.created_at.localeCompare(a.created_at));
    return {
      todoTasks: todos,
      doneTasks: done,
    };
  }, [tasks, todoOrderIds]);

  const clearDragState = () => {
    setDraggedTaskId(null);
    setDropTargetTaskId(null);
  };

  if (tasks.length === 0) {
    return (
      <div className="task-list-wrap task-list-empty" role="status" aria-live="polite">
        <p>Popi ne voit aucune tâche pour le moment.</p>
        <button type="button" onClick={onAddTask}>
          Ajouter une tâche
        </button>
      </div>
    );
  }

  return (
    <div className="task-list-wrap" aria-label="Liste des tâches">
      {todoTasks.length === 0 && <p className="task-list-feedback">Bravo, Mimio et Popi célèbrent: tout est fait !</p>}

      <div className="task-list-sections">
        <section className="task-list-section" aria-label="Tâches à faire">
          <div className="task-list-section__head">
            <h3>A faire</h3>
            <span className="task-list-count">{todoTasks.length}</span>
          </div>

          {todoTasks.length > 1 ? <p className="task-list-section__hint">Glisse une tâche pour changer son ordre.</p> : null}

          {todoTasks.length === 0 ? (
            <p>Popi dit: aucune tâche à faire.</p>
          ) : (
            <ul className="task-list">
              {todoTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isUpdating={updatingTaskIds.includes(task.id)}
                  isDraggable={todoTasks.length > 1 && !updatingTaskIds.includes(task.id)}
                  isDragging={draggedTaskId === task.id}
                  isDropTarget={dropTargetTaskId === task.id && draggedTaskId !== task.id}
                  onToggleDone={onToggleDone}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask}
                  onDragStart={() => setDraggedTaskId(task.id)}
                  onDragOver={(event) => {
                    if (!draggedTaskId || draggedTaskId === task.id) {
                      return;
                    }

                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDropTargetTaskId(task.id);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();

                    if (!draggedTaskId || draggedTaskId === task.id) {
                      clearDragState();
                      return;
                    }

                    onReorderTodoTasks?.(draggedTaskId, task.id);
                    clearDragState();
                  }}
                  onDragEnd={clearDragState}
                />
              ))}
            </ul>
          )}
        </section>

        <section className="task-list-section" aria-label="Tâches faites">
          <div className="task-list-section__head">
            <h3>Faites</h3>
            <span className="task-list-count">{doneTasks.length}</span>
          </div>

          {doneTasks.length > 0 && (
            <button
              type="button"
              className="task-list-section__toggle"
              onClick={() => setShowDoneTasks((current) => !current)}
              aria-expanded={showDoneTasks}
            >
              {showDoneTasks ? "Masquer les tâches faites" : "Afficher les tâches faites"}
            </button>
          )}

          {doneTasks.length === 0 ? (
            <p>Popi attend encore la première tâche faite.</p>
          ) : (
            showDoneTasks && (
              <ul className="task-list">
                {doneTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isUpdating={updatingTaskIds.includes(task.id)}
                    onToggleDone={onToggleDone}
                    onEditTask={onEditTask}
                    onDeleteTask={onDeleteTask}
                  />
                ))}
              </ul>
            )
          )}
        </section>
      </div>
    </div>
  );
}
