import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope, withCGFilter } from '@/lib/cg-scope';
import { activeUserInGroup, canPostWork, projectInGroup, userInGroupWhere } from '@/lib/work-item-access';
import { dueOnDate, timingLabel, validateWorkItemInput } from '@/lib/work-items';

const itemInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  project: { select: { id: true, name: true } },
} as const;

function serialize(item: {
  id: string;
  title: string;
  detail: string;
  explanation: string | null;
  referenceUrl: string | null;
  timingKind: 'DEADLINE' | 'PROJECT_DATE' | 'MONTHLY' | 'YEARLY' | 'PROCESS' | 'CREW_REQUEST' | 'NONE';
  dueOn: Date | null;
  claimable: boolean;
  status: 'OPEN' | 'DONE';
  requestorName: string | null;
  requestorEmail: string | null;
  claimedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  assignee: { id: string; name: string | null; email: string } | null;
  project: { id: string; name: string } | null;
}) {
  const dueOn = item.dueOn ? item.dueOn.toISOString().slice(0, 10) : null;
  return {
    id: item.id,
    title: item.title,
    detail: item.detail,
    explanation: item.explanation,
    referenceUrl: item.referenceUrl,
    timingKind: item.timingKind,
    dueOn,
    timingLabel: timingLabel(item.timingKind, dueOn, item.project?.name || null),
    project: item.project,
    claimable: item.claimable,
    status: item.status,
    assignee: item.assignee,
    requestorName: item.requestorName,
    requestorEmail: item.requestorEmail,
    claimedAt: item.claimedAt?.toISOString() || null,
    completedAt: item.completedAt?.toISOString() || null,
    createdAt: item.createdAt.toISOString(),
  };
}

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

    const canAssign = await canPostWork(session.user.id, scope);
    const [items, teammates, projects] = await Promise.all([
      prisma.workItem.findMany({
        where: withCGFilter(scope),
        include: itemInclude,
        orderBy: [{ status: 'asc' }, { dueOn: 'asc' }, { createdAt: 'desc' }],
      }),
      canAssign
        ? prisma.user.findMany({
            where: userInGroupWhere(scope.constructionGroupId),
            select: { id: true, name: true, email: true },
            orderBy: [{ name: 'asc' }, { email: 'asc' }],
          })
        : Promise.resolve([]),
      canAssign
        ? prisma.project.findMany({
            where: { constructionGroupId: scope.constructionGroupId, isActive: true },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
          })
        : Promise.resolve([]),
    ]);

    return NextResponse.json({
      canAssign,
      currentUserId: session.user.id,
      items: items.map(serialize),
      teammates,
      projects,
    });
  } catch (error) {
    console.error('List work items error:', error);
    return NextResponse.json({ error: 'Failed to load work' }, { status: 500 });
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
      return NextResponse.json({ error: 'Personnel can add work' }, { status: 403 });
    }

    const parsed = validateWorkItemInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const input = parsed.value;
    if (input.projectId) {
      const project = await projectInGroup(input.projectId, scope.constructionGroupId);
      if (!project) {
        return NextResponse.json({ error: 'That project is not in this construction group' }, { status: 400 });
      }
    }

    if (input.assigneeId) {
      const assignee = await activeUserInGroup(input.assigneeId, scope.constructionGroupId);
      if (!assignee) {
        return NextResponse.json({ error: 'Assignee must be signed in to this construction group' }, { status: 400 });
      }
    }

    const created = await prisma.workItem.create({
      data: {
        constructionGroupId: scope.constructionGroupId,
        title: input.title,
        detail: input.detail,
        explanation: input.explanation,
        referenceUrl: input.referenceUrl,
        timingKind: input.timingKind,
        dueOn: dueOnDate(input.dueOn),
        projectId: input.projectId,
        claimable: input.claimable,
        assigneeId: input.assigneeId,
        status: 'OPEN',
        requestorName: input.requestorName,
        requestorEmail: input.requestorEmail,
        createdById: session.user.id,
      },
      include: itemInclude,
    });

    return NextResponse.json(serialize(created), { status: 201 });
  } catch (error) {
    console.error('Create work item error:', error);
    return NextResponse.json({ error: 'Failed to add work' }, { status: 500 });
  }
}
