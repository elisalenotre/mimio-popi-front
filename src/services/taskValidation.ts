export const TASK_TITLE_MAX_LENGTH = 120;

export function normalizeTaskTitle(raw: string) {
  return raw.trim();
}

export function isValidTaskTitle(title: string) {
  return title.length >= 1 && title.length <= TASK_TITLE_MAX_LENGTH;
}

export function getTaskTitleError(title: string) {
  const normalized = normalizeTaskTitle(title);
  if (!isValidTaskTitle(normalized)) {
    return "Ajoute un titre pour creer ta tache.";
  }

  return null;
}
