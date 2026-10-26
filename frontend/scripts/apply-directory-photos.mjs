#!/usr/bin/env node
/**
 * Point User.image at cropped directory headshots.
 * Usage: node scripts/apply-directory-photos.mjs ./manifest.json
 * Manifest: [{ email, file, firstName?, lastName? }]
 * Photos must already be on disk under DIRECTORY_PHOTOS_DIR.
 */
import { readFileSync } from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const manifest = JSON.parse(readFileSync(process.argv[2], 'utf8'));

async function main() {
  let updated = 0;
  const missing = [];
  for (const row of manifest) {
    const image = `/api/v1/directory-photos/${row.file}`;
    let user = null;
    if (row.email) {
      user = await prisma.user.findUnique({ where: { email: row.email.toLowerCase() } });
    }
    if (!user && row.firstName && row.lastName) {
      user = await prisma.user.findFirst({
        where: {
          firstName: { equals: row.firstName, mode: 'insensitive' },
          lastName: { equals: row.lastName, mode: 'insensitive' },
        },
      });
    }
    if (!user) {
      missing.push(row.email || `${row.firstName} ${row.lastName}`);
      continue;
    }
    await prisma.user.update({ where: { id: user.id }, data: { image } });
    updated++;
  }
  console.log(JSON.stringify({ updated, missing }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
