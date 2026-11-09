import { describe, expect, it } from 'vitest';
import {
  makeCheckpoint,
  recoverCheckpoint,
  checkpointKey,
} from '../../apps/extension/src/storage/checkpoint';
import { workflows } from '../../packages/shared/workflows';
import { parseSnapshot } from '../../apps/demo-portal/src/mock-data/session-state';
const workflow = workflows[0]!;
const saved = makeCheckpoint(
  { status: 'running', workflowId: workflow.id, stepIndex: 2 },
  workflow,
  'parts',
  'complete-step',
)!;
describe('refresh checkpoints', () => {
  it('restores the same step paused rather than replaying actions', () => {
    expect(recoverCheckpoint(saved, 'parts')?.state).toEqual({
      workflowId: 'create-part',
      stepIndex: 2,
      status: 'paused',
      recovered: true,
    });
    expect(saved.stepId).toBe('part-number');
    expect(saved.lastEvent).toBe('complete-step');
  });
  it('rejects incompatible versions, routes, steps, malformed and extra data', () => {
    for (const value of [
      null,
      {},
      { ...saved, schemaVersion: 2 },
      { ...saved, workflowVersion: 99 },
      { ...saved, stepId: 'missing' },
      { ...saved, status: 'unknown' },
      { ...saved, lastEvent: 'eval' },
      { ...saved, fieldValue: 'not allowed' },
    ])
      expect(recoverCheckpoint(value, 'parts')).toBeUndefined();
    expect(recoverCheckpoint(saved, 'documents')).toBeUndefined();
  });
  it('retains completion and never persists cancelled or invalid progress', () => {
    const complete = makeCheckpoint(
      {
        status: 'completed',
        workflowId: workflow.id,
        stepIndex: workflow.steps.length,
      },
      workflow,
      'parts',
      'complete-step',
    );
    expect(recoverCheckpoint(complete, 'parts')?.state.status).toBe(
      'completed',
    );
    expect(
      recoverCheckpoint({ ...saved, status: 'completed' }, 'parts'),
    ).toBeUndefined();
    expect(
      makeCheckpoint(
        { status: 'cancelled', workflowId: workflow.id, stepIndex: 2 },
        workflow,
        'parts',
        'pause',
      ),
    ).toBeUndefined();
    expect(checkpointKey(1)).not.toBe(checkpointKey(2));
  });
});
describe('portal draft validation', () => {
  const snapshot = {
    schemaVersion: 1,
    route: 'parts',
    draft: {
      kind: 'part',
      values: {
        name: 'Bracket',
        number: 'PRT-900',
        category: 'Mechanical',
        description: 'Demo only',
      },
      review: true,
    },
  };
  it('restores completed drafts to review without saving them', () => {
    expect(parseSnapshot(snapshot, 'parts')?.draft?.review).toBe(true);
  });
  it('returns incomplete review drafts to editing', () => {
    expect(
      parseSnapshot(
        {
          ...snapshot,
          draft: { ...snapshot.draft, values: { name: 'Only a name' } },
        },
        'parts',
      )?.draft?.review,
    ).toBe(false);
  });
  it('does not restore invalid category or part number directly to review', () => {
    for (const patch of [
      { category: 'Unknown' },
      { number: 'spaces are invalid' },
    ]) {
      expect(
        parseSnapshot(
          {
            ...snapshot,
            draft: {
              ...snapshot.draft,
              values: { ...snapshot.draft.values, ...patch },
            },
          },
          'parts',
        )?.draft?.review,
      ).toBe(false);
    }
  });
  it('validates saved document context against known document IDs', () => {
    expect(
      parseSnapshot(
        {
          schemaVersion: 1,
          route: 'documents',
          documentContext: { query: 'bracket', documentId: 'DOC-201' },
        },
        'documents',
      )?.documentContext?.query,
    ).toBe('bracket');
    expect(
      parseSnapshot(
        {
          schemaVersion: 1,
          route: 'documents',
          documentContext: { query: 'bracket', documentId: 'missing' },
        },
        'documents',
      ),
    ).toBeUndefined();
  });
  it('rejects wrong routes, schemas, unexpected fields and excessive values', () => {
    expect(parseSnapshot(snapshot, 'changes')).toBeUndefined();
    expect(
      parseSnapshot({ ...snapshot, schemaVersion: 2 }, 'parts'),
    ).toBeUndefined();
    expect(
      parseSnapshot(
        {
          ...snapshot,
          draft: { ...snapshot.draft, values: { password: 'not allowed' } },
        },
        'parts',
      ),
    ).toBeUndefined();
    expect(
      parseSnapshot(
        {
          ...snapshot,
          draft: { ...snapshot.draft, values: { name: 'x'.repeat(10001) } },
        },
        'parts',
      ),
    ).toBeUndefined();
  });
});
