import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getCGScope } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';
import { createReferenceLink, listReferenceLinks } from '@/lib/reference-links';
import { validateReference } from '@/lib/references';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getCGScope();
    if (!scope?.constructionGroupId) {
      return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }

    const [links, canManage] = await Promise.all([
      listReferenceLinks(scope.constructionGroupId),
      canPostWork(session.user.id, scope),
    ]);
    return NextResponse.json({ canManage, links });
  } catch (error) {
    console.error('List references error:', error);
    return NextResponse.json({ error: 'Could not load references' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getCGScope();
    if (!scope?.constructionGroupId) {
      return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }
    if (!(await canPostWork(session.user.id, scope))) {
      return NextResponse.json({ error: 'Personnel can add a reference' }, { status: 403 });
    }

    const parsed = validateReference(await request.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

    const link = await createReferenceLink({
      constructionGroupId: scope.constructionGroupId,
      createdById: session.user.id,
      value: parsed.value,
    });
    return NextResponse.json({ link }, { status: 201 });
  } catch (error) {
    console.error('Create reference error:', error);
    return NextResponse.json({ error: 'Could not save the reference' }, { status: 500 });
  }
}
