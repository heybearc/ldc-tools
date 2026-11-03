import { apiRequest } from './api';

export type Person = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  place: string;
  photo: string | null;
};

export type Crew = {
  id: string;
  name: string;
  people: Person[];
};

export type Team = {
  id: string;
  name: string;
  people: Person[];
  crews: Crew[];
};

export type Directory = {
  constructionGroup: Person[];
  personnel: Person[];
  ancillary: Person[];
  teams: Team[];
};

export type WorkItem = {
  id: string;
  title: string;
  detail: string;
  timing: string;
  stepsDone?: number;
  stepsTotal?: number;
};

export type Home = {
  user: { name: string | null; email: string };
  work: WorkItem[];
  available?: WorkItem[];
  people?: Person[];
  directory?: Directory;
};

const inflight = new Map<string, Promise<Home>>();

export function fetchHome(apiBase: string, token: string) {
  const key = `${apiBase}\n${token}`;
  const existing = inflight.get(key);
  if (existing) return existing;
  const pending = apiRequest<Home>(apiBase, '/api/v1/mobile/home', {
    token,
    action: 'Could not load My Work and the directory',
  }).finally(() => {
    if (inflight.get(key) === pending) inflight.delete(key);
  });
  inflight.set(key, pending);
  return pending;
}
