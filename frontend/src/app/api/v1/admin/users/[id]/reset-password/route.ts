import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { isAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetLink } from '@/lib/password-reset';

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

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        status: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const sent = await sendPasswordResetLink(user, 24);
    if (!sent) {
      return NextResponse.json(
        { error: 'Email configuration not found' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Password reset email sent successfully',
      email: user.email
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Failed to send password reset email', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
