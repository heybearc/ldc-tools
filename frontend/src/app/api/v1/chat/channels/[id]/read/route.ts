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
    await prisma.chatRead.upsert({
      where: { channelId_userId: { channelId: channel.id, userId: session.user.id } },
      create: { channelId: channel.id, userId: session.user.id },
      update: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mark chat read error:', error);
    return NextResponse.json({ error: 'Failed to update the chat' }, { status: 500 });
  }
}
