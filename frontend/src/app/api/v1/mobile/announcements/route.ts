import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isMobileAdmin, requireMobileActor } from '@/lib/mobile-actor';

export async function GET(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const rows = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { constructionGroupId: access.actor.constructionGroupId },
          { constructionGroupId: null },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, title: true, message: true, type: true },
    });
    return NextResponse.json({
      announcements: rows,
      admin: isMobileAdmin(access.actor.role),
    });
  } catch (error) {
    console.error('Mobile announcements error:', error);
    return NextResponse.json({ error: 'Could not load announcements' }, { status: 500 });
  }
}
