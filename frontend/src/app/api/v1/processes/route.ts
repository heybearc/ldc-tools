import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';
import { validateProcessTemplate } from '@/lib/processes';

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
        where: { constructionGroupId: scope.constructionGroupId, isActive: true },
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
      templates: templates.map((template) => ({
        id: template.id,
        name: template.name,
        steps: template.steps.map((step) => ({
          id: step.id,
          title: step.title,
          detail: step.detail,
          explanation: step.explanation,
          referenceUrl: step.referenceUrl,
        })),
      })),
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

    return NextResponse.json({
      id: created.id,
      name: created.name,
      steps: created.steps.map((step) => ({
        id: step.id,
        title: step.title,
        detail: step.detail,
        explanation: step.explanation,
        referenceUrl: step.referenceUrl,
      })),
    }, { status: 201 });
  } catch (error) {
    console.error('Create process error:', error);
    return NextResponse.json({ error: 'Failed to add a process' }, { status: 500 });
  }
}
