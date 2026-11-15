import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    console.log('My Feedback API - Session email:', session.user.email)
    console.log('My Feedback API - Found user:', user?.id, user?.email)

    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          feedback: [],
          message: 'No feedback found'
        }
      })
    }

    // Fetch user's feedback with comments and attachments
    const feedback = await prisma.feedback.findMany({
      where: {
        submittedBy: user.id
      },
      include: {
        attachments: true,
        comments: {
          include: {
            author: {
              select: {
                name: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform data for frontend
    const transformedFeedback = feedback.map(item => ({
      id: item.id,
      feedbackNumber: item.feedbackNumber,
      type: item.type.toLowerCase(),
      title: item.title,
      description: item.description,
      priority: item.priority.toLowerCase(),
      status: item.status.toLowerCase(),
      submittedAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      comments: (item.comments || []).map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        author: comment.author 
          ? (comment.author.firstName && comment.author.lastName 
              ? `${comment.author.firstName} ${comment.author.lastName}` 
              : comment.author.name || comment.author.firstName || comment.author.lastName || 'User')
          : 'Unknown',
        createdAt: comment.createdAt.toISOString()
      })),
      attachments: (item.attachments || []).map((attachment: any) => ({
        id: attachment.id,
        filename: attachment.filename,
        url: attachment.filePath,
        size: attachment.fileSize
      }))
    }))

    return NextResponse.json({
      success: true,
      data: {
        feedback: transformedFeedback,
        total: transformedFeedback.length
      }
    })
  } catch (error) {
    console.error('Error fetching user feedback:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}
