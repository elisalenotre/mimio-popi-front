import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updatePassword } from "../services/authService";
import { isStrongPassword } from "../services/validation";

function readUrlParam(name: string) {
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const hashParams = new URLSearchParams(hash);

  return searchParams.get(name) ?? hashParams.get(name);
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const bootstrap = () => {
      const errorDescription = readUrlParam("error_description");
      const errorCode = readUrlParam("error");
      if (errorCode || errorDescription) setTokenError("Ce lien n’est plus valide. Demande un nouveau lien.");
      setLoading(false);
    };

    bootstrap();
  }, []);

  const passwordError = useMemo(() => {
    if (!password) return null;
    if (!isStrongPassword(password)) {
      return "Ton mot de passe doit faire au moins 8 caractères avec 1 lettre et 1 chiffre.";
    }
    return null;
  }, [password]);

  const confirmError = useMemo(() => {
    if (!confirm) return null;
    if (confirm !== password) return "Les mots de passe ne correspondent pas.";
    return null;
  }, [confirm, password]);

  const canSubmit = !submitting && !loading && !tokenError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!password) {
      setError("Mot de passe obligatoire.");
      return;
    }

    if (!isStrongPassword(password)) {
      setError("Ton mot de passe doit faire au moins 8 caractères avec 1 lettre et 1 chiffre.");
      return;
    }

    if (!confirm) {
      setError("Confirmation du mot de passe obligatoire.");
      return;
    }

    if (confirm !== password) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setSubmitting(true);
      const { error: updateError } = await updatePassword(password);
      if (updateError) {
        const message = updateError.message.toLowerCase();
        if (message.includes("expired") || message.includes("invalid") || message.includes("token")) {
          setError("Ce lien n’est plus valide. Demande un nouveau lien.");
        } else {
          setError("Impossible de mettre à jour le mot de passe. Réessaie.");
        }
        return;
      }

      setSuccess("Mot de passe mis à jour.");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 900);
    } catch {
      setError("Impossible de mettre à jour le mot de passe. Réessaie.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Chargement...</div>;

  if (tokenError) {
    return (
      <main>
        <h1>Nouveau mot de passe</h1>
        <p role="alert">{tokenError}</p>
        <p>
          <Link to="/forgot-password">Demander un nouveau lien</Link>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Nouveau mot de passe</h1>

      {error && <p role="alert">{error}</p>}
      {success && <p role="status">{success}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          Nouveau mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={!canSubmit}
          />
        </label>
        {passwordError && <p role="alert">{passwordError}</p>}

        <label>
          Confirmation
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            disabled={!canSubmit}
          />
        </label>
        {confirmError && <p role="alert">{confirmError}</p>}

        <button type="submit" disabled={!canSubmit}>
          {submitting ? "Mise à jour..." : "Mettre à jour"}
        </button>
      </form>

      <p>
        <Link to="/login">Retour à la connexion</Link>
      </p>
    </main>
  );
}
