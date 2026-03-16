import { describe, expect, it } from "vitest";
import {
  getTaskTitleError,
  isValidTaskTitle,
  normalizeTaskTitle,
  TASK_TITLE_MAX_LENGTH,
} from "../taskValidation/taskValidation";

describe("normalizeTaskTitle", () => {
  it("trim leading and trailing spaces", () => {
    expect(normalizeTaskTitle("  payer facture  ")).toBe("payer facture");
  });
});

describe("isValidTaskTitle", () => {
  it("accepts a non-empty title", () => {
    expect(isValidTaskTitle("Acheter du lait")).toBe(true);
  });

  it("rejects an empty title", () => {
    expect(isValidTaskTitle("")).toBe(false);
  });

  it("rejects a title longer than max", () => {
    const tooLong = "a".repeat(TASK_TITLE_MAX_LENGTH + 1);
    expect(isValidTaskTitle(tooLong)).toBe(false);
  });
});

describe("getTaskTitleError", () => {
  it("returns required title error for blank input", () => {
    expect(getTaskTitleError("    ")).toBe("Ajoute un titre pour creer ta tâche.");
  });

  it("returns null for valid title", () => {
    expect(getTaskTitleError("Payer facture internet")).toBeNull();
  });
});
