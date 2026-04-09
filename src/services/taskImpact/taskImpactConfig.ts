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
      fatigue: 3,
      stress: 2,
      joie: 1,
      sante: 1,
      motivation: 2,
      finances: -1,
    },
    travail: {
      fatigue: 4,
      stress: 3,
      joie: -1,
      sante: 0,
      motivation: 2,
      finances: 1,
    },
    social: {
      fatigue: -2,
      stress: -2,
      joie: 3,
      sante: 1,
      motivation: 1,
      finances: -1,
    },
    sante: {
      fatigue: -2,
      stress: -1,
      joie: 1,
      sante: 3,
      motivation: 1,
      finances: 0,
    },
    maison: {
      fatigue: 2,
      stress: -1,
      joie: 1,
      sante: 1,
      motivation: 1,
      finances: -1,
    },
    loisirs: {
      fatigue: -3,
      stress: -2,
      joie: 3,
      sante: 1,
      motivation: 1,
      finances: -1,
    },
  },
};

export const TASK_IMPACT_CURRENT_CONFIG = TASK_IMPACT_CONFIG_V1;