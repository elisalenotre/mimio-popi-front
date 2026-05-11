import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppNavbar } from "../../components/navbar/AppNavbar";
import backIcon from "../../assets/icons/Chevron-Arrow-Left.svg";
import { getMyStatuses } from "../../services/status/statusService";
import {
  STATUS_DETAIL_CONTENT,
  getStatusDefinitionByKey,
  getStatusLevel,
} from "../../types/statuses";
import "./StatusDetailPage.css";

function formatStatusLevel(level: "faible" | "modere" | "eleve" | null) {
  if (!level) {
    return "Non disponible";
  }

  if (level === "modere") {
    return "Modéré";
  }

  if (level === "eleve") {
    return "Élevé";
  }

  return "Faible";
}

export default function StatusDetailPage() {
  const { statusKey } = useParams<{ statusKey: string }>();
  const navigate = useNavigate();

  const statusDefinition = useMemo(() => getStatusDefinitionByKey(statusKey ?? ""), [statusKey]);

  const [value, setValue] = useState<number | null>(null);
  const [valueUnavailable, setValueUnavailable] = useState(false);

  useEffect(() => {
    if (!statusDefinition) {
      const redirectTimeout = window.setTimeout(() => {
        navigate("/", { replace: true });
      }, 1400);

      return () => window.clearTimeout(redirectTimeout);
    }

    let cancelled = false;

    getMyStatuses()
      .then((statuses) => {
        if (cancelled) {
          return;
        }

        const nextValue = statuses[statusDefinition.key];
        setValue(nextValue);
        setValueUnavailable(nextValue === null);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setValue(null);
        setValueUnavailable(true);
      });

    return () => {
      cancelled = true;
    };
  }, [navigate, statusDefinition]);

  if (!statusDefinition) {
    return (
      <>
        <AppNavbar />
        <div className="status-detail-page-layout">
          <main className="status-detail-page status-detail-page--error" role="alert" aria-live="polite">
            <h1>Statut introuvable</h1>
            <p>Ce statut n'est pas reconnu. Retour aux statuts en cours...</p>
            <Link to="/" className="status-detail-page__back-link-button">
              Revenir aux statuts
            </Link>
          </main>
        </div>
      </>
    );
  }

  const level = getStatusLevel(value);
  const detailContent = STATUS_DETAIL_CONTENT[statusDefinition.key];
  const selectedTips = level ? detailContent.gentleTips[level] : detailContent.gentleTips.generic;

  return (
    <>
      <AppNavbar />
      <div className="status-detail-page-layout">
        <main className="status-detail-page" aria-labelledby="status-detail-title">
          <p className="status-detail-page__back-link">
            <Link to="/" className="back-home-link">
              <img className="back-home-link__icon" src={backIcon} alt="" aria-hidden="true" />
              Retour aux statuts
            </Link>
          </p>

          <header className="status-detail-page__header">
            <p className="status-detail-page__eyebrow">Détail du statut</p>
            <h1 id="status-detail-title">{statusDefinition.label}</h1>
            <p className="status-detail-page__value">{value === null ? "—" : `${value}/100`}</p>
            <p className="status-detail-page__level">Interprétation: {formatStatusLevel(level)}</p>
            {valueUnavailable && (
              <p className="status-detail-page__value-fallback" role="status">
                Impossible de charger la valeur pour le moment.
              </p>
            )}
          </header>

          <section className="status-detail-page__section" aria-labelledby="status-understanding-title">
            <h2 id="status-understanding-title">Comprendre ce statut</h2>
            <h3>À quoi ça correspond ?</h3>
            <p>{detailContent.definition}</p>
            <p className="status-detail-page__normalization">{detailContent.normalization}</p>
          </section>

          <section className="status-detail-page__section" aria-labelledby="status-levels-title">
            <h2 id="status-levels-title">Lecture par niveaux</h2>
            <ul className="status-detail-page__levels">
              <li>0-33: faible</li>
              <li>34-66: modéré</li>
              <li>67-100: élevé</li>
            </ul>
          </section>

          <section className="status-detail-page__section" aria-labelledby="status-tips-title">
            <h2 id="status-tips-title">Les conseils de Popi</h2>
            <ul className="status-detail-page__tips">
              {selectedTips.slice(0, 5).map((tip) => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </section>
        </main>
      </div>
    </>
  );
}
