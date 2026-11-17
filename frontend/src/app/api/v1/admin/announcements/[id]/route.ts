import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { isAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { announcementLinkSchema } from '@/lib/announcement-link';

export const dynamic = 'force-dynamic';

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(2000).optional(),
  type: z.enum(['INFO', 'WARNING', 'URGENT']).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  constructionGroupId: z.string().optional().nullable(),
  targetRoles: z.array(z.string()).optional(),
  linkUrl: announcementLinkSchema,
  isActive: z.boolean().optional(),
});

// PATCH /api/v1/admin/announcements/[id] - Update announcement
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateAnnouncementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors
      }, { status: 400 });
    }

    const data = validation.data;
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.message !== undefined) updateData.message = data.message;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }
    if (data.constructionGroupId !== undefined) {
      updateData.constructionGroupId = data.constructionGroupId;
    }
    updateData.targetRoles = [];
    if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const announcement = await prisma.announcement.update({
      where: { id: params.id },
      data: updateData,
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        },
        constructionGroup: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: announcement,
      message: 'Announcement updated successfully'
    });

  } catch (error) {
    console.error('Update announcement error:', error);
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/admin/announcements/[id] - Delete announcement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.announcement.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Announcement deleted successfully'
    });

  } catch (error) {
    console.error('Delete announcement error:', error);
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}
