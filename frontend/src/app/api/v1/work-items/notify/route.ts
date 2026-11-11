import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope, withCGFilter } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const scope = await getCGScope();
    if (!scope?.constructionGroupId) {
      return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }
    if (!(await canPostWork(session.user.id, scope))) {
      return NextResponse.json({ error: 'Personnel can change email notifications' }, { status: 403 });
    }
    const body = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === 'string' && id) : [];
    if (ids.length === 0 || typeof body.notifyRequestor !== 'boolean') {
      return NextResponse.json({ error: 'Choose work and whether to email the requestor' }, { status: 400 });
    }
    const matched = await prisma.workItem.findMany({
      where: { AND: [{ id: { in: ids } }, withCGFilter(scope)] },
      select: { id: true },
    });
    if (matched.length === 0) {
      return NextResponse.json({ error: 'Those tasks are not in this construction group' }, { status: 400 });
    }
    const matchedIds = matched.map((item) => item.id);
    await prisma.workItem.updateMany({
      where: { id: { in: matchedIds } },
      data: { notifyRequestor: body.notifyRequestor },
    });
    const saved = await prisma.workItem.findMany({
      where: { id: { in: matchedIds }, notifyRequestor: body.notifyRequestor },
      select: { id: true },
    });
    if (saved.length === 0) {
      return NextResponse.json({ error: 'Could not update the completion email' }, { status: 500 });
    }
    return NextResponse.json({
      updated: saved.length,
      ids: saved.map((item) => item.id),
      notifyRequestor: body.notifyRequestor,
    });
  } catch (error) {
    console.error('Update work notifications error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
