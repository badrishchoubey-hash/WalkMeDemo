import type { WorkflowId } from '../../../../packages/shared/workflow-types';
const fields: Record<WorkflowId, Record<string, string>> = {
  'collaboration-tour': {},
  'rename-tab': { 'tab-name': 'Review team' },
  'create-part': {
    'part-name': 'Precision mounting bracket',
    'part-number': '',
    'part-category': 'Mechanical',
    'part-description': 'Demo bracket designed to improve mounting stability.',
  },
  'find-document': { 'document-search': 'bracket' },
  'create-change': {
    'change-title': 'Improve mounting bracket durability',
    'change-part': 'PRT-1001',
    'change-reason':
      'Increase the bracket thickness to reduce vibration under load.',
  },
};
export function autofill(
  root: HTMLElement,
  id: WorkflowId,
  example?: string,
): void {
  const entries = fields[id] ?? {};
  let count = 0;
  for (const [guide, configured] of Object.entries(entries)) {
    const field = root.querySelector(`[data-guide="${guide}"]`);
    if (
      !(
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement ||
        field instanceof HTMLSelectElement
      ) ||
      !field.getClientRects().length
    )
      continue;
    if (field instanceof HTMLInputElement && field.type === 'password')
      continue;
    const value =
      guide === 'part-number'
        ? `PRT-${Date.now().toString().slice(-8)}`
        : id === 'rename-tab' && example
          ? example
          : configured;
    // Use the native setter: assigning through React's tracked instance setter can suppress onChange.
    const prototype =
      field instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : field instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (!setter) throw new Error('This field does not support safe autofill.');
    setter.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    count++;
  }
  if (!count) throw new Error('Open the form before filling demo values.');
}
