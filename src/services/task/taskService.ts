import { supabase } from "../../lib/supabaseClient";
import { normalizeTaskTitle } from "../taskValidation/taskValidation";
import type { CreateTaskInput, Task, TaskCategory } from "../../types/tasks";

type TaskRow = {
  id: string;
  title: string;
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
    .select("id, title, due_at, is_done, category_id, created_at")
    .eq("user_id", userId)
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

export async function createTask(input: CreateTaskInput) {
  const userId = await getCurrentUserId();

  const title = normalizeTaskTitle(input.title);
  const categoryId = input.categoryId ?? null;
  const dueDate = input.dueDate ?? null;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title,
      category_id: categoryId,
      due_at: dueDate,
      is_done: false,
    })
    .select("id, title, due_at, is_done, category_id, created_at")
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
