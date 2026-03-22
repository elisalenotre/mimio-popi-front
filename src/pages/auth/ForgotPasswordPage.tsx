import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../services/auth/authService";
import { isValidEmail, normalizeEmail } from "../../services/validation/validation";
import mimioMascot from "../../assets/mimio-ok.svg";
import popiMascot from "../../assets/popi.svg";
import "./auth.css";

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
    <article className="auth-shell">
      <div className="retro-brand-wrap">
        <img className="retro-mascot retro-mascot--left" src={mimioMascot} alt="Mascotte Mimio" />
        <h1 className="retro-brand" aria-label="Mimio et Popi">
          <span className="retro-brand__char">M</span>
          <span className="retro-brand__char">i</span>
          <span className="retro-brand__char">m</span>
          <span className="retro-brand__char">i</span>
          <span className="retro-brand__char">o</span>
          <span className="retro-brand__char retro-brand__space">&nbsp;</span>
          <span className="retro-brand__char">&amp;</span>
          <span className="retro-brand__char retro-brand__space">&nbsp;</span>
          <span className="retro-brand__char">P</span>
          <span className="retro-brand__char">o</span>
          <span className="retro-brand__char">p</span>
          <span className="retro-brand__char">i</span>
        </h1>
        <img className="retro-mascot retro-mascot--right" src={popiMascot} alt="Mascotte Popi" />
      </div>

      <main>
        <h2>Mot de passe oublié</h2>

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
    </article>
  );
}
