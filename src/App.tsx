import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, type JSX } from "react";

import { RequireOnboarding } from "./components/RequireOnBoarding";
import { useAuth } from "./contexts/AuthContext";

const SignUpPage = lazy(() => import("./pages/auth/SignUpPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const AuthCallbackPage = lazy(() => import("./pages/auth/AuthCallbackPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/auth/ResetPasswordPage"));
const OnboardingPage = lazy(() => import("./pages/params/OnBoardingPage"));
const SettingsPage = lazy(() => import("./pages/params/SettingsPage"));
const TasksPage = lazy(() => import("./pages/tasks/TasksPage"));
const RoomPage = lazy(() => import("./pages/room/RoomPage"));

function PageLoader() {
  return <div>Chargement...</div>;
}

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
      <Route
        path="/signup"
        element={
          <Suspense fallback={<PageLoader />}>
            <SignUpPage />
          </Suspense>
        }
      />
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="/auth/callback"
        element={
          <Suspense fallback={<PageLoader />}>
            <AuthCallbackPage />
          </Suspense>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <Suspense fallback={<PageLoader />}>
            <ForgotPasswordPage />
          </Suspense>
        }
      />
      <Route
        path="/reset-password"
        element={
          <Suspense fallback={<PageLoader />}>
            <ResetPasswordPage />
          </Suspense>
        }
      />
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* Auth required */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <OnboardingPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Auth + Onboarding required */}
      <Route
        path="/"
        element={
          <RequireOnboarding>
            <Suspense fallback={<PageLoader />}>
              <TasksPage />
            </Suspense>
          </RequireOnboarding>
        }
      />

      {/* Settings (auth + onboarding required) */}
      <Route
        path="/settings"
        element={
          <RequireOnboarding>
            <Suspense fallback={<PageLoader />}>
              <SettingsPage />
            </Suspense>
          </RequireOnboarding>
        }
      />

      <Route
        path="/room"
        element={
          <RequireOnboarding>
            <Suspense fallback={<PageLoader />}>
              <RoomPage />
            </Suspense>
          </RequireOnboarding>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}