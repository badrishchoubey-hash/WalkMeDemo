import { describe, expect, it } from 'vitest';
import {
  readCatalog,
  readOverrides,
} from '../../packages/shared/workflow-catalog';
import { workflows } from '../../packages/shared/workflows';
import { isRequest, isContext } from '../../packages/shared/workflow-types';
import {
  makeCheckpoint,
  recoverCheckpoint,
} from '../../apps/extension/src/storage/checkpoint';

const custom = {
  id: 'custom-overview',
  version: 1,
  title: 'Review tasks',
  description: 'Review sample tasks.',
  route: 'dashboard',
  supportedRoutes: ['dashboard'],
  steps: [
    {
      id: 'review',
      title: 'My tasks',
      description: 'Review this sample work item.',
      selector: '[data-info="overview-task"]',
      action: 'next',
    },
  ],
};
const snapshot = (value: unknown) => ({ schemaVersion: 1, workflows: [value] });
describe('editable workflow catalog', () => {
  it('merges edits and new guides without mutating bundled definitions', () => {
    const original = workflows[0]!;
    const originalTitle = original.title;
    const catalog = readCatalog({
      schemaVersion: 1,
      workflows: [
        { ...original, version: 2, title: 'Updated part guide' },
        custom,
      ],
    });
    expect(catalog.find((item) => item.id === original.id)?.title).toBe(
      'Updated part guide',
    );
    expect(workflows[0]!.title).toBe(originalTitle);
    expect(catalog.at(-1)?.id).toBe('custom-overview');
    expect(
      isRequest({
        channel: 'smartguide',
        requestId: 'start',
        command: { type: 'START_WORKFLOW', workflowId: 'custom-overview' },
      }),
    ).toBe(true);
    expect(
      isContext({
        route: 'dashboard',
        state: {
          status: 'running',
          workflowId: 'custom-overview',
          stepIndex: 0,
        },
      }),
    ).toBe(true);
  });
  it('rejects invalid data, duplicate IDs, unsafe selectors, automation and missing confirmations', () => {
    expect(() => readCatalog({ schemaVersion: 2, workflows: [] })).toThrow();
    expect(() =>
      readCatalog({ schemaVersion: 1, workflows: [custom, custom] }),
    ).toThrow();
    for (const changes of [
      { selector: 'body' },
      { selector: 'script' },
      { action: 'execute' },
      { autofill: true },
      { navigateSelector: '[data-guide="confirm-part"]' },
    ]) {
      expect(() =>
        readOverrides(
          snapshot({ ...custom, steps: [{ ...custom.steps[0], ...changes }] }),
        ),
      ).toThrow();
    }
    const part = workflows.find((item) => item.id === 'create-part')!;
    expect(() =>
      readCatalog(
        snapshot({
          ...part,
          steps: part.steps.filter((step) => step.action !== 'confirm'),
        }),
      ),
    ).toThrow(/confirmation/);
  });
  it('recovers a published custom guide at the same step, paused, and rejects obsolete versions', () => {
    const catalog = readCatalog(snapshot(custom));
    const definition = catalog.find((item) => item.id === 'custom-overview')!;
    const saved = makeCheckpoint(
      { status: 'running', workflowId: definition.id, stepIndex: 0 },
      definition,
      'dashboard',
      'start',
    );
    expect(recoverCheckpoint(saved, 'dashboard', catalog)?.state.status).toBe(
      'paused',
    );
    expect(
      recoverCheckpoint(
        saved,
        'dashboard',
        readCatalog(snapshot({ ...custom, version: 2 })),
      ),
    ).toBeUndefined();
  });
});
