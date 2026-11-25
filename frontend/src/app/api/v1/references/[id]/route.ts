import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getCGScope } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';
import { deleteReferenceLink, updateReferenceLink } from '@/lib/reference-links';
import { validateReference } from '@/lib/references';

async function authorize() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const scope = await getCGScope();
  if (!scope?.constructionGroupId) {
    return { error: NextResponse.json({ error: 'No construction group assigned' }, { status: 403 }) };
  }
  if (!(await canPostWork(session.user.id, scope))) {
    return { error: NextResponse.json({ error: 'Personnel can change a reference' }, { status: 403 }) };
  }
  return { constructionGroupId: scope.constructionGroupId };
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const access = await authorize();
    if ('error' in access) return access.error;
    const parsed = validateReference(await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const link = await updateReferenceLink(params.id, access.constructionGroupId, parsed.value);
    if (!link) return NextResponse.json({ error: 'That reference is not in this construction group' }, { status: 404 });
    return NextResponse.json({ link });
  } catch (error) {
    console.error('Update reference error:', error);
    return NextResponse.json({ error: 'Could not save the reference' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const access = await authorize();
    if ('error' in access) return access.error;
    const removed = await deleteReferenceLink(params.id, access.constructionGroupId);
    if (!removed) return NextResponse.json({ error: 'That reference is not in this construction group' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Delete reference error:', error);
    return NextResponse.json({ error: 'Could not remove the reference' }, { status: 500 });
  }
}
