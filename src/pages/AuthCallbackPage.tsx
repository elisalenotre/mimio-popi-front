import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function readUrlParam(name: string) {
  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  const hashParams = new URLSearchParams(hash);

  return searchParams.get(name) ?? hashParams.get(name);
}

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fallbackPath, setFallbackPath] = useState("/login");

  useEffect(() => {
    let active = true;

    const run = async () => {
      const type = readUrlParam("type");
      const errorCode = readUrlParam("error");
      const errorDescription = readUrlParam("error_description");
      const code = new URLSearchParams(window.location.search).get("code");

      if (type === "recovery") {
        setFallbackPath("/forgot-password");
      }

      if (errorCode || errorDescription) {
        if (!active) return;
        setError("Ce lien n’est plus valide. Demande un nouveau lien.");
        setLoading(false);
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (!active) return;
          setError("Ce lien n’est plus valide. Demande un nouveau lien.");
          setLoading(false);
          return;
        }
      }

      if (!active) return;

      if (type === "recovery") {
        navigate("/reset-password", { replace: true });
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        navigate("/", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [navigate]);

  if (loading) {
    return <div>Connexion en cours...</div>;
  }

  if (error) {
    return (
      <main>
        <h1>Lien invalide</h1>
        <p role="alert">{error}</p>
        <p>
          <Link to={fallbackPath}>Continuer</Link>
        </p>
      </main>
    );
  }

  return <div>Redirection...</div>;
}
