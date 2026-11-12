import { test, expect } from './extension-fixture';

test('admin creates, publishes, executes, edits and restores a custom guide without rebuilding', async ({
  guide,
}, testInfo) => {
  const { panel, portal, command } = guide;
  await panel
    .getByRole('button', { name: 'Create workflow', exact: true })
    .click();
  const editor = panel.getByRole('form', { name: 'Workflow editor' });
  await editor
    .getByLabel('Workflow name', { exact: true })
    .fill('Review overview tasks');
  await editor
    .getByLabel('Workflow description', { exact: true })
    .fill('A locally authored overview tour.');
  const step = editor.getByRole('group', { name: 'Step 1', exact: true });
  await step.getByLabel('Step title', { exact: true }).fill('Review your work');
  await step
    .getByLabel('Instructions', { exact: true })
    .fill('Check the sample task before opening it.');
  await step
    .getByLabel('Target selector', { exact: true })
    .fill('[data-info="overview-task"]');
  await editor.getByRole('button', { name: 'Add step', exact: true }).click();
  const second = editor.getByRole('group', { name: 'Step 2', exact: true });
  await second
    .getByLabel('Step title', { exact: true })
    .fill('Review part totals');
  await second
    .getByLabel('Instructions', { exact: true })
    .fill('Review the number of sample parts.');
  await second
    .getByLabel('Target selector', { exact: true })
    .fill('[data-info="overview-parts-count"]');
  await editor
    .getByRole('button', { name: 'Move step 2 up', exact: true })
    .click();
  await expect(
    editor
      .getByRole('group', { name: 'Step 1', exact: true })
      .getByLabel('Step title', { exact: true }),
  ).toHaveValue('Review part totals');
  await editor
    .getByRole('button', { name: 'Move step 1 down', exact: true })
    .click();
  await editor.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(
    panel.getByText(
      'Draft saved. Choose Publish to make this workflow available to users.',
    ),
  ).toBeVisible();
  await portal.goto('/#/dashboard');
  await portal
    .getByRole('region', { name: 'Release announcement' })
    .getByRole('button', { name: 'Acknowledge', exact: true })
    .click();
  const launcher = portal.getByRole('button', {
    name: 'Help & Guidance',
    exact: true,
  });
  await launcher.click();
  await expect(
    portal.getByRole('button', { name: 'Review overview tasks', exact: true }),
  ).toHaveCount(0);
  await panel.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(
    portal.getByRole('button', { name: 'Review overview tasks', exact: true }),
  ).toBeVisible();
  await portal
    .getByRole('button', { name: 'Review overview tasks', exact: true })
    .click();
  const overlay = portal.locator('#smartguide-overlay');
  await expect(overlay.getByRole('heading')).toHaveText('Review your work');
  expect(
    (await command({ type: 'GET_CONTEXT' })).recoveryWarning,
  ).toBeUndefined();
  await portal.reload();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('paused');
  await command({ type: 'RESUME_WORKFLOW' });
  await expect(overlay.getByRole('heading')).toHaveText('Review your work');
  await overlay.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(overlay.getByRole('heading')).toHaveText('Review part totals');
  await overlay.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(
    portal.getByText("Well done! You're finished.", { exact: true }),
  ).toBeVisible();
  await panel
    .getByRole('button', { name: 'Edit selected workflow', exact: true })
    .click();
  await editor
    .getByLabel('Workflow name', { exact: true })
    .fill('Updated overview tour');
  await editor
    .getByRole('group', { name: 'Step 1', exact: true })
    .getByLabel('Step title', { exact: true })
    .fill('Updated review instructions');
  await editor.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(
    portal.getByRole('button', { name: 'Review overview tasks', exact: true }),
  ).toBeVisible();
  await expect(
    portal.getByRole('button', { name: 'Updated overview tour', exact: true }),
  ).toHaveCount(0);
  await panel.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(
    portal.getByRole('button', { name: 'Updated overview tour', exact: true }),
  ).toBeVisible();
  await portal
    .getByRole('button', { name: 'Updated overview tour', exact: true })
    .click();
  await expect(overlay.getByRole('heading')).toHaveText(
    'Updated review instructions',
  );
  await panel.reload();
  await expect(
    panel
      .getByRole('group', { name: 'Published workflows' })
      .getByRole('checkbox', { name: 'Updated overview tour', exact: true }),
  ).toBeChecked();
  await panel
    .getByLabel('Workflow to edit', { exact: true })
    .selectOption({ label: 'Updated overview tour · Draft saved' });
  await panel
    .getByRole('button', { name: 'Edit selected workflow', exact: true })
    .click();
  await expect(editor.getByLabel('Workflow name', { exact: true })).toHaveValue(
    'Updated overview tour',
  );
  await panel.screenshot({
    path: testInfo.outputPath('workflow-editor.png'),
    fullPage: true,
  });
});

test('existing workflow edits stay draft until publication and invalid targets are rejected', async ({
  guide,
}) => {
  const { panel, portal, command } = guide;
  await panel
    .getByLabel('Workflow to edit', { exact: true })
    .selectOption('find-document');
  await panel
    .getByRole('button', { name: 'Edit selected workflow', exact: true })
    .click();
  const editor = panel.getByRole('form', { name: 'Workflow editor' });
  await editor
    .getByLabel('Workflow name', { exact: true })
    .fill('Find a controlled document');
  const step = editor.getByRole('group', { name: 'Step 1', exact: true });
  await step
    .getByLabel('Step title', { exact: true })
    .fill('Search using the document title');
  await step.getByLabel('Target selector', { exact: true }).fill('body');
  await editor.getByRole('button', { name: 'Save draft', exact: true }).click();
  await expect(editor.getByRole('alert')).toContainText('Use an element ID');
  await step
    .getByLabel('Target selector', { exact: true })
    .fill('[data-guide="document-search"]');
  await editor.getByRole('button', { name: 'Save draft', exact: true }).click();
  await portal.goto('/#/documents');
  await portal
    .getByRole('button', { name: 'Help & Guidance', exact: true })
    .click();
  await expect(
    portal.getByRole('button', {
      name: 'Find an engineering document',
      exact: true,
    }),
  ).toBeVisible();
  await panel.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(
    portal.getByRole('button', {
      name: 'Find a controlled document',
      exact: true,
    }),
  ).toBeVisible();
  await portal
    .getByRole('button', { name: 'Find a controlled document', exact: true })
    .click();
  await expect(
    portal.locator('#smartguide-overlay').getByRole('heading'),
  ).toHaveText('Search using the document title');
  expect((await command({ type: 'GET_CONTEXT' })).state.workflowId).toBe(
    'find-document',
  );
  await panel
    .getByRole('button', { name: 'Edit selected workflow', exact: true })
    .click();
  await editor
    .getByLabel('Workflow name', { exact: true })
    .fill('Updated live document guide');
  await editor.getByRole('button', { name: 'Save draft', exact: true }).click();
  await panel.getByRole('button', { name: 'Publish', exact: true }).click();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('cancelled');
  await expect(portal.locator('#smartguide-overlay')).toHaveCount(0);
  expect((await command({ type: 'GET_CONTEXT' })).state.error).toContain(
    'guide was updated',
  );
});
