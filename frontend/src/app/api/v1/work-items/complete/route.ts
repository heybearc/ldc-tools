import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';
import { sendWorkCompletionEmail } from '@/lib/work-completion-email';
import { canEmailAddress } from '@/lib/reachable-email';

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

    const body = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === 'string' && id) : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: 'Select at least one task' }, { status: 400 });
    }

    const personnel = await canPostWork(session.user.id, scope);
    const openItems = await prisma.workItem.findMany({
      where: {
        id: { in: ids },
        constructionGroupId: scope.constructionGroupId,
        status: 'OPEN',
        ...(personnel ? {} : { assigneeId: session.user.id }),
      },
      select: {
        id: true,
        title: true,
        detail: true,
        notifyRequestor: true,
        requestorName: true,
        requestorEmail: true,
      },
    });
    if (openItems.length === 0) {
      return NextResponse.json({ error: 'You can only finish open work assigned to you' }, { status: 400 });
    }

    const completedAt = new Date();
    await prisma.workItem.updateMany({
      where: { id: { in: openItems.map((item) => item.id) } },
      data: { status: 'DONE', completedAt },
    });

    let emailed = 0;
    for (const item of openItems) {
      if (!item.requestorEmail || !canEmailAddress(item.requestorEmail, item.notifyRequestor)) continue;
      try {
        const sent = await sendWorkCompletionEmail({
          requestorName: item.requestorName,
          requestorEmail: item.requestorEmail,
          title: item.title,
          detail: item.detail,
          completedByName: session.user.name || 'Personnel',
        });
        if (sent) emailed += 1;
      } catch (emailError) {
        console.error('Work completion email failed:', emailError);
      }
    }

    return NextResponse.json({
      completed: openItems.length,
      emailed,
      completedAt: completedAt.toISOString(),
    });
  } catch (error) {
    console.error('Complete work items error:', error);
    return NextResponse.json({ error: 'Failed to mark work done' }, { status: 500 });
  }
}
