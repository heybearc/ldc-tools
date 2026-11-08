export function defaultApiBase() {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE;
  if (typeof fromEnv === 'string' && fromEnv.trim()) return normalizeApiBase(fromEnv);
  return 'https://ldctools.com';
}

export function normalizeApiBase(value: string) {
  return value.trim().replace(/\/+$/, '');
}
