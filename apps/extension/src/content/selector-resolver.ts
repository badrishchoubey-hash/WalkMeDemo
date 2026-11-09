import type { GuideStep } from '../../../../packages/shared/workflow-types';
export function isInteractable(element: HTMLElement): boolean {
  return (
    element.isConnected &&
    element.getClientRects().length > 0 &&
    getComputedStyle(element).visibility !== 'hidden' &&
    !element.closest('[inert]') &&
    !element.matches(':disabled, [aria-disabled="true"]')
  );
}
export function resolveTargets(
  root: HTMLElement,
  step: Pick<GuideStep, 'id' | 'selector' | 'fallbackSelectors'>,
): HTMLElement[] {
  for (const selector of [step.selector, ...(step.fallbackSelectors ?? [])]) {
    // Selectors are local configuration, still checked before use.
    let candidates: NodeListOf<HTMLElement>;
    try {
      candidates = root.querySelectorAll<HTMLElement>(selector);
    } catch {
      throw new Error(`Invalid selector in step ${step.id}.`);
    }
    const eligible = [...candidates].filter(isInteractable);
    if (eligible.length) return eligible;
  }
  return [];
}
export function resolveTarget(
  root: HTMLElement,
  step: GuideStep,
): HTMLElement | undefined {
  return resolveTargets(root, step)[0];
}
