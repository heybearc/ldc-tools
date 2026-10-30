/**
 * Read the persons list and print who is fully listed.
 * Does not change assignments. A role with no crew is left unchanged.
 *
 *   npx tsx scripts/compare-persons-roster.ts [workbook]
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ExcelJS from 'exceljs';
import { parsePersonsLines } from '../src/lib/persons-roster.ts';

const file = resolve(process.argv[2] || '../docs/templates/LDC-Trade-Leadership-Import-Template.xlsx');

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.load(readFileSync(file));

let lines: string[] = [];
for (const sheet of workbook.worksheets) {
  const column: string[] = [];
  sheet.eachRow((row) => {
    const value = row.getCell(1).text?.trim() || '';
    if (value) column.push(value);
  });
  if (column.includes('Mobile Phone') && column.includes('Email Address')) {
    lines = column;
    break;
  }
}

if (lines.length === 0) {
  console.error('No persons list found in that workbook');
  process.exit(1);
}

const people = parsePersonsLines(lines);
const complete = people.filter((person) => person.complete && person.roles.length > 0);
const incomplete = people.filter((person) => !person.complete);
const noTrade = people.filter((person) => person.complete && person.roles.length === 0);
console.log(`People: ${people.length}`);
console.log(`Fully listed trade roles: ${complete.length}`);
console.log(`No trade role listed: ${noTrade.length}`);
console.log(`Left unchanged (a role has no team or crew): ${incomplete.length}`);
for (const person of incomplete) {
  console.log(`- ${person.name}`);
}
