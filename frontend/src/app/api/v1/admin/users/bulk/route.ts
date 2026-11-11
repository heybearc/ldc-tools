import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { isAdmin, resolvePlatformRole } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { adminSignInAccountWhere } from '@/lib/personnel-accounts';
import { sendAccountInvitation } from '@/lib/account-invitation';
import { logUpdate } from '@/lib/audit';

const STATUSES = ['ACTIVE', 'INVITED', 'INACTIVE'] as const;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const body = await request.json();
    const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown) => typeof id === 'string' && id) : [];
    const sendInvitations = body.sendInvitations === true;
    const roleInput = typeof body.role === 'string' ? body.role : '';
    const statusInput = typeof body.status === 'string' ? body.status : '';
    const hasGroup = Object.prototype.hasOwnProperty.call(body, 'constructionGroupId');

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Select at least one account.' }, { status: 400 });
    }
    if (ids.length > 100) {
      return NextResponse.json({ error: 'Select 100 accounts or fewer at a time.' }, { status: 400 });
    }
    if (!roleInput && !statusInput && !hasGroup && !sendInvitations) {
      return NextResponse.json({ error: 'Choose what to change.' }, { status: 400 });
    }

    let access: ReturnType<typeof resolvePlatformRole> = null;
    if (roleInput) {
      access = resolvePlatformRole(roleInput);
      if (!access) {
        return NextResponse.json(
          { error: 'Choose a platform access role: User, Admin, Super Admin, or Read Only.' },
          { status: 400 }
        );
      }
    }
    if (statusInput && !STATUSES.includes(statusInput as (typeof STATUSES)[number])) {
      return NextResponse.json({ error: 'Status must be Active, Invited, or Inactive.' }, { status: 400 });
    }

    const cgScope = await getCGScope();
    const users = await prisma.user.findMany({
      where: { id: { in: ids }, AND: [adminSignInAccountWhere(cgScope)] },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        adminLevel: true,
        status: true,
        emailVerified: true,
        constructionGroupId: true,
      },
    });

    const found = new Set(users.map((user) => user.id));
    const errors: string[] = [];
    const missing = ids.filter((id: string) => !found.has(id)).length;
    if (missing) {
      errors.push(`${missing} selected ${missing === 1 ? 'account is' : 'accounts are'} outside this construction group.`);
    }

    let updated = 0;
    const actorId = session?.user?.id || null;
    const changingAccount = Boolean(roleInput || statusInput);

    for (const user of users) {
      if (changingAccount && actorId && user.id === actorId) {
        errors.push('Your own account was left unchanged.');
        continue;
      }

      const data: Record<string, unknown> = {};
      if (access) {
        data.role = access.role;
        if (access.adminLevel) data.adminLevel = access.adminLevel;
      }
      if (statusInput) {
        data.status = statusInput;
        if (statusInput === 'ACTIVE' && !user.emailVerified) data.emailVerified = new Date();
        if (statusInput === 'INVITED') data.emailVerified = null;
      }
      if (hasGroup) {
        data.constructionGroupId = body.constructionGroupId || null;
      }
      if (Object.keys(data).length === 0) continue;

      await prisma.user.update({ where: { id: user.id }, data });
      updated += 1;
      await logUpdate(
        actorId,
        'USER',
        user.id,
        { role: user.role, status: user.status, constructionGroupId: user.constructionGroupId },
        data
      );
    }

    let invited = 0;
    if (sendInvitations) {
      if (!actorId) {
        return NextResponse.json({ error: 'Unable to determine who is sending the invitations.' }, { status: 500 });
      }
      for (const user of users) {
        if (user.emailVerified) {
          errors.push(`${user.email} already set up their account.`);
          continue;
        }
        const result = await sendAccountInvitation(user.id, actorId);
        if (result.ok) invited += 1;
        else errors.push(`${user.email}: ${result.error}`);
      }
    }

    return NextResponse.json({ updated, invited, errors });
  } catch (error) {
    console.error('Bulk user update error:', error);
    return NextResponse.json(
      { error: 'Failed to update the selected accounts.' },
      { status: 500 }
    );
  }
}
