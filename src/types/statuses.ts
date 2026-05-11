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
    description: "Le stress que tu ressens en ce moment.",
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
    description: "Ton envie d'avancer dans ta journée.",
    accentColor: "#6fa7f6",
  },
  {
    key: "finances",
    label: "Finances",
    description: "Ton ressenti sur l'équilibre de ton budget actuel.",
    accentColor: "#8fcf9b",
  },
];

export const STATUS_DETAIL_CONTENT: Record<StatusKey, StatusDetailContent> = {
  fatigue: {
    definition: "La fatigue reflète ton niveau d'energie. Popi te rappelle que cela peut varier selon ton repos, ton rythme et ta charge mentale de ta journée.",
    normalization: "C'est pas grave d'avoir des coups de mou (longs ou courts), même pour Mimio ! Popi te rappelle : l'important, c'est d'ajuster ton rythme pour ne pas t'écrouler à la fin de la journée.",
    gentleTips: {
      faible: [
        "Popi te suggère : garde un rythme stable avec des pauses (lire, marcher, boire un verre d'eau) entre deux tâches.",
        "Conserver ton élan sur une priorité simple et réaliste, que cette priorité soit petite ou grande, comme le ferait Mimio sous les conseils avisés de Popi.",
      ],
      modere: [
        "Popi te recommande une micro-pause de 5 minutes avant de reprendre.",
        "Alterner une tache demandante puis une tache legere, selon les conseils de Popi.",
        "Le bon conseil de Popi : boire un verre d'eau et respirer lentement une minute.",
      ],
      eleve: [
        "Pin Pon Pin Pon ! C'est urgent : prevoir une micro-pause (5 minutes), te conseille urgemment Popi.",
        "Choisit une tache legere dès maintenant.",
        "Boire un verre d'eau - même sur d'autres planetes, c'est bon !",
        "Popi te suggère : si possible, avancer l'heure de coucher.",
      ],
      generic: [
        "Faire une pause courte et bienveillante, à la manière de Popi.",
        "Regarde dans l'onglet \"Tâches\" et regarde, avec Mimio et Popi, si tu ne peux pas découper ta prochaine action en petit pas très simple.",
      ],
    },
  },
  stress: {
    definition: "Ici, le stress reflète la pression ressentie et la charge mentale du moment. Cela indique surtout que tu as peut-être besoin d'espace, de clarté, de soutien ou une bonne pause.",
    normalization: "Ressentir du stress peut être normal, ne t'inquiète pas. Prends le comme un signal. Même Popi ressent cela à sa manière et doit souvent ralentir pour mieux avancer ensuite. Si tu ressens trop de stress sans pouvoir te soulager ou qui persiste sur une trop longue période, n'hésite pas à en parler à quelqu'un de confiance ou à un professionnel.",
    gentleTips: {
      faible: [
        "Continuer avec un rythme régulier et des objectifs raisonnables, comme Popi te l'enseigne.",
        "Comme tu sais Popi est de grande sagesse et te conseille de noter ce qui t'aide pour le réutiliser plus tard.",
      ],
      modere: [
        "Faire une pause respiration avec Popi : 4 secondes inspire, 6 secondes expire.",
        "Choisit une seule priorite pour la prochaine heure.",
        "Reporter les décisions non urgentes, même Popi attend parfois.",
      ],
      eleve: [
        "Fais une pause de 5 minutes sans écran.",
        "Popi te suggère : revenir à une tâche très concrète et courte.",
        "Demander de l'aide sur un point qui bloque, c'est ce que Popi ferait.",
      ],
      generic: [
        "Ralentir le rythme pendant quelques minutes avec l'aide de Popi.",
        "Reprioriser sur une seule action utile. Mimio et Popi sont là pour ça.",
      ],
    },
  },
  joie: {
    definition: "La joie reflète ton élan positif et le plaisir ressenti dans la journée. Pas besoin de faire de grandes choses pour la ressentir. Elle peut monter grâce à de petits moments qui comptent.",
    normalization: "Ta joie peut varier d'un jour à l'autre, tout comme Mimio et pleins d'autres personnes, c'est normal. Popi accepte cette belle variété d'émotions et pourra te soutenir en toutes circonstances.",
    gentleTips: {
      faible: [
        "Prévoir une activité courte qui te fait du bien, comme par exemple lire un chapitre d'un livre ou écouter ta musique préférée ou encore regarder un épisode de ta série préférée ou même faire un peu de sport (même si Popi va râler).",
        "Te reconnecter à une personne ou un lieu rassurant, comme Mimio avec Popi, par exemple !",
      ],
      modere: [
        "Conseille de Popi: garder un moment agréable dans la journée, même bref.",
        "Noter une petite victoire pour renforcer l'élan. Mimio et Popi célèbrent avec toi.",
      ],
      eleve: [
        "Capitaliser sur ton énergie pour avancer sur une tâche importante, dit Popi.",
        "Partager ce bon moment avec quelqu'un si tu en as envie : Mimio adore partager ses exploits avec Popi et Popi adore connaître les exploits de Popi.",
      ],
      generic: [
        "Accueillir ce que tu ressens sans te juger, à la manière bienveillante de Popi.",
        "Chercher un petit moment qui te ressource avec l'aide de ton ami Popi.",
      ],
    },
  },
  sante: {
    definition: "La santé représente ton ressenti global sur ton propre corps et ton hygiène. Ce n'est pas un diagnostic médical, mais plutôt une évaluation de ton confort physique et de ton énergie générale.",
    normalization: "Ton corps envoie des signaux utiles. Les écouter, c'est ce que Popi t'encourage à faire. Si tu ressens un inconfort physique persistant ou des symptômes inquiétants, n'hésite pas à consulter un professionnel de santé pour un avis médical approprié.",
    gentleTips: {
      faible: [
        "Conseil du sage Popi : conserver tes habitudes qui te font du bien.",
        "Garder des temps de récupération entre deux efforts (même un extraterrestre a besoin de repos entre deux aventures !).",
      ],
      modere: [
        "Ajouter un peu de mouvement doux dans la journée.",
        "Verrouiller un vrai temps de pause pour souffler.",
      ],
      eleve: [
        "Allège ton planning si possible.",
        "Hydrate-toi et privilégie des repas simples et réguliers.",
        "Accorde-toi un temps de repos sans culpabiliser.",
      ],
      generic: [
        "Prendre une pause et respirer calmement par exemple en suivant les conseils de Popi : 4 secondes inspire, 6 secondes expire.",
        "Te concentrer sur une habitude bien-être facile à tenir.",
      ],
    },
  },
  motivation: {
    definition: "La motivation mesure ton envie d'avancer, même petits pas après petit pas. Elle dépend souvent du niveau d'énergie, de clarté et de charge globale.",
    normalization: "Une motivation basse n'est pas un défaut. Même Mimio ressent cela de temps à autres. C'est souvent le signe qu'il faut simplifier et Popi l'a bien appris sur sa planète. Si tu te sens démotivé depuis plusieurs jours sans voir d'amélioration, n'hésite pas à en parler à quelqu'un de confiance ou à un professionnel pour t'aider à y voir plus clair.",
    gentleTips: {
      faible: [
        "Choisir une mini-action de moins de 10 minutes et mets dans tes tâches pour les faire avec Mimio et Popi.",
        "Objectif du jour, selon le caporal Popi: clarifier une seule priorité réaliste pour aujourd'hui.",
      ],
      modere: [
        "Conseil de Popi : découper la prochaine tâche en deux étapes simples. Par exemple, quand Mimio veut \"ranger la chambre\", Popi lui dit qu'elle peux faire \"ranger les vêtements\" puis \"ranger les livres\".",
        "En tant que grand stratège, Popi recommande de démarrer par l'étape la plus facile pour lancer l'élan.",
      ],
      eleve: [
        "T'es sur la bonne voie, chef.fe !, crie Popi. Profiter de l'élan pour avancer sur une tâche de fond.",
        "Prévoir une pause ensuite pour garder un rythme durable, signé Popi qui sait que même toi tu as besoin de souffler.",
      ],
      generic: [
        "Commencer petit avec Popi et Mimio, puis ajuster selon ton énergie.",
        "Quand Popi a planifié son voyage sur Terre, il y est allé petit pas par petit pas et toi aussi, tu peux t'inspirer de cette approche pour faire de ton mieux.",
      ],
    },
  },
  finances: {
    definition: "Les finances reflètent ton ressenti sur l'équilibre de ton budget actuel. C'est un indicateur de confort et de charge mentale liée à l'argent. Mimio et Popi le savent bien : gérer leur budget est un vrai défi alors qu'il y a temps de sorties et café à tester !",
    normalization: "Gérer le plus simplement possible son budget aide souvent. Popi te suggère de suivre tes dépenses importantes et de prévoir un petit point budget régulier pour ajuster le tir si besoin. Si tu te sens dépassé.e par ta situation financière, n'hésite pas à en parler à quelqu'un de confiance ou à un professionnel qui pourra t'aider à y voir plus clair et trouver des solutions adaptées.",
    gentleTips: {
      faible: [
        "Continuer un suivi simple de tes dépenses importantes, suggère Popi.",
        "Pourquoi ne pas prévoir un mini-point budget hebdomadaire ? Popi le fait tous les dimanches avec Mimio pour préparer la semaine à venir. À toi de trouver le rythme qui te convient !",
      ],
      modere: [
        "Conseil du fin économiste Popi : lister les dépenses fixes et celles à ajuster cette semaine.",
        "Planifier une action simple avec Popi : vérifier un abonnement ou une facture.",
      ],
      eleve: [
        "Faire un point budget court, sans chercher la perfection.",
        "La recommendation de Popi : prioriser les dépenses essentielles pour les prochains jours.",
        "Demander un coup de main administratif si besoin, c'est ce que Popi ferait !",
      ],
      generic: [
        "Faire un petit point budget tranquillement avec Popi.",
        "Choisir une seule action concrète pour retrouver un peu de clarté : c'est le travail de Popi.",
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
