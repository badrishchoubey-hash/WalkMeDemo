import { test, expect } from '@playwright/test';
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
