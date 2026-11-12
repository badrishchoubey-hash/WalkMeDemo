import { describe, expect, it } from 'vitest';
import {
  idleState,
  transition,
} from '../../apps/extension/src/engine/workflow-engine';
import { workflows, validateWorkflow } from '../../packages/shared/workflows';
import {
  getRoute,
  isRequest,
  isSupportedUrl,
} from '../../packages/shared/workflow-types';
const workflow = workflows[0]!;
describe('workflow transitions', () => {
  it('starts only at the first step and completes the actual ordered steps', () => {
    let state = transition(idleState, { type: 'start' }, workflow);
    for (const step of workflow.steps)
      state = transition(
        state,
        { type: 'complete-step', stepId: step.id },
        workflow,
      );
    expect(state.status).toBe('completed');
    expect(state.stepIndex).toBe(workflow.steps.length);
  });
  it('rejects an incorrect or repeated completion event', () => {
    const state = transition(idleState, { type: 'start' }, workflow);
    expect(
      transition(state, { type: 'complete-step', stepId: 'wrong' }, workflow),
    ).toEqual(state);
    const next = transition(
      state,
      { type: 'complete-step', stepId: workflow.steps[0]!.id },
      workflow,
    );
    expect(
      transition(
        next,
        { type: 'complete-step', stepId: workflow.steps[0]!.id },
        workflow,
      ),
    ).toEqual(next);
  });
  it('does not advance while paused or cancelled', () => {
    const running = transition(idleState, { type: 'start' }, workflow);
    for (const type of ['pause', 'cancel'] as const) {
      const state = transition(running, { type }, workflow);
      expect(
        transition(
          state,
          { type: 'complete-step', stepId: workflow.steps[0]!.id },
          workflow,
        ),
      ).toEqual(state);
    }
  });
  it('retries failure at the same step and restarts at zero', () => {
    const failed = transition(
      { status: 'running', stepIndex: 2, workflowId: workflow.id },
      { type: 'fail', error: 'target missing' },
      workflow,
    );
    expect(transition(failed, { type: 'retry' }, workflow)).toMatchObject({
      status: 'running',
      stepIndex: 2,
    });
    expect(transition(failed, { type: 'start' }, workflow).stepIndex).toBe(0);
  });
});
describe('trust boundaries', () => {
  it('accepts only the exact local origin', () => {
    expect(isSupportedUrl('http://127.0.0.1:5173/#/parts')).toBe(true);
    for (const url of [
      'http://127.0.0.1:9000',
      'http://localhost:5173',
      'https://example.com',
      'invalid',
    ])
      expect(isSupportedUrl(url)).toBe(false);
  });
  it('rejects malformed and unknown messages', () => {
    expect(
      isRequest({
        channel: 'smartguide',
        requestId: '1',
        command: { type: 'GET_CONTEXT' },
      }),
    ).toBe(true);
    for (const command of [
      { type: 'EXECUTE_SCRIPT' },
      { type: 'START_WORKFLOW', workflowId: 'unknown' },
      null,
    ])
      expect(
        isRequest({ channel: 'smartguide', requestId: '1', command }),
      ).toBe(false);
  });
  it('maps routes without treating arbitrary hashes as supported feature routes', () => {
    expect(getRoute('#/parts')).toBe('parts');
    expect(getRoute('#/unknown')).toBe('unsupported');
  });
  it('validates shipped definitions and rejects duplicate step ids', () => {
    workflows.forEach((item) =>
      expect(() => validateWorkflow(item)).not.toThrow(),
    );
    expect(() =>
      validateWorkflow({
        ...workflow,
        steps: [workflow.steps[0]!, workflow.steps[0]!],
      }),
    ).toThrow();
  });
});
