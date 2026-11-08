import { apiRequest } from './api';
import type { Project } from './project-facts';

export type { Project, ProjectDate, ProjectPerson } from './project-facts';
export { projectFacts } from './project-facts';

export type PersonnelChoice = { id: string; name: string };

export type ProjectList = {
  projects: Project[];
  canManage?: boolean;
  canAssign?: boolean;
  personnel?: PersonnelChoice[];
};

export function fetchProjects(apiBase: string, token: string) {
  return apiRequest<ProjectList>(apiBase, '/api/v1/mobile/projects', {
    token,
    action: 'Could not load projects',
  });
}
