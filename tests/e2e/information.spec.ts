import { test, expect } from './extension-fixture';
import type { Reply } from '../../packages/shared/workflow-types';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

test('neutral branding is present in portal, panel, overlays, manifest and packaged icons', async ({
  guide,
}) => {
  const { portal, panel, command } = guide;
  await expect(
    panel.getByText('Windchill Extension Demo', { exact: true }),
  ).toBeVisible();
  await expect(panel.locator('.logo svg')).toBeVisible();
  await expect(portal.locator('.brand svg')).toBeVisible();
  expect(await portal.title()).toContain('Windchill Extension Demo');
  expect(await panel.title()).toBe('Windchill Extension Demo');
  await expect(portal.locator('body')).not.toContainText(/smartguide/i);
  await expect(panel.locator('body')).not.toContainText(/smartguide/i);
  await command({ type: 'START_WORKFLOW', workflowId: 'create-part' });
  await expect(portal.locator('#smartguide-overlay .meta')).toContainText(
    'EXTENSION DEMO',
  );
  await expect(portal.locator('#smartguide-overlay')).not.toContainText(
    /smartguide/i,
  );
  const directory = path.resolve('dist/extension');
  const manifest = JSON.parse(
    readFileSync(path.join(directory, 'manifest.json'), 'utf8'),
  );
  expect(manifest.name).toBe('Windchill Extension Demo');
  expect(manifest.action.default_title).toBe('Open Windchill Extension Demo');
  expect(manifest.permissions).toEqual(['sidePanel', 'storage']);
  for (const [size, file] of Object.entries(manifest.icons)) {
    const image = path.join(directory, String(file));
    expect(existsSync(image)).toBe(true);
    const bytes = readFileSync(image);
    expect(bytes.subarray(0, 8)).toEqual(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    );
    expect(bytes.readUInt32BE(16)).toBe(Number(size));
    expect(bytes.readUInt32BE(20)).toBe(Number(size));
  }
});

test('side-panel toggle highlights real part fields and shows hover and keyboard tooltips', async ({
  guide,
}, testInfo) => {
  const { portal, panel, command } = guide;
  const toggle = panel.getByRole('switch', {
    name: 'Show Important Information',
  });
  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(12);
  expect((await command({ type: 'GET_CONTEXT' })).information).toMatchObject({
    enabled: true,
    supported: true,
    matchedCount: 12,
    suspended: false,
  });
  const icon = portal.getByRole('button', {
    name: 'Explain Part number: PRT-1001',
    exact: true,
  });
  await icon.hover();
  const tooltip = portal.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('Current value: PRT-1001');
  await expect(tooltip).toContainText('Why it matters:');
  await portal.getByRole('heading', { name: 'Parts', exact: true }).hover();
  await expect(tooltip).toBeHidden();
  await icon.focus();
  await expect(tooltip).toBeVisible();
  await portal.keyboard.press('Escape');
  await expect(tooltip).toBeHidden();
  await expect(icon).toBeFocused();
  await portal
    .getByRole('button', { name: 'Explain Revision: A.1', exact: true })
    .first()
    .focus();
  await expect(tooltip).toContainText('fixed A.1 label');
  await portal
    .getByRole('button', { name: 'Explain Part status: Released', exact: true })
    .first()
    .focus();
  await expect(tooltip).toContainText('not proof of an approval process');
  expect(
    await portal.locator('#smartguide-information').evaluate((host) => {
      const shadow = host.shadowRoot!;
      const tip = shadow.querySelector<HTMLElement>('.info-tooltip')!;
      const r = tip.getBoundingClientRect();
      const points = [...shadow.querySelectorAll<HTMLElement>('.info-icon')]
        .map((button) => {
          const b = button.getBoundingClientRect();
          return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
        })
        .filter(
          (p) => p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom,
        );
      return points.every((p) =>
        tip.contains(shadow.elementFromPoint(p.x, p.y)),
      );
    }),
  ).toBe(true);
  await panel.setViewportSize({ width: 390, height: 1000 });
  await panel.screenshot({
    path: testInfo.outputPath('information-panel.png'),
    fullPage: true,
  });
  await portal.screenshot({
    path: testInfo.outputPath('information-tooltip.png'),
    fullPage: true,
  });
});

test('tooltips render untrusted current values only as text', async ({
  guide,
}) => {
  const { portal, command } = guide;
  await command({ type: 'SET_INFORMATION_HIGHLIGHTS', enabled: true });
  const unsafe = '<img src=x onerror="window.informationXss=true">';
  await portal
    .locator('[data-info="part-status"]')
    .first()
    .evaluate((element, text) => {
      element.textContent = text;
    }, unsafe);
  const icon = portal
    .locator('#smartguide-information .info-icon[data-info-id="part-status"]')
    .first();
  await expect(icon).toHaveAttribute(
    'aria-label',
    `Explain Part status: ${unsafe}`,
  );
  await icon.focus();
  await expect(portal.getByRole('tooltip')).toContainText(unsafe);
  await expect(portal.locator('#smartguide-information img')).toHaveCount(0);
  expect(
    await portal.evaluate(() => Reflect.get(window, 'informationXss')),
  ).toBeUndefined();
});

test('document information icons do not overlap metadata text at wide or narrow widths', async ({
  guide,
}, testInfo) => {
  const { portal, command } = guide;
  await portal.locator('[data-guide="nav-documents"]').click();
  await command({ type: 'SET_INFORMATION_HIGHLIGHTS', enabled: true });
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(9);
  for (const width of [1440, 900, 600]) {
    await portal.setViewportSize({ width, height: 960 });
    await expect
      .poll(async () =>
        portal.evaluate(() => {
          const layer = document.getElementById('smartguide-information');
          const icons = [
            ...(layer?.shadowRoot?.querySelectorAll<HTMLElement>(
              '.info-icon',
            ) ?? []),
          ]
            .filter((icon) => !icon.hidden)
            .map((icon) => icon.getBoundingClientRect());
          const root = document.querySelector('.document-list');
          if (!root || icons.length !== 9)
            return [`${innerWidth}px: found ${icons.length} icons`];
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          const textBounds: { text: string; rect: DOMRect }[] = [];
          while (walker.nextNode()) {
            if (!walker.currentNode.textContent?.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(walker.currentNode);
            textBounds.push(
              ...[...range.getClientRects()].map((rect) => ({
                text: walker.currentNode.textContent ?? '',
                rect,
              })),
            );
          }
          return icons.flatMap((icon, index) =>
            textBounds
              .filter(
                ({ rect: text }) =>
                  !(
                    icon.right <= text.left ||
                    icon.left >= text.right ||
                    icon.bottom <= text.top ||
                    icon.top >= text.bottom
                  ),
              )
              .map(({ text }) => `${innerWidth}px icon ${index}: ${text}`),
          );
        }),
      )
      .toEqual([]);
  }
  const icon = portal.getByRole('button', {
    name: 'Explain Document identifier: DOC-201',
    exact: true,
  });
  await icon.focus();
  await expect(portal.getByRole('tooltip')).toContainText(
    'Current value: DOC-201',
  );
  await portal.keyboard.press('Escape');
  const versionIcon = portal.getByRole('button', {
    name: 'Explain Document version: Document version C',
    exact: true,
  });
  await versionIcon.focus();
  await expect(portal.getByRole('tooltip')).toContainText(
    'version C comes after versions A and B',
  );
  await portal.keyboard.press('Escape');
  await portal.setViewportSize({ width: 1440, height: 960 });
  await portal.screenshot({
    path: testInfo.outputPath('document-information-alignment.png'),
    fullPage: true,
  });
  await portal.locator('[data-guide="document-result"]').click();
  await expect(portal.locator('[data-guide="document-detail"]')).toBeVisible();
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(11);
});

test('dynamic changes update the count, recover replacement targets and do not duplicate icons', async ({
  guide,
}) => {
  const { portal, command } = guide;
  await command({ type: 'SET_INFORMATION_HIGHLIGHTS', enabled: true });
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(12);
  await portal
    .locator('[data-info="part-number"]')
    .first()
    .evaluate((element) => element.removeAttribute('data-info'));
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(11);
  await portal
    .locator('tbody tr')
    .first()
    .locator('td')
    .first()
    .locator('span')
    .evaluate((element) => {
      element.setAttribute('data-info', 'part-number');
      element.replaceWith(element.cloneNode(true));
    });
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(12);
  await portal
    .getByRole('textbox', { name: 'Search records' })
    .fill('PRT-1001');
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(3);
  await portal
    .getByRole('textbox', { name: 'Search records' })
    .fill('not-a-record');
  await expect(portal.locator('#smartguide-information')).toHaveCount(0);
  expect(
    (await command({ type: 'GET_CONTEXT' })).information?.matchedCount,
  ).toBe(0);
  await portal.getByRole('textbox', { name: 'Search records' }).fill('');
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(12);
  for (let i = 0; i < 3; i++) {
    await command({ type: 'SET_INFORMATION_HIGHLIGHTS', enabled: false });
    await expect(portal.locator('#smartguide-information')).toHaveCount(0);
    await command({ type: 'SET_INFORMATION_HIGHLIGHTS', enabled: true });
    await expect(
      portal.locator('#smartguide-information .info-icon'),
    ).toHaveCount(12);
  }
  await command({ type: 'SET_INFORMATION_HIGHLIGHTS', enabled: false });
  await portal
    .getByRole('textbox', { name: 'Search records' })
    .fill('PRT-1002');
  await expect(portal.locator('#smartguide-information')).toHaveCount(0);
  expect((await command({ type: 'GET_CONTEXT' })).information).toMatchObject({
    enabled: false,
    matchedCount: 0,
  });
});

test('navigation refreshes definitions, handles async documents, and suspends on unconfigured pages', async ({
  guide,
}) => {
  const { portal, command } = guide;
  await command({ type: 'SET_INFORMATION_HIGHLIGHTS', enabled: true });
  await portal.locator('[data-guide="nav-documents"]').click();
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(9);
  await portal
    .getByRole('button', {
      name: 'Explain Document owner: Mechanical Engineering',
      exact: true,
    })
    .focus();
  await expect(portal.getByRole('tooltip')).toContainText(
    'team listed as responsible',
  );
  await portal
    .getByRole('textbox', { name: 'Search documents' })
    .fill('bracket');
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(3);
  await portal.locator('[data-guide="nav-changes"]').click();
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(3);
  await portal
    .getByRole('button', {
      name: 'Explain Change status: In review',
      exact: true,
    })
    .focus();
  await expect(portal.getByRole('tooltip')).toContainText(
    'approval transitions are not implemented',
  );
  await portal.locator('[data-guide="nav-dashboard"]').click();
  await expect(portal.locator('#smartguide-information')).toHaveCount(0);
  expect((await command({ type: 'GET_CONTEXT' })).information).toMatchObject({
    enabled: true,
    supported: false,
    matchedCount: 0,
  });
  await portal.locator('[data-guide="nav-parts"]').click();
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(12);
  await portal.reload();
  expect((await command({ type: 'GET_CONTEXT' })).information?.enabled).toBe(
    false,
  );
  await expect(portal.locator('#smartguide-information')).toHaveCount(0);
});

test('walkthroughs take priority and disabling information does not cancel a tour', async ({
  guide,
}) => {
  const { portal, command, step } = guide;
  await command({ type: 'SET_INFORMATION_HIGHLIGHTS', enabled: true });
  await command({ type: 'START_WORKFLOW', workflowId: 'create-part' });
  await expect(portal.locator('#smartguide-information')).toHaveCount(0);
  await expect(portal.locator('#smartguide-overlay')).toHaveCount(1);
  expect((await command({ type: 'GET_CONTEXT' })).information).toMatchObject({
    enabled: true,
    suspended: true,
  });
  await command({ type: 'PAUSE_WORKFLOW' });
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(12);
  await command({ type: 'RESUME_WORKFLOW' });
  await command({ type: 'SET_INFORMATION_HIGHLIGHTS', enabled: false });
  expect((await command({ type: 'GET_CONTEXT' })).state.status).toBe('running');
  await portal.locator('[data-guide="create-part"]').click();
  await step(1);
  await command({ type: 'SET_INFORMATION_HIGHLIGHTS', enabled: true });
  await expect(portal.locator('#smartguide-information')).toHaveCount(0);
  await command({ type: 'AUTOFILL' });
  await step(5);
  await portal.locator('[data-guide="review-part"]').click();
  await step(6);
  await portal.locator('[data-guide="confirm-part"]').click();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('completed');
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(15);
});

test('information state is isolated by tab and tooltip placement stays within the viewport', async ({
  guide,
}) => {
  const { browser, portal, panel, command } = guide;
  await command({ type: 'SET_INFORMATION_HIGHLIGHTS', enabled: true });
  const second = await browser.newPage();
  await second.goto('http://127.0.0.1:5173/#/parts');
  await second.bringToFront();
  const reply = await panel.evaluate(
    async () =>
      (await chrome.runtime.sendMessage({
        channel: 'smartguide',
        requestId: crypto.randomUUID(),
        command: { type: 'GET_CONTEXT' },
      })) as Reply,
  );
  expect(reply.ok && reply.context.information?.enabled).toBe(false);
  await expect(second.locator('#smartguide-information')).toHaveCount(0);
  expect((await command({ type: 'GET_CONTEXT' })).information?.enabled).toBe(
    true,
  );
  await portal.setViewportSize({ width: 900, height: 600 });
  await portal
    .getByRole('button', { name: 'Explain Part status: Released', exact: true })
    .first()
    .focus();
  const tooltip = portal.getByRole('tooltip');
  await expect(tooltip).toBeVisible();
  await expect
    .poll(async () => {
      const r = await tooltip.boundingBox();
      return Boolean(
        r &&
        r.x >= 0 &&
        r.y >= 0 &&
        r.x + r.width <= 900 &&
        r.y + r.height <= 600,
      );
    })
    .toBe(true);
  await portal.setViewportSize({ width: 1150, height: 740 });
  await expect
    .poll(async () => {
      const r = await tooltip.boundingBox();
      return Boolean(r && r.x + r.width <= 1150 && r.y + r.height <= 740);
    })
    .toBe(true);
  await command({ type: 'SET_INFORMATION_HIGHLIGHTS', enabled: false });
  await portal.evaluate(() => window.dispatchEvent(new Event('resize')));
  await expect(portal.locator('#smartguide-information')).toHaveCount(0);
});
