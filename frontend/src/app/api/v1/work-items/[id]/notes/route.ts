import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { canAccessCG, getCGScope } from '@/lib/cg-scope';
import { sendWorkHelpEmail } from '@/lib/work-completion-email';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getCGScope();
    if (!scope) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const text = typeof body.body === 'string' ? body.body.trim() : '';
    const kind = body.kind === 'HELP' ? 'HELP' : body.kind === 'NOTE' ? 'NOTE' : null;
    if (!kind) {
      return NextResponse.json({ error: 'Choose a note or a request for help' }, { status: 400 });
    }
    if (!text) {
      return NextResponse.json({ error: 'Write a note' }, { status: 400 });
    }
    if (text.length > 4000) {
      return NextResponse.json({ error: 'That note is too long' }, { status: 400 });
    }

    const item = await prisma.workItem.findUnique({
      where: { id: params.id },
      select: { id: true, constructionGroupId: true, title: true, detail: true },
    });
    if (!item || !canAccessCG(scope, item.constructionGroupId)) {
      return NextResponse.json({ error: 'Work item not found' }, { status: 404 });
    }

    const note = await prisma.workNote.create({
      data: {
        workItemId: item.id,
        authorId: session.user.id,
        kind,
        body: text,
      },
      include: { author: { select: { id: true, name: true, email: true } } },
    });

    let notified = 0;
    if (kind === 'HELP') {
      try {
        const [contacts, volunteers] = await Promise.all([
          prisma.personnelContact.findMany({
            where: {
              constructionGroupId: item.constructionGroupId,
              isActive: true,
              endDate: null,
              role: { in: ['PC', 'PCA', 'PC_SUPPORT'] },
            },
            select: { user: { select: { email: true } } },
          }),
          prisma.volunteerRole.findMany({
            where: {
              isActive: true,
              endDate: null,
              roleCode: { in: ['PC', 'PCA', 'PC-Support', 'PC_SUPPORT'] },
              volunteer: { isActive: true, constructionGroupId: item.constructionGroupId },
            },
            select: { volunteer: { select: { user: { select: { email: true } } } } },
          }),
        ]);
        const emails = new Set<string>();
        for (const contact of contacts) {
          if (contact.user.email) emails.add(contact.user.email);
        }
        for (const role of volunteers) {
          const email = role.volunteer.user?.email;
          if (email) emails.add(email);
        }
        if (session.user.email) emails.delete(session.user.email);
        notified = await sendWorkHelpEmail({
          to: Array.from(emails),
          title: item.title,
          detail: item.detail,
          message: text,
          askedByName: session.user.name || note.author.name || 'Someone',
        });
      } catch (emailError) {
        console.error('Work help email failed:', emailError);
      }
    }

    return NextResponse.json({
      id: note.id,
      kind: note.kind,
      body: note.body,
      createdAt: note.createdAt.toISOString(),
      author: note.author,
      notified,
    }, { status: 201 });
  } catch (error) {
    console.error('Add work note error:', error);
    return NextResponse.json({ error: 'Failed to save the note' }, { status: 500 });
  }
}
