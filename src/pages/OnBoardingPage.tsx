import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Energy, OnboardingAnswers, Pace, Priority } from "../types/onboarding";
import { saveOnboarding, skipOnboarding } from "../services/profileService";

type Step = 0 | 1 | 2;

export default function OnboardingPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(0);

  const [pace, setPace] = useState<Pace | "">("");
  const [priority, setPriority] = useState<Priority | "">("");
  const [energy, setEnergy] = useState<Energy | "">("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGoNext = useMemo(() => {
    if (step === 0) return pace !== "";
    if (step === 1) return priority !== "";
    if (step === 2) return energy !== "";
    return false;
  }, [step, pace, priority, energy]);

  const next = () => {
    if (!canGoNext) return;
    setError(null);
    setStep((s) => (s < 2 ? ((s + 1) as Step) : s));
  };

  const back = () => {
    setError(null);
    setStep((s) => (s > 0 ? ((s - 1) as Step) : s));
  };

  const handleSkip = async () => {
    setError(null);
    try {
      setSubmitting(true);
      await skipOnboarding();
      navigate("/", { replace: true });
    } catch {
      setError("Impossible d’enregistrer pour le moment. Réessaie dans un instant.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinish = async () => {
    setError(null);
    if (!pace || !priority || !energy) return;

    const answers: OnboardingAnswers = { pace, priority, energy };

    try {
      setSubmitting(true);
      await saveOnboarding(answers);
      navigate("/settings", { replace: true });
    } catch {
      setError("Impossible d’enregistrer pour le moment. Réessaie dans un instant.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <h1>Onboarding</h1>
      <p>On te pose 3 petites questions. Ça prend moins d’une minute.</p>

      {error && <p role="alert">{error}</p>}

      <button type="button" onClick={handleSkip} disabled={submitting}>
        Tu pourras le faire plus tard.
      </button>

      <hr />

      {step === 0 && (
        <section>
          <h2>Ton rythme actuel</h2>
          <div>
            <label>
              <input
                type="radio"
                name="pace"
                value="light"
                checked={pace === "light"}
                onChange={() => setPace("light")}
              />
              Léger
            </label>

            <label>
              <input
                type="radio"
                name="pace"
                value="normal"
                checked={pace === "normal"}
                onChange={() => setPace("normal")}
              />
              Normal
            </label>

            <label>
              <input
                type="radio"
                name="pace"
                value="intense"
                checked={pace === "intense"}
                onChange={() => setPace("intense")}
              />
              Intense
            </label>
          </div>
        </section>
      )}

      {step === 1 && (
        <section>
          <h2>Ta priorité du moment</h2>
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            <option value="">— Choisir —</option>
            <option value="studies">Études</option>
            <option value="work">Travail</option>
            <option value="balance">Équilibre</option>
            <option value="health">Santé</option>
            <option value="other">Autre</option>
          </select>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2>Ton énergie globale</h2>
          <div>
            <label>
              <input
                type="radio"
                name="energy"
                value="low"
                checked={energy === "low"}
                onChange={() => setEnergy("low")}
              />
              Basse
            </label>

            <label>
              <input
                type="radio"
                name="energy"
                value="medium"
                checked={energy === "medium"}
                onChange={() => setEnergy("medium")}
              />
              Moyenne
            </label>

            <label>
              <input
                type="radio"
                name="energy"
                value="high"
                checked={energy === "high"}
                onChange={() => setEnergy("high")}
              />
              Haute
            </label>
          </div>

          <p>Merci. On ajuste l’app à ton rythme.</p>
        </section>
      )}

      <hr />

      <div>
        <button type="button" onClick={back} disabled={submitting || step === 0}>
          Retour
        </button>

        {step < 2 ? (
          <button type="button" onClick={next} disabled={submitting || !canGoNext}>
            Suivant
          </button>
        ) : (
          <button type="button" onClick={handleFinish} disabled={submitting || !canGoNext}>
            {submitting ? "Enregistrement..." : "Valider"}
          </button>
        )}
      </div>
    </main>
  );
}