import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getCGScope } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';
import { setProcessPublished } from '@/lib/process-runs';
import { processTemplateJson } from '@/lib/processes';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
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
      return NextResponse.json({ error: 'Personnel can publish a process' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const result = await setProcessPublished({
      id: params.id,
      constructionGroupId: scope.constructionGroupId,
      publish: body.publish !== false,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(processTemplateJson(result.template));
  } catch (error) {
    console.error('Publish process error:', error);
    return NextResponse.json({ error: 'Failed to publish the process' }, { status: 500 });
  }
}
