import { NextRequest, NextResponse } from 'next/server';
import { canManageGroup, requireMobileActor } from '@/lib/mobile-actor';
import { setProcessPublished } from '@/lib/process-runs';
import { processTemplateJson } from '@/lib/processes';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const { actor } = access;
    if (!(await canManageGroup(actor))) {
      return NextResponse.json({ error: 'Personnel can publish a process' }, { status: 403 });
    }
    const body = await request.json().catch(() => ({}));
    const result = await setProcessPublished({
      id: params.id,
      constructionGroupId: actor.constructionGroupId,
      publish: body.publish !== false,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(processTemplateJson(result.template));
  } catch (error) {
    console.error('Mobile publish process error:', error);
    return NextResponse.json({ error: 'Could not publish the process' }, { status: 500 });
  }
}
