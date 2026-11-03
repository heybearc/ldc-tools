import * as SecureStore from 'expo-secure-store';
import type { Person } from './home';

const STORAGE_KEY = 'selected-person';

let current: Person | null = null;

export function selectPerson(person: Person) {
  current = person;
  void SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(person)).catch(() => {});
}

export function selectedPerson() {
  return current;
}

export async function loadSelectedPerson() {
  if (current) return current;
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Person;
    if (!parsed || typeof parsed.id !== 'string') return null;
    current = parsed;
    return current;
  } catch {
    return null;
  }
}
