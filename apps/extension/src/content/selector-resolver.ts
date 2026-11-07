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
export function resolveTarget(
  root: HTMLElement,
  step: GuideStep,
): HTMLElement | undefined {
  for (const selector of [step.selector, ...(step.fallbackSelectors ?? [])]) {
    // Selectors are local configuration, still checked before use.
    let candidates: NodeListOf<HTMLElement>;
    try {
      candidates = root.querySelectorAll<HTMLElement>(selector);
    } catch {
      throw new Error(`Invalid selector in step ${step.id}.`);
    }
    for (const candidate of candidates)
      if (isInteractable(candidate)) return candidate;
  }
}
