import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import { makeZip } from './zip.mjs';
import { extensionFiles, validateReleaseManifest } from './release-validation.mjs';
import { getBuildConfig } from './build-config.mjs';
const { values } = parseArgs({ options: { 'allow-placeholder': { type: 'boolean', default: false } } });
const metadata = JSON.parse(await readFile('dist/build-info.json', 'utf8'));
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const config = getBuildConfig({ mode: metadata.mode, origin: metadata.portalOrigin, version: pkg.version });
if (process.env.PORTAL_ORIGIN && getBuildConfig({mode:'production',origin:process.env.PORTAL_ORIGIN,version:pkg.version}).portalOrigin !== config.portalOrigin) throw new Error('PORTAL_ORIGIN differs from the built extension. Rebuild for the requested origin.');
if (config.mode !== 'production') throw new Error('Build a production demo first. Local development builds are not release packages.');
if (config.provisional && !values['allow-placeholder']) throw new Error('The portal uses a non-working .invalid placeholder. Supply a real origin, or explicitly use --allow-placeholder for review-only artifacts.');
const manifest = JSON.parse(await readFile('dist/extension/manifest.json', 'utf8'));
validateReleaseManifest(manifest, config);
const entries = await Promise.all([...extensionFiles].sort().map(async name => {
  const data = await readFile(`dist/extension/${name}`);
  if (createHash('sha256').update(data).digest('hex') !== metadata.files?.[name]) throw new Error(`Build hash mismatch for ${name}. Rebuild before packaging.`);
  return [name, data];
}));
for (const [name, data] of entries) {
  if (name.endsWith('.js') && /https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?/.test(data.toString('utf8'))) throw new Error('Production JavaScript still references a development origin.');
}
async function portalEntries(directory, prefix = '') {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) found.push(...await portalEntries(`${directory}/${entry.name}`, `${name}/`));
    else if (entry.isFile() && (name === 'index.html' || /^assets\/[a-zA-Z0-9._-]+\.(js|css|svg|png|woff2?)$/.test(name))) found.push([name, await readFile(`${directory}/${entry.name}`)]);
    else throw new Error(`Unexpected portal release asset: ${name}`);
  }
  return found.sort(([a], [b]) => a.localeCompare(b));
}
const portal = await portalEntries('dist/portal');
if (!portal.some(([name]) => name === 'index.html')) throw new Error('Build the portal before packaging.');
const out = 'dist/releases'; await mkdir(out, { recursive: true });
const suffix = config.provisional ? '-PROVISIONAL' : '';
const base = `windchill-extension-demo-${config.version}${suffix}`;
const archive = makeZip(entries);
const artifacts = [[`${base}-unpacked.zip`, archive], [`${base}-store.zip`, archive], [`demo-portal-${config.version}${suffix}.zip`, makeZip(portal)]];
for (const [name, data] of artifacts) await writeFile(`${out}/${name}`, data);
await writeFile(`${out}/SHA256SUMS${suffix}.txt`, artifacts.map(([name, data]) => `${createHash('sha256').update(data).digest('hex')}  ${name}`).join('\n') + '\n');
await writeFile(`${out}/release-info${suffix}.json`, JSON.stringify({ ...config, distributionApproved: false, artifacts: artifacts.map(([name, data]) => ({ name, bytes: data.length })), extensionBytes: entries.reduce((sum, [, data]) => sum + data.length, 0), portalBytes: portal.reduce((sum, [, data]) => sum + data.length, 0) }, null, 2) + '\n');
console.log(`Created ${artifacts.length} archives in ${out}${config.provisional ? ' — PROVISIONAL, NOT FOR DISTRIBUTION' : ' — approval still required before publishing'}.`);
