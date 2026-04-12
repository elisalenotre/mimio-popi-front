import { ZERO_TASK_IMPACT, type TaskImpact } from "../../types/tasks";
import { TASK_IMPACT_CURRENT_CONFIG, type TaskImpactRulesVersion } from "./taskImpactConfig";

export type VersionedTaskImpact = {
  version: TaskImpactRulesVersion;
  deltas: TaskImpact;
};

const warnedCategoryKeys = new Set<string>();

function normalizeCategoryName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function warnMissingMapping(categoryName: string, normalizedCategoryKey: string) {
  if (!normalizedCategoryKey || warnedCategoryKeys.has(normalizedCategoryKey)) {
    return;
  }

  warnedCategoryKeys.add(normalizedCategoryKey);

  const isDevelopment = import.meta.env?.DEV === true;
  const isTestMode = import.meta.env?.MODE === "test";
  if (!isDevelopment || isTestMode) {
    return;
  }

  console.warn(
    `[taskImpactEstimator] Aucun mapping d'impact trouve pour la categorie "${categoryName}". Fallback neutre applique.`
  );
}

export function estimateTaskImpactFromCategoryName(categoryName: string | null | undefined): TaskImpact {
  if (!categoryName) {
    return { ...ZERO_TASK_IMPACT };
  }

  const normalizedCategoryKey = normalizeCategoryName(categoryName);
  if (!normalizedCategoryKey) {
    return { ...ZERO_TASK_IMPACT };
  }

  const mappedImpact = TASK_IMPACT_CURRENT_CONFIG.categoryImpactByName[normalizedCategoryKey];
  if (!mappedImpact) {
    warnMissingMapping(categoryName, normalizedCategoryKey);
    return { ...ZERO_TASK_IMPACT };
  }

  return { ...mappedImpact };
}

export function estimateVersionedTaskImpactFromCategoryName(
  categoryName: string | null | undefined
): VersionedTaskImpact {
  return {
    version: TASK_IMPACT_CURRENT_CONFIG.version,
    deltas: estimateTaskImpactFromCategoryName(categoryName),
  };
}
