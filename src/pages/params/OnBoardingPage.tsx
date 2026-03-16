import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Energy, OnboardingAnswers, Pace, Priority } from "../../types/onboarding";
import { saveOnboarding, skipOnboarding } from "../../services/profile/profileService";

type Step = 0 | 1 | 2;

const priorityOptions: Array<{ value: Priority; label: string }> = [
  { value: "studies", label: "Études" },
  { value: "work", label: "Travail" },
  { value: "balance", label: "Équilibre" },
  { value: "health", label: "Santé" },
  { value: "other", label: "Autre" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(0);

  const [pace, setPace] = useState<Pace | "">("");
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [energy, setEnergy] = useState<Energy | "">("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGoNext = useMemo(() => {
    if (step === 0) return pace !== "";
    if (step === 1) return priorities.length > 0;
    if (step === 2) return energy !== "";
    return false;
  }, [step, pace, priorities, energy]);

  const togglePriority = (value: Priority) => {
    setError(null);

    setPriorities((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }

      if (current.length >= 2) {
        setError("Choisis jusqu'à 2 priorités maximum.");
        return current;
      }

      return [...current, value];
    });
  };

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
    if (!pace || priorities.length === 0 || !energy) return;

    const answers: OnboardingAnswers = { pace, priorities, energy };

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
          <h2>Tes priorités du moment (max 2)</h2>
          <p>Choisis 1 ou 2 priorités.</p>

          <div>
            {priorityOptions.map((option) => {
              const isChecked = priorities.includes(option.value);
              return (
                <label key={option.value}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => togglePriority(option.value)}
                    disabled={!isChecked && priorities.length >= 2}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
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