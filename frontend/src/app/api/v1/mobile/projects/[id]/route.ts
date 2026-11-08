import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canManageGroup, requireMobileActor } from '@/lib/mobile-actor';

const PROJECT_STATUSES = new Set(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']);

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    if (!(await canManageGroup(actor))) {
      return NextResponse.json({ error: 'Personnel can edit a project' }, { status: 403 });
    }
    const existing = await prisma.project.findFirst({
      where: { id: params.id, constructionGroupId: actor.constructionGroupId, isActive: true },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    const body = await request.json().catch(() => ({}));
    const name = String(body.name || '').trim();
    const status = String(body.status || '').toUpperCase();
    if (!name) return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    if (!PROJECT_STATUSES.has(status)) return NextResponse.json({ error: 'Choose a project status' }, { status: 400 });
    await prisma.project.update({
      where: { id: existing.id },
      data: {
        name,
        projectNumber: String(body.number || '').trim() || null,
        location: String(body.location || '').trim() || null,
        status: status as 'PLANNING',
        startDate: dateOrNull(body.startDate),
        endDate: dateOrNull(body.endDate),
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mobile update project error:', error);
    return NextResponse.json({ error: 'Could not save the project' }, { status: 500 });
  }
}

function dateOrNull(value: unknown) {
  const text = String(value || '').trim();
  if (!text) return null;
  const parsed = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
