import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readMobileToken } from '@/lib/mobile-session';
import { mobileGateResponse } from '@/lib/mobile-actor';
import { activeUserInGroup } from '@/lib/work-item-access';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const token = readMobileToken(request.headers.get('authorization'));
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: token.id },
      select: { id: true, status: true, constructionGroupId: true },
    });
    const denied = mobileGateResponse(user);
    if (denied || !user?.constructionGroupId) {
      return denied ?? NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }

    const item = await prisma.workItem.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        constructionGroupId: true,
        claimable: true,
        assigneeId: true,
        status: true,
      },
    });
    if (!item || item.constructionGroupId !== user.constructionGroupId) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }
    if (!item.claimable) {
      return NextResponse.json({ error: 'This work is not claimable' }, { status: 400 });
    }
    if (item.status !== 'OPEN') {
      return NextResponse.json({ error: 'This work is already finished' }, { status: 400 });
    }
    if (item.assigneeId && item.assigneeId !== user.id) {
      return NextResponse.json({ error: 'This work is already assigned' }, { status: 400 });
    }

    const member = await activeUserInGroup(user.id, item.constructionGroupId);
    if (!member) {
      return NextResponse.json({ error: 'Sign in to this construction group to claim work' }, { status: 403 });
    }

    const updated = await prisma.workItem.update({
      where: { id: item.id },
      data: {
        assigneeId: user.id,
        claimedAt: item.assigneeId === user.id ? undefined : new Date(),
      },
      select: { id: true, assigneeId: true },
    });
    return NextResponse.json({ id: updated.id, assigneeId: updated.assigneeId });
  } catch (error) {
    console.error('Mobile claim work error:', error);
    return NextResponse.json({ error: 'Could not claim the work. Try again in a moment.' }, { status: 500 });
  }
}
