import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getMyStatuses } from "../../services/status/statusService";
import { STATUS_DEFINITIONS, type UserStatuses } from "../../types/statuses";
import "./StatusMiniPanel.css";

function MiniRow({ label, value, accentColor }: { label: string; value: number | null; accentColor: string }) {
  const progressWidth = value === null ? 0 : value;
  const displayValue = value === null ? "—" : `${value}`;

  return (
    <div className="status-mini-row">
      <div className="status-mini-row__header">
        <span className="status-mini-row__label">{label}</span>
        <span
          className="status-mini-row__value"
          aria-label={value === null ? `${label} : Non disponible` : `${label} : ${value} sur 100`}
        >
          {displayValue}
        </span>
      </div>
      <div className="status-mini-row__bar" aria-hidden="true">
        <div
          className="status-mini-row__bar-fill"
          style={{ width: `${progressWidth}%`, backgroundColor: accentColor }}
        />
      </div>
    </div>
  );
}

function MiniPanelSkeleton() {
  return (
    <div className="status-mini-skeleton" aria-hidden="true">
      {STATUS_DEFINITIONS.map((definition) => (
        <div key={definition.key} className="status-mini-skeleton__row">
          <div className="status-mini-skeleton__label" />
          <div className="status-mini-skeleton__bar" />
        </div>
      ))}
    </div>
  );
}

export function StatusMiniPanel() {
  const [statuses, setStatuses] = useState<UserStatuses | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getMyStatuses()
      .then((result) => {
        setStatuses(result);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="status-mini-panel">
      <div className="status-mini-panel__header">
        <h3>Mes statuts</h3>
        <Link to="/" className="status-mini-panel__link" aria-label="Voir mes statuts en détail">
          Tout voir
        </Link>
      </div>

      {loading ? (
        <MiniPanelSkeleton />
      ) : error ? (
        <p className="status-mini-panel__error">Impossible de charger tes statuts.</p>
      ) : (
        <div className="status-mini-panel__list">
          {STATUS_DEFINITIONS.map((definition) => (
            <MiniRow
              key={definition.key}
              label={definition.label}
              value={statuses?.[definition.key] ?? null}
              accentColor={definition.accentColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
