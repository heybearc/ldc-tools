import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canManageGroup, requireMobileActor } from '@/lib/mobile-actor';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    if (!(await canManageGroup(actor))) {
      return NextResponse.json({ error: 'Personnel can add a crew' }, { status: 403 });
    }
    const team = await prisma.tradeTeam.findFirst({
      where: { id: params.id, constructionGroupId: actor.constructionGroupId, isActive: true },
      select: { id: true },
    });
    if (!team) return NextResponse.json({ error: 'Trade team not found' }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const crew = await prisma.crew.create({
      data: {
        name,
        tradeTeamId: team.id,
        constructionGroupId: actor.constructionGroupId,
        isActive: true,
      },
      select: { id: true, name: true },
    });
    return NextResponse.json(crew, { status: 201 });
  } catch (error) {
    console.error('Mobile create crew error:', error);
    return NextResponse.json({ error: 'Could not add the crew' }, { status: 500 });
  }
}
