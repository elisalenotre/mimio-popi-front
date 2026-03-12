import { describe, expect, it } from "vitest";
import { isValidDisplayName, normalizeDisplayName } from "./profileValidation";

describe("normalizeDisplayName", () => {
  it("trim leading and trailing spaces", () => {
    expect(normalizeDisplayName("  Elisa  ")).toBe("Elisa");
  });
});

describe("isValidDisplayName", () => {
  it("accepts an empty name (optional field)", () => {
    expect(isValidDisplayName("")).toBe(true);
  });

  it("accepts valid names", () => {
    expect(isValidDisplayName("Elisa_42")).toBe(true);
    expect(isValidDisplayName("Jean-Luc")).toBe(true);
    expect(isValidDisplayName("Ana Maria")).toBe(true);
    expect(isValidDisplayName("Zoé")).toBe(true);
  });

  it("rejects names shorter than 2 characters", () => {
    expect(isValidDisplayName("A")).toBe(false);
  });

  it("rejects names longer than 30 characters", () => {
    expect(isValidDisplayName("a".repeat(31))).toBe(false);
  });

  it("rejects special characters outside allowed set", () => {
    expect(isValidDisplayName("John!")).toBe(false);
    expect(isValidDisplayName("Léa@home")).toBe(false);
  });
});
