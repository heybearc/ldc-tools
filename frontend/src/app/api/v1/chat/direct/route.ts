import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { activeUserInGroup } from '@/lib/work-item-access';
import { directKey } from '@/lib/chat';

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
    const userId = typeof body.userId === 'string' ? body.userId : '';
    if (!userId || userId === session.user.id) {
      return NextResponse.json({ error: 'Choose a teammate' }, { status: 400 });
    }
    const teammate = await activeUserInGroup(userId, scope.constructionGroupId);
    if (!teammate) {
      return NextResponse.json({ error: 'That person is not in this construction group' }, { status: 400 });
    }

    const key = directKey(session.user.id, userId);
    const channel = await prisma.chatChannel.upsert({
      where: { constructionGroupId_directKey: { constructionGroupId: scope.constructionGroupId, directKey: key } },
      create: { constructionGroupId: scope.constructionGroupId, kind: 'DIRECT', directKey: key },
      update: {},
      select: { id: true },
    });
    return NextResponse.json({ id: channel.id });
  } catch (error) {
    console.error('Open direct chat error:', error);
    return NextResponse.json({ error: 'Failed to open the chat' }, { status: 500 });
  }
}
