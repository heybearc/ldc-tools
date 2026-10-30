import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getCGScope } from '@/lib/cg-scope';
import { getUserOrgRoles, checkPermission } from '@/lib/api-permissions';
import { canManageProjects } from '@/lib/permissions';
import { canPostWork } from '@/lib/work-item-access';
import { canAssignProjectPersonnel } from '@/lib/project-personnel';

// GET /api/v1/projects - List all projects (CG scoped)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {
      isActive: true,
    };

    // Apply CG scoping
    const cgScope = await getCGScope();
    if (cgScope?.constructionGroupId) {
      where.constructionGroupId = cgScope.constructionGroupId;
    } else if (cgScope?.constructionGroupIds) {
      where.constructionGroupId = { in: cgScope.constructionGroupIds };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { projectNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        constructionGroup: true,
        crewAssignments: {
          where: { isActive: true },
          include: {
            crew: {
              include: {
                tradeTeam: true,
              },
            },
          },
        },
        _count: {
          select: {
            crewAssignments: { where: { isActive: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

// POST /api/v1/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cgScope = await getCGScope();
    const userOrgRoles = await getUserOrgRoles(session);
    const inGroup = Boolean(session.user.id && cgScope?.constructionGroupId);
    const allowed =
      canManageProjects(session, userOrgRoles) ||
      (inGroup &&
        ((await canPostWork(session.user.id, cgScope!)) ||
          (await canAssignProjectPersonnel(session.user.id, cgScope!))));
    const permissionError = checkPermission(allowed);
    if (permissionError) return permissionError;

    const body = await request.json();
    const { 
      name, 
      description, 
      projectNumber,
      location,
      projectType,
      currentPhase,
      status, 
      startDate, 
      endDate, 
      jwSharepointUrl,
      builderAssistantUrl,
      constructionGroupId 
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    const cgId = cgScope?.constructionGroupId || (canManageProjects(session, userOrgRoles) ? constructionGroupId : null);
    
    if (!cgId) {
      return NextResponse.json({ error: 'Construction Group is required' }, { status: 400 });
    }

    // Get the CG to find its region
    const cg = await prisma.constructionGroup.findUnique({
      where: { id: cgId },
      include: { region: true },
    });

    const project = await prisma.project.create({
      data: {
        name,
        description,
        projectNumber,
        location,
        projectType,
        currentPhase,
        status: status || 'PLANNING',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        jwSharepointUrl,
        builderAssistantUrl,
        constructionGroupId: cgId,
        regionId: cg?.region?.id || cg?.regionId || 'default',
      },
      include: {
        constructionGroup: true,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
