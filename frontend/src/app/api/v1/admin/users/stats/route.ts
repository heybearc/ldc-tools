import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { isAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { personnelAccountWhere } from '@/lib/personnel-accounts';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    const cgScope = await getCGScope();
    const personnel = personnelAccountWhere(cgScope?.regionId || null);

    const totalUsers = await prisma.user.count({ where: personnel });

    const activeUsers = await prisma.user.count({
      where: { AND: [personnel, { emailVerified: { not: null } }] },
    });

    const invitedUsers = await prisma.user.count({
      where: { AND: [personnel, { emailVerified: null }] },
    });
    
    const stats = {
      total: totalUsers,
      active: activeUsers,
      invited: invitedUsers,
      inactive: 0 // We don't have an inactive status in the schema
    };
    
    return NextResponse.json({
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Admin user stats API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user stats',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
