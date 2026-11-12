import { describe, expect, it } from 'vitest';
import { workflows, validateWorkflow } from '../../packages/shared/workflows';
import { getRoute, isRequest } from '../../packages/shared/workflow-types';
import {
  makeCheckpoint,
  recoverCheckpoint,
} from '../../apps/extension/src/storage/checkpoint';

describe('collaboration guidance safety', () => {
  const tour = workflows.find((item) => item.id === 'collaboration-tour')!;
  const rename = workflows.find((item) => item.id === 'rename-tab')!;
  it('validates all definitions and accepts the new routes and commands', () => {
    for (const workflow of workflows)
      expect(() => validateWorkflow(workflow)).not.toThrow();
    expect(getRoute('#/task')).toBe('task');
    expect(getRoute('#/documentation')).toBe('documentation');
    expect(getRoute('#/unconfigured')).toBe('unsupported');
    expect(
      isRequest({
        channel: 'smartguide',
        requestId: 'rename',
        command: { type: 'START_WORKFLOW', workflowId: 'rename-tab' },
      }),
    ).toBe(true);
  });
  it('rejects automatic submission and linked transitions before a parent finishes', () => {
    expect(() =>
      validateWorkflow({
        ...tour,
        steps: [
          { ...tour.steps[0]!, navigateSelector: '[data-guide="rename-ok"]' },
        ],
      }),
    ).toThrow();
    expect(() =>
      validateWorkflow({
        ...rename,
        steps: [{ ...rename.steps[3]!, autofill: true }],
      }),
    ).toThrow();
    expect(() =>
      validateWorkflow({
        ...tour,
        steps: [
          { ...tour.steps[0]!, linkedWorkflow: 'rename-tab' },
          ...tour.steps.slice(1),
        ],
      }),
    ).toThrow();
  });
  it('restores task guidance paused without replaying automatic tab navigation', () => {
    const stored = makeCheckpoint(
      { status: 'running', workflowId: tour.id, stepIndex: 1 },
      tour,
      'task',
      'complete-step',
    );
    const recovered = recoverCheckpoint(stored, 'task');
    expect(recovered?.state).toMatchObject({
      status: 'paused',
      stepIndex: 1,
      recovered: true,
    });
    expect(recoverCheckpoint(stored, 'dashboard')).toBeUndefined();
  });
});
