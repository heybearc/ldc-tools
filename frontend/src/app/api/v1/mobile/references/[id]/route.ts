import { NextRequest, NextResponse } from 'next/server';
import { canManageGroup, requireMobileActor } from '@/lib/mobile-actor';
import { deleteReferenceLink, updateReferenceLink } from '@/lib/reference-links';
import { validateReference } from '@/lib/references';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    if (!(await canManageGroup(actor))) {
      return NextResponse.json({ error: 'Personnel can change a reference' }, { status: 403 });
    }
    const parsed = validateReference(await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const link = await updateReferenceLink(params.id, actor.constructionGroupId, parsed.value);
    if (!link) return NextResponse.json({ error: 'That reference is not in this construction group' }, { status: 404 });
    return NextResponse.json({ link });
  } catch (error) {
    console.error('Mobile update reference error:', error);
    return NextResponse.json({ error: 'Could not save the reference' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    if (!(await canManageGroup(actor))) {
      return NextResponse.json({ error: 'Personnel can change a reference' }, { status: 403 });
    }
    const removed = await deleteReferenceLink(params.id, actor.constructionGroupId);
    if (!removed) return NextResponse.json({ error: 'That reference is not in this construction group' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mobile delete reference error:', error);
    return NextResponse.json({ error: 'Could not remove the reference' }, { status: 500 });
  }
}
