import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { isAdmin } from '@/lib/auth-helpers';
import { sendAccountInvitation } from '@/lib/account-invitation';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unable to determine who is sending the invitation.' },
        { status: 500 }
      );
    }

    const result = await sendAccountInvitation(params.id, session.user.id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      message: 'Invitation sent successfully',
      user: { id: params.id, email: result.email },
    });
  } catch (error) {
    console.error('Resend invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
