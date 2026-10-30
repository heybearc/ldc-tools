import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
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
    const result = await prisma.workItem.updateMany({
      where: { id: { in: ids }, constructionGroupId: scope.constructionGroupId },
      data: { notifyRequestor: body.notifyRequestor },
    });
    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error('Update work notifications error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
