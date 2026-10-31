import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

type MobilePayload = {
  id: string;
  email: string;
  role: string;
  exp: number;
};

function secret() {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error('NEXTAUTH_SECRET is not set');
  return value;
}

export function signMobileToken(user: { id: string; email: string; role: string }) {
  const body = Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000,
  })).toString('base64url');
  const sig = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function readMobileToken(header: string | null): MobilePayload | null {
  const raw = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const [body, sig] = raw.split('.');
  if (!body || !sig) return null;
  const expected = createHmac('sha256', secret()).update(body).digest('base64url');
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as MobilePayload;
    if (!payload.id || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function signInForMobile(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user?.passwordHash || user.status === 'INACTIVE') return null;
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  const updateData: { lastLogin: Date; loginCount: { increment: number }; emailVerified?: Date; status?: 'ACTIVE' } = {
    lastLogin: new Date(),
    loginCount: { increment: 1 },
  };
  if (!user.emailVerified) {
    updateData.emailVerified = new Date();
    updateData.status = 'ACTIVE';
  }
  await prisma.user.update({ where: { id: user.id }, data: updateData });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    token: signMobileToken({ id: user.id, email: user.email, role: user.role }),
  };
}
