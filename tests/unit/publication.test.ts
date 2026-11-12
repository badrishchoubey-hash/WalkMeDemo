import { describe, it, expect } from 'vitest';
import { publishedIds } from '../../packages/shared/publication';
describe('local publication snapshots', () => {
  it('uses bundled defaults only when no snapshot exists and accepts a deliberate empty publication', () => {
    expect(publishedIds(undefined)).toContain('collaboration-tour');
    expect(publishedIds({ schemaVersion: 1, workflowIds: [] })).toEqual([]);
    expect(
      publishedIds({ schemaVersion: 1, workflowIds: ['create-part'] }),
    ).toEqual(['create-part']);
  });
  it('rejects malformed, incompatible, and unknown workflow selections', () => {
    for (const value of [
      null,
      {},
      { schemaVersion: 2, workflowIds: ['create-part'] },
      { schemaVersion: 1, workflowIds: ['arbitrary-code'] },
      { schemaVersion: 1, workflowIds: 'create-part' },
    ])
      expect(publishedIds(value)).toEqual([]);
  });
});
