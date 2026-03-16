import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyProfile, resetOnboardingFlag, updateProfile } from "../../services/profileService";
import { isValidDisplayName, normalizeDisplayName } from "../../services/profileValidation";
import type { Preferences, MascotMessageIntensity } from "../../types/preferences";
import { signOut } from "../../services/authService";
import "./SettingsPage.css";

export default function SettingsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [intensity, setIntensity] = useState<MascotMessageIntensity>("normal");
  const [helpTexts, setHelpTexts] = useState(true);

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const profile = await getMyProfile();
        const prefs = (profile.preferences ?? {}) as Preferences;

        setDisplayName(profile.display_name ?? "");
        setIntensity((prefs.mascot_message_intensity ?? "normal") as MascotMessageIntensity);
        setHelpTexts(Boolean(prefs.help_texts_enabled ?? true));
      } catch {
        setError("Impossible de charger ton profil pour le moment.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const displayNameError = useMemo(() => {
    const normalized = normalizeDisplayName(displayName);
    if (!isValidDisplayName(normalized)) {
      return "Pseudo invalide (2–30 caractères, lettres/chiffres/espaces/_-).";
    }
    return null;
  }, [displayName]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const normalized = normalizeDisplayName(displayName);
    if (!isValidDisplayName(normalized)) {
      setError("Impossible d’enregistrer pour le moment. Réessaie.");
      return;
    }

    try {
      setSubmitting(true);

      const profile = await getMyProfile();
      const currentPrefs = (profile.preferences ?? {}) as Preferences;

      const nextPrefs: Preferences = {
        ...currentPrefs,
        mascot_message_intensity: intensity,
        help_texts_enabled: helpTexts,
      };

      await updateProfile({
        display_name: normalized.length === 0 ? null : normalized,
        preferences: nextPrefs as Record<string, unknown>,
      });

      setSuccess("C’est enregistré.");
    } catch {
      setError("Impossible d’enregistrer pour le moment. Réessaie.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedoOnboarding = async () => {
    setError(null);
    setSuccess(null);

    try {
      setSubmitting(true);
      await resetOnboardingFlag();
      navigate("/onboarding", { replace: true });
    } catch {
      setError("Impossible d’enregistrer pour le moment. Réessaie.");
    } finally {
      setSubmitting(false);
    }
  };

  // US0.3 logout
  const handleLogout = async () => {
    setError(null);
    setSuccess(null);

    try {
      setSubmitting(true);
      await signOut();
    } catch {
    } finally {
      setSubmitting(false);
      navigate("/login", { replace: true });
      setSuccess("Déconnecté. Prends soin de toi.");
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <main>
      <h1>Profil / Paramètres</h1>

      <Link to="/" className="settings-back-link">
        Retour à l’accueil
      </Link>

      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}

      <form onSubmit={handleSave}>
        <fieldset disabled={submitting}>
          <legend>Identité</legend>

          <label>
            Pseudo
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </label>

          {displayNameError && <p role="alert">{displayNameError}</p>}
        </fieldset>

        <fieldset disabled className="settings-preferences-disabled" aria-disabled="true">
          <legend>Préférences</legend>

          <p className="settings-mvp-note" role="note">
            Cette section sera activée dans une prochaine version.
          </p>

          <label>
            Intensité des messages mascottes
            <select value={intensity} onChange={(e) => setIntensity(e.target.value as MascotMessageIntensity)}>
              <option value="discrete">Discret</option>
              <option value="normal">Normal</option>
            </select>
          </label>

          <label>
            <input
              type="checkbox"
              checked={helpTexts}
              onChange={(e) => setHelpTexts(e.target.checked)}
            />
            Activer les textes d’aide
          </label>
        </fieldset>

        <button type="submit" disabled={submitting}>
          {submitting ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>

      <hr />

      <button type="button" onClick={handleRedoOnboarding} disabled={submitting}>
        Mettre à jour mes réponses (refaire l’onboarding)
      </button>

      <hr />

      <button
        type="button"
        className="settings-logout-button"
        onClick={handleLogout}
        disabled={submitting}
      >
        Se déconnecter
      </button>
    </main>
  );
}