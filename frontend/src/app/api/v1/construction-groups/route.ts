import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all construction groups
    const constructionGroups = await prisma.constructionGroup.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        region: true,
        isActive: true,
      },
      orderBy: {
        code: 'asc',
      },
    });

    const scope = await getCGScope();

    return NextResponse.json({
      success: true,
      constructionGroups: constructionGroups,
      data: constructionGroups,
      effectiveConstructionGroupId: scope?.constructionGroupId ?? null,
      viewingAll: Boolean(scope?.canViewAllBranches && !scope?.constructionGroupId),
    });
  } catch (error) {
    console.error('Failed to fetch construction groups:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch construction groups',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
