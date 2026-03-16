import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  fromMock,
  getUserMock,
  tasksSelectMock,
  tasksEqMock,
  tasksOrderMock,
  tasksInsertMock,
  tasksInsertSelectMock,
  tasksInsertSingleMock,
  categoriesSelectMock,
  categoriesEqMock,
  categoriesOrderMock,
} = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
  tasksSelectMock: vi.fn(),
  tasksEqMock: vi.fn(),
  tasksOrderMock: vi.fn(),
  tasksInsertMock: vi.fn(),
  tasksInsertSelectMock: vi.fn(),
  tasksInsertSingleMock: vi.fn(),
  categoriesSelectMock: vi.fn(),
  categoriesEqMock: vi.fn(),
  categoriesOrderMock: vi.fn(),
}));

vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    from: fromMock,
    auth: {
      getUser: getUserMock,
    },
  },
}));

import { createTask, getMyTaskCategories, getMyTasks } from "./taskService";

describe("taskService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    tasksSelectMock.mockReturnValue({ eq: tasksEqMock });
    tasksEqMock.mockReturnValue({ order: tasksOrderMock });

    tasksInsertMock.mockReturnValue({ select: tasksInsertSelectMock });
    tasksInsertSelectMock.mockReturnValue({ single: tasksInsertSingleMock });

    categoriesSelectMock.mockReturnValue({ eq: categoriesEqMock });
    categoriesEqMock.mockReturnValue({ order: categoriesOrderMock });

    fromMock.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: tasksSelectMock,
          insert: tasksInsertMock,
        };
      }

      if (table === "categories") {
        return {
          select: categoriesSelectMock,
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    getUserMock.mockResolvedValue({
      data: {
        user: { id: "user-1" },
      },
      error: null,
    });
  });

  it("getMyTaskCategories returns categories list", async () => {
    categoriesOrderMock.mockResolvedValueOnce({
      data: [
        { id: "c-1", name: "General" },
        { id: "c-2", name: "Travail" },
      ],
      error: null,
    });

    const result = await getMyTaskCategories();

    expect(result).toEqual([
      { id: "c-1", name: "General" },
      { id: "c-2", name: "Travail" },
    ]);
    expect(categoriesEqMock).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("getMyTasks returns tasks with resolved category when available", async () => {
    tasksOrderMock.mockResolvedValueOnce({
      data: [
        {
          id: "t-1",
          title: "Payer facture",
          due_at: null,
          is_done: false,
          category_id: "c-2",
          created_at: "2026-03-16",
        },
      ],
      error: null,
    });

    categoriesOrderMock.mockResolvedValueOnce({
      data: [
        { id: "c-2", name: "Travail" },
      ],
      error: null,
    });

    const result = await getMyTasks();

    expect(result).toEqual([
      {
        id: "t-1",
        title: "Payer facture",
        due_at: null,
        is_done: false,
        category_id: "c-2",
        created_at: "2026-03-16",
        category: { id: "c-2", name: "Travail" },
      },
    ]);
  });

  it("createTask inserts with normalized title and defaults", async () => {
    tasksInsertSingleMock.mockResolvedValueOnce({
      data: {
        id: "t-2",
        title: "Payer facture",
        due_at: null,
        is_done: false,
        category_id: null,
        created_at: "2026-03-16",
      },
      error: null,
    });

    const result = await createTask({ title: "  Payer facture  " });

    expect(tasksInsertMock).toHaveBeenCalledWith({
      user_id: "user-1",
      title: "Payer facture",
      category_id: null,
      due_at: null,
      is_done: false,
    });

    expect(result).toEqual({
      id: "t-2",
      title: "Payer facture",
      due_at: null,
      is_done: false,
      category_id: null,
      created_at: "2026-03-16",
      category: null,
    });
  });

  it("createTask resolves selected category when possible", async () => {
    tasksInsertSingleMock.mockResolvedValueOnce({
      data: {
        id: "t-3",
        title: "Reviser",
        due_at: "2026-03-17",
        is_done: false,
        category_id: "c-3",
        created_at: "2026-03-16",
      },
      error: null,
    });

    categoriesOrderMock.mockResolvedValueOnce({
      data: [{ id: "c-3", name: "Etudes" }],
      error: null,
    });

    const result = await createTask({
      title: "Reviser",
      categoryId: "c-3",
      dueDate: "2026-03-17",
    });

    expect(result.category).toEqual({ id: "c-3", name: "Etudes" });
  });
});
