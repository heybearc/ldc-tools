import { PrismaClient } from '@prisma/client';

const apply = process.argv.includes('--apply');
const prisma = new PrismaClient();

function peopleCount(team) {
  const teamPeople = team.oversight.filter((row) => row.isActive).length;
  const crewPeople = team.crews.reduce(
    (sum, crew) => sum + crew.oversight.filter((row) => row.isActive).length,
    0
  );
  return teamPeople + crewPeople;
}

const teams = await prisma.tradeTeam.findMany({
  where: { isActive: true },
  include: { oversight: true, crews: { include: { oversight: true } } },
});

const groups = new Map();
for (const team of teams) {
  const key = team.name.trim().toLowerCase();
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(team);
}

const chosen = new Map();
for (const list of groups.values()) {
  const populated = list.filter((team) => peopleCount(team) > 0);
  if (populated.length === 0) continue;
  for (const team of list) {
    if (peopleCount(team) === 0) chosen.set(team.id, team);
  }
}
for (const team of teams) {
  if (team.name.trim().toLowerCase() === 'test electrical team') chosen.set(team.id, team);
}

const targets = [...chosen.values()];
console.log(apply ? 'Deactivating' : 'Would deactivate');
for (const team of targets) {
  console.log(`- ${team.name} (${team.id}) crews=${team.crews.length}`);
}
console.log(`count=${targets.length}`);

if (apply) {
  for (const team of targets) {
    await prisma.crew.updateMany({
      where: { tradeTeamId: team.id },
      data: { isActive: false },
    });
    await prisma.tradeTeam.update({
      where: { id: team.id },
      data: { isActive: false },
    });
  }
}

await prisma.$disconnect();
