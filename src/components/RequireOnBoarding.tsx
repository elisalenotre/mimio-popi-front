import { useEffect, useState, type JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getMyProfile } from "../services/profileService";

export function RequireOnboarding({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [completed, setCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    (async () => {
      try {
        const profile = await getMyProfile();

        const isCompleted = Boolean(profile.onboarding_completed);


        setCompleted(isCompleted);
      } catch {
        setCompleted(true);
      } finally {
        setChecking(false);
      }
    })();
  }, [user, loading]);

  if (loading || checking) return <div>Chargement...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (completed === false) return <Navigate to="/onboarding" replace />;

  return children;
}