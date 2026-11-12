import { test, expect } from './extension-fixture';

test('tour restores Details when started from Participants and unsupported routes show no executable guidance', async ({
  guide,
}) => {
  const { portal } = guide;
  await portal.goto('/#/task');
  await portal.getByRole('tab', { name: 'Setup Participants' }).click();
  await portal
    .getByRole('button', { name: "See what's new with this task" })
    .click();
  await portal
    .locator('#smartguide-overlay')
    .getByRole('button', { name: 'Next', exact: true })
    .click();
  await expect(
    portal.getByRole('tab', { name: 'Details', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(
    portal.locator('#smartguide-overlay').getByRole('heading'),
  ).toHaveText('Updated task instructions');
  await portal.goto('/#/unconfigured');
  await expect(portal.locator('#smartguide-overlay')).toHaveCount(0);
  await portal
    .getByRole('button', { name: 'Help & Guidance', exact: true })
    .click();
  await expect(
    portal.getByText('No field guidance is configured for this page.'),
  ).toBeVisible();
  await expect(
    portal.getByRole('button', { name: 'Create a new part', exact: true }),
  ).toHaveCount(0);
  await expect(
    portal.getByRole('region', { name: 'Release announcement' }),
  ).toBeHidden();
});

test('collaboration task and rename work independently without the extension', async ({
  page,
}) => {
  await page.goto('/#/task');
  await page.getByRole('tab', { name: 'Setup Participants' }).click();
  await page.getByRole('button', { name: 'Customize tab' }).click();
  await page.getByRole('button', { name: 'Rename', exact: true }).click();
  const input = page.locator('[data-guide="tab-name"]');
  await expect(input).toHaveValue('Setup Participants');
  await input.fill('Sample review group');
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(
    page.getByRole('tab', { name: 'Sample review group' }),
  ).toBeVisible();
  await expect(page.locator('#guidance-help')).toHaveCount(0);
});

test('floating help completes the collaboration and linked rename flow without the panel', async ({
  guide,
}, testInfo) => {
  const { portal, panel } = guide;
  await panel.close();
  await portal.goto('/#/task');
  await portal
    .getByRole('button', { name: "See what's new with this task" })
    .click();
  const overlay = portal.locator('#smartguide-overlay');
  await expect(overlay.getByRole('heading')).toHaveText('See what is new');
  await overlay.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(overlay.getByRole('heading')).toHaveText(
    'Updated task instructions',
  );
  await overlay.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(
    portal.getByRole('tab', { name: 'Setup Participants' }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(overlay.getByRole('heading')).toHaveText('Participant guidance');
  await portal.screenshot({
    path: testInfo.outputPath('collaboration-guidance.png'),
    fullPage: true,
  });
  await overlay.getByRole('button', { name: 'Next', exact: true }).click();
  await overlay.getByRole('button', { name: 'Show me how' }).click();
  await expect(overlay.getByRole('heading')).toHaveText('Customize this tab');
  await expect(portal.locator('#guidance-help .panel')).toBeHidden();
  // Wrong clicks cannot skip interactive steps.
  await portal.getByRole('heading', { name: 'Participant setup' }).click();
  await expect(overlay.getByRole('heading')).toHaveText('Customize this tab');
  await portal.getByRole('button', { name: 'Customize tab' }).click();
  await portal.getByRole('button', { name: 'Rename', exact: true }).click();
  await expect(portal.locator('[data-guide="tab-name"]')).toHaveValue(
    'Review team',
  );
  await expect(overlay.getByRole('heading')).toHaveText('Confirm the new name');
  await expect(
    portal.getByRole('tab', { name: 'Setup Participants' }),
  ).toBeVisible();
  await portal.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(
    portal.getByRole('tab', { name: 'Review team', exact: true }),
  ).toBeVisible();
  await expect(
    portal.getByText("Well done! You're finished.", { exact: true }),
  ).toBeVisible();
  await expect(overlay).toHaveCount(0);
});

test('release acknowledgment persists and reset is explicit', async ({
  guide,
}) => {
  const { portal, panel } = guide;
  await portal.goto('/#/dashboard');
  const announcement = portal.getByRole('region', {
    name: 'Release announcement',
  });
  await expect(announcement).toBeVisible();
  await announcement
    .getByRole('button', { name: 'Close announcement' })
    .click();
  await portal.reload();
  await expect(announcement).toBeVisible();
  await announcement
    .getByRole('button', { name: 'Acknowledge', exact: true })
    .click();
  await expect(announcement).toBeHidden();
  await portal.reload();
  await expect(
    portal.getByRole('button', { name: 'Help & Guidance', exact: true }),
  ).toBeVisible();
  await expect(announcement).toBeHidden();
  await panel
    .getByRole('button', { name: 'Reset release announcement for demo' })
    .click();
  await expect(announcement).toBeVisible();
});

test('participant SmartTip links to working sample documentation', async ({
  guide,
}) => {
  const { portal } = guide;
  await portal.goto('/#/task');
  await portal.getByRole('tab', { name: 'Setup Participants' }).click();
  await portal
    .getByRole('button', { name: 'Help & Guidance', exact: true })
    .click();
  await portal.getByRole('button', { name: 'Close help', exact: true }).click();
  await portal
    .getByRole('button', { name: /Participant Instructions/i })
    .click();
  const link = portal
    .locator('#information-tooltip')
    .getByRole('link', { name: 'View sample process guide', exact: true });
  await expect(link).toHaveAttribute(
    'href',
    'http://127.0.0.1:5173/#/documentation',
  );
  const popupPromise = portal.waitForEvent('popup');
  await link.click();
  const popup = await popupPromise;
  await expect(
    popup.getByRole('heading', { name: 'Sample process guide' }),
  ).toBeVisible();
});

test('cancelled rename leaves no guide and keeps the original tab name', async ({
  guide,
}) => {
  const { portal } = guide;
  await portal.goto('/#/task');
  await portal.getByRole('tab', { name: 'Setup Participants' }).click();
  await portal
    .getByRole('button', { name: 'Help & Guidance', exact: true })
    .click();
  await portal
    .getByRole('button', { name: 'Rename a tab', exact: true })
    .click();
  await portal.getByRole('button', { name: 'Customize tab' }).click();
  await portal.getByRole('button', { name: 'Rename', exact: true }).click();
  await expect(portal.locator('[data-guide="tab-name"]')).toHaveValue(
    'Review team',
  );
  await portal.locator('[data-guide="rename-cancel"]').click();
  await expect(portal.locator('#smartguide-overlay')).toHaveCount(0);
  await expect(
    portal.getByRole('tab', { name: 'Setup Participants' }),
  ).toBeVisible();
});
