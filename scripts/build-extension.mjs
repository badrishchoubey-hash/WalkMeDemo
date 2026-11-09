import { build } from 'esbuild';
import { mkdir, copyFile, rm } from 'node:fs/promises';
import { generateDemoIcons } from './generate-icons.mjs';
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
  minify: false,
  sourcemap: false,
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
});
await copyFile('apps/extension/public/manifest.json', `${out}/manifest.json`);
await copyFile('apps/extension/public/sidepanel.html', `${out}/sidepanel.html`);
console.log('Extension built → dist/extension');
