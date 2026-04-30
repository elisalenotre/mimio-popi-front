import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppNavbar } from "../../components/navbar/AppNavbar";
import { Mascots } from "../../components/mascots/Mascots";
import { StatusCard } from "../../components/statuses/StatusCard";
import { getMyStatuses } from "../../services/status/statusService";
import { STATUS_DEFINITIONS, getStatusDayKey, type UserStatuses } from "../../types/statuses";
import "./StatusesPage.css";

function StatusCardsSkeleton() {
  return (
    <div className="statuses-grid" aria-hidden="true">
      {STATUS_DEFINITIONS.map((definition) => (
        <div key={definition.key} className="status-card status-card--skeleton">
          <div className="status-card__skeleton-line status-card__skeleton-line--short" />
          <div className="status-card__skeleton-line status-card__skeleton-line--title" />
          <div className="status-card__skeleton-line" />
          <div className="status-card__skeleton-bar" />
          <div className="status-card__skeleton-line status-card__skeleton-line--short" />
        </div>
      ))}
    </div>
  );
}

export default function StatusesPage() {
  const [statuses, setStatuses] = useState<UserStatuses | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayRefreshToken, setDayRefreshToken] = useState(0);

  const loadStatuses = async () => {
    setLoading(true);
    setError(null);

    try {
      const nextStatuses = await getMyStatuses();
      setStatuses(nextStatuses);
    } catch {
      setError("Impossible de charger tes statuts. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatuses();
  }, [dayRefreshToken]);

  useEffect(() => {
    let lastDayKey = getStatusDayKey();

    const interval = window.setInterval(() => {
      const currentDayKey = getStatusDayKey();
      if (currentDayKey !== lastDayKey) {
        lastDayKey = currentDayKey;
        setDayRefreshToken((current) => current + 1);
      }
    }, 60000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <>
      <AppNavbar />
      <div className="statuses-page-layout">
        <main className="statuses-page-main">
          <header className="statuses-page-hero">
            <div>
              <p className="statuses-page-hero__eyebrow">Tableau de bord</p>
              <h1>Tes statuts du moment</h1>
              <p>
                Un coup d'œil suffit pour voir où tu en es sur tes six repères personnels. 
              </p>
              <p>
                Attention à ne dépasser tes limites sur aucun d’entre eux, et n’hésite pas à consulter tes tâches pour faire baisser les niveaux qui sont un peu trop hauts.
            </p>
        </div>

            <section className="statuses-page-summary" aria-label="Resume des statuts">
              <h2>Scan rapide</h2>
              <p>6 indicateurs, une lecture en quelques secondes, puis un accès direct à tes tâches.</p>
              <Link to="/tasks" className="statuses-page-link-button">
                Voir mes tâches
              </Link>
              <Mascots variant="default" position="card" />
            </section>
          </header>

          {error ? (
            <section className="statuses-page-error" aria-labelledby="statuses-error-title">
              <h2 id="statuses-error-title">Impossible de charger tes statuts.</h2>
              <p>Réessaie dans un instant.</p>
              <button type="button" onClick={() => void loadStatuses()}>
                Réessayer
              </button>
            </section>
          ) : loading ? (
            <section aria-label="Chargement des statuts">
              <StatusCardsSkeleton />
            </section>
          ) : (
            <section aria-label="Liste des statuts">
              <div className="statuses-grid">
                {STATUS_DEFINITIONS.map((definition) => (
                  <StatusCard key={definition.key} definition={definition} value={statuses?.[definition.key] ?? null} />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </>
  );
}
