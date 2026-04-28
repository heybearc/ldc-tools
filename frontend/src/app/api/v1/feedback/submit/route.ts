import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { type, title, description, priority, screenshots = [] } = body;

    if (!type || !title || !description) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: type, title, description' 
      }, { status: 400 });
    }

    const validTypes = ['BUG', 'ENHANCEMENT', 'FEATURE'];
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

    if (!validTypes.includes(type.toUpperCase())) {
      return NextResponse.json({ success: false, error: 'Invalid feedback type' }, { status: 400 });
    }

    if (priority && !validPriorities.includes(priority.toUpperCase())) {
      return NextResponse.json({ success: false, error: 'Invalid priority level' }, { status: 400 });
    }

    let feedback = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const lastFeedback = await prisma.feedback.findFirst({
          orderBy: { feedbackNumber: 'desc' },
          select: { feedbackNumber: true }
        });

        let nextNumber = 1;
        if (lastFeedback?.feedbackNumber) {
          const match = lastFeedback.feedbackNumber.match(/^FB-(\d+)$/);
          if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
          }
        }

        const feedbackNumber = `FB-${String(nextNumber).padStart(3, '0')}`;

        feedback = await prisma.feedback.create({
          data: {
            feedbackNumber,
            type: type.toUpperCase(),
            title: title.trim(),
            description: description.trim(),
            priority: (priority || 'MEDIUM').toUpperCase(),
            submittedBy: user.id,
            attachments: {
              create: screenshots.map((screenshot: string, index: number) => ({
                filename: `screenshot-${index + 1}.png`,
                fileData: screenshot,
                fileSize: screenshot.length,
                mimeType: 'image/png'
              }))
            }
          }
        });

        break;
      } catch (error: any) {
        if (error?.code === 'P2002' && attempt < 4) {
          // Retry when feedbackNumber collides from concurrent submissions.
          continue;
        }
        throw error;
      }
    }

    if (!feedback) {
      throw new Error('Failed to create feedback after retries');
    }

    return NextResponse.json({
      success: true,
      data: { id: feedback.id, message: 'Feedback submitted successfully' }
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit feedback' }, { status: 500 });
  }
}
