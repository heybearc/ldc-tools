import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { canAccessCG, getCGScope } from '@/lib/cg-scope';
import { setChannelRead } from '@/lib/chat';

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const scope = await getCGScope();
    if (!scope) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const channel = await prisma.chatChannel.findUnique({ where: { id: params.id } });
    if (!channel || !canAccessCG(scope, channel.constructionGroupId)) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    if (channel.kind === 'DIRECT' && !channel.directKey.split(':').includes(session.user.id)) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }
    const body = await request.json().catch(() => ({}));
    const unread = await setChannelRead(channel.id, session.user.id, Boolean(body.unread));
    return NextResponse.json({ ok: true, unread });
  } catch (error) {
    console.error('Mark chat read error:', error);
    return NextResponse.json({ error: 'Failed to update the chat' }, { status: 500 });
  }
}
