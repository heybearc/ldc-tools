import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { isAdmin } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { notifyGroupPhones } from '@/lib/expo-push';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
  type: z.enum(['INFO', 'WARNING', 'URGENT']).default('INFO'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  constructionGroupId: z.string().optional().nullable(),
  targetRoles: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

// GET /api/v1/admin/announcements - Get all announcements (admin view)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const announcements = await prisma.announcement.findMany({
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
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: announcements
    });

  } catch (error) {
    console.error('Get announcements error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

// POST /api/v1/admin/announcements - Create announcement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user!.email! },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validation = createAnnouncementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.error.errors
      }, { status: 400 });
    }

    const data = validation.data;

    const announcement = await prisma.announcement.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        constructionGroupId: data.constructionGroupId || null,
        targetRoles: data.targetRoles,
        isActive: data.isActive,
        createdBy: user.id,
      },
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

    if (announcement.constructionGroupId) {
      notifyGroupPhones({
        constructionGroupId: announcement.constructionGroupId,
        excludeUserId: user.id,
        title: announcement.title,
        body: announcement.message,
      }).catch((error) => console.error('Announcement push failed:', error));
    }

    return NextResponse.json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Create announcement error:', error);
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    );
  }
}
