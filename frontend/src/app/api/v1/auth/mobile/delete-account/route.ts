import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileActor } from '@/lib/mobile-actor';
import { notifyAdmins } from '@/lib/admin-notice';

export async function POST(request: NextRequest) {
  try {
    const actorResult = await requireMobileActor(request);
    if ('error' in actorResult) return actorResult.error;
    const { actor } = actorResult;

    await prisma.session.deleteMany({ where: { userId: actor.id } });
    await prisma.user.update({
      where: { id: actor.id },
      data: { status: 'INACTIVE', passwordHash: null },
    });
    await notifyAdmins({
      action: 'ACCOUNT_DELETE',
      resource: 'user',
      resourceId: actor.id,
      userId: actor.id,
      subject: 'LDC Tools account deleted',
      text: `${actor.name || actor.email} (${actor.email}) deleted their LDC Tools sign-in from the mobile app.`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mobile delete account error:', error);
    return NextResponse.json({ error: 'Could not delete the account. Try again in a moment.' }, { status: 500 });
  }
}
