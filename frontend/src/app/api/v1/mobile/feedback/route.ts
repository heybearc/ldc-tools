import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMobileActor } from '@/lib/mobile-actor';

const TYPES = new Set(['BUG', 'ENHANCEMENT', 'FEATURE']);
const PRIORITIES = new Set(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export async function GET(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const rows = await prisma.feedback.findMany({
      where: { submittedBy: access.actor.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        feedbackNumber: true,
        type: true,
        title: true,
        description: true,
        priority: true,
        status: true,
        resolutionComment: true,
        createdAt: true,
      },
    });
    return NextResponse.json({
      feedback: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Mobile feedback list error:', error);
    return NextResponse.json({ error: 'Could not load your feedback' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireMobileActor(request);
    if ('error' in access) return access.error;
    const body = await request.json().catch(() => ({}));
    const type = String(body.type || '').toUpperCase();
    const title = String(body.title || '').trim();
    const description = String(body.description || '').trim();
    const priority = String(body.priority || 'MEDIUM').toUpperCase();
    if (!TYPES.has(type) || !title || !description) {
      return NextResponse.json({ error: 'Type, title, and description are required' }, { status: 400 });
    }
    if (!PRIORITIES.has(priority)) {
      return NextResponse.json({ error: 'Choose a priority' }, { status: 400 });
    }

    let created = null;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const last = await prisma.feedback.findFirst({
        orderBy: { feedbackNumber: 'desc' },
        select: { feedbackNumber: true },
      });
      const match = last?.feedbackNumber?.match(/^FB-(\d+)$/);
      const feedbackNumber = `FB-${String((match ? parseInt(match[1], 10) : 0) + 1).padStart(3, '0')}`;
      try {
        created = await prisma.feedback.create({
          data: {
            feedbackNumber,
            type: type as 'BUG',
            title,
            description,
            priority: priority as 'MEDIUM',
            submittedBy: access.actor.id,
          },
          select: { id: true, feedbackNumber: true },
        });
        break;
      } catch (error) {
        const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: string }).code) : '';
        if (code !== 'P2002') throw error;
      }
    }
    if (!created) return NextResponse.json({ error: 'Could not save that feedback' }, { status: 500 });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Mobile feedback submit error:', error);
    return NextResponse.json({ error: 'Could not save that feedback' }, { status: 500 });
  }
}
