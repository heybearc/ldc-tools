#!/usr/bin/env node
/**
 * Import Trade Leadership Directory rows into Users + TradeTeam/TradeCrew oversight.
 * Usage:
 *   node scripts/import-trade-leadership-oversight.mjs [--dry-run] [--cg "CG 01.12"] [--file ./import-cg0112-oversight-data.json]
 *
 * Idempotent: skips existing unique (team/crew, user, role) assignments.
 * Does not enforce role max counts (cleanup can happen in UI).
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

const TEAM_ALIASES = {
  'site/civil': 'Sitework/Civil',
  'sitework/civil': 'Sitework/Civil',
};

const CREW_ALIASES = {
  // CG 01.12 legacy naming → preferred spreadsheet / USLDC names
  'windows & doors (exterior)': 'Windows',
  'doors & hardware (interior)': 'Doors',
  'equipment & vehicle maintenance': 'Equipment & vehicle maintenance',
  'equipment & vehicle maintenance ': 'Equipment & vehicle maintenance',
};

const TEAM_ROLES = new Set(['TTO', 'TTOA', 'TT_SUPPORT']);
const CREW_ROLES = new Set(['TCO', 'TCOA', 'TC_SUPPORT']);

function parseArgs(argv) {
  const out = {
    dryRun: false,
    cgCode: 'CG 01.12',
    file: resolve(__dirname, 'import-cg0112-oversight-data.json'),
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') out.dryRun = true;
    else if (a === '--cg') out.cgCode = argv[++i];
    else if (a === '--file') out.file = resolve(argv[++i]);
  }
  return out;
}

function norm(s) {
  return (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

function resolveTeamName(name) {
  if (!name) return null;
  const aliased = TEAM_ALIASES[norm(name)];
  return aliased || name.toString().trim();
}

function resolveCrewName(name) {
  if (!name) return null;
  const n = name.toString().trim();
  const aliased = CREW_ALIASES[norm(n)];
  return aliased || n;
}

function pickEmail(row) {
  const personal = (row.email || '').toString().trim();
  const jwpub = (row.jwpub_email || '').toString().trim();
  if (personal && personal.toLowerCase() !== 'none') return personal.toLowerCase();
  if (jwpub && jwpub.toLowerCase() !== 'none') return jwpub.toLowerCase();
  return null;
}

function isActive(row) {
  const v = (row.is_active || 'Y').toString().trim().toUpperCase();
  return v !== 'N' && v !== 'FALSE' && v !== '0';
}

async function ensureTeam(cgId, teamName, dryRun, cache) {
  const key = norm(teamName);
  if (cache.teams.has(key)) return cache.teams.get(key);

  let team = await prisma.tradeTeam.findFirst({
    where: {
      constructionGroupId: cgId,
      name: { equals: teamName, mode: 'insensitive' },
    },
  });

  // Alias fallback: spreadsheet Site/Civil vs DB Sitework/Civil
  if (!team && TEAM_ALIASES[key]) {
    team = await prisma.tradeTeam.findFirst({
      where: {
        constructionGroupId: cgId,
        name: { equals: TEAM_ALIASES[key], mode: 'insensitive' },
      },
    });
  }

  if (!team) {
    if (dryRun) {
      console.log(`[dry-run] create trade team: ${teamName}`);
      team = { id: `dry-team-${key}`, name: teamName, _dry: true };
    } else {
      team = await prisma.tradeTeam.create({
        data: {
          name: teamName,
          constructionGroupId: cgId,
          isActive: true,
          description: `Imported for ${teamName}`,
        },
      });
      console.log(`+ team ${team.name}`);
    }
  }

  cache.teams.set(key, team);
  cache.teams.set(norm(team.name), team);
  return team;
}

async function ensureCrew(cgId, team, crewName, dryRun, cache) {
  const cacheKey = `${team.id}::${norm(crewName)}`;
  if (cache.crews.has(cacheKey)) return cache.crews.get(cacheKey);

  let crew = await prisma.crew.findFirst({
    where: {
      tradeTeamId: team.id,
      name: { equals: crewName, mode: 'insensitive' },
    },
  });

  // Try reverse aliases (DB legacy name → spreadsheet name)
  if (!crew) {
    const legacyHits = Object.entries(CREW_ALIASES)
      .filter(([, preferred]) => norm(preferred) === norm(crewName))
      .map(([legacy]) => legacy);
    for (const legacy of legacyHits) {
      crew = await prisma.crew.findFirst({
        where: {
          tradeTeamId: team.id,
          name: { equals: legacy, mode: 'insensitive' },
        },
      });
      if (crew) break;
    }
  }

  // Fuzzy contains for close renames (e.g. Windows vs Windows & doors)
  if (!crew && !team._dry) {
    const all = await prisma.crew.findMany({
      where: { tradeTeamId: team.id, isActive: true },
      select: { id: true, name: true },
    });
    const target = norm(crewName);
    crew =
      all.find((c) => norm(c.name) === target) ||
      all.find((c) => norm(c.name).startsWith(target) || target.startsWith(norm(c.name).split(' &')[0]));
  }

  if (!crew) {
    if (dryRun || team._dry) {
      console.log(`[dry-run] create crew: ${team.name} / ${crewName}`);
      crew = { id: `dry-crew-${cacheKey}`, name: crewName, _dry: true };
    } else {
      crew = await prisma.crew.create({
        data: {
          name: crewName,
          tradeTeamId: team.id,
          constructionGroupId: cgId,
          isActive: true,
          isRequired: false,
          status: 'ACTIVE',
        },
      });
      console.log(`+ crew ${team.name} / ${crew.name}`);
    }
  }

  cache.crews.set(cacheKey, crew);
  return crew;
}

async function ensureUserAndVolunteer(cgId, row, dryRun, cache) {
  const email = pickEmail(row);
  if (!email) {
    return { error: 'no email' };
  }

  if (cache.users.has(email)) {
    return cache.users.get(email);
  }

  const firstName = (row.first_name || '').toString().trim();
  const lastName = (row.last_name || '').toString().trim();
  const phone = (row.phone || '').toString().trim() || null;
  const jwpub = (row.jwpub_email || '').toString().trim() || null;
  const displayName = `${firstName} ${lastName}`.trim();

  let user = await prisma.user.findUnique({ where: { email } });
  let volunteer = null;

  // Prefer volunteer match by emails, then exact name within CG
  volunteer = await prisma.volunteer.findFirst({
    where: {
      constructionGroupId: cgId,
      OR: [
        { emailPersonal: { equals: email, mode: 'insensitive' } },
        ...(jwpub
          ? [{ emailJw: { equals: jwpub, mode: 'insensitive' } }]
          : []),
      ],
    },
  });

  if (!volunteer) {
    volunteer = await prisma.volunteer.findFirst({
      where: {
        constructionGroupId: cgId,
        firstName: { equals: firstName, mode: 'insensitive' },
        lastName: { equals: lastName, mode: 'insensitive' },
      },
    });
  }

  if (dryRun) {
    const result = {
      user: user || { id: `dry-user-${email}`, email, _dry: true },
      volunteer: volunteer || { id: `dry-vol-${email}`, _dry: true },
      createdUser: !user,
      createdVolunteer: !volunteer,
    };
    cache.users.set(email, result);
    return result;
  }

  if (!volunteer) {
    volunteer = await prisma.volunteer.create({
      data: {
        firstName,
        lastName,
        emailPersonal: email,
        emailJw: jwpub,
        phone,
        constructionGroupId: cgId,
        isActive: isActive(row),
      },
    });
  } else {
    volunteer = await prisma.volunteer.update({
      where: { id: volunteer.id },
      data: {
        emailPersonal: volunteer.emailPersonal || email,
        emailJw: volunteer.emailJw || jwpub,
        phone: volunteer.phone || phone,
        isActive: isActive(row),
      },
    });
  }

  // Volunteer may already be linked to a User (unique volunteerId)
  const linkedUser = await prisma.user.findFirst({
    where: { volunteerId: volunteer.id },
  });

  if (!user && linkedUser) {
    user = linkedUser;
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: displayName,
        firstName,
        lastName,
        role: 'READ_ONLY',
        status: 'INVITED',
        constructionGroupId: cgId,
        volunteerId: volunteer.id,
      },
    });
  } else {
    const linkVolunteer =
      !user.volunteerId &&
      !(await prisma.user.findFirst({ where: { volunteerId: volunteer.id } }));
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name || displayName,
        firstName: user.firstName || firstName,
        lastName: user.lastName || lastName,
        constructionGroupId: user.constructionGroupId || cgId,
        ...(linkVolunteer ? { volunteerId: volunteer.id } : {}),
      },
    });
  }

  const result = { user, volunteer, createdUser: false, createdVolunteer: false };
  cache.users.set(email, result);
  return result;
}

async function assignTeamRole(team, user, role, dryRun, stats) {
  if (team._dry || user._dry) {
    stats.wouldAssign++;
    return;
  }
  const existing = await prisma.tradeTeamOversight.findUnique({
    where: {
      tradeTeamId_userId_role: {
        tradeTeamId: team.id,
        userId: user.id,
        role,
      },
    },
  });
  if (existing) {
    if (!existing.isActive) {
      if (!dryRun) {
        await prisma.tradeTeamOversight.update({
          where: { id: existing.id },
          data: { isActive: true, endDate: null },
        });
      }
      stats.reactivated++;
    } else {
      stats.skippedExisting++;
    }
    return;
  }
  if (dryRun) {
    stats.wouldAssign++;
    return;
  }
  await prisma.tradeTeamOversight.create({
    data: {
      tradeTeamId: team.id,
      userId: user.id,
      role,
      isActive: true,
      startDate: new Date(),
    },
  });
  stats.assigned++;
}

async function assignCrewRole(crew, user, role, dryRun, stats) {
  if (crew._dry || user._dry) {
    stats.wouldAssign++;
    return;
  }
  const existing = await prisma.tradeCrewOversight.findUnique({
    where: {
      crewId_userId_role: {
        crewId: crew.id,
        userId: user.id,
        role,
      },
    },
  });
  if (existing) {
    if (!existing.isActive) {
      if (!dryRun) {
        await prisma.tradeCrewOversight.update({
          where: { id: existing.id },
          data: { isActive: true, endDate: null },
        });
      }
      stats.reactivated++;
    } else {
      stats.skippedExisting++;
    }
    return;
  }
  if (dryRun) {
    stats.wouldAssign++;
    return;
  }
  await prisma.tradeCrewOversight.create({
    data: {
      crewId: crew.id,
      userId: user.id,
      role,
      isActive: true,
      startDate: new Date(),
    },
  });
  stats.assigned++;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rows = JSON.parse(readFileSync(args.file, 'utf8'));
  console.log(`Importing ${rows.length} rows into ${args.cgCode}${args.dryRun ? ' (dry-run)' : ''}`);

  const cg = await prisma.constructionGroup.findFirst({ where: { code: args.cgCode } });
  if (!cg) {
    throw new Error(`Construction group not found: ${args.cgCode}`);
  }

  const cache = { teams: new Map(), crews: new Map(), users: new Map() };
  const stats = {
    assigned: 0,
    wouldAssign: 0,
    skippedExisting: 0,
    reactivated: 0,
    skippedNoTeam: 0,
    skippedNoEmail: 0,
    skippedBadRole: 0,
    errors: [],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowLabel = `${row.first_name} ${row.last_name} (${row.role})`;
    try {
      let role = (row.role || '').toString().trim().toUpperCase();
      if (!TEAM_ROLES.has(role) && !CREW_ROLES.has(role)) {
        stats.skippedBadRole++;
        stats.errors.push(`Row ${i + 1} ${rowLabel}: bad role ${row.role}`);
        continue;
      }

      let teamName = resolveTeamName(row.trade_team);
      if (!teamName) {
        // No trade yet: park as team support on the placeholder team.
        teamName = 'TBD';
        role = 'TT_SUPPORT';
        stats.errors.push(
          `Row ${i + 1} ${rowLabel}: missing trade_team — assigning as TT_SUPPORT on TBD`
        );
      }

      const person = await ensureUserAndVolunteer(cg.id, row, args.dryRun, cache);
      if (person.error) {
        stats.skippedNoEmail++;
        stats.errors.push(`Row ${i + 1} ${rowLabel}: ${person.error}`);
        continue;
      }

      const team = await ensureTeam(cg.id, teamName, args.dryRun, cache);

      if (TEAM_ROLES.has(role)) {
        await assignTeamRole(team, person.user, role, args.dryRun, stats);
      } else {
        const crewName = resolveCrewName(row.trade_crew);
        if (!crewName) {
          // Crew-level role without crew: attach as team support fallback note
          stats.errors.push(
            `Row ${i + 1} ${rowLabel}: crew role without trade_crew — assigning as TT_SUPPORT on ${team.name}`
          );
          await assignTeamRole(team, person.user, 'TT_SUPPORT', args.dryRun, stats);
          continue;
        }
        const crew = await ensureCrew(cg.id, team, crewName, args.dryRun, cache);
        await assignCrewRole(crew, person.user, role, args.dryRun, stats);
      }
    } catch (err) {
      stats.errors.push(`Row ${i + 1} ${rowLabel}: ${err.message}`);
    }
  }

  console.log('\n=== Import summary ===');
  console.log(JSON.stringify(stats, null, 2));
  if (stats.errors.length) {
    console.log('\nIssues (first 30):');
    for (const e of stats.errors.slice(0, 30)) console.log(' -', e);
    if (stats.errors.length > 30) console.log(` ... +${stats.errors.length - 30} more`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
