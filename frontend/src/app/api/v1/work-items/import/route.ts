import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import * as XLSX from 'xlsx';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { getCGScope } from '@/lib/cg-scope';
import { canPostWork } from '@/lib/work-item-access';
import { parseCrewRequestRows } from '@/lib/crew-request-import';

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scope = await getCGScope();
    if (!scope?.constructionGroupId) {
      return NextResponse.json({ error: 'No construction group assigned' }, { status: 403 });
    }
    const constructionGroupId = scope.constructionGroupId;

    if (!(await canPostWork(session.user.id, scope))) {
      return NextResponse.json({ error: 'Personnel can import crew requests' }, { status: 403 });
    }

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Choose a spreadsheet' }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Spreadsheet must be 10MB or smaller' }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      return NextResponse.json({ error: 'Use an Excel or CSV spreadsheet' }, { status: 400 });
    }

    let records: Record<string, unknown>[];
    try {
      const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) {
        return NextResponse.json({ error: 'The spreadsheet has no responses' }, { status: 400 });
      }
      records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });
    } catch (error) {
      console.error('Read crew request spreadsheet error:', error);
      return NextResponse.json({ error: 'Could not read that spreadsheet' }, { status: 400 });
    }

    const parsed = parseCrewRequestRows(records);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const keys = parsed.rows.map((row) => row.importKey).filter((key): key is string => Boolean(key));
    const existing = keys.length
      ? await prisma.workItem.findMany({
          where: {
            constructionGroupId,
            importKey: { in: keys },
          },
          select: { importKey: true },
        })
      : [];
    const existingKeys = new Set(existing.map((item) => item.importKey));
    const fresh = parsed.rows.filter((row) => !row.importKey || !existingKeys.has(row.importKey));

    if (fresh.length > 0) {
      await prisma.workItem.createMany({
        data: fresh.map((row) => ({
          constructionGroupId,
          title: row.title,
          detail: row.detail,
          timingKind: 'CREW_REQUEST',
          claimable: true,
          status: 'OPEN',
          requestorName: row.requestorName,
          requestorEmail: row.requestorEmail,
          importKey: row.importKey,
          createdById: session.user.id,
        })),
      });
    }

    return NextResponse.json({
      created: fresh.length,
      skipped: parsed.skipped + (parsed.rows.length - fresh.length),
    });
  } catch (error) {
    console.error('Import crew requests error:', error);
    return NextResponse.json({ error: 'Failed to import crew requests' }, { status: 500 });
  }
}
