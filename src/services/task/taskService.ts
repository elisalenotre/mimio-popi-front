import { supabase } from "../../lib/supabaseClient";
import { normalizeTaskTitle } from "../taskValidation/taskValidation";
import { normalizeTaskImpact } from "../../types/tasks";
import type { CreateTaskInput, Task, TaskCategory, UpdateTaskInput } from "../../types/tasks";
import { estimateVersionedTaskImpactFromCategoryName } from "../taskImpact/taskImpactEstimator";

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

  const { data, error } = await supabase
    .from("tasks")
    .update({ is_done: isDone })
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
