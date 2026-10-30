import { NextRequest, NextResponse } from 'next/server';
import { canEmailAddress } from '@/lib/reachable-email';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope, withCGFilter } from '@/lib/cg-scope';

// GET - List all crew change requests (for personnel team)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cgScope = await getCGScope();
    if (!cgScope) {
      return NextResponse.json({ error: 'Unable to determine CG scope' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assignedToMe = searchParams.get('assigned_to_me') === 'true';
    const myRequests = searchParams.get('my_requests') === 'true';

    const where: any = {
      ...withCGFilter(cgScope),
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Filter to requests assigned to current user
    if (assignedToMe) {
      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });
      
      if (currentUser) {
        where.assignedToId = currentUser.id;
      }
    }

    // Filter to requests submitted by current user (as requestor)
    if (myRequests) {
      where.requestorEmail = session.user.email;
    }

    const requests = await prisma.crewChangeRequest.findMany({
      where,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true }
        },
        completedBy: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(requests.map(r => ({
      id: r.id,
      request_type: r.requestType,
      requestor_name: r.requestorName,
      requestor_email: r.requestorEmail,
      notify_requestor: r.notifyRequestor,
      volunteer_name: r.volunteerName,
      volunteer_ba_id: r.volunteerBaId,
      trade_team_id: r.tradeTeamId,
      crew_id: r.crewId,
      crew_name: r.crewName,
      project_id: r.projectId,
      project_roster_name: r.projectRosterName,
      comments: r.comments,
      status: r.status,
      assigned_to: r.assignedTo ? {
        id: r.assignedTo.id,
        name: r.assignedTo.name,
        email: r.assignedTo.email
      } : null,
      resolution_notes: r.resolutionNotes,
      completed_at: r.completedAt?.toISOString() || null,
      completed_by: r.completedBy ? {
        id: r.completedBy.id,
        name: r.completedBy.name
      } : null,
      created_at: r.createdAt.toISOString(),
      updated_at: r.updatedAt.toISOString(),
    })));
  } catch (error) {
    console.error('Get crew requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

// POST - Submit a new crew change request (requires authentication)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    const cgScope = await getCGScope();
    if (!cgScope || !cgScope.constructionGroupId) {
      return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      request_type,
      volunteer_name,
      volunteer_ba_id,
      trade_team_id,
      crew_id,
      crew_name,
      project_id,
      project_roster_name,
      comments,
      override_requestor_name: rawRequestorName,
      override_requestor_email: rawRequestorEmail,
      batch_id,
    } = body;
    
    // Trim whitespace from override fields (handles copy-paste from spreadsheets)
    const override_requestor_name = rawRequestorName?.trim() || null;
    const override_requestor_email = rawRequestorEmail?.trim() || null;

    // Validation
    if (!request_type || !volunteer_name) {
      return NextResponse.json(
        { error: 'Request type and volunteer name are required' },
        { status: 400 }
      );
    }

    // Check if user can submit on behalf of others (Personnel Contact organizational roles + SUPER_ADMIN)
    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { 
        role: true,
        volunteerId: true
      }
    });

    // Check for SUPER_ADMIN system role OR Personnel Contact organizational role
    let canSubmitOnBehalfOf = userRecord?.role === 'SUPER_ADMIN';
    
    if (!canSubmitOnBehalfOf && userRecord?.volunteerId) {
      const personnelRoles = await prisma.volunteerRole.findFirst({
        where: {
          volunteerId: userRecord.volunteerId,
          roleCode: { in: ['PC', 'PCA', 'PC-Support'] },
          endDate: null
        }
      });
      canSubmitOnBehalfOf = !!personnelRoles;
    }
    
    const hasOverride = override_requestor_name && override_requestor_email;

    // Use override if provided by authorized user, otherwise use session user
    const requestorName = (canSubmitOnBehalfOf && hasOverride) 
      ? override_requestor_name 
      : (user.name || session.user.email || 'Unknown');
    const requestorEmail = (canSubmitOnBehalfOf && hasOverride)
      ? override_requestor_email
      : session.user.email;

    const newRequest = await prisma.crewChangeRequest.create({
      data: {
        requestType: request_type,
        requestorName,
        requestorEmail,
        notifyRequestor: canEmailAddress(requestorEmail),
        volunteerName: volunteer_name,
        volunteerBaId: volunteer_ba_id || null,
        tradeTeamId: trade_team_id || null,
        crewId: crew_id || null,
        crewName: crew_name || null,
        projectId: project_id || null,
        projectRosterName: project_roster_name || null,
        comments: comments || null,
        batchId: batch_id || null,
        status: 'NEW',
        constructionGroupId: cgScope.constructionGroupId,
      }
    });

    // TODO: Send email notification to personnel team

    return NextResponse.json({
      id: newRequest.id,
      message: 'Request submitted successfully',
      request_type: newRequest.requestType,
      volunteer_name: newRequest.volunteerName,
      status: newRequest.status,
      created_at: newRequest.createdAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Create crew request error:', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}
