export function normalizeEmail(raw: string) {
  return raw.trim();
}

export function isValidEmail(email: string) {
  // simple et efficace pour MVP
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(password: string) {
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return password.length >= 8 && hasLetter && hasNumber;
}