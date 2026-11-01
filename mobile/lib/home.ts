import { apiRequest } from './api';

export type Home = {
  user: { name: string | null; email: string };
  work: Array<{ id: string; title: string; detail: string; timing: string }>;
  people: Array<{ name: string; email: string; phone: string | null; role: string; place: string }>;
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
