import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { isAdmin } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!isAdmin(session)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const feedback = await prisma.feedback.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
            role: true
          }
        },
        attachments: true,
        comments: {
          include: {
            author: {
              select: {
                firstName: true,
                lastName: true,
                name: true,
                role: true
              }
            },
            attachments: true
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const transformedFeedback = feedback.map(item => ({
      id: item.id,
      feedbackNumber: item.feedbackNumber,
      type: item.type.toLowerCase(),
      title: item.title,
      description: item.description,
      priority: item.priority.toLowerCase(),
      status: item.status.toLowerCase(),
      submittedBy: {
        name: item.user?.name || `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.trim() || 'Unknown',
        email: item.user?.email || '',
        role: item.user?.role || ''
      },
      submittedAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      comments: item.comments.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        author: comment.author.name || `${comment.author.firstName || ''} ${comment.author.lastName || ''}`.trim() || 'Unknown',
        createdAt: comment.createdAt.toISOString(),
        attachments: comment.attachments?.map((att: any) => ({
          id: att.id,
          filename: att.filename,
          fileData: att.fileData,
          mimeType: att.mimeType
        })) || []
      })),
      attachments: item.attachments.map((attachment: any) => ({
        id: attachment.id,
        filename: attachment.filename,
        fileData: attachment.fileData,
        mimeType: attachment.mimeType
      }))
    }));

    const stats = {
      total: transformedFeedback.length,
      new: transformedFeedback.filter(f => f.status === 'new').length,
      inProgress: transformedFeedback.filter(f => f.status === 'in_progress').length,
      resolved: transformedFeedback.filter(f => f.status === 'resolved').length
    };

    return NextResponse.json({
      success: true,
      data: { feedback: transformedFeedback, stats }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch feedback' }, { status: 500 });
  }
}
