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

export type StatusDetailContent = {
  definition: string;
  normalization: string;
  gentleTips: {
    faible: string[];
    modere: string[];
    eleve: string[];
    generic: string[];
  };
};

export const DAILY_STATUS_BASELINE = 30;

export const DEFAULT_USER_STATUSES: UserStatuses = {
  fatigue: DAILY_STATUS_BASELINE,
  stress: DAILY_STATUS_BASELINE,
  joie: DAILY_STATUS_BASELINE,
  sante: DAILY_STATUS_BASELINE,
  motivation: DAILY_STATUS_BASELINE,
  finances: DAILY_STATUS_BASELINE,
};

export function getStatusDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

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

export const STATUS_DETAIL_CONTENT: Record<StatusKey, StatusDetailContent> = {
  fatigue: {
    definition: "La fatigue reflète ton niveau d'energie disponible ici et maintenant. Elle peut bouger vite selon ton repos, ton rythme et ta charge mentale.",
    normalization: "C'est ok d'avoir un coup de mou. L'important, c'est d'ajuster doucement ton rythme.",
    gentleTips: {
      faible: [
        "Garder un rythme stable avec des pauses courtes entre deux taches.",
        "Conserver ton elan sur une priorite simple et realiste.",
      ],
      modere: [
        "Prevoir une micro-pause de 5 minutes avant de reprendre.",
        "Alterner une tache demandante puis une tache legere.",
        "Boire un verre d'eau et respirer lentement une minute.",
      ],
      eleve: [
        "Prevoir une micro-pause (5 minutes).",
        "Choisir une tache legere.",
        "Boire un verre d'eau.",
        "Si possible, avancer l'heure de coucher.",
      ],
      generic: [
        "Faire une pause courte et bienveillante.",
        "Decouper ta prochaine action en un pas tres simple.",
      ],
    },
  },
  stress: {
    definition: "Le stress reflète la pression ressentie et la charge mentale du moment. Il indique surtout un besoin d'espace, de clarte ou de soutien.",
    normalization: "Ressentir du stress ne veut pas dire que tu echoues. C'est un signal, pas un verdict.",
    gentleTips: {
      faible: [
        "Continuer avec un rythme regulier et des objectifs raisonnables.",
        "Noter ce qui t'aide pour le reutiliser plus tard.",
      ],
      modere: [
        "Faire une pause respiration: 4 secondes inspire, 6 secondes expire.",
        "Choisir une seule priorite pour la prochaine heure.",
        "Reporter les decisions non urgentes.",
      ],
      eleve: [
        "Faire une pause de 5 minutes sans ecran.",
        "Revenir a une tache tres concrete et courte.",
        "Demander de l'aide sur un point qui bloque.",
      ],
      generic: [
        "Ralentir le rythme pendant quelques minutes.",
        "Reprioriser sur une seule action utile.",
      ],
    },
  },
  joie: {
    definition: "La joie reflète ton elan positif et le plaisir ressenti dans la journee. Elle peut monter grace a de petits moments qui comptent.",
    normalization: "Ta joie peut varier d'un jour a l'autre, et c'est normal.",
    gentleTips: {
      faible: [
        "Prevoir une activite courte qui te fait du bien.",
        "Te reconnecter a une personne ou un lieu rassurant.",
      ],
      modere: [
        "Garder un moment agreable dans la journee, meme bref.",
        "Noter une petite victoire pour renforcer l'elan.",
      ],
      eleve: [
        "Capitaliser sur ton energie pour avancer sur une tache importante.",
        "Partager ce bon moment avec quelqu'un si tu en as envie.",
      ],
      generic: [
        "Accueillir ce que tu ressens sans te juger.",
        "Chercher un petit moment qui te ressource.",
      ],
    },
  },
  sante: {
    definition: "La sante represente ton ressenti global cote corps et energie. Ce n'est pas un diagnostic medical, mais un repere de bien-etre.",
    normalization: "Ton corps envoie des signaux utiles. Les ecouter, c'est deja avancer.",
    gentleTips: {
      faible: [
        "Conserver tes habitudes qui te font du bien.",
        "Garder des temps de recuperation entre deux efforts.",
      ],
      modere: [
        "Ajouter un peu de mouvement doux dans la journee.",
        "Verrouiller un vrai temps de pause pour souffler.",
      ],
      eleve: [
        "Allege ton planning si possible.",
        "Hydrate-toi et privilegie des repas simples et regulers.",
        "Accorde-toi un temps de repos sans culpabiliser.",
      ],
      generic: [
        "Prendre une pause et respirer calmement.",
        "Te concentrer sur une habitude bien-etre facile a tenir.",
      ],
    },
  },
  motivation: {
    definition: "La motivation mesure ton envie d'avancer sur ce qui compte pour toi. Elle depend souvent du niveau d'energie, de clarte et de charge.",
    normalization: "Une motivation basse n'est pas un defaut. C'est souvent le signe qu'il faut simplifier.",
    gentleTips: {
      faible: [
        "Choisir une mini-action de moins de 10 minutes.",
        "Clarifier une seule priorite realiste pour aujourd'hui.",
      ],
      modere: [
        "Decouper la prochaine tache en deux etapes simples.",
        "Demarrer par l'etape la plus facile pour lancer l'elan.",
      ],
      eleve: [
        "Profiter de l'elan pour avancer sur une tache de fond.",
        "Prevoir une pause ensuite pour garder un rythme durable.",
      ],
      generic: [
        "Commencer petit, puis ajuster selon ton energie.",
        "Te feliciter pour chaque pas, meme court.",
      ],
    },
  },
  finances: {
    definition: "Les finances refletent ton ressenti sur l'equilibre de ton budget actuel. C'est un indicateur de confort et de charge mentale liee a l'argent.",
    normalization: "C'est normal que ce sujet soit sensible. Avancer par petits pas aide souvent.",
    gentleTips: {
      faible: [
        "Continuer un suivi simple de tes depenses importantes.",
        "Prevoir un mini-point budget hebdomadaire.",
      ],
      modere: [
        "Lister les depenses fixes et celles a ajuster cette semaine.",
        "Planifier une action simple: verifier un abonnement ou une facture.",
      ],
      eleve: [
        "Faire un point budget court, sans chercher la perfection.",
        "Prioriser les depenses essentielles pour les prochains jours.",
        "Demander un coup de main administratif si besoin.",
      ],
      generic: [
        "Faire un petit point budget en mode bienveillance.",
        "Choisir une seule action concrete pour retrouver un peu de clarte.",
      ],
    },
  },
};

export function getStatusDefinitionByKey(statusKey: string): StatusDefinition | null {
  return STATUS_DEFINITIONS.find((definition) => definition.key === statusKey) ?? null;
}

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
