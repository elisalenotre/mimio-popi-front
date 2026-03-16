import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
  },
}));

vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    auth: mockAuth,
  },
}));

import {
  requestPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  updatePassword,
} from "./authService";

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signUpWithEmail calls supabase.auth.signUp with email redirect", async () => {
    mockAuth.signUp.mockResolvedValueOnce({ data: {}, error: null });

    await signUpWithEmail("test@example.com", "abc12345");

    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "abc12345",
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  });

  it("signInWithEmail delegates to signInWithPassword", async () => {
    mockAuth.signInWithPassword.mockResolvedValueOnce({ data: {}, error: null });

    await signInWithEmail("user@example.com", "password123");

    expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
  });

  it("signInWithGoogle delegates to signInWithOAuth with callback URL", async () => {
    mockAuth.signInWithOAuth.mockResolvedValueOnce({ data: {}, error: null });

    await signInWithGoogle();

    expect(mockAuth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  });

  it("signOut delegates to supabase.auth.signOut", async () => {
    mockAuth.signOut.mockResolvedValueOnce({ error: null });

    await signOut();

    expect(mockAuth.signOut).toHaveBeenCalledTimes(1);
  });

  it("requestPasswordReset delegates to resetPasswordForEmail", async () => {
    mockAuth.resetPasswordForEmail.mockResolvedValueOnce({ data: {}, error: null });

    await requestPasswordReset("reset@example.com");

    expect(mockAuth.resetPasswordForEmail).toHaveBeenCalledWith("reset@example.com", {
      redirectTo: `${window.location.origin}/auth/callback`,
    });
  });

  it("updatePassword delegates to updateUser", async () => {
    mockAuth.updateUser.mockResolvedValueOnce({ data: {}, error: null });

    await updatePassword("newPassword123");

    expect(mockAuth.updateUser).toHaveBeenCalledWith({ password: "newPassword123" });
  });
});
