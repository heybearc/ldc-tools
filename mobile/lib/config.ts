export function defaultApiBase() {
  return 'https://ldctools.com';
}

export function normalizeApiBase(value: string) {
  return value.trim().replace(/\/+$/, '');
}
