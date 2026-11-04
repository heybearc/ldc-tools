export type ProjectPerson = {
  id: string;
  name: string;
};

export type ProjectDate = {
  id: string;
  title: string;
  detail: string;
  date: string | null;
  status: string;
};

export type Project = {
  id: string;
  name: string;
  number: string | null;
  location: string | null;
  status: string;
  start: string | null;
  end: string | null;
  personnel: ProjectPerson[];
  schedule: ProjectDate[];
};

export function projectFacts(project: Project) {
  return [project.number, project.location, project.start, project.end].filter(Boolean).join(' · ');
}
