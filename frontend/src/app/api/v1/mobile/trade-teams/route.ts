import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canCreateTradeTeam, requireMobileActor } from '@/lib/mobile-actor';

export async function GET(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    const teams = await prisma.tradeTeam.findMany({
      where: { constructionGroupId: actor.constructionGroupId, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        crews: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        },
        oversight: {
          where: { isActive: true, endDate: null },
          select: { role: true },
        },
      },
    });
    return NextResponse.json({
      canManage: await canCreateTradeTeam(actor),
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        roles: countRoles(team.oversight.map((row) => row.role)),
        crews: team.crews,
      })),
    });
  } catch (error) {
    console.error('Mobile trade teams error:', error);
    return NextResponse.json({ error: 'Could not load trade teams' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    if (!(await canCreateTradeTeam(actor))) {
      return NextResponse.json({ error: 'Personnel can add a trade team' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    const description = String(body.description || '').trim() || null;
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const team = await prisma.tradeTeam.create({
      data: {
        name,
        description,
        constructionGroupId: actor.constructionGroupId,
        isActive: true,
      },
      select: { id: true, name: true },
    });
    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Mobile create trade team error:', error);
    return NextResponse.json({ error: 'Could not add the trade team' }, { status: 500 });
  }
}

function countRoles(roles: string[]) {
  return {
    overseer: roles.filter((role) => role === 'TTO').length,
    assistant: roles.filter((role) => role === 'TTOA').length,
    support: roles.filter((role) => role === 'TT_SUPPORT').length,
  };
}
