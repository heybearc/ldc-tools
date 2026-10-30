import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { cookies } from 'next/headers';
import { logCGFilterChange } from '@/lib/audit-logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const cookieStore = await cookies();
    const value = cookieStore.get('cg_filter')?.value || null;
    return NextResponse.json({
      constructionGroupId: value && value !== 'all' ? value : null,
      viewingAll: value === 'all',
    });
  } catch (error) {
    console.error('Failed to read CG filter:', error);
    return NextResponse.json({ error: 'Failed to read CG filter' }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only SUPER_ADMIN can set CG filter
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Only SUPER_ADMIN can filter by CG' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { constructionGroupId } = body;

    // Get current filter for audit log
    const cookieStore = await cookies();
    const currentFilter = cookieStore.get('cg_filter')?.value || null;

    // "all" is explicit. A missing cookie means the user's own construction group.
    const nextFilter = constructionGroupId && constructionGroupId !== 'all' ? constructionGroupId : 'all';
    cookieStore.set('cg_filter', nextFilter, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Log the CG filter change
    if (session.user.id) {
      await logCGFilterChange(
        session.user.id,
        currentFilter,
        constructionGroupId || null,
        request
      );
    }

    return NextResponse.json({
      success: true,
      message: constructionGroupId 
        ? 'CG filter set successfully' 
        : 'CG filter cleared - showing all CGs',
    });
  } catch (error) {
    console.error('Failed to set CG filter:', error);
    return NextResponse.json(
      {
        error: 'Failed to set CG filter',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
