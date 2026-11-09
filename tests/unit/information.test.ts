import { describe, expect, it } from 'vitest';
import {
  informationForRoute,
  informationHighlights,
} from '../../packages/shared/information-highlights';
import { isContext, isRequest } from '../../packages/shared/workflow-types';
import { positionTooltip } from '../../apps/extension/src/content/overlay-primitives';

describe('information definitions and contracts', () => {
  it('provides only actual fields for the three supported collection pages', () => {
    expect(informationForRoute('dashboard')).toEqual([]);
    for (const route of ['parts', 'documents', 'changes'] as const)
      expect(informationForRoute(route)).toHaveLength(3);
    expect(new Set(informationHighlights.map((item) => item.id)).size).toBe(
      informationHighlights.length,
    );
    for (const item of informationHighlights) {
      expect(item.selector).toContain('[data-info=');
      expect(item.description).toBeTruthy();
      expect(item.whyItMatters).toBeTruthy();
    }
  });
  it('validates the toggle payload instead of accepting arbitrary commands', () => {
    const request = {
      channel: 'smartguide',
      requestId: 'toggle',
      command: { type: 'SET_INFORMATION_HIGHLIGHTS', enabled: true },
    };
    expect(isRequest(request)).toBe(true);
    expect(
      isRequest({
        ...request,
        command: { ...request.command, enabled: 'yes' },
      }),
    ).toBe(false);
  });
  it('rejects malformed counts or feature state in context replies', () => {
    const context = {
      route: 'parts',
      state: { status: 'idle', stepIndex: 0 },
      information: {
        enabled: true,
        supported: true,
        suspended: false,
        matchedCount: 12,
      },
    };
    expect(isContext(context)).toBe(true);
    expect(
      isContext({
        ...context,
        information: { ...context.information, matchedCount: -1 },
      }),
    ).toBe(false);
    expect(
      isContext({
        ...context,
        information: { ...context.information, enabled: 'true' },
      }),
    ).toBe(false);
  });
});
describe('shared tooltip placement', () => {
  it('keeps the tooltip inside the viewport at the bottom-right edge', () => {
    const point = positionTooltip(
      { left: 780, right: 800, top: 570, bottom: 590 },
      310,
      210,
      820,
      600,
      true,
    );
    expect(point.left).toBeGreaterThanOrEqual(12);
    expect(point.left + 310).toBeLessThanOrEqual(808);
    expect(point.top).toBeGreaterThanOrEqual(12);
    expect(point.top + 210).toBeLessThanOrEqual(588);
  });
  it('prefers a side placement when room is available', () => {
    expect(
      positionTooltip(
        { left: 100, right: 120, top: 50, bottom: 70 },
        310,
        200,
        1200,
        900,
        true,
      ),
    ).toEqual({ left: 134, top: 50 });
  });
});
