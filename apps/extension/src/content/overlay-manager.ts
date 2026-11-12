import type { GuideStep } from '../../../../packages/shared/workflow-types';
import { createIsolatedLayer, positionTooltip } from './overlay-primitives';
export type Overlay = {
  update: (target: HTMLElement | undefined) => void;
  remove: () => void;
  setObscured: (hidden: boolean) => void;
};
export function createOverlay(
  step: GuideStep,
  index: number,
  total: number,
  cancel: () => void,
  next?: () => void,
): Overlay {
  const { host, shadow } = createIsolatedLayer('smartguide-overlay');
  // A manual popover enters the top layer, so guidance remains above native modal dialogs.
  host.popover = 'manual';
  const style = document.createElement('style');
  style.textContent =
    ':host{font-family:"Segoe UI",sans-serif;color:#263f32}*{box-sizing:border-box}.ring{position:fixed;border:2px solid #2e926b;border-radius:6px;box-shadow:0 0 0 4px #50b78930;pointer-events:none}.tip{position:fixed;background:#fff;border:1px solid #d6e6da;border-radius:10px;padding:18px;width:280px;max-width:calc(100vw - 24px);box-shadow:0 12px 45px #16322230;pointer-events:auto;font-size:12px;line-height:1.6}.meta{color:#538469;font-size:9px;letter-spacing:1px}h2{font-size:15px;margin:8px 0}p{margin:0;color:#6f8275}button{margin-top:12px;border:1px solid #d9e5d9;border-radius:4px;background:#f5f9f3;padding:5px 10px;color:#35664b;cursor:pointer}button:focus-visible{outline:2px solid #337e59}';
  const ring = document.createElement('div');
  ring.className = 'ring';
  const tip = document.createElement('section');
  tip.className = 'tip';
  tip.setAttribute('role', 'region');
  tip.setAttribute('aria-label', 'Extension Demo current step');
  tip.setAttribute('aria-live', 'polite');
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `EXTENSION DEMO · ${index + 1} OF ${total}`;
  const title = document.createElement('h2');
  title.textContent = step.title;
  const description = document.createElement('p');
  description.textContent = step.description;
  const close = document.createElement('button');
  close.textContent = 'Cancel guide · Esc';
  close.onclick = cancel;
  style.textContent +=
    '.tip{width:320px;font-size:14px;line-height:1.6;padding:20px}.tip h2{font-size:18px;line-height:1.35;margin:10px 0}.tip p{color:#506a5b}.actions{display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:18px;flex-wrap:wrap}.actions button{margin:0;min-height:36px;padding:7px 12px}';
  const actions = document.createElement('div');
  style.textContent += '.tip{max-height:calc(100dvh - 24px);overflow:auto}';
  actions.className = 'actions';
  actions.append(close);
  tip.append(meta, title, description, actions);
  if (step.action === 'next' && next) {
    const button = document.createElement('button');
    button.textContent = step.linkedWorkflow ? 'Show me how' : 'Next';
    button.onclick = next;
    actions.append(button);
  }
  shadow.append(style, ring, tip);
  document.body.append(host);
  host.showPopover();
  let target: HTMLElement | undefined;
  function highlightTarget() {
    return (
      (step.highlightSelector &&
        target
          ?.closest('#portal-main')
          ?.querySelector<HTMLElement>(step.highlightSelector)) ||
      target
    );
  }
  let frame = 0;
  function position() {
    frame = 0;
    if (!target?.isConnected || !target.getClientRects().length) {
      ring.hidden = true;
      tip.hidden = true;
      return;
    }
    ring.hidden = false;
    tip.hidden = false;
    // Composite controls can have an icon/padding shell around the actual input.
    // Keep event validation on the input while outlining the complete visual control.
    const visual = highlightTarget() ?? target;
    const r = visual.getBoundingClientRect();
    const inset = step.highlightSelector ? 0 : 4;
    ring.style.cssText = `left:${r.left - inset}px;top:${r.top - inset}px;width:${r.width + inset * 2}px;height:${r.height + inset * 2}px;border-radius:${getComputedStyle(visual).borderRadius}`;
    const width = tip.offsetWidth;
    const height = tip.offsetHeight;
    const position = positionTooltip(r, width, height, innerWidth, innerHeight);
    tip.style.left = `${position.left}px`;
    tip.style.top = `${position.top}px`;
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(position);
  }
  const resize = new ResizeObserver(schedule);
  window.addEventListener('scroll', schedule, true);
  window.addEventListener('resize', schedule);
  const escape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') cancel();
  };
  window.addEventListener('keydown', escape);
  return {
    setObscured(hidden) {
      host.style.visibility = hidden ? 'hidden' : '';
    },
    update(next) {
      if (next !== target) {
        resize.disconnect();
        target = next;
        if (target) {
          resize.observe(target);
          const visual = highlightTarget();
          if (visual && visual !== target) resize.observe(visual);
          // React can open its modal after the click handler advanced the guide.
          // Re-enter the top layer after resolving the new target so the dialog cannot cover us.
          host.hidePopover();
          // A visually elevated sibling is still inert while a native dialog is modal.
          // Nest inside that dialog to keep Cancel reachable by pointer and keyboard.
          const container = target.closest('dialog[open]') ?? document.body;
          if (host.parentElement !== container) container.append(host);
          host.showPopover();
        }
      }
      schedule();
    },
    remove() {
      cancelAnimationFrame(frame);
      resize.disconnect();
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('keydown', escape);
      host.remove();
    },
  };
}
