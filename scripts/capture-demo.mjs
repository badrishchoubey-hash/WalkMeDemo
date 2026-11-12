import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
const output = path.resolve('artifacts');
await mkdir(output, { recursive: true });
const extension = path.resolve('dist/extension');
const browser = await chromium.launchPersistentContext(
  path.resolve('test-results/preview-profile'),
  {
    channel: 'chromium',
    headless: true,
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
    viewport: { width: 1440, height: 960 },
  },
);
try {
  const worker =
    browser.serviceWorkers()[0] ??
    (await browser.waitForEvent('serviceworker'));
  const id = new URL(worker.url()).host;
  const portal = await browser.newPage();
  await portal.goto('http://127.0.0.1:5173');
  await portal
    .getByRole('heading', { name: 'Engineering, in focus.' })
    .waitFor();
  await portal.screenshot({
    path: path.join(output, 'portal-overview.png'),
    fullPage: true,
  });
  const panel = await browser.newPage();
  await panel.setViewportSize({ width: 380, height: 900 });
  await panel.goto(`chrome-extension://${id}/admin.html`);
  await portal.bringToFront();
  await panel.getByText('Connected · Dashboard').waitFor();
  await panel.screenshot({
    path: path.join(output, 'extension-panel.png'),
    fullPage: true,
  });
  const reply = await panel.evaluate(
    async () =>
      await chrome.runtime.sendMessage({
        channel: 'smartguide',
        requestId: crypto.randomUUID(),
        command: { type: 'START_WORKFLOW', workflowId: 'create-part' },
      }),
  );
  if (!reply.ok) throw new Error(reply.error);
  await portal
    .locator('#smartguide-overlay')
    .getByRole('heading', { name: 'Start a part record' })
    .waitFor();
  await portal.getByRole('button', { name: 'Create part' }).click();
  await portal
    .locator('#smartguide-overlay')
    .getByRole('heading', { name: 'Name the part' })
    .waitFor();
  await expect(portal.locator('#smartguide-overlay .ring')).toHaveCSS(
    'width',
    /[1-9]\d+px/,
  );
  await portal.screenshot({
    path: path.join(output, 'guided-part-form.png'),
    fullPage: true,
  });
  console.log(`Screenshots saved in ${output}`);
} finally {
  await browser.close();
}
