import { STATUS_KEYS, type StatusKey } from "./statuses";

export type TaskCategory = {
  id: string;
  name: string;
};

export type TaskImpact = Record<StatusKey, number>;

export const ZERO_TASK_IMPACT: TaskImpact = {
  fatigue: 0,
  stress: 0,
  joie: 0,
  sante: 0,
  motivation: 0,
  finances: 0,
};

export function normalizeTaskImpact(rawImpact: unknown): TaskImpact {
  if (!rawImpact || typeof rawImpact !== "object" || Array.isArray(rawImpact)) {
    return { ...ZERO_TASK_IMPACT };
  }

  const rawImpactObject = rawImpact as Record<string, unknown>;
  const rawDeltas =
    rawImpactObject.deltas && typeof rawImpactObject.deltas === "object" && !Array.isArray(rawImpactObject.deltas)
      ? (rawImpactObject.deltas as Record<string, unknown>)
      : rawImpactObject;

  return STATUS_KEYS.reduce<TaskImpact>((accumulator, key) => {
    const rawValue = rawDeltas[key];
    accumulator[key] = typeof rawValue === "number" && Number.isFinite(rawValue) ? Math.round(rawValue) : 0;
    return accumulator;
  }, { ...ZERO_TASK_IMPACT });
}

export type Task = {
  id: string;
  title: string;
  notes?: string | null;
  due_at: string | null;
  is_done: boolean;
  category_id: string | null;
  created_at: string;
  impact: TaskImpact;
  category: TaskCategory | null;
};

export type CreateTaskInput = {
  title: string;
  notes?: string | null;
  categoryId?: string | null;
  dueDate?: string | null;
};

export type UpdateTaskInput = {
  title?: string;
  notes?: string | null;
  categoryId?: string | null;
  dueDate?: string | null;
};
