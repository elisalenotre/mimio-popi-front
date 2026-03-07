import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmail } from "../services/authService";
import { isValidEmail, normalizeEmail } from "../services/validation";

export default function LoginPage() {
  const navigate = useNavigate();
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

  return (
    <main>
      <h1>Se connecter</h1>
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

      <p>
        <Link to="/forgot-password">Mot de passe oublié ?</Link>
      </p>

      <p>
        Pas de compte ? <Link to="/signup">Créer un compte</Link>
      </p>
    </main>
  );
}