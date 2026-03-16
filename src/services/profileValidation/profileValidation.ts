export function normalizeDisplayName(raw: string) {
  return raw.trim();
}

export function isValidDisplayName(name: string) {
  if (name.length === 0) return true;

  if (name.length < 2) return false;
  if (name.length > 30) return false;

  return /^[\p{L}\d _-]+$/u.test(name);
}