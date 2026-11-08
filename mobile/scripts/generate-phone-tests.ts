import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { phoneFeatures, renderFeatureFlow } from '../lib/phone-features.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, '.maestro', 'generated');
mkdirSync(output, { recursive: true });

for (const feature of phoneFeatures) {
  writeFileSync(join(output, `${feature.id}.yaml`), renderFeatureFlow(feature));
}

console.log(`Wrote ${phoneFeatures.length} phone feature flows`);
