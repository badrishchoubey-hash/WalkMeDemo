import { test, expect, chromium } from '@playwright/test';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

test('production extension integrates with the live hosted portal', async ({
  browserName,
}, testInfo) => {
  test.skip(
    process.env.HOSTED_SMOKE !== '1',
    'Opt-in live network check; build production first.',
  );
  test.setTimeout(90000);
  const metadata = JSON.parse(await readFile('dist/build-info.json', 'utf8'));
  expect(metadata.mode).toBe('production');
  expect(metadata.portalOrigin).toBe('https://walk-me-demo-silk.vercel.app');
  const extension = path.resolve('dist/extension');
  const browser = await chromium.launchPersistentContext(
    testInfo.outputPath('profile'),
    {
      channel: browserName,
      headless: true,
      args: [
        `--disable-extensions-except=${extension}`,
        `--load-extension=${extension}`,
      ],
    },
  );
  try {
    const page = await browser.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(`${metadata.portalOrigin}/#/dashboard`);
    expect(response?.status()).toBe(200);
    await page
      .getByRole('button', { name: 'Acknowledge', exact: true })
      .click();
    await expect(page.locator('#smartguide-information')).toBeAttached();
    await page
      .getByRole('button', { name: 'Help & Guidance', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'How can we help?' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Close help', exact: true }).click();
    await page.goto(`${metadata.portalOrigin}/#/task`);
    await page
      .getByRole('button', { name: "See what's new with this task" })
      .click();
    const overlay = page.locator('#smartguide-overlay');
    await expect(overlay.getByRole('heading')).toHaveText('See what is new');
    await overlay.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(overlay.getByRole('heading')).toHaveText(
      'Updated task instructions',
    );
    await overlay.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(
      page.getByRole('tab', { name: 'Setup Participants' }),
    ).toHaveAttribute('aria-selected', 'true');
    await overlay.getByRole('button', { name: 'Next', exact: true }).click();
    await overlay.getByRole('button', { name: 'Show me how' }).click();
    await page.getByRole('button', { name: 'Customize tab' }).click();
    await page.getByRole('button', { name: 'Rename', exact: true }).click();
    await expect(page.locator('[data-guide="tab-name"]')).toHaveValue(
      'Review team',
    );
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await expect(
      page.getByRole('tab', { name: 'Review team', exact: true }),
    ).toBeVisible();
    await page.goto(`${metadata.portalOrigin}/#/documents`);
    await expect(overlay.getByRole('heading')).toHaveText('Search the library');
    await expect(page.locator('[data-guide="document-search"]')).toBeFocused();
    let worker = browser.serviceWorkers()[0];
    worker ??= await browser.waitForEvent('serviceworker');
    const admin = await browser.newPage();
    await admin.goto(
      `chrome-extension://${new URL(worker.url()).host}/admin.html`,
    );
    await expect(
      admin.getByRole('link', { name: 'Open user experience' }),
    ).toHaveAttribute('href', `${metadata.portalOrigin}/#/dashboard`);
    expect(errors).toEqual([]);
  } finally {
    await browser.close();
  }
});
