import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canCreateProject, canManageGroup, requireMobileActor, scopeForActor } from '@/lib/mobile-actor';
import { canAssignProjectPersonnel, personnelInGroup } from '@/lib/project-personnel';
import { formatCalendarDate } from '@/lib/work-items';

const STATUS_LABELS: Record<string, string> = {
  PLANNING: 'Planning',
  ACTIVE: 'Active',
  ON_HOLD: 'On hold',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export async function GET(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    const groupId = actor.constructionGroupId;
    const scope = scopeForActor(actor);
    const [projects, dates, canManage, canCreate, canAssign, personnelChoices] = await Promise.all([
      prisma.project.findMany({
        where: { constructionGroupId: groupId, isActive: true },
        select: {
          id: true,
          name: true,
          projectNumber: true,
          location: true,
          status: true,
          startDate: true,
          endDate: true,
          personnel: {
            select: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.workItem.findMany({
        where: { constructionGroupId: groupId, timingKind: 'PROJECT_DATE', projectId: { not: null } },
        select: { id: true, title: true, detail: true, dueOn: true, status: true, projectId: true },
        orderBy: [{ status: 'asc' }, { dueOn: 'asc' }],
      }),
      canManageGroup(actor),
      canCreateProject(actor),
      canAssignProjectPersonnel(actor.id, scope),
      personnelInGroup(groupId),
    ]);

    const scheduleByProject = new Map<string, typeof dates>();
    for (const item of dates) {
      if (!item.projectId) continue;
      const rows = scheduleByProject.get(item.projectId) || [];
      rows.push(item);
      scheduleByProject.set(item.projectId, rows);
    }

    return NextResponse.json({
      canManage,
      canCreate,
      canAssign,
      personnel: personnelChoices.map((person) => ({
        id: person.id,
        name: person.name || person.email,
      })),
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        number: project.projectNumber,
        location: project.location,
        status: STATUS_LABELS[project.status] || project.status,
        statusCode: project.status,
        start: project.startDate ? formatCalendarDate(project.startDate.toISOString()) : null,
        end: project.endDate ? formatCalendarDate(project.endDate.toISOString()) : null,
        startDate: project.startDate ? project.startDate.toISOString().slice(0, 10) : '',
        endDate: project.endDate ? project.endDate.toISOString().slice(0, 10) : '',
        personnel: project.personnel.map((row) => ({
          id: row.user.id,
          name: row.user.name || row.user.email,
        })),
        schedule: (scheduleByProject.get(project.id) || []).map((item) => ({
          id: item.id,
          title: item.title,
          detail: item.detail,
          date: item.dueOn ? formatCalendarDate(item.dueOn.toISOString()) : null,
          status: item.status,
        })),
      })),
    });
  } catch (error) {
    console.error('Mobile projects error:', error);
    return NextResponse.json({ error: 'Could not load projects. Try again in a moment.' }, { status: 500 });
  }
}

const PROJECT_STATUSES = new Set(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']);

export async function POST(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    if (!(await canCreateProject(actor))) {
      return NextResponse.json({ error: 'Personnel can add a project' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    const status = String(body.status || 'PLANNING').toUpperCase();
    if (!PROJECT_STATUSES.has(status)) return NextResponse.json({ error: 'Choose a project status' }, { status: 400 });
    const group = await prisma.constructionGroup.findUnique({
      where: { id: actor.constructionGroupId },
      select: { regionId: true },
    });
    if (!group) return NextResponse.json({ error: 'Construction group not found' }, { status: 404 });
    const project = await prisma.project.create({
      data: {
        name,
        projectNumber: String(body.number || '').trim() || null,
        location: String(body.location || '').trim() || null,
        status: status as 'PLANNING',
        startDate: dateOrNull(body.startDate),
        endDate: dateOrNull(body.endDate),
        constructionGroupId: actor.constructionGroupId,
        regionId: group.regionId,
      },
      select: { id: true },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Mobile create project error:', error);
    return NextResponse.json({ error: 'Could not add the project' }, { status: 500 });
  }
}

function dateOrNull(value: unknown) {
  const text = String(value || '').trim();
  if (!text) return null;
  const parsed = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
