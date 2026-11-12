import { test, expect } from './extension-fixture';

test('user and developer switch uses the configured local portal', async ({
  guide,
}) => {
  const { panel } = guide;
  const entry = new URL(panel.url());
  entry.hash = '';
  await panel.goto(entry.href);
  await expect(
    panel.getByRole('button', { name: 'User', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    panel.getByRole('heading', { name: 'Get guidance on your portal' }),
  ).toBeVisible();
  await expect(
    panel.getByRole('link', { name: 'Open user experience' }),
  ).toHaveAttribute('href', 'http://127.0.0.1:5173/#/dashboard');
  await expect(
    panel.getByRole('button', { name: 'Create workflow', exact: true }),
  ).toHaveCount(0);
  await panel.getByText('Run with the local portal', { exact: true }).click();
  await expect(
    panel.getByText('npm run build:extension', { exact: true }),
  ).toBeVisible();
  await panel.getByRole('button', { name: 'Developer', exact: true }).click();
  await expect(
    panel.getByRole('button', { name: 'Create workflow', exact: true }),
  ).toBeVisible();
  await panel.getByRole('button', { name: 'User', exact: true }).click();
  await expect(
    panel.getByRole('heading', { name: 'Get guidance on your portal' }),
  ).toBeVisible();
  await panel.reload();
  await expect(
    panel.getByRole('button', { name: 'User', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await panel.getByRole('button', { name: 'Developer', exact: true }).click();
  await expect(
    panel.getByRole('button', { name: 'Publish', exact: true }),
  ).toBeVisible();
});
