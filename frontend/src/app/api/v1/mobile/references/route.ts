import { NextRequest, NextResponse } from 'next/server';
import { canManageGroup, requireMobileActor } from '@/lib/mobile-actor';
import { createReferenceLink, listReferenceLinks } from '@/lib/reference-links';
import { validateReference } from '@/lib/references';

export async function GET(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    const [links, canManage] = await Promise.all([
      listReferenceLinks(actor.constructionGroupId),
      canManageGroup(actor),
    ]);
    return NextResponse.json({ canManage, links });
  } catch (error) {
    console.error('Mobile references error:', error);
    return NextResponse.json({ error: 'Could not load references' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    if (!(await canManageGroup(actor))) {
      return NextResponse.json({ error: 'Personnel can add a reference' }, { status: 403 });
    }
    const parsed = validateReference(await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const link = await createReferenceLink({
      constructionGroupId: actor.constructionGroupId,
      createdById: actor.id,
      value: parsed.value,
    });
    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error('Mobile create reference error:', error);
    return NextResponse.json({ error: 'Could not save the reference' }, { status: 500 });
  }
}
