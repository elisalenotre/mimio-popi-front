import { supabase } from "../../lib/supabaseClient";
import { normalizeTaskTitle } from "../taskValidation/taskValidation";
import type { CreateTaskInput, Task, TaskCategory, UpdateTaskInput } from "../../types/tasks";

type TaskRow = {
  id: string;
  title: string;
  notes?: string | null;
  due_at: string | null;
  is_done: boolean;
  category_id: string | null;
  created_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
};

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
    .select("id, title, notes, due_at, is_done, category_id, created_at")
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
    .select("id, title, notes, due_at, is_done, category_id, created_at")
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
  const categoryId = input.categoryId ?? null;
  const dueDate = input.dueDate ?? null;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title,
        notes,
      category_id: categoryId,
      due_at: dueDate,
      is_done: false,
    })
    .select("id, title, notes, due_at, is_done, category_id, created_at")
    .single();

  if (error) throw error;

  let category: TaskCategory | null = null;
  if (categoryId) {
    try {
      const categories = await getMyTaskCategories();
      category = categories.find((item) => item.id === categoryId) ?? null;
    } catch {
      category = null;
    }
  }

  const row = data as TaskRow;
  return {
    ...row,
    category,
  } as Task;
}

export async function updateTask(taskId: string, input: UpdateTaskInput) {
  const userId = await getCurrentUserId();

  const updates: Record<string, string | null> = {};

  if (input.title !== undefined) {
    updates.title = normalizeTaskTitle(input.title);
  }

  if (input.notes !== undefined) {
    updates.notes = input.notes ? input.notes.trim() : null;
  }

  if (input.categoryId !== undefined) {
    updates.category_id = input.categoryId;
  }

  if (input.dueDate !== undefined) {
    updates.due_at = input.dueDate;
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("user_id", userId)
    .select("id, title, notes, due_at, is_done, category_id, created_at")
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
