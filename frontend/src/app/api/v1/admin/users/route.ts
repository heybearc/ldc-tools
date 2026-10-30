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

    // Get CG scope for data filtering
    const cgScope = await getCGScope();
    
    // Get query parameters for filtering
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    
    // Personnel team for the signed-in region. Other directory contacts are not accounts to manage here.
    const where: any = {
      AND: [personnelAccountWhere(cgScope?.regionId || null)],
    };

    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (role) {
      where.AND.push({ role });
    }
    
    // Fetch users from database with CG scope
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminLevel: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        lastLogin: true,
        volunteerId: true,
        constructionGroupId: true,
        volunteer: {
          select: {
            constructionGroup: {
              select: {
                id: true,
                code: true,
                name: true,
                region: {
                  select: {
                    code: true,
                    name: true,
                    zone: {
                      select: {
                        code: true,
                        name: true,
                      }
                    }
                  }
                }
              }
            }
          }
        },
        constructionGroup: {
          select: {
            id: true,
            code: true,
            name: true,
            region: {
              select: {
                code: true,
                name: true,
                zone: {
                  select: {
                    code: true,
                    name: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transform users to match expected format
    // Compute display status based on emailVerified to match stats logic
    const transformedUsers = users.map(user => {
      // Determine status: if emailVerified is null, user is "INVITED"
      // Otherwise use the database status or default to ACTIVE
      let displayStatus: 'ACTIVE' | 'INVITED' | 'INACTIVE' = 'ACTIVE';
      if (user.status === 'INACTIVE' || user.status === 'SUSPENDED') {
        displayStatus = 'INACTIVE';
      } else if (!user.emailVerified || user.status === 'INVITED') {
        displayStatus = 'INVITED';
      }
      
      // Derive CG from volunteer or direct assignment
      const effectiveCG = user.volunteer?.constructionGroup || user.constructionGroup;
      
      return {
        id: user.id,
        name: user.name || '',
        email: user.email,
        role: user.role || 'READ_ONLY',
        adminLevel: user.adminLevel || undefined,
        status: displayStatus,
        regionId: effectiveCG?.region?.code || '',
        zoneId: effectiveCG?.region?.zone?.code || '',
        volunteerId: user.volunteerId || null,
        lastLogin: user.lastLogin?.toISOString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        emailVerified: user.emailVerified?.toISOString() || null,
        constructionGroupId: effectiveCG?.id || null,
        constructionGroup: effectiveCG || null,
      };
    });
    
    return NextResponse.json({
      users: transformedUsers,
      total: transformedUsers.length,
      // Include scope info for UI
      scope: cgScope ? {
        constructionGroupId: cgScope.constructionGroupId,
        canViewAllBranches: cgScope.canViewAllBranches,
        canViewZoneRegions: cgScope.canViewZoneRegions,
      } : null,
    });
    
  } catch (error) {
    console.error('Admin users API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, volunteerId } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // If volunteerId provided, verify it exists and get CG from volunteer
    let constructionGroupId = null;
    if (volunteerId) {
      const volunteer = await prisma.volunteer.findUnique({
        where: { id: volunteerId },
        select: { constructionGroupId: true }
      });
      
      if (!volunteer) {
        return NextResponse.json(
          { error: 'Volunteer not found' },
          { status: 404 }
        );
      }
      
      constructionGroupId = volunteer.constructionGroupId;
    } else {
      // For break-glass SUPER_ADMIN accounts without a volunteer,
      // use the creating admin's CG scope
      const cgScope = await getCGScope();
      constructionGroupId = cgScope?.constructionGroupId || null;
    }

    // Hash the password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role,
        status: 'ACTIVE',
        volunteerId: volunteerId || null,
        constructionGroupId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        volunteerId: true,
        constructionGroupId: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        volunteerId: newUser.volunteerId,
        constructionGroupId: newUser.constructionGroupId,
        createdAt: newUser.createdAt.toISOString(),
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
