export type TaskCategory = {
  id: string;
  name: string;
};

export type Task = {
  id: string;
  title: string;
  due_at: string | null;
  is_done: boolean;
  category_id: string | null;
  created_at: string;
  category: TaskCategory | null;
};

export type CreateTaskInput = {
  title: string;
  categoryId?: string | null;
  dueDate?: string | null;
};
