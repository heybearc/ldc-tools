import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { canAccessCG, getCGScope } from '@/lib/cg-scope';
import { canAssignProjectPersonnel, personnelInGroup } from '@/lib/project-personnel';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getCGScope();
    if (!scope?.constructionGroupId) {
      return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }
    if (!(await canAssignProjectPersonnel(session.user.id, scope))) {
      return NextResponse.json({ error: 'Oversight assigns Personnel to a project' }, { status: 403 });
    }

    const body = await request.json();
    const fromList = Array.isArray(body.userIds)
      ? body.userIds.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
      : [];
    const userIds = fromList.length > 0
      ? fromList
      : (typeof body.userId === 'string' && body.userId ? [body.userId] : []);
    if (userIds.length === 0) {
      return NextResponse.json({ error: 'Choose a Personnel person' }, { status: 400 });
    }

    const project = await prisma.project.findFirst({
      where: { id: params.id, constructionGroupId: scope.constructionGroupId, isActive: true },
      select: { id: true, constructionGroupId: true },
    });
    if (!project || !canAccessCG(scope, project.constructionGroupId || '')) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const personnel = await personnelInGroup(scope.constructionGroupId);
    const allowed = new Set(personnel.map((person) => person.id));
    if (userIds.some((id) => !allowed.has(id))) {
      return NextResponse.json({ error: 'That person is not Personnel in this construction group' }, { status: 400 });
    }

    const result = await prisma.projectPersonnel.createMany({
      data: userIds.map((userId) => ({
        projectId: project.id,
        userId,
        assignedById: session.user.id,
      })),
      skipDuplicates: true,
    });

    return NextResponse.json({ ok: true, assigned: result.count });
  } catch (error) {
    console.error('Assign project personnel error:', error);
    return NextResponse.json({ error: 'Failed to assign Personnel' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getCGScope();
    if (!scope?.constructionGroupId) {
      return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }
    if (!(await canAssignProjectPersonnel(session.user.id, scope))) {
      return NextResponse.json({ error: 'Oversight assigns Personnel to a project' }, { status: 403 });
    }

    const userId = new URL(request.url).searchParams.get('userId') || '';
    const project = await prisma.project.findFirst({
      where: { id: params.id, constructionGroupId: scope.constructionGroupId, isActive: true },
      select: { id: true },
    });
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await prisma.projectPersonnel.deleteMany({
      where: { projectId: project.id, userId },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Remove project personnel error:', error);
    return NextResponse.json({ error: 'Failed to remove Personnel' }, { status: 500 });
  }
}
