import { test, expect } from './extension-fixture';

test('Overview highlights entire cards and uses theme-colored links after dismissing the announcement', async ({
  guide,
}, testInfo) => {
  const { portal } = guide;
  await portal.goto('/#/dashboard');
  const release = portal.getByRole('region', { name: 'Release announcement' });
  await expect(release).toBeVisible();
  await expect(portal.locator('#smartguide-information')).toHaveCount(0);
  await release
    .getByRole('button', { name: 'Acknowledge', exact: true })
    .click();
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(4);
  await expect
    .poll(() =>
      portal.evaluate(() => {
        const ids = [
          'overview-task',
          'overview-parts-count',
          'overview-documents-count',
          'overview-changes-count',
        ];
        const shadow = document.getElementById(
          'smartguide-information',
        )?.shadowRoot;
        return ids.every((id) => {
          const card = document.querySelector<HTMLElement>(
            `[data-info="${id}"]`,
          );
          const ring = shadow?.querySelector<HTMLElement>(
            `.info-ring[data-info-id="${id}"]`,
          );
          if (!card || !ring) return false;
          const actual = ring.getBoundingClientRect();
          const expected = card.getBoundingClientRect();
          return (
            (['top', 'right', 'bottom', 'left'] as const).every(
              (side) => Math.abs(actual[side] - expected[side]) < 1,
            ) && getComputedStyle(ring).borderTopWidth === '2px'
          );
        });
      }),
    )
    .toBe(true);
  expect(
    await portal
      .locator('.dashboard-tasks a')
      .first()
      .evaluate((node) => getComputedStyle(node).color),
  ).toBe('rgb(33, 93, 70)');
  await portal.getByRole('button', { name: /^Explain My tasks:/ }).focus();
  const tip = portal.getByRole('tooltip');
  await expect(tip).toContainText('sample collaboration task');
  await expect(
    tip.getByRole('link', { name: 'View sample process guide' }),
  ).toHaveAttribute('href', 'http://127.0.0.1:5173/#/documentation');
  expect(
    await tip
      .getByRole('link', { name: 'View sample process guide' })
      .evaluate((node) => getComputedStyle(node).color),
  ).toBe('rgb(33, 93, 70)');
  await portal.screenshot({
    path: testInfo.outputPath('overview-highlights.png'),
    fullPage: true,
  });
  await portal
    .getByRole('button', { name: 'Help & Guidance', exact: true })
    .click();
  await expect(portal.locator('#smartguide-information')).toHaveCount(0);
  await portal.getByRole('button', { name: 'Close help', exact: true }).click();
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(4);
});

test('question mark opens searchable guidance; highlights appear automatically and Escape dismisses them', async ({
  guide,
}) => {
  const { portal } = guide;
  await portal.reload();
  await expect(
    portal.locator('#smartguide-information .info-icon'),
  ).toHaveCount(12);
  await portal
    .getByRole('button', { name: 'Help & Guidance', exact: true })
    .click();
  const search = portal.getByRole('searchbox', {
    name: 'Search guides and documentation',
  });
  await expect(search).toBeFocused();
  await search.fill('no such workflow');
  await expect(
    portal.getByText('No matching help on this page. Try another search.'),
  ).toBeVisible();
  await expect(
    portal.getByRole('button', { name: 'Create a new part', exact: true }),
  ).toHaveCount(0);
  await search.fill('part');
  await expect(
    portal.getByRole('button', { name: 'Create a new part', exact: true }),
  ).toBeVisible();
  await portal.keyboard.press('Escape');
  await expect(search).toBeHidden();
  await portal.keyboard.press('Escape');
  await expect(portal.locator('#smartguide-information')).toHaveCount(0);
});

test('admin publishes workflow availability and opens developer documentation separately from users', async ({
  guide,
}, testInfo) => {
  const { portal, panel } = guide;
  await expect(
    panel.getByRole('heading', { name: 'Manage guidance', exact: true }),
  ).toBeVisible();
  const selection = panel.getByRole('group', { name: 'Published workflows' });
  await selection
    .getByRole('checkbox', { name: 'Create a new part', exact: true })
    .uncheck();
  await panel.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(
    panel.getByRole('heading', { name: 'Sample documentation', exact: true }),
  ).toBeVisible();
  await expect(
    panel.getByRole('heading', { name: 'Add a workflow', exact: true }),
  ).toBeVisible();
  await panel.screenshot({
    path: testInfo.outputPath('admin-documentation.png'),
  });
  await portal
    .getByRole('button', { name: 'Help & Guidance', exact: true })
    .click();
  await expect(
    portal.getByRole('button', { name: 'Create a new part', exact: true }),
  ).toHaveCount(0);
  await expect(
    portal.getByRole('button', { name: 'Publish', exact: true }),
  ).toHaveCount(0);
  await selection
    .getByRole('checkbox', { name: 'Create a new part', exact: true })
    .check();
  await panel.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(
    portal.getByRole('button', { name: 'Create a new part', exact: true }),
  ).toBeVisible();
  await selection
    .getByRole('checkbox', { name: 'Rename a tab', exact: true })
    .uncheck();
  await panel.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(
    panel.getByText(
      'Include Rename a tab when publishing the linked collaboration tour.',
    ),
  ).toBeVisible();
});

test('release actions align and Overview cards have consistent spacing and typography', async ({
  guide,
}, testInfo) => {
  const { portal } = guide;
  await portal.goto('/#/dashboard');
  const notice = portal.getByRole('region', { name: 'Release announcement' });
  await expect(notice).toBeVisible();
  const acknowledge = await notice
    .getByRole('button', { name: 'Acknowledge', exact: true })
    .boundingBox();
  const close = await notice
    .getByRole('button', { name: 'Close announcement', exact: true })
    .boundingBox();
  expect(acknowledge).not.toBeNull();
  expect(close).not.toBeNull();
  expect(Math.abs(acknowledge!.y - close!.y)).toBeLessThanOrEqual(1);
  expect(
    close!.x - (acknowledge!.x + acknowledge!.width),
  ).toBeGreaterThanOrEqual(10);
  const tasks = await portal.locator('.dashboard-tasks').boundingBox();
  const stats = await portal.locator('.stats').boundingBox();
  expect(stats!.y - (tasks!.y + tasks!.height)).toBeGreaterThanOrEqual(24);
  expect(
    await portal
      .locator('.page-heading p')
      .evaluate((node) => getComputedStyle(node).fontSize),
  ).toBe('15px');
  await portal.screenshot({
    path: testInfo.outputPath('overview-release.png'),
    fullPage: true,
  });
  await notice
    .getByRole('button', { name: 'Acknowledge', exact: true })
    .click();
  await portal.screenshot({
    path: testInfo.outputPath('overview-spacing.png'),
    fullPage: true,
  });
  await portal.setViewportSize({ width: 600, height: 800 });
  await portal
    .getByRole('button', { name: 'Help & Guidance', exact: true })
    .click();
  await portal.screenshot({
    path: testInfo.outputPath('help-search-compact.png'),
    fullPage: true,
  });
  await portal.goto('/#/task');
  await portal.getByRole('tab', { name: 'Setup Participants' }).click();
  await portal.getByRole('button', { name: 'Customize tab' }).click();
  await portal.getByRole('button', { name: 'Rename', exact: true }).click();
  const ok = await portal.locator('[data-guide="rename-ok"]').boundingBox();
  const cancel = await portal
    .locator('[data-guide="rename-cancel"]')
    .boundingBox();
  expect(Math.abs(ok!.y - cancel!.y)).toBeLessThanOrEqual(1);
  expect(ok!.height).toBe(cancel!.height);
  await portal.screenshot({
    path: testInfo.outputPath('rename-dialog-compact.png'),
  });
});
