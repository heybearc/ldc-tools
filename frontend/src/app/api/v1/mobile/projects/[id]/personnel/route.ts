import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileActor, scopeForActor } from '@/lib/mobile-actor';
import { canAssignProjectPersonnel, personnelInGroup } from '@/lib/project-personnel';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    const scope = scopeForActor(actor);
    if (!(await canAssignProjectPersonnel(actor.id, scope))) {
      return NextResponse.json({ error: 'Oversight assigns Personnel to a project' }, { status: 403 });
    }
    const project = await prisma.project.findFirst({
      where: { id: params.id, constructionGroupId: actor.constructionGroupId, isActive: true },
      select: { id: true },
    });
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const userId = String(body.userId || '');
    const people = await personnelInGroup(actor.constructionGroupId);
    if (!people.some((person) => person.id === userId)) {
      return NextResponse.json({ error: 'That person is not Personnel in this construction group' }, { status: 400 });
    }
    if (body.remove === true) {
      await prisma.projectPersonnel.deleteMany({ where: { projectId: project.id, userId } });
      return NextResponse.json({ ok: true });
    }
    await prisma.projectPersonnel.upsert({
      where: { projectId_userId: { projectId: project.id, userId } },
      update: {},
      create: { projectId: project.id, userId, assignedById: actor.id },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mobile project personnel error:', error);
    return NextResponse.json({ error: 'Could not update project personnel' }, { status: 500 });
  }
}
