import { test, expect } from './extension-fixture';

test('completed guide offers optional rating and comments saved locally', async ({
  guide,
}) => {
  const { portal, panel, command, step } = guide;
  await portal.goto('/#/documents');
  await command({ type: 'START_WORKFLOW', workflowId: 'find-document' });
  const feedbackLink = portal.getByRole('button', {
    name: 'Give feedback on this walkthrough',
  });
  await expect(feedbackLink).toHaveCount(0);
  await portal
    .getByRole('textbox', { name: 'Search documents' })
    .fill('bracket');
  await portal.getByRole('heading', { name: 'Documents', exact: true }).click();
  await step(1);
  await portal
    .getByRole('button', { name: /Mounting bracket specification/ })
    .click();
  await expect(feedbackLink).toBeVisible();
  const help = portal.locator('#guidance-help .panel');
  await expect(help).not.toBeVisible();
  const completion = portal.getByRole('region', {
    name: 'Walkthrough complete',
    exact: true,
  });
  await expect(
    completion.getByRole('button', { name: 'Done', exact: true }),
  ).toBeVisible();
  await feedbackLink.click();
  const dialog = portal.getByRole('dialog', { name: 'Workflow feedback' });
  await dialog.getByRole('button', { name: 'Save feedback' }).click();
  await expect(dialog.getByRole('status')).toContainText('Choose a rating');
  await dialog.getByRole('radio', { name: '4 out of 5' }).check();
  await dialog
    .getByLabel('Comments (optional)')
    .fill('The search guidance helped.');
  await dialog.getByRole('button', { name: 'Save feedback' }).click();
  await expect(dialog.getByRole('status')).toContainText(
    'saved in this browser',
  );
  const stored = await panel.evaluate(
    async () =>
      (await chrome.storage.local.get('guidance:feedback:v1:find-document'))[
        'guidance:feedback:v1:find-document'
      ],
  );
  expect(stored).toMatchObject({
    workflowId: 'find-document',
    rating: 4,
    comment: 'The search guidance helped.',
  });
  await dialog.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(feedbackLink).toBeFocused();
  await feedbackLink.click();
  await portal.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(feedbackLink).toBeVisible();
  expect((await command({ type: 'GET_CONTEXT' })).state.status).toBe(
    'completed',
  );
  await completion.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(completion).not.toBeVisible();
  await expect(help).not.toBeVisible();
  await portal
    .getByRole('button', { name: 'Help & Guidance', exact: true })
    .click();
  await expect(help).toBeVisible();
});
