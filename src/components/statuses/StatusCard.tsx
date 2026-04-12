import { getStatusLevel, type StatusDefinition } from "../../types/statuses";
import { Link } from "react-router-dom";
import "./StatusCard.css";

type StatusCardProps = {
  definition: StatusDefinition;
  value: number | null;
};

function formatStatusValue(value: number | null) {
  if (value === null) {
    return "—";
  }

  return `${value}/100`;
}

function formatStatusLevel(value: number | null) {
  const level = getStatusLevel(value);

  if (!level) {
    return "Non disponible";
  }

  if (level === "faible") {
    return "Faible";
  }

  if (level === "modere") {
    return "Modéré";
  }

  return "Élevé";
}

export function StatusCard({ definition, value }: StatusCardProps) {
  const progressWidth = value === null ? 0 : value;
  const progressLabel = value === null ? "Non disponible" : `${value} sur 100`;

  return (
    <Link
      to={`/statuses/${definition.key}`}
      className="status-card status-card--link"
      aria-labelledby={`status-card-${definition.key}-title`}
      aria-label={`Ouvrir le detail du statut ${definition.label}`}
    >
      <div className="status-card__header">
        <div>
          <p className="status-card__eyebrow">Statut</p>
          <h2 id={`status-card-${definition.key}-title`}>{definition.label}</h2>
        </div>
        <p className="status-card__value" aria-label={`Valeur ${definition.label} : ${progressLabel}`}>
          {formatStatusValue(value)}
        </p>
      </div>

      <p className="status-card__description">{definition.description}</p>

      <div className="status-card__meter-wrap">
        <div className="status-card__meter" aria-hidden="true">
          <div
            className="status-card__meter-fill"
            style={{ width: `${progressWidth}%`, backgroundColor: definition.accentColor }}
          />
        </div>
        <span className="status-card__meter-label">{progressLabel}</span>
      </div>

      <dl className="status-card__meta">
        <div>
          <dt>Niveau</dt>
          <dd>{formatStatusLevel(value)}</dd>
        </div>
      </dl>
    </Link>
  );
}
