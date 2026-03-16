import { Routes, Route, Navigate } from "react-router-dom";

import SignUpPage from "./pages/auth/SignUpPage";
import LoginPage from "./pages/auth/LoginPage";
import AuthCallbackPage from "./pages/auth/AuthCallbackPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import OnboardingPage from "./pages/params/OnBoardingPage";
import SettingsPage from "./pages/params/SettingsPage";
import TasksPage from "./pages/tasks/TasksPage";

import { RequireOnboarding } from "./components/RequireOnBoarding";
import { useAuth } from "./contexts/AuthContext";
import type { JSX } from "react";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

function PrivacyPage() {
  return <div>Confidentialité (placeholder MVP)</div>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Auth required */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Auth + Onboarding required */}
      <Route
        path="/"
        element={
          <RequireOnboarding>
            <TasksPage />
          </RequireOnboarding>
        }
      />

      {/* Settings (auth + onboarding required) */}
      <Route
        path="/settings"
        element={
          <RequireOnboarding>
            <SettingsPage />
          </RequireOnboarding>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}