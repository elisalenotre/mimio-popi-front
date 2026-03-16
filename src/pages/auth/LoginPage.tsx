import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmail, signInWithGoogle } from "../../services/auth/authService";
import { isValidEmail, normalizeEmail } from "../../services/validation/validation";
import mimioMascot from "../../assets/mimio-ok.svg";
import popiMascot from "../../assets/popi.svg";
import "./auth.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const shouldShowCheckEmailMessage = searchParams.get("checkEmail") === "1";
  const emailToConfirm = searchParams.get("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanedEmail = normalizeEmail(email);
    if (!cleanedEmail) return setError("Email obligatoire.");
    if (!isValidEmail(cleanedEmail)) return setError("Oups, cet email ne semble pas valide.");
    if (!password) return setError("Mot de passe obligatoire.");

    try {
      setSubmitting(true);
      const { error: signInError } = await signInWithEmail(cleanedEmail, password);
      if (signInError) {
        setError("Email ou mot de passe incorrect.");
        return;
      }
      navigate("/", { replace: true });
    } catch {
      setError("Impossible de te connecter pour le moment. Réessaie dans un instant.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);

    try {
      setSubmitting(true);
      const { error: googleError } = await signInWithGoogle();
      if (googleError) {
        setError("Connexion Google indisponible pour le moment. Réessaie dans un instant.");
      }
    } catch {
      setError("Connexion Google indisponible pour le moment. Réessaie dans un instant.");
    } finally {
      setSubmitting(false);
    }
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
        <h2>Se connecter</h2>
        {shouldShowCheckEmailMessage && (
          <p role="status">
            Check tes mails{emailToConfirm ? ` (${emailToConfirm})` : ""} pour confirmer ton compte avant de te connecter.
          </p>
        )}
        {error && <p role="alert">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>

          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="auth-separator" aria-hidden="true">
          ou
        </p>

        <button type="button" className="oauth-button" onClick={handleGoogleSignIn} disabled={submitting}>
          {submitting ? "Connexion..." : "Continuer avec Google"}
        </button>

        <p>
          <Link to="/forgot-password">Mot de passe oublié ?</Link>
        </p>

        <p>
          Pas de compte ? <Link to="/signup">Créer un compte</Link>
        </p>
      </main>
    </article>
  );
}