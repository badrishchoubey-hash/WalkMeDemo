import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { getBuildConfig } from './build-config.mjs';
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
// Reject an unsafe/missing target before modifying any build output.
getBuildConfig({ mode: 'production', origin: process.env.PORTAL_ORIGIN, version: pkg.version });
for (const args of [
  ['node_modules/typescript/bin/tsc', '--noEmit'],
  ['node_modules/vite/bin/vite.js', 'build', '--config', 'apps/demo-portal/vite.config.ts'],
  ['scripts/build-extension.mjs', '--mode', 'production'],
]) execFileSync(process.execPath, args, { stdio: 'inherit' });
