import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { readFile } from 'fs/promises';
import path from 'path';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/prisma';
import { closedMobileAccount, readMobileToken } from '@/lib/mobile-session';

const PHOTO_DIR = process.env.DIRECTORY_PHOTOS_DIR || '/var/lib/ldc-tools/directory-photos';

export async function GET(
  _request: NextRequest,
  { params }: { params: { file: string } }
) {
  const session = await getServerSession(authOptions);
  const mobile = readMobileToken(_request.headers.get('authorization'));
  if (!session?.user && !mobile) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
  if (!session?.user && mobile) {
    const user = await prisma.user.findUnique({
      where: { id: mobile.id },
      select: { status: true, constructionGroupId: true },
    });
    if (!user || closedMobileAccount(user.status) || !user.constructionGroupId) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  const file = params.file || '';
  if (!/^[a-zA-Z0-9._-]+$/.test(file)) {
    return new NextResponse('Bad request', { status: 400 });
  }

  const full = path.resolve(PHOTO_DIR, file);
  if (!full.startsWith(path.resolve(PHOTO_DIR) + path.sep)) {
    return new NextResponse('Bad request', { status: 400 });
  }

  try {
    const buf = await readFile(full);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }
}
