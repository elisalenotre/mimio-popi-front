import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithGoogle, signUpWithEmail } from "../../services/authService";
import { isStrongPassword, isValidEmail, normalizeEmail } from "../../services/validation";
import mimioMascot from "../../assets/mimio-ok.svg";
import popiMascot from "../../assets/popi.svg";
import "./auth.css";

function mapSupabaseSignupError(message: string) {
  const msg = message.toLowerCase();

  if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
    return "Cet email est déjà utilisé. Tu peux plutôt te connecter.";
  }

  return "Impossible de créer ton compte pour le moment. Réessaie dans un instant.";
}

export default function SignUpPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanedEmail = normalizeEmail(email);

    // --- Validations US0.1 ---
    if (!cleanedEmail) return setError("Email obligatoire.");
    if (!isValidEmail(cleanedEmail)) return setError("Oups, cet email ne semble pas valide.");
    if (!password) return setError("Mot de passe obligatoire.");
    if (!isStrongPassword(password)) return setError("Ton mot de passe doit faire au moins 8 caractères.");
    if (!confirm) return setError("Confirmation du mot de passe obligatoire.");
    if (confirm !== password) return setError("Les mots de passe ne correspondent pas.");

    try {
      setSubmitting(true);

      const { error: signUpError } = await signUpWithEmail(cleanedEmail, password);

      if (signUpError) {
        setError(mapSupabaseSignupError(signUpError.message));
        setPassword(""); setConfirm("");
        return;
      }

      navigate(`/login?checkEmail=1&email=${encodeURIComponent(cleanedEmail)}`, { replace: true });
    } catch {
      setError("Impossible de créer ton compte pour le moment. Réessaie dans un instant.");
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
        <h2>Créer un compte</h2>
        <p role="note">Après inscription, check tes mails pour confirmer ton compte.</p>

        {error && <p role="alert">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
            />
          </label>

          <label>
            Mot de passe
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          <button type="button" onClick={() => setShowPwd((v) => !v)}>
            {showPwd ? "Masquer" : "Afficher"}
          </button>

          <label>
            Confirmation du mot de passe
            <input
              type={showPwd ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="auth-separator" aria-hidden="true">
          ou
        </p>

        <button type="button" className="oauth-button" onClick={handleGoogleSignIn} disabled={submitting}>
          {submitting ? "Connexion..." : "Continuer avec Google"}
        </button>

        <p>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>

        <p>
          <Link to="/privacy">Confidentialité</Link>
        </p>
      </main>
    </article>
  );
}