import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../services/auth/authService";
import { isValidEmail, normalizeEmail } from "../../services/validation/validation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitResetRequest = async () => {
    const cleanedEmail = normalizeEmail(email);

    if (!cleanedEmail) {
      setError("Email obligatoire.");
      return;
    }

    if (!isValidEmail(cleanedEmail)) {
      setError("Oups, cet email ne semble pas valide.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await requestPasswordReset(cleanedEmail);
      setConfirmation("Si un compte existe avec cet email, tu recevras un lien de réinitialisation.");
    } catch {
      setError("Impossible d’envoyer le lien pour le moment. Vérifie ta connexion et réessaie.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitResetRequest();
  };

  return (
    <main>
      <h1>Mot de passe oublié</h1>

      <p>
        Saisis ton email. Si un compte existe, on t’enverra un lien pour réinitialiser ton mot de passe.
      </p>

      {error && <p role="alert">{error}</p>}
      {confirmation && <p role="status">{confirmation}</p>}
      {confirmation && <p>Vérifie aussi ton dossier spam/courriers indésirables.</p>}

      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            disabled={submitting}
          />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Envoi..." : "Envoyer le lien"}
        </button>
      </form>

      {confirmation && (
        <p>
          Pas reçu ? <button type="button" onClick={submitResetRequest} disabled={submitting}>Renvoyer l’email</button>
        </p>
      )}

      <p>
        <Link to="/login">Retour à la connexion</Link>
      </p>
    </main>
  );
}
