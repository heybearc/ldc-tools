import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';
import { processTemplateJson, validateProcessTemplate } from '@/lib/processes';
import { hiddenReleaseCheckProcess } from '@/lib/release-check-cleanup';

const templateInclude = {
  steps: { orderBy: { position: 'asc' as const } },
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getCGScope();
    if (!scope?.constructionGroupId) {
      return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }

    const canPost = await canPostWork(session.user.id, scope);
    const [templates, projects] = await Promise.all([
      prisma.processTemplate.findMany({
        where: {
          constructionGroupId: scope.constructionGroupId,
          isActive: true,
          ...(canPost ? {} : { status: 'PUBLISHED' as const }),
          ...hiddenReleaseCheckProcess,
        },
        include: templateInclude,
        orderBy: { name: 'asc' },
      }),
      canPost
        ? prisma.project.findMany({
            where: { constructionGroupId: scope.constructionGroupId, isActive: true },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      canPost,
      projects,
      templates: templates.map(processTemplateJson),
    });
  } catch (error) {
    console.error('List processes error:', error);
    return NextResponse.json({ error: 'Failed to load processes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: 'Personnel can add a process' }, { status: 403 });
    }

    const parsed = validateProcessTemplate(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const created = await prisma.processTemplate.create({
      data: {
        constructionGroupId: scope.constructionGroupId,
        name: parsed.value.name,
        purpose: parsed.value.purpose,
        appliesTo: parsed.value.appliesTo,
        cadence: parsed.value.cadence,
        customEvery: parsed.value.customEvery,
        customUnit: parsed.value.customUnit,
        status: 'DRAFT',
        createdById: session.user.id,
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
      include: templateInclude,
    });

    return NextResponse.json(processTemplateJson(created), { status: 201 });
  } catch (error) {
    console.error('Create process error:', error);
    return NextResponse.json({ error: 'Failed to add a process' }, { status: 500 });
  }
}
