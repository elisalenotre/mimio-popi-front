import { describe, expect, it } from "vitest";
import { isStrongPassword, isValidEmail, normalizeEmail } from "./validation";

describe("normalizeEmail", () => {
  it("trim leading and trailing spaces", () => {
    expect(normalizeEmail("  test@example.com  ")).toBe("test@example.com");
  });
});

describe("isValidEmail", () => {
  it("accepts a valid email", () => {
    expect(isValidEmail("user.name+tag@example.co")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidEmail("missing-domain@")).toBe(false);
    expect(isValidEmail("@missing-user.com")).toBe(false);
  });
});

describe("isStrongPassword", () => {
  it("accepts passwords with at least 8 chars, letters and numbers", () => {
    expect(isStrongPassword("abc12345")).toBe(true);
  });

  it("rejects short passwords", () => {
    expect(isStrongPassword("a1b2c3")).toBe(false);
  });

  it("rejects passwords without numbers", () => {
    expect(isStrongPassword("abcdefgh")).toBe(false);
  });

  it("rejects passwords without letters", () => {
    expect(isStrongPassword("12345678")).toBe(false);
  });
});
