import { apiRequest } from './api';
import type { Project } from './project-facts';

export type { Project, ProjectDate, ProjectPerson } from './project-facts';
export { projectFacts } from './project-facts';

export function fetchProjects(apiBase: string, token: string) {
  return apiRequest<{ projects: Project[] }>(apiBase, '/api/v1/mobile/projects', {
    token,
    action: 'Could not load projects',
  });
}
