export const STATUS_KEYS = ["fatigue", "stress", "joie", "sante", "motivation", "finances"] as const;

export type StatusKey = (typeof STATUS_KEYS)[number];

export type StatusLevel = "faible" | "modere" | "eleve";

export type UserStatuses = Record<StatusKey, number | null>;

export type StatusDefinition = {
  key: StatusKey;
  label: string;
  description: string;
  accentColor: string;
};

export const DEFAULT_USER_STATUSES: UserStatuses = {
  fatigue: 50,
  stress: 50,
  joie: 50,
  sante: 50,
  motivation: 50,
  finances: 50,
};

export const STATUS_DEFINITIONS: StatusDefinition[] = [
  {
    key: "fatigue",
    label: "Fatigue",
    description: "Ton niveau de fatigue ressenti sur la journée.",
    accentColor: "#f6a86f",
  },
  {
    key: "stress",
    label: "Stress",
    description: "La pression mentale que tu ressens en ce moment.",
    accentColor: "#f76c5e",
  },
  {
    key: "joie",
    label: "Joie",
    description: "L'espace que prend ton élan positif aujourd'hui.",
    accentColor: "#f2c14e",
  },
  {
    key: "sante",
    label: "Santé",
    description: "Comment ton corps et ton énergie générale tiennent le cap.",
    accentColor: "#7acb8b",
  },
  {
    key: "motivation",
    label: "Motivation",
    description: "Ton envie d'avancer sur ce qui compte pour toi.",
    accentColor: "#6fa7f6",
  },
  {
    key: "finances",
    label: "Finances",
    description: "Ton ressenti sur l'equilibre de ton budget actuel.",
    accentColor: "#8fcf9b",
  },
];

export function clampStatusValue(value: unknown): number | null {
  if (value === null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function normalizeStatuses(rawStatuses: unknown): UserStatuses {
  if (!rawStatuses || typeof rawStatuses !== "object" || Array.isArray(rawStatuses)) {
    return { ...DEFAULT_USER_STATUSES };
  }

  const candidateStatuses = rawStatuses as Record<string, unknown>;

  return STATUS_KEYS.reduce<UserStatuses>((accumulator, key) => {
    if (!(key in candidateStatuses)) {
      accumulator[key] = DEFAULT_USER_STATUSES[key];
      return accumulator;
    }

    const normalizedValue = clampStatusValue(candidateStatuses[key]);
    accumulator[key] = normalizedValue;
    return accumulator;
  }, { ...DEFAULT_USER_STATUSES });
}

export function getStatusLevel(value: number | null): StatusLevel | null {
  if (value === null) {
    return null;
  }

  if (value <= 33) {
    return "faible";
  }

  if (value <= 66) {
    return "modere";
  }

  return "eleve";
}
