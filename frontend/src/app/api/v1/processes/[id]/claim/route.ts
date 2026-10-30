import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { canAccessCG, getCGScope } from '@/lib/cg-scope';
import { activeUserInGroup } from '@/lib/work-item-access';
import { createProcessRun } from '@/lib/process-runs';

export async function POST(
  _request: Request,
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

    const template = await prisma.processTemplate.findFirst({
      where: { id: params.id, isActive: true },
      include: { steps: { orderBy: { position: 'asc' } } },
    });
    if (!template || !canAccessCG(scope, template.constructionGroupId)) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }
    if (template.steps.length === 0) {
      return NextResponse.json({ error: 'This process has no steps' }, { status: 400 });
    }

    const member = await activeUserInGroup(session.user.id, template.constructionGroupId);
    const sameGroup = scope.constructionGroupId === template.constructionGroupId;
    if (!member && !(scope.userRole === 'SUPER_ADMIN' && sameGroup)) {
      return NextResponse.json({ error: 'Sign in to this construction group to claim a process' }, { status: 403 });
    }

    const item = await createProcessRun({
      constructionGroupId: template.constructionGroupId,
      createdById: session.user.id,
      templateId: template.id,
      name: template.name,
      steps: template.steps,
      projectId: null,
      assigneeId: session.user.id,
      claimable: false,
    });

    return NextResponse.json({ id: item.id, assigneeId: item.assigneeId }, { status: 201 });
  } catch (error) {
    console.error('Claim process error:', error);
    return NextResponse.json({ error: 'Failed to claim the process' }, { status: 500 });
  }
}
