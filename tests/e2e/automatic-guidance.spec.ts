import { test, expect } from './extension-fixture';

test('document search highlight encloses the complete control on every side at desktop and compact widths', async ({
  guide,
}, testInfo) => {
  const { portal, command } = guide;
  await portal.locator('[data-guide="nav-documents"]').click();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).route)
    .toBe('documents');
  await command({ type: 'START_WORKFLOW', workflowId: 'find-document' });
  await expect(
    portal.locator('#smartguide-overlay').getByRole('heading'),
  ).toHaveText('Search the library');
  for (const width of [1440, 900, 600]) {
    await portal.setViewportSize({ width, height: 960 });
    await expect
      .poll(async () =>
        portal.evaluate(() => {
          const control = document.querySelector<HTMLElement>(
            '[data-guide="document-search-control"]',
          );
          const input = document.querySelector<HTMLInputElement>(
            '[data-guide="document-search"]',
          );
          const ring = document
            .getElementById('smartguide-overlay')
            ?.shadowRoot?.querySelector<HTMLElement>('.ring');
          if (!control || !input || !ring) return false;
          const shell = control.getBoundingClientRect();
          const actual = ring.getBoundingClientRect();
          const field = input.getBoundingClientRect();
          const css = getComputedStyle(ring);
          return (
            ['left', 'right', 'top', 'bottom'].every(
              (side) =>
                Math.abs(
                  actual[side as 'left' | 'right' | 'top' | 'bottom'] -
                    shell[side as 'left' | 'right' | 'top' | 'bottom'],
                ) < 1,
            ) &&
            field.left >= shell.left &&
            field.right <= shell.right &&
            [
              css.borderTopWidth,
              css.borderRightWidth,
              css.borderBottomWidth,
              css.borderLeftWidth,
            ].every((border) => border === '2px')
          );
        }),
      )
      .toBe(true);
  }
  await portal.screenshot({
    path: testInfo.outputPath('document-search-outline.png'),
  });
});

test('Parts, Documents, and Change Requests start guidance on entry and Escape does not restart it', async ({
  guide,
}) => {
  const { portal, panel, command } = guide;
  await panel.evaluate(() =>
    chrome.storage.local.remove('guidance:autoStart:v1'),
  );
  await portal.reload();
  const overlay = portal.locator('#smartguide-overlay');
  await expect(overlay.getByRole('heading')).toHaveText('Start a part record');
  await expect(portal.locator('dialog[open]')).toHaveCount(0);
  await portal.keyboard.press('Escape');
  await expect(overlay).toHaveCount(0);
  await portal.getByRole('heading', { name: 'Parts', exact: true }).click();
  expect((await command({ type: 'GET_CONTEXT' })).state.status).toBe(
    'cancelled',
  );
  await portal.locator('[data-guide="nav-documents"]').click();
  await expect(overlay.getByRole('heading')).toHaveText('Search the library');
  const search = portal.locator('[data-guide="document-search"]');
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('');
  await search.fill('bracket');
  await search.blur();
  await expect(overlay.getByRole('heading')).toHaveText(
    'Open the matching specification',
  );
  await portal.locator('[data-guide="nav-changes"]').click();
  await expect(overlay.getByRole('heading')).toHaveText(
    'Propose an engineering change',
  );
  await expect(portal.locator('dialog[open]')).toHaveCount(0);
  await portal.reload();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('paused');
  await expect(overlay).toHaveCount(0);
  await panel.evaluate(() =>
    chrome.storage.local.set({
      'guidance:publication:v1': { schemaVersion: 1, workflowIds: [] },
    }),
  );
  await portal.locator('[data-guide="nav-parts"]').click();
  await expect(
    portal.getByRole('heading', { name: 'Parts', exact: true }),
  ).toBeVisible();
  await expect(overlay).toHaveCount(0);
});

test('help panel is tall, anchored inside main, and paints above information annotations', async ({
  guide,
}, testInfo) => {
  const { portal, command } = guide;
  await command({ type: 'SET_INFORMATION_HIGHLIGHTS', enabled: true });
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(12);
  const informationZ = await portal
    .locator('#smartguide-information')
    .evaluate((node) => Number(getComputedStyle(node).zIndex));
  const launcher = portal.getByRole('button', {
    name: 'Help & Guidance',
    exact: true,
  });
  await launcher.click();
  await expect(portal.locator('#smartguide-information')).toHaveCount(0);
  expect((await command({ type: 'GET_CONTEXT' })).information).toMatchObject({
    enabled: true,
    suspended: true,
  });
  await expect(
    portal.getByRole('searchbox', { name: 'Search guides and documentation' }),
  ).toBeFocused();
  const help = portal.locator('#guidance-help .panel');
  const main = await portal.locator('#portal-main').boundingBox();
  const bounds = await help.boundingBox();
  const circle = await launcher.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(main!.x);
  expect(circle!.x).toBeGreaterThanOrEqual(main!.x);
  expect(circle!.x).toBeCloseTo(1440 * 0.2, 0);
  expect(bounds!.x).toBeCloseTo(circle!.x + circle!.width + 12, 0);
  expect(bounds!.x + bounds!.width).toBeLessThan(1440);
  expect(bounds!.y).toBe(60);
  expect(bounds!.height).toBe(645);
  expect(
    await launcher.evaluate((node) => {
      const css = getComputedStyle(node);
      return [css.display, css.alignItems, css.justifyContent, css.padding];
    }),
  ).toEqual(['flex', 'center', 'center', '0px']);
  const stacking = await portal.evaluate(() => {
    const host = document.getElementById('guidance-help')!;
    const panel = host.shadowRoot!.querySelector<HTMLElement>('.panel')!;
    const r = panel.getBoundingClientRect();
    return {
      help: Number(getComputedStyle(host).zIndex),
      top:
        document.elementFromPoint(
          r.left + r.width / 2,
          r.top + r.height / 2,
        ) === host,
    };
  });
  expect(stacking.help).toBeGreaterThan(informationZ);
  expect(stacking.top).toBe(true);
  await expect(
    portal.getByRole('link', { name: 'Process documentation', exact: true }),
  ).toHaveCount(0);
  await portal.screenshot({
    path: testInfo.outputPath('help-main-stacking.png'),
  });
  await portal.setViewportSize({ width: 600, height: 800 });
  const compact = await help.boundingBox();
  expect(compact!.x).toBeGreaterThanOrEqual(72);
  expect(compact!.x + compact!.width).toBeLessThanOrEqual(600);
  const compactCircle = await launcher.boundingBox();
  expect(compact!.x).toBeCloseTo(
    compactCircle!.x + compactCircle!.width + 12,
    0,
  );
  expect(compact!.y).toBe(60);
  expect(compact!.height).toBe(645);
  await portal.getByRole('button', { name: 'Close help', exact: true }).click();
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(12);
});

test('opening help hides a walkthrough overlay and closing it restores the same step', async ({
  guide,
}) => {
  const { portal, command } = guide;
  await command({ type: 'START_WORKFLOW', workflowId: 'create-part' });
  const overlay = portal.locator('#smartguide-overlay');
  await expect(overlay.getByRole('heading')).toHaveText('Start a part record');
  await portal
    .getByRole('button', { name: 'Help & Guidance', exact: true })
    .click();
  await expect(overlay).toBeHidden();
  expect((await command({ type: 'GET_CONTEXT' })).state).toMatchObject({
    status: 'running',
    stepIndex: 0,
  });
  await portal.getByRole('button', { name: 'Close help', exact: true }).click();
  await expect(overlay).toBeVisible();
  await expect(overlay.getByRole('heading')).toHaveText('Start a part record');
});
