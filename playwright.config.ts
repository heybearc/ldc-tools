import fs from 'fs';
import path from 'path';
import { defineConfig, devices } from './frontend/node_modules/@playwright/test';

const envFile = path.join(__dirname, 'frontend/.env.test');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

const baseURL = process.env.BASE_URL || 'http://localhost:3001';
const remoteTarget = Boolean(process.env.BASE_URL) && !/localhost|127\.0\.0\.1/.test(process.env.BASE_URL);

export default defineConfig({
  testDir: './frontend/tests',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.CI || remoteTarget ? undefined : {
    command: 'npm --prefix frontend run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
