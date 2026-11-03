import type { Person } from './home';

let current: Person | null = null;

export function selectPerson(person: Person) {
  current = person;
}

export function selectedPerson() {
  return current;
}
