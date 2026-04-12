import { supabase } from "../../lib/supabaseClient";
import { normalizeTaskTitle } from "../taskValidation/taskValidation";
import { normalizeTaskImpact } from "../../types/tasks";
import type { CreateTaskInput, Task, TaskCategory, UpdateTaskInput } from "../../types/tasks";
import { estimateVersionedTaskImpactFromCategoryName } from "../taskImpact/taskImpactEstimator";
import {
  DAILY_STATUS_BASELINE,
  DEFAULT_USER_STATUSES,
  STATUS_KEYS,
  getStatusDayKey,
  normalizeStatuses,
} from "../../types/statuses";
import type { Preferences } from "../../types/preferences";

type TaskRow = {
  id: string;
  title: string;
  notes?: string | null;
  due_at: string | null;
  is_done: boolean;
  category_id: string | null;
  created_at: string;
  impact?: unknown;
};

type TaskImpactApplicationResult = {
  task: Task;
  impactApplied: boolean;
};

type TaskDetailsRow = TaskRow & {
  done_at?: string | null;
};

type CategoryRow = {
  id: string;
  name: string;
};

type CategoryBootstrapPreferences = {
  task_categories_init_started?: boolean;
  task_categories_init_completed?: boolean;
};

const DEFAULT_TASK_CATEGORIES: Array<{ name: string; color: string }> = [
  { name: "Études", color: "#3B82F6" },
  { name: "Travail", color: "#F59E0B" },
  { name: "Social", color: "#10B981" },
  { name: "Santé", color: "#EF4444" },
  { name: "Maison", color: "#8B5CF6" },
  { name: "Loisirs", color: "#EC4899" },
];

async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;

  const user = data.user;
  if (!user) {
    throw new Error("Aucun utilisateur connecte.");
  }

  return user.id;
}

function toTask(row: TaskRow, categoriesById: Map<string, TaskCategory>): Task {
  return {
    ...row,
    impact: normalizeTaskImpact(row.impact),
    category: row.category_id ? (categoriesById.get(row.category_id) ?? null) : null,
  };
}

async function fetchCategoriesMap(userId: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) throw error;

  const rows = (data ?? []) as CategoryRow[];
  return new Map(rows.map((category) => [category.id, category as TaskCategory]));
}

async function getTaskDetails(userId: string, taskId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, notes, due_at, is_done, done_at, category_id, created_at, impact")
    .eq("id", taskId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("Task not found");
  }

  return data as TaskDetailsRow;
}

function getTodayStatusContext(currentPreferences: Record<string, unknown>, now = new Date()) {
  const preferences = { ...currentPreferences };
  const currentDayKey = getStatusDayKey(now);
  const storedDayKey = typeof (preferences as Preferences).statuses_day_key === "string"
    ? ((preferences as Preferences).statuses_day_key as string)
    : null;
  const storedBaseline = typeof (preferences as Preferences).statuses_daily_base === "number"
    ? (preferences as Preferences).statuses_daily_base
    : null;

  const currentStatuses =
    storedDayKey === currentDayKey && storedBaseline === DAILY_STATUS_BASELINE
      ? normalizeStatuses((preferences as Preferences).statuses)
      : { ...DEFAULT_USER_STATUSES };

  return {
    preferences,
    currentDayKey,
    currentStatuses,
  };
}

function getTaskDoneDayKey(task: TaskDetailsRow) {
  if (!task.done_at) {
    return null;
  }

  const date = new Date(task.done_at);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return getStatusDayKey(date);
}

function applyImpactToStatuses(
  currentPreferences: Record<string, unknown>,
  rawImpact: unknown,
  direction: 1 | -1,
  now = new Date()
): Record<string, unknown> {
  const { preferences, currentDayKey, currentStatuses } = getTodayStatusContext(currentPreferences, now);
  const impact = normalizeTaskImpact(rawImpact);

  const nextStatuses = STATUS_KEYS.reduce((accumulator, key) => {
    const currentValue = currentStatuses[key] ?? 0;
    const nextValue = currentValue + impact[key] * direction;
    accumulator[key] = Math.min(100, Math.max(0, Math.round(nextValue)));
    return accumulator;
  }, { ...currentStatuses });

  return {
    ...preferences,
    statuses: nextStatuses,
    statuses_day_key: currentDayKey,
    statuses_daily_base: DAILY_STATUS_BASELINE,
  };
}

async function readProfilePreferences(userId: string) {
  const { data, error } = await supabase.from("profiles").select("preferences").eq("id", userId).maybeSingle();

  if (error) throw error;

  return (data?.preferences ?? {}) as Record<string, unknown>;
}

async function writeProfilePreferences(userId: string, preferences: Record<string, unknown>) {
  const { error: upsertError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      preferences,
    },
    { onConflict: "id" }
  );

  if (upsertError) throw upsertError;
}

async function applyTaskImpactToProfileStatuses(userId: string, rawImpact: unknown, direction: 1 | -1) {
  const currentPreferences = await readProfilePreferences(userId);
  const nextPreferences = applyImpactToStatuses(currentPreferences, rawImpact, direction);

  await writeProfilePreferences(userId, nextPreferences);
}

async function resetStatusesForToday(userId: string) {
  const currentPreferences = await readProfilePreferences(userId);
  const { preferences, currentDayKey } = getTodayStatusContext(currentPreferences);

  if ((preferences as Preferences).statuses_day_key === currentDayKey) {
    return;
  }

  await writeProfilePreferences(userId, {
    ...preferences,
    statuses: { ...DEFAULT_USER_STATUSES },
    statuses_day_key: currentDayKey,
    statuses_daily_base: DAILY_STATUS_BASELINE,
  });
}

async function readCategoryBootstrapPreferences(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;

  const preferences = (data?.preferences ?? {}) as Record<string, unknown>;

  return {
    preferences,
    started: preferences.task_categories_init_started === true,
    completed: preferences.task_categories_init_completed === true,
  };
}

async function writeCategoryBootstrapPreferences(
  userId: string,
  preferences: Record<string, unknown>,
  patch: CategoryBootstrapPreferences
) {
  const nextPreferences = {
    ...preferences,
    ...patch,
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: userId,
        preferences: nextPreferences,
      },
      { onConflict: "id" }
    );

  if (error) throw error;
  return nextPreferences;
}

export async function initializeMyDefaultTaskCategories() {
  const userId = await getCurrentUserId();

  const profileState = await readCategoryBootstrapPreferences(userId);
  if (profileState.completed) {
    return;
  }

  const { data, error } = await supabase
    .from("categories")
    .select("name")
    .eq("user_id", userId);

  if (error) throw error;

  const existingCategoryNames = new Set(((data ?? []) as Array<{ name: string }>).map((row) => row.name));
  const shouldSeedDefaults = existingCategoryNames.size === 0 || profileState.started;

  if (!shouldSeedDefaults) {
    await writeCategoryBootstrapPreferences(userId, profileState.preferences, {
      task_categories_init_completed: true,
      task_categories_init_started: false,
    });
    return;
  }

  let currentPreferences = profileState.preferences;
  if (!profileState.started) {
    currentPreferences = await writeCategoryBootstrapPreferences(userId, profileState.preferences, {
      task_categories_init_started: true,
      task_categories_init_completed: false,
    });
  }

  const missingDefaults = DEFAULT_TASK_CATEGORIES.filter((category) => !existingCategoryNames.has(category.name));
  if (missingDefaults.length > 0) {
    const { error: upsertError } = await supabase.from("categories").upsert(
      missingDefaults.map((category) => ({
        user_id: userId,
        name: category.name,
        color: category.color,
        is_default: true,
      })),
      {
        onConflict: "user_id,name",
        ignoreDuplicates: true,
      }
    );

    if (upsertError) throw upsertError;
  }

  await writeCategoryBootstrapPreferences(userId, currentPreferences, {
    task_categories_init_completed: true,
    task_categories_init_started: false,
  });
}

export async function getMyTaskCategories() {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as TaskCategory[];
}

export async function getMyTasks() {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, notes, due_at, is_done, category_id, created_at, impact")
    .eq("user_id", userId)
    .order("is_done", { ascending: true })
    .order("due_at", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  let categoriesById = new Map<string, TaskCategory>();
  try {
    categoriesById = await fetchCategoriesMap(userId);
  } catch {
    categoriesById = new Map<string, TaskCategory>();
  }

  return ((data ?? []) as TaskRow[]).map((row) => toTask(row, categoriesById));
}

export async function setTaskDoneState(taskId: string, isDone: boolean) {
  const userId = await getCurrentUserId();

  let taskRow: TaskRow;
  let impactApplied = false;

  if (isDone) {
    const { data, error } = await supabase
      .from("tasks")
      .update({ is_done: true, done_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("user_id", userId)
      .eq("is_done", false)
      .select("id, title, notes, due_at, is_done, category_id, created_at, impact")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const existingTask = await getTaskDetails(userId, taskId);
      taskRow = existingTask;
    } else {
      taskRow = data as TaskRow;
      try {
        await applyTaskImpactToProfileStatuses(userId, taskRow.impact, 1);
        impactApplied = true;
      } catch (statusError) {
        await supabase
          .from("tasks")
          .update({ is_done: false, done_at: null })
          .eq("id", taskId)
          .eq("user_id", userId);

        throw statusError;
      }
    }
  } else {
    const previousTask = await getTaskDetails(userId, taskId);

    const { data, error } = await supabase
      .from("tasks")
      .update({ is_done: false, done_at: null })
      .eq("id", taskId)
      .eq("user_id", userId)
      .select("id, title, notes, due_at, is_done, category_id, created_at, impact")
      .single();

    if (error) throw error;
    taskRow = data as TaskRow;

    const shouldRollbackImpact = previousTask.is_done && getTaskDoneDayKey(previousTask) === getStatusDayKey();

    try {
      if (shouldRollbackImpact) {
        await applyTaskImpactToProfileStatuses(userId, previousTask.impact, -1);
      } else {
        await resetStatusesForToday(userId);
      }
    } catch (statusError) {
      await supabase
        .from("tasks")
        .update({ is_done: true, done_at: previousTask.done_at ?? new Date().toISOString() })
        .eq("id", taskId)
        .eq("user_id", userId);

      throw statusError;
    }
  }

  let categoriesById = new Map<string, TaskCategory>();
  try {
    categoriesById = await fetchCategoriesMap(userId);
  } catch {
    categoriesById = new Map<string, TaskCategory>();
  }

  const task = toTask(taskRow, categoriesById);

  return {
    task,
    impactApplied,
  } as TaskImpactApplicationResult;
}

export async function createTask(input: CreateTaskInput) {
  const userId = await getCurrentUserId();

  const title = normalizeTaskTitle(input.title);
  const notes = input.notes ? input.notes.trim() : null;
  const requestedCategoryId = input.categoryId ?? null;
  const dueDate = input.dueDate ?? null;

  let category: TaskCategory | null = null;
  let categoryId: string | null = null;

  if (requestedCategoryId) {
    const categoriesById = await fetchCategoriesMap(userId);
    category = categoriesById.get(requestedCategoryId) ?? null;
    categoryId = category?.id ?? null;
  }

  const estimatedImpact = estimateVersionedTaskImpactFromCategoryName(category?.name);

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title,
      notes,
      category_id: categoryId,
      due_at: dueDate,
      is_done: false,
      impact: estimatedImpact,
    })
    .select("id, title, notes, due_at, is_done, category_id, created_at, impact")
    .single();

  if (error) throw error;

  const row = data as TaskRow;
  return {
    ...row,
    impact: normalizeTaskImpact(row.impact),
    category,
  } as Task;
}

export async function updateTask(taskId: string, input: UpdateTaskInput) {
  const userId = await getCurrentUserId();

  const updates: Record<string, unknown> = {};

  if (input.title !== undefined) {
    updates.title = normalizeTaskTitle(input.title);
  }

  if (input.notes !== undefined) {
    updates.notes = input.notes ? input.notes.trim() : null;
  }

  if (input.categoryId !== undefined) {
    if (input.categoryId) {
      const categoriesById = await fetchCategoriesMap(userId);
      const category = categoriesById.get(input.categoryId) ?? null;
      updates.category_id = category?.id ?? null;
      updates.impact = estimateVersionedTaskImpactFromCategoryName(category?.name);
    } else {
      updates.category_id = null;
      updates.impact = estimateVersionedTaskImpactFromCategoryName(null);
    }
  }

  if (input.dueDate !== undefined) {
    updates.due_at = input.dueDate;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("user_id", userId)
    .select("id, title, notes, due_at, is_done, category_id, created_at, impact")
    .single();

  if (error) throw error;

  let categoriesById = new Map<string, TaskCategory>();
  try {
    categoriesById = await fetchCategoriesMap(userId);
  } catch {
    categoriesById = new Map<string, TaskCategory>();
  }

  return toTask(data as TaskRow, categoriesById);
}

export async function deleteTask(taskId: string) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId)
    .select("id");

  if (error) throw error;

  const deletedRows = (data ?? []) as Array<{ id: string }>;
  if (deletedRows.length === 0) {
    return "missing" as const;
  }

  return "deleted" as const;
}
