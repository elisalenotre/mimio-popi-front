import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  fromMock,
  getUserMock,
  tasksSelectMock,
  tasksEqMock,
  tasksOrderPrimaryMock,
  tasksOrderSecondaryMock,
  tasksOrderTertiaryMock,
  tasksInsertMock,
  tasksInsertSelectMock,
  tasksInsertSingleMock,
  tasksUpdateMock,
  tasksUpdateEqIdMock,
  tasksUpdateEqUserMock,
  tasksUpdateSelectMock,
  tasksUpdateSingleMock,
  tasksDeleteMock,
  tasksDeleteEqIdMock,
  tasksDeleteEqUserMock,
  tasksDeleteSelectMock,
  categoriesSelectMock,
  categoriesEqMock,
  categoriesOrderMock,
} = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
  tasksSelectMock: vi.fn(),
  tasksEqMock: vi.fn(),
  tasksOrderPrimaryMock: vi.fn(),
  tasksOrderSecondaryMock: vi.fn(),
  tasksOrderTertiaryMock: vi.fn(),
  tasksInsertMock: vi.fn(),
  tasksInsertSelectMock: vi.fn(),
  tasksInsertSingleMock: vi.fn(),
  tasksUpdateMock: vi.fn(),
  tasksUpdateEqIdMock: vi.fn(),
  tasksUpdateEqUserMock: vi.fn(),
  tasksUpdateSelectMock: vi.fn(),
  tasksUpdateSingleMock: vi.fn(),
  tasksDeleteMock: vi.fn(),
  tasksDeleteEqIdMock: vi.fn(),
  tasksDeleteEqUserMock: vi.fn(),
  tasksDeleteSelectMock: vi.fn(),
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

import { createTask, deleteTask, getMyTaskCategories, getMyTasks, setTaskDoneState, updateTask } from "./taskService";

describe("taskService", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    tasksSelectMock.mockReturnValue({ eq: tasksEqMock });
    tasksEqMock.mockReturnValue({ order: tasksOrderPrimaryMock });
    tasksOrderPrimaryMock.mockReturnValue({ order: tasksOrderSecondaryMock });
    tasksOrderSecondaryMock.mockReturnValue({ order: tasksOrderTertiaryMock });

    tasksInsertMock.mockReturnValue({ select: tasksInsertSelectMock });
    tasksInsertSelectMock.mockReturnValue({ single: tasksInsertSingleMock });

    tasksUpdateMock.mockReturnValue({ eq: tasksUpdateEqIdMock });
    tasksUpdateEqIdMock.mockReturnValue({ eq: tasksUpdateEqUserMock });
    tasksUpdateEqUserMock.mockReturnValue({ select: tasksUpdateSelectMock });
    tasksUpdateSelectMock.mockReturnValue({ single: tasksUpdateSingleMock });

    tasksDeleteMock.mockReturnValue({ eq: tasksDeleteEqIdMock });
    tasksDeleteEqIdMock.mockReturnValue({ eq: tasksDeleteEqUserMock });
    tasksDeleteEqUserMock.mockReturnValue({ select: tasksDeleteSelectMock });

    categoriesSelectMock.mockReturnValue({ eq: categoriesEqMock });
    categoriesEqMock.mockReturnValue({ order: categoriesOrderMock });

    fromMock.mockImplementation((table: string) => {
      if (table === "tasks") {
        return {
          select: tasksSelectMock,
          insert: tasksInsertMock,
          update: tasksUpdateMock,
          delete: tasksDeleteMock,
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
    tasksOrderTertiaryMock.mockResolvedValueOnce({
      data: [
        {
          id: "t-1",
          title: "Payer facture",
          notes: null,
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

    expect(tasksOrderPrimaryMock).toHaveBeenCalledWith("is_done", { ascending: true });
    expect(tasksOrderSecondaryMock).toHaveBeenCalledWith("due_at", { ascending: true, nullsFirst: false });
    expect(tasksOrderTertiaryMock).toHaveBeenCalledWith("created_at", { ascending: false });

    expect(result).toEqual([
      {
        id: "t-1",
        title: "Payer facture",
        notes: null,
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
        notes: null,
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
      notes: null,
      category_id: null,
      due_at: null,
      is_done: false,
    });

    expect(result).toEqual({
      id: "t-2",
      title: "Payer facture",
      notes: null,
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
        notes: null,
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

  it("setTaskDoneState updates task status for current user", async () => {
    tasksUpdateSingleMock.mockResolvedValueOnce({
      data: {
        id: "t-1",
        title: "Payer facture",
        notes: null,
        due_at: "2026-03-17",
        is_done: true,
        category_id: "c-2",
        created_at: "2026-03-16",
      },
      error: null,
    });

    categoriesOrderMock.mockResolvedValueOnce({
      data: [{ id: "c-2", name: "Travail" }],
      error: null,
    });

    const result = await setTaskDoneState("t-1", true);

    expect(tasksUpdateMock).toHaveBeenCalledWith({ is_done: true });
    expect(tasksUpdateEqIdMock).toHaveBeenCalledWith("id", "t-1");
    expect(tasksUpdateEqUserMock).toHaveBeenCalledWith("user_id", "user-1");
    expect(result.is_done).toBe(true);
    expect(result.category).toEqual({ id: "c-2", name: "Travail" });
  });

  it("updateTask updates editable fields without changing done state", async () => {
    tasksUpdateSingleMock.mockResolvedValueOnce({
      data: {
        id: "t-5",
        title: "Titre modifie",
        notes: "Notes modifiees",
        due_at: null,
        is_done: true,
        category_id: null,
        created_at: "2026-03-16",
      },
      error: null,
    });

    categoriesOrderMock.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const result = await updateTask("t-5", {
      title: "  Titre modifie  ",
      notes: "  Notes modifiees  ",
      categoryId: null,
      dueDate: null,
    });

    expect(tasksUpdateMock).toHaveBeenCalledWith({
      title: "Titre modifie",
      notes: "Notes modifiees",
      category_id: null,
      due_at: null,
    });
    expect(tasksUpdateEqIdMock).toHaveBeenCalledWith("id", "t-5");
    expect(tasksUpdateEqUserMock).toHaveBeenCalledWith("user_id", "user-1");
    expect(result.is_done).toBe(true);
  });

  it("deleteTask deletes only current user task", async () => {
    tasksDeleteSelectMock.mockResolvedValueOnce({
      data: [{ id: "t-8" }],
      error: null,
    });

    const result = await deleteTask("t-8");

    expect(tasksDeleteEqIdMock).toHaveBeenCalledWith("id", "t-8");
    expect(tasksDeleteEqUserMock).toHaveBeenCalledWith("user_id", "user-1");
    expect(tasksDeleteSelectMock).toHaveBeenCalledWith("id");
    expect(result).toBe("deleted");
  });

  it("deleteTask returns missing when no matching task is found", async () => {
    tasksDeleteSelectMock.mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const result = await deleteTask("t-404");

    expect(result).toBe("missing");
  });
});
