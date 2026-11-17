import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getCGScope } from '@/lib/cg-scope';
import { availableWorkCountForUser } from '@/lib/work-available-notify';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const scope = await getCGScope();
    if (!scope?.constructionGroupId) {
      return NextResponse.json({ count: 0 });
    }
    const count = await availableWorkCountForUser(session.user.id, scope.constructionGroupId);
    return NextResponse.json({ count }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Available work count error:', error);
    return NextResponse.json({ error: 'Failed to load available work' }, { status: 500 });
  }
}
