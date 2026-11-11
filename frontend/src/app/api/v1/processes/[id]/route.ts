import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';
import { validateProcessTemplate } from '@/lib/processes';

export async function PATCH(
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
    if (!(await canPostWork(session.user.id, scope))) {
      return NextResponse.json({ error: 'Personnel can edit a process' }, { status: 403 });
    }

    const existing = await prisma.processTemplate.findFirst({
      where: { id: params.id, constructionGroupId: scope.constructionGroupId, isActive: true },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Process not found' }, { status: 404 });
    }

    const parsed = validateProcessTemplate(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.processStep.deleteMany({ where: { templateId: existing.id } });
      return tx.processTemplate.update({
        where: { id: existing.id },
        data: {
          name: parsed.value.name,
          purpose: parsed.value.purpose,
          appliesTo: parsed.value.appliesTo,
          cadence: parsed.value.cadence,
          steps: {
            create: parsed.value.steps.map((step, index) => ({
              position: index,
              title: step.title,
              detail: step.detail,
              explanation: step.explanation,
              referenceUrl: step.referenceUrl,
            })),
          },
        },
        include: { steps: { orderBy: { position: 'asc' } } },
      });
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      purpose: updated.purpose,
      appliesTo: updated.appliesTo,
      cadence: updated.cadence,
      steps: updated.steps.map((step) => ({
        id: step.id,
        title: step.title,
        detail: step.detail,
        explanation: step.explanation,
        referenceUrl: step.referenceUrl,
      })),
    });
  } catch (error) {
    console.error('Update process error:', error);
    return NextResponse.json({ error: 'Failed to update the process' }, { status: 500 });
  }
}
