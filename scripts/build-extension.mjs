import { build } from 'esbuild';
import { mkdir, copyFile, rm, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parseArgs } from 'node:util';
import { generateDemoIcons } from './generate-icons.mjs';
import { getBuildConfig } from './build-config.mjs';
const { values } = parseArgs({
  options: { mode: { type: 'string', default: 'development' } },
});
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const config = getBuildConfig({
  mode: values.mode,
  origin: process.env.PORTAL_ORIGIN,
  version: pkg.version,
});
const out = 'dist/extension';
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await generateDemoIcons(out);
await build({
  entryPoints: {
    content: 'apps/extension/src/content/content-script.ts',
    background: 'apps/extension/src/background/service-worker.ts',
    sidepanel: 'apps/extension/src/sidepanel/main.tsx',
  },
  outdir: out,
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  minify: config.mode === 'production',
  legalComments: 'eof',
  sourcemap: false,
  jsx: 'automatic',
  define: {
    'process.env.NODE_ENV': '"production"',
    __GUIDANCE_PORTAL_ORIGIN__: JSON.stringify(config.portalOrigin),
  },
});
const manifest = JSON.parse(
  await readFile('apps/extension/public/manifest.json', 'utf8'),
);
manifest.version = config.version;
manifest.host_permissions = [config.matchPattern];
manifest.content_scripts = manifest.content_scripts.map((entry) => ({
  ...entry,
  matches: [config.matchPattern],
}));
await writeFile(
  `${out}/manifest.json`,
  `${JSON.stringify(manifest, null, 2)}\n`,
);
await copyFile('apps/extension/public/sidepanel.html', `${out}/admin.html`);
const notices = await Promise.all(
  ['react', 'react-dom', 'scheduler'].map(
    async (name) =>
      `${name}\n${await readFile(`node_modules/${name}/LICENSE`, 'utf8')}`,
  ),
);
await writeFile(`${out}/THIRD_PARTY_NOTICES.txt`, notices.join('\n\n'));
const files = [
  'manifest.json',
  'background.js',
  'content.js',
  'sidepanel.js',
  'sidepanel.css',
  'admin.html',
  'THIRD_PARTY_NOTICES.txt',
  ...Object.values(manifest.icons),
];
const hashes = Object.fromEntries(
  await Promise.all(
    files.map(async (file) => [
      file,
      createHash('sha256')
        .update(await readFile(`${out}/${file}`))
        .digest('hex'),
    ]),
  ),
);
await writeFile(
  'dist/build-info.json',
  `${JSON.stringify({ ...config, files: hashes }, null, 2)}\n`,
);
console.log(
  `Extension built: ${config.mode}, ${config.portalOrigin}, version ${config.version}${config.provisional ? ' (PROVISIONAL placeholder)' : ''}`,
);
