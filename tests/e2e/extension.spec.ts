import { test as base, chromium, expect } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import path from 'node:path';
import type {
  Command,
  Context,
  Reply,
} from '../../packages/shared/workflow-types';

type Harness = {
  browser: BrowserContext;
  portal: Page;
  panel: Page;
  command: (command: Command) => Promise<Context>;
  step: (index: number) => Promise<void>;
};
const test = base.extend<{ guide: Harness }>({
  guide: async ({ browserName }, use, testInfo) => {
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
        viewport: { width: 1440, height: 960 },
      },
    );
    try {
      let worker = browser.serviceWorkers()[0];
      worker ??= await browser.waitForEvent('serviceworker');
      const id = new URL(worker.url()).host;
      const portal = await browser.newPage();
      await portal.goto('http://127.0.0.1:5173/#/parts');
      const panel = await browser.newPage();
      await panel.goto(`chrome-extension://${id}/sidepanel.html`);
      async function command(command: Command): Promise<Context> {
        await portal.bringToFront();
        const reply = await panel.evaluate(
          async (value) =>
            (await chrome.runtime.sendMessage({
              channel: 'smartguide',
              requestId: crypto.randomUUID(),
              command: value,
            })) as Reply,
          command,
        );
        if (!reply.ok) throw new Error(reply.error);
        return reply.context;
      }
      await expect
        .poll(async () => {
          try {
            return (await command({ type: 'GET_CONTEXT' })).route;
          } catch {
            return 'waiting';
          }
        })
        .toBe('parts');
      const step = async (index: number) => {
        await expect
          .poll(
            async () =>
              (await command({ type: 'GET_CONTEXT' })).state.stepIndex,
          )
          .toBe(index);
      };
      await use({ browser, portal, panel, command, step });
    } finally {
      await browser.close();
    }
  },
});

test('real extension messaging, React autofill, explicit confirmation, cleanup and restart', async ({
  guide,
}) => {
  const { portal, panel, command, step } = guide;
  await command({ type: 'START_WORKFLOW', workflowId: 'create-part' });
  await expect(portal.locator('#smartguide-overlay')).toBeAttached();
  await portal.getByRole('heading', { name: 'Parts', exact: true }).click();
  await step(0);
  await portal.getByRole('button', { name: 'Create part' }).click();
  await step(1);
  await expect
    .poll(
      async () =>
        await portal.locator('#smartguide-overlay .tip').evaluate((tip) => {
          const bounds = tip.getBoundingClientRect();
          return document.elementFromPoint(bounds.left + 10, bounds.top + 10)
            ?.id;
        }),
    )
    .toBe('smartguide-overlay');
  await command({ type: 'AUTOFILL' });
  await step(5);
  await expect(portal.getByLabel('Part name')).toHaveValue(
    'Precision mounting bracket',
  );
  await expect(portal.locator('[data-guide="part-success"]')).toHaveCount(0);
  await portal.getByRole('button', { name: 'Review part' }).click();
  await step(6);
  await expect(portal.locator('[data-guide="part-success"]')).toHaveCount(0);
  await portal.getByRole('button', { name: 'Confirm create' }).click();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('completed');
  await expect(portal.locator('#smartguide-overlay')).toHaveCount(0);
  await expect(
    panel.getByText('Workflow complete.', { exact: true }),
  ).toBeVisible();
  await command({ type: 'START_WORKFLOW', workflowId: 'create-part' });
  await step(0);
  await command({ type: 'CANCEL_WORKFLOW' });
  await expect(portal.locator('#smartguide-overlay')).toHaveCount(0);
});
test('document guide waits for async results and detects details', async ({
  guide,
}) => {
  const { portal, command, step } = guide;
  await portal.goto('http://127.0.0.1:5173/#/documents');
  await command({ type: 'START_WORKFLOW', workflowId: 'find-document' });
  await portal
    .getByRole('textbox', { name: 'Search documents' })
    .fill('bracket');
  await portal.getByRole('heading', { name: 'Documents', exact: true }).click();
  await step(1);
  await portal
    .getByRole('button', { name: /Mounting bracket specification/ })
    .click();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('completed');
});
test('change request uses the same engine', async ({ guide }) => {
  const { portal, command, step } = guide;
  await portal.goto('http://127.0.0.1:5173/#/changes');
  await command({ type: 'START_WORKFLOW', workflowId: 'create-change' });
  await portal.getByRole('button', { name: 'New change request' }).click();
  await step(1);
  await command({ type: 'AUTOFILL' });
  await step(4);
  await portal.getByRole('button', { name: 'Review request' }).click();
  await step(5);
  await portal.getByRole('button', { name: 'Confirm create' }).click();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('completed');
});
test('pause removes guidance; resume resolves replacement; route and reload reset safely', async ({
  guide,
}) => {
  const { portal, command } = guide;
  await command({ type: 'START_WORKFLOW', workflowId: 'create-part' });
  await command({ type: 'PAUSE_WORKFLOW' });
  await expect(portal.locator('#smartguide-overlay')).toHaveCount(0);
  await portal
    .locator('[data-guide="create-part"]')
    .evaluate((element) => element.replaceWith(element.cloneNode(true)));
  await command({ type: 'RESUME_WORKFLOW' });
  await expect(portal.locator('#smartguide-overlay')).toBeAttached();
  await portal.locator('[data-guide="nav-documents"]').click();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('cancelled');
  await expect(portal.locator('#smartguide-overlay')).toHaveCount(0);
  await portal.reload();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('idle');
});
test('missing target times out and retry recovers', async ({ guide }) => {
  const { portal, command } = guide;
  await command({ type: 'START_WORKFLOW', workflowId: 'create-part' });
  await portal
    .locator('[data-guide="create-part"]')
    .evaluate((element) => element.setAttribute('data-guide', 'missing'));
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status, {
      timeout: 15000,
    })
    .toBe('failed');
  await expect(portal.locator('#smartguide-overlay')).toHaveCount(0);
  await portal
    .locator('[data-guide="missing"]')
    .evaluate((element) => element.setAttribute('data-guide', 'create-part'));
  await command({ type: 'RETRY_STEP' });
  await expect(portal.locator('#smartguide-overlay')).toBeAttached();
  expect((await command({ type: 'GET_CONTEXT' })).state.status).toBe('running');
});
test('tab state is isolated and unsupported origins remain unchanged', async ({
  guide,
}) => {
  const { browser, portal, panel, command } = guide;
  await command({ type: 'START_WORKFLOW', workflowId: 'create-part' });
  const second = await browser.newPage();
  await second.goto('http://127.0.0.1:5173/#/documents');
  await second.bringToFront();
  const reply = await panel.evaluate(
    async () =>
      (await chrome.runtime.sendMessage({
        channel: 'smartguide',
        requestId: crypto.randomUUID(),
        command: { type: 'GET_CONTEXT' },
      })) as Reply,
  );
  expect(reply.ok && reply.context.state.status).toBe('idle');
  expect((await command({ type: 'GET_CONTEXT' })).state.status).toBe('running');
  await portal.reload();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state)
    .toMatchObject({
      status: 'paused',
      workflowId: 'create-part',
      stepIndex: 0,
    });
  await second.goto('about:blank');
  await expect(second.locator('#smartguide-overlay')).toHaveCount(0);
  await portal.bringToFront();
});

test('refresh restores the saved input step and unfinished form; resume does not autofill', async ({
  guide,
}, testInfo) => {
  const { portal, panel, command, step } = guide;
  await command({ type: 'START_WORKFLOW', workflowId: 'create-part' });
  await portal.getByRole('button', { name: 'Create part' }).click();
  await step(1);
  await portal.getByLabel('Part name').fill('My unfinished bracket');
  await portal.getByLabel('Part number').focus();
  await step(2);
  await portal.getByLabel('Part number').fill('PRT-DRAFT');
  await portal.reload();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state)
    .toMatchObject({ status: 'paused', stepIndex: 2, recovered: true });
  await expect(portal.getByLabel('Part name')).toHaveValue(
    'My unfinished bracket',
  );
  await expect(portal.getByLabel('Part number')).toHaveValue('PRT-DRAFT');
  await expect(portal.locator('#smartguide-overlay')).toHaveCount(0);
  await panel.setViewportSize({ width: 380, height: 900 });
  await expect(
    panel.getByRole('button', { name: 'Resume saved step' }),
  ).toBeVisible();
  await panel.screenshot({
    path: testInfo.outputPath('recovery-panel.png'),
    fullPage: true,
  });
  await command({ type: 'RESUME_WORKFLOW' });
  await step(2);
  await expect(portal.getByLabel('Part name')).toHaveValue(
    'My unfinished bracket',
  );
  await expect(portal.getByLabel('Category')).toHaveValue('');
  await expect(portal.locator('[data-guide="part-success"]')).toHaveCount(0);
});

test('refresh at confirmation restores review and requires another explicit user confirmation', async ({
  guide,
}) => {
  const { portal, command, step } = guide;
  await command({ type: 'START_WORKFLOW', workflowId: 'create-part' });
  await portal.getByRole('button', { name: 'Create part' }).click();
  await step(1);
  await command({ type: 'AUTOFILL' });
  await step(5);
  await portal.getByRole('button', { name: 'Review part' }).click();
  await step(6);
  await portal.reload();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state)
    .toMatchObject({ status: 'paused', stepIndex: 6 });
  await expect(
    portal.getByRole('heading', { name: 'Review before creating' }),
  ).toBeVisible();
  await expect(portal.locator('tbody tr')).toHaveCount(4);
  await command({ type: 'RESUME_WORKFLOW' });
  await step(6);
  await expect(portal.locator('tbody tr')).toHaveCount(4);
  await portal.getByRole('button', { name: 'Confirm create' }).click();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('completed');
  await expect(portal.locator('tbody tr')).toHaveCount(5);
  await portal.reload();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('completed');
  await expect(portal.locator('tbody tr')).toHaveCount(5);
});

test('missing restored target stays paused without replay, and cancel clears the checkpoint', async ({
  guide,
}) => {
  const { portal, command, step } = guide;
  await command({ type: 'START_WORKFLOW', workflowId: 'create-part' });
  await portal.getByRole('button', { name: 'Create part' }).click();
  await step(1);
  await command({ type: 'PAUSE_WORKFLOW' });
  await portal.evaluate(() => sessionStorage.clear());
  await portal.reload();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('paused');
  await expect(command({ type: 'RESUME_WORKFLOW' })).rejects.toThrow(
    'saved step is not available',
  );
  await expect(portal.locator('dialog')).toHaveCount(0);
  await command({ type: 'CANCEL_WORKFLOW' });
  await portal.reload();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('idle');
});

test('document search context and guide survive refresh', async ({ guide }) => {
  const { portal, command, step } = guide;
  await portal.goto('http://127.0.0.1:5173/#/documents');
  await command({ type: 'START_WORKFLOW', workflowId: 'find-document' });
  await portal
    .getByRole('textbox', { name: 'Search documents' })
    .fill('bracket');
  await portal.getByRole('heading', { name: 'Documents', exact: true }).click();
  await step(1);
  await portal.reload();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state)
    .toMatchObject({ status: 'paused', stepIndex: 1 });
  await expect(
    portal.getByRole('textbox', { name: 'Search documents' }),
  ).toHaveValue('bracket');
  await expect(portal.locator('[data-guide="document-result"]')).toBeVisible();
  await command({ type: 'RESUME_WORKFLOW' });
  await portal.locator('[data-guide="document-result"]').click();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('completed');
});

test('change review survives refresh without creating a request', async ({
  guide,
}) => {
  const { portal, command, step } = guide;
  await portal.goto('http://127.0.0.1:5173/#/changes');
  await command({ type: 'START_WORKFLOW', workflowId: 'create-change' });
  await portal.getByRole('button', { name: 'New change request' }).click();
  await step(1);
  await command({ type: 'AUTOFILL' });
  await step(4);
  await portal.getByRole('button', { name: 'Review request' }).click();
  await step(5);
  await portal.reload();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state)
    .toMatchObject({ status: 'paused', stepIndex: 5 });
  await expect(
    portal.getByRole('heading', { name: 'Review before creating' }),
  ).toBeVisible();
  await expect(portal.locator('tbody tr')).toHaveCount(1);
  await command({ type: 'RESUME_WORKFLOW' });
  await portal.getByRole('button', { name: 'Confirm create' }).click();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('completed');
});

test('incompatible stored checkpoint is discarded safely', async ({
  guide,
}) => {
  const { portal, panel, command } = guide;
  await command({ type: 'START_WORKFLOW', workflowId: 'create-part' });
  await panel.evaluate(async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const key = `smartguide:checkpoint:v1:${tab!.id}`;
    const stored = await chrome.storage.session.get(key);
    const checkpoint = stored[key];
    if (typeof checkpoint !== 'object' || checkpoint === null)
      throw new Error('Expected a saved checkpoint.');
    await chrome.storage.session.set({
      [key]: { ...checkpoint, workflowVersion: 99 },
    });
  });
  await portal.reload();
  await expect
    .poll(async () => (await command({ type: 'GET_CONTEXT' })).state.status)
    .toBe('idle');
  await expect(portal.locator('#smartguide-overlay')).toHaveCount(0);
});

test('storage failures are visible without breaking the running guide', async ({
  guide,
}) => {
  const { browser, portal, command } = guide;
  const worker = browser.serviceWorkers()[0]!;
  await worker.evaluate(() => {
    chrome.storage.session.set = async () => {
      throw new Error('Simulated storage failure');
    };
  });
  const result = await command({
    type: 'START_WORKFLOW',
    workflowId: 'create-part',
  });
  expect(result.recoveryWarning).toContain('refresh recovery is unavailable');
  expect(result.state.status).toBe('running');
  await expect(portal.locator('#smartguide-overlay')).toBeAttached();
  await command({ type: 'CANCEL_WORKFLOW' });
  await expect(portal.locator('#smartguide-overlay')).toHaveCount(0);
});
