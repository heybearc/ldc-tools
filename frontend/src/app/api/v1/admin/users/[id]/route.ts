import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { isAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { logUpdate, logDelete } from '@/lib/audit';

// PATCH /api/v1/admin/users/[id] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { name, email, role, constructionGroupId, adminLevel, status, password } = body;
    
    // Get current user data for audit log
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { name: true, email: true, role: true, constructionGroupId: true, adminLevel: true, status: true, emailVerified: true, volunteerId: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Build update data from the fields that were sent
    const updateData: any = {};
    let nextFirst = '';
    let nextLast = '';
    if (typeof name === 'string') {
      const parts = name.trim().split(/\s+/).filter(Boolean);
      nextFirst = parts[0] || '';
      nextLast = parts.slice(1).join(' ');
      updateData.name = `${nextFirst} ${nextLast}`.trim();
      updateData.firstName = nextFirst;
      updateData.lastName = nextLast;
    }
    if (typeof email === 'string' && email.trim()) {
      updateData.email = email.trim().toLowerCase();
    }
    if (role) updateData.role = role;
    if (constructionGroupId !== undefined) {
      updateData.constructionGroupId = constructionGroupId === '' ? null : constructionGroupId;
    }
    if (adminLevel !== undefined) {
      updateData.adminLevel = adminLevel === '' ? null : adminLevel;
    }
    if (status) updateData.status = status;

    // Handle password change if provided
    if (password) {
      const bcrypt = require('bcryptjs');
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }
    
    // If status is being changed to ACTIVE and user is not yet verified,
    // set emailVerified to activate them
    if (status === 'ACTIVE' && !currentUser?.emailVerified) {
      updateData.emailVerified = new Date();
    }
    
    // If status is being changed to INVITED, clear emailVerified
    if (status === 'INVITED') {
      updateData.emailVerified = null;
    }
    
    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id: params.id },
        data: updateData,
      });
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as { code?: string }).code === 'P2002') {
        return NextResponse.json({ error: 'That email belongs to someone else' }, { status: 409 });
      }
      throw error;
    }

    if (status === 'INACTIVE') {
      await prisma.userInvitation.updateMany({
        where: {
          email: { equals: currentUser.email, mode: 'insensitive' },
          status: { in: ['PENDING', 'SENT'] },
        },
        data: { status: 'CANCELLED', expiresAt: new Date() },
      });
    }
    
    // Sync volunteer data if user is linked to a volunteer
    try {
      if (updatedUser.volunteerId) {
        const volunteerData: any = {};
        
        if (typeof name === 'string') {
          volunteerData.firstName = nextFirst;
          volunteerData.lastName = nextLast;
        }
        
        if (typeof email === 'string' && email.trim() && email.trim().toLowerCase() !== currentUser.email) {
          volunteerData.emailPersonal = email.trim().toLowerCase();
        }
        
        // Update volunteer if we have changes
        if (Object.keys(volunteerData).length > 0) {
          await (prisma as any).volunteer?.update({
            where: { id: updatedUser.volunteerId },
            data: volunteerData
          }).catch((err: any) => {
            console.log('Volunteer sync skipped (table may not exist yet):', err.message);
          });
        }
      }
    } catch (volunteerSyncError) {
      // Non-critical error - volunteer sync can fail if schema not fully deployed
      console.log('Volunteer sync skipped:', volunteerSyncError);
    }
    
    // Log the update to audit trail
    await logUpdate(
      session?.user?.id || null,
      'USER',
      params.id,
      { name: currentUser?.name, email: currentUser?.email, role: currentUser?.role, adminLevel: currentUser?.adminLevel, status: currentUser?.status },
      { name, email, role, adminLevel, status }
    );
    
    return NextResponse.json({
      success: true,
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/admin/users/[id] - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
    
    // Get user data for audit log before deletion
    const userToDelete = await prisma.user.findUnique({
      where: { id: params.id },
      select: { name: true, email: true, role: true, status: true }
    });
    
    // Delete user
    await prisma.user.delete({
      where: { id: params.id }
    });
    
    // Log the deletion to audit trail
    await logDelete(
      session?.user?.id || null,
      'USER',
      params.id,
      { name: userToDelete?.name, email: userToDelete?.email, role: userToDelete?.role, status: userToDelete?.status }
    );
    
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
