import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getCGScope, withCGFilter } from '@/lib/cg-scope';
import { getUserOrgRoles, checkPermission } from '@/lib/api-permissions';
import { canManageVolunteers } from '@/lib/permissions';
import { formatPhoneForDisplay, formatPhoneForStorage, validateAndFormatPhone } from '@/lib/phone-utils';

// GET /api/v1/volunteers - List volunteers with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cgScope = await getCGScope();
    if (!cgScope) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const congregation = searchParams.get('congregation') || '';
    const crewId = searchParams.get('crewId') || '';
    const tradeTeamId = searchParams.get('tradeTeamId') || '';
    const servingAs = searchParams.get('servingAs') || '';
    const hasEmail = searchParams.get('hasEmail') || '';
    const hasPhone = searchParams.get('hasPhone') || '';
    const isAssigned = searchParams.get('isAssigned') || '';
    const status = searchParams.get('status') || '';

    const where: any = {
      ...withCGFilter(cgScope),
    };

    // Status filter (active/inactive/all)
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }
    // If status is 'all' or empty, don't filter by isActive

    // Multi-field search
    if (search) {
      const searchTerm = search.trim();
      
      // For multi-word searches, search for the first word to get broader results
      // Then filter by full name match on the client side
      const searchWords = searchTerm.split(/\s+/);
      const firstWord = searchWords[0];
      
      where.OR = [
        { firstName: { contains: firstWord, mode: 'insensitive' } },
        { lastName: { contains: firstWord, mode: 'insensitive' } },
        { baId: { contains: searchTerm, mode: 'insensitive' } },
        { congregation: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
        { emailPersonal: { contains: searchTerm, mode: 'insensitive' } },
        { emailJw: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (role) {
      where.role = role;
    }

    // Congregation filter
    if (congregation) {
      where.congregation = congregation;
    }

    // Crew filter
    if (crewId) {
      where.crewId = crewId;
    }

    // Trade team filter
    if (tradeTeamId) {
      where.tradeTeamId = tradeTeamId;
    }

    // Serving as filter (Elder, MS, Pioneer, Publisher)
    if (servingAs) {
      where.servingAs = {
        has: servingAs,
      };
    }

    // Has email filter
    if (hasEmail === 'true') {
      where.OR = where.OR || [];
      where.OR.push(
        { emailPersonal: { not: null } },
        { emailJw: { not: null } }
      );
    } else if (hasEmail === 'false') {
      where.emailPersonal = null;
      where.emailJw = null;
    }

    // Has phone filter
    if (hasPhone === 'true') {
      where.phone = { not: null };
    } else if (hasPhone === 'false') {
      where.phone = null;
    }

    // Assignment filter
    if (isAssigned === 'true') {
      where.OR = where.OR || [];
      where.OR.push(
        { crewId: { not: null } },
        { tradeTeamId: { not: null } }
      );
    } else if (isAssigned === 'false') {
      where.crewId = null;
      where.tradeTeamId = null;
    }

    let volunteers = await prisma.volunteer.findMany({
      where,
      include: {
        crew: {
          include: {
            tradeTeam: true,
          },
        },
        tradeTeam: true,
        user: {
          select: { id: true, email: true, name: true },
        },
        roles: {
          where: { isActive: true },
          orderBy: [{ isPrimary: 'desc' }, { startDate: 'desc' }],
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    // For multi-word searches, filter by full name match
    if (search && search.trim().includes(' ')) {
      const searchTerm = search.trim().toLowerCase();
      
      // Filter to only show volunteers where the full name contains the search term
      volunteers = volunteers.filter(v => {
        const fullName = `${v.firstName} ${v.lastName}`.toLowerCase();
        return fullName.includes(searchTerm);
      });
    }

    // Transform to match expected frontend format
    const transformed = volunteers.map(v => ({
      id: v.id,
      first_name: v.firstName,
      last_name: v.lastName,
      ba_id: v.baId,
      role: v.role,
      phone: formatPhoneForDisplay(v.phone) || null,
      email_personal: v.emailPersonal,
      email_jw: v.emailJw,
      email_personal_verified: v.emailPersonalVerified,
      email_jw_verified: v.emailJwVerified,
      email_personal_bounced: v.emailPersonalBounced,
      email_jw_bounced: v.emailJwBounced,
      last_email_verified: v.lastEmailVerified?.toISOString() || null,
      emergency_contact_name: v.emergencyContactName,
      emergency_contact_phone: formatPhoneForDisplay(v.emergencyContactPhone) || null,
      emergency_contact_relationship: v.emergencyContactRelationship,
      congregation: v.congregation,
      serving_as: v.servingAs,
      is_overseer: v.isOverseer,
      is_assistant: v.isAssistant,
      is_active: v.isActive,
      trade_crew_id: v.crewId,
      trade_crew_name: v.crew?.name,
      trade_team_id: v.tradeTeamId,
      trade_team_name: v.tradeTeam?.name || v.crew?.tradeTeam?.name,
      user_id: v.user?.id || null,
      has_user_account: !!v.user,
      roles: v.roles?.map(r => ({
        id: r.id,
        roleCategory: r.roleCategory,
        roleName: r.roleName,
        roleCode: r.roleCode,
        entityId: r.entityId,
        entityType: r.entityType,
        tradeTeamId: r.tradeTeamId,
        crewId: r.crewId,
        isPrimary: r.isPrimary,
        isActive: r.isActive,
        startDate: r.startDate.toISOString(),
        endDate: r.endDate?.toISOString() || null,
      })) || [],
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    return NextResponse.json({ error: 'Failed to fetch volunteers' }, { status: 500 });
  }
}

// POST /api/v1/volunteers - Create a new volunteer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions - requires management role or admin
    const userOrgRoles = await getUserOrgRoles(session);
    const permissionError = checkPermission(canManageVolunteers(session, userOrgRoles));
    if (permissionError) return permissionError;

    const cgScope = await getCGScope();
    const body = await request.json();

    // Validate and format phone number if provided
    let formattedPhone = body.phone || null;
    if (body.phone) {
      const phoneValidation = validateAndFormatPhone(body.phone);
      if (!phoneValidation.isValid) {
        return NextResponse.json(
          { error: `Invalid phone number: ${phoneValidation.error}` },
          { status: 400 }
        );
      }
      formattedPhone = formatPhoneForStorage(body.phone);
    }

    const volunteer = await prisma.volunteer.create({
      data: {
        firstName: body.first_name,
        lastName: body.last_name,
        baId: body.ba_id || null,
        phone: formattedPhone,
        emailPersonal: body.email_personal || null,
        emailJw: body.email_jw || null,
        congregation: body.congregation || null,
        servingAs: body.serving_as || [],
        crewId: body.trade_crew_id || null,
        tradeTeamId: body.trade_team_id || null,
        constructionGroupId: cgScope.constructionGroupId,
      },
      include: {
        crew: {
          include: {
            tradeTeam: true,
          },
        },
        tradeTeam: true,
      },
    });

    return NextResponse.json({
      id: volunteer.id,
      first_name: volunteer.firstName,
      last_name: volunteer.lastName,
      ba_id: volunteer.baId,
      phone: volunteer.phone,
      email_personal: volunteer.emailPersonal,
      email_jw: volunteer.emailJw,
      congregation: volunteer.congregation,
      serving_as: volunteer.servingAs,
      is_active: volunteer.isActive,
      trade_crew_id: volunteer.crewId,
      trade_crew_name: volunteer.crew?.name,
      trade_team_id: volunteer.tradeTeamId,
      trade_team_name: volunteer.tradeTeam?.name || volunteer.crew?.tradeTeam?.name,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating volunteer:', error);
    return NextResponse.json({ error: 'Failed to create volunteer' }, { status: 500 });
  }
}
