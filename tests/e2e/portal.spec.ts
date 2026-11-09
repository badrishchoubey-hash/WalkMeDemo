import { test, expect } from '@playwright/test';
test('part number pattern compiles in Unicode Sets mode and blocks invalid values', async ({
  page,
}) => {
  const patternErrors: string[] = [];
  page.on('console', (message) => {
    if (/Pattern attribute|Invalid regular expression/.test(message.text()))
      patternErrors.push(message.text());
  });
  page.on('pageerror', (error) => patternErrors.push(error.message));
  await page.goto('/#/parts');
  await page.getByRole('button', { name: 'Create part' }).click();
  const number = page.getByLabel('Part number');
  // HTML pattern uses v mode, which has stricter literal-hyphen escaping rules.
  expect(
    await number.evaluate((input) =>
      new RegExp(input.getAttribute('pattern') ?? '', 'v').test('PRT-123Ab'),
    ),
  ).toBe(true);
  await page.getByLabel('Part name').fill('Pattern regression bracket');
  await page.getByLabel('Category').selectOption('Mechanical');
  await page
    .getByLabel('Description')
    .fill('Validates the real browser constraint API.');
  for (const invalid of ['PRT bad', 'PRT_123', 'PRT!123']) {
    await number.fill(invalid);
    expect(
      await number.evaluate((input) =>
        (input as HTMLInputElement).checkValidity(),
      ),
    ).toBe(false);
    expect(
      await number.evaluate(
        (input) => (input as HTMLInputElement).validity.patternMismatch,
      ),
    ).toBe(true);
    await page.getByRole('button', { name: 'Review part' }).click();
    await expect(
      page.getByRole('heading', { name: 'Create part', exact: true }),
    ).toBeVisible();
  }
  await number.fill('PRT-123Ab');
  expect(
    await number.evaluate((input) =>
      (input as HTMLInputElement).checkValidity(),
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Review part' }).click();
  await expect(
    page.getByRole('heading', { name: 'Review before creating' }),
  ).toBeVisible();
  expect(patternErrors).toEqual([]);
});
test('portal works without an extension; creation needs review and confirmation', async ({
  page,
}) => {
  await page.goto('/#/parts');
  await page.getByRole('button', { name: 'Create part' }).click();
  await page.getByLabel('Part name').fill('E2E test bracket');
  await page.getByLabel('Part number').fill('PRT-E2E');
  await page.getByLabel('Category').selectOption('Mechanical');
  await page.getByLabel('Description').fill('Synthetic test record');
  await page.getByRole('button', { name: 'Review part' }).click();
  await expect(
    page.getByRole('heading', { name: 'Review before creating' }),
  ).toBeVisible();
  await expect(page.locator('tbody')).not.toContainText('PRT-E2E');
  await page.getByRole('button', { name: 'Confirm create' }).click();
  await expect(page.locator('[data-guide="part-success"]')).toContainText(
    'PRT-E2E',
  );
  await page.reload();
  await expect(page.locator('tbody')).toContainText('PRT-E2E');
});
test('required fields and duplicate numbers are rejected', async ({ page }) => {
  await page.goto('/#/parts');
  await page.getByRole('button', { name: 'Create part' }).click();
  await page.getByRole('button', { name: 'Review part' }).click();
  await expect(
    page.getByRole('heading', { name: 'Create part', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Part name').fill('Duplicate');
  await page.getByLabel('Part number').fill('PRT-1001');
  await page.getByLabel('Category').selectOption('Mechanical');
  await page.getByLabel('Description').fill('Duplicate test');
  await page.getByRole('button', { name: 'Review part' }).click();
  await page.getByRole('button', { name: 'Confirm create' }).click();
  await expect(page.getByRole('alert')).toContainText('already exists');
});
test('documents support delayed search and a detail view', async ({ page }) => {
  await page.goto('/#/documents');
  await page.getByRole('textbox', { name: 'Search documents' }).fill('bracket');
  await page
    .getByRole('button', { name: /Mounting bracket specification/ })
    .click();
  await expect(page.locator('[data-guide="document-detail"]')).toContainText(
    'aluminium 6061-T6',
  );
});
test('change request remains unsaved until explicit confirmation', async ({
  page,
}) => {
  await page.goto('/#/changes');
  await page.getByRole('button', { name: 'New change request' }).click();
  await page.getByLabel('Change title').fill('E2E durability improvement');
  await page.getByLabel('Affected part').selectOption('PRT-1001');
  await page.getByLabel('Reason for change').fill('Reduce vibration');
  await page.getByRole('button', { name: 'Review request' }).click();
  await expect(page.locator('tbody')).not.toContainText(
    'E2E durability improvement',
  );
  await page.getByRole('button', { name: 'Confirm create' }).click();
  await expect(page.locator('[data-guide="change-success"]')).toBeVisible();
});

test('portal restores its own draft without an extension and removes it when closed', async ({
  page,
}) => {
  await page.goto('/#/parts');
  await page.getByRole('button', { name: 'Create part' }).click();
  await page.getByLabel('Part name').fill('Independent draft');
  await page.reload();
  await expect(page.getByLabel('Part name')).toHaveValue('Independent draft');
  await expect(page.locator('tbody tr')).toHaveCount(4);
  await page.getByRole('button', { name: 'Close form' }).click();
  await page.reload();
  await expect(page.locator('dialog')).toHaveCount(0);
  await expect(page.locator('tbody tr')).toHaveCount(4);
});
