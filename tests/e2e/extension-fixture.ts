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
export const test = base.extend<{ guide: Harness }>({
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
      // Manual lifecycle suites opt out; automatic entry is covered separately.
      await worker.evaluate(() =>
        chrome.storage.local.set({ 'guidance:autoStart:v1': false }),
      );
      const portal = await browser.newPage();
      await portal.goto('http://127.0.0.1:5173/#/parts');
      const panel = await browser.newPage();
      await panel.goto(`chrome-extension://${id}/admin.html`);
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
      // Legacy manual-highlight scenarios start opted out; new UI tests verify the automatic default.
      await command({ type: 'SET_INFORMATION_HIGHLIGHTS', enabled: false });
      await expect(
        panel.getByRole('switch', { name: 'Show Important Information' }),
      ).not.toBeChecked();
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

export { expect };
