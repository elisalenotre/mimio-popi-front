import type { TaskImpact } from "../../types/tasks";

export type TaskImpactRulesVersion = "v1";

type TaskImpactConfig = {
  version: TaskImpactRulesVersion;
  categoryImpactByName: Record<string, TaskImpact>;
};

export const TASK_IMPACT_CONFIG_V1: TaskImpactConfig = {
  version: "v1",
  categoryImpactByName: {
    etudes: {
      fatigue: 8,
      stress: 7,
      joie: 5,
      sante: 5,
      motivation: 9,
      finances: -5,
    },
    travail: {
      fatigue: 9,
      stress: 8,
      joie: -5,
      sante: 0,
      motivation: 7,
      finances: 6,
    },
    social: {
      fatigue: -6,
      stress: -7,
      joie: 8,
      sante: 5,
      motivation: 5,
      finances: -5,
    },
    sante: {
      fatigue: -7,
      stress: -6,
      joie: 5,
      sante: 10,
      motivation: 6,
      finances: 0,
    },
    maison: {
      fatigue: 6,
      stress: -5,
      joie: 5,
      sante: 5,
      motivation: 6,
      finances: -5,
    },
    loisirs: {
      fatigue: -8,
      stress: -7,
      joie: 9,
      sante: 5,
      motivation: 6,
      finances: -5,
    },
  },
};

export const TASK_IMPACT_CURRENT_CONFIG = TASK_IMPACT_CONFIG_V1;