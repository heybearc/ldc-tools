import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { canAccessCG, getCGScope } from '@/lib/cg-scope';

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
    if (!scope) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const item = await prisma.workItem.findUnique({
      where: { id: params.id },
      select: { id: true, constructionGroupId: true },
    });
    if (!item || !canAccessCG(scope, item.constructionGroupId)) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    const read = await prisma.workHelpRead.upsert({
      where: { workItemId_userId: { workItemId: item.id, userId: session.user.id } },
      create: { workItemId: item.id, userId: session.user.id },
      update: { readAt: new Date() },
      select: { readAt: true },
    });

    return NextResponse.json({ readAt: read.readAt.toISOString() });
  } catch (error) {
    console.error('Mark help read error:', error);
    return NextResponse.json({ error: 'Failed to mark the request read' }, { status: 500 });
  }
}
