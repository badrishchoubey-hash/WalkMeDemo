import type { GuideStep } from '../../../../packages/shared/workflow-types';
export type Overlay = {
  update: (target: HTMLElement | undefined) => void;
  remove: () => void;
};
export function createOverlay(
  step: GuideStep,
  index: number,
  total: number,
  cancel: () => void,
): Overlay {
  const host = document.createElement('div');
  host.id = 'smartguide-overlay';
  // A manual popover enters the top layer, so guidance remains above native modal dialogs.
  host.popover = 'manual';
  host.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;margin:0;padding:0;border:0;background:transparent;pointer-events:none;overflow:visible;';
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent =
    ':host{font-family:"Segoe UI",sans-serif;color:#263f32}*{box-sizing:border-box}.ring{position:fixed;border:2px solid #2e926b;border-radius:6px;box-shadow:0 0 0 4px #50b78930;pointer-events:none}.tip{position:fixed;background:#fff;border:1px solid #d6e6da;border-radius:10px;padding:18px;width:280px;max-width:calc(100vw - 24px);box-shadow:0 12px 45px #16322230;pointer-events:auto;font-size:12px;line-height:1.6}.meta{color:#538469;font-size:9px;letter-spacing:1px}h2{font-size:15px;margin:8px 0}p{margin:0;color:#6f8275}button{margin-top:12px;border:1px solid #d9e5d9;border-radius:4px;background:#f5f9f3;padding:5px 10px;color:#35664b;cursor:pointer}button:focus-visible{outline:2px solid #337e59}';
  const ring = document.createElement('div');
  ring.className = 'ring';
  const tip = document.createElement('section');
  tip.className = 'tip';
  tip.setAttribute('role', 'region');
  tip.setAttribute('aria-label', 'SmartGuide current step');
  tip.setAttribute('aria-live', 'polite');
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `SMARTGUIDE · ${index + 1} OF ${total}`;
  const title = document.createElement('h2');
  title.textContent = step.title;
  const description = document.createElement('p');
  description.textContent = step.description;
  const close = document.createElement('button');
  close.textContent = 'Cancel guide · Esc';
  close.onclick = cancel;
  tip.append(meta, title, description, close);
  shadow.append(style, ring, tip);
  document.body.append(host);
  host.showPopover();
  let target: HTMLElement | undefined;
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
    const r = target.getBoundingClientRect();
    ring.style.cssText = `left:${r.left - 4}px;top:${r.top - 4}px;width:${r.width + 8}px;height:${r.height + 8}px`;
    const width = tip.offsetWidth;
    const height = tip.offsetHeight;
    const below = r.bottom + height + 18 < innerHeight;
    tip.style.left = `${Math.max(12, Math.min(r.left, innerWidth - width - 12))}px`;
    tip.style.top = `${Math.max(12, Math.min(below ? r.bottom + 14 : r.top - height - 14, innerHeight - height - 12))}px`;
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
    update(next) {
      if (next !== target) {
        resize.disconnect();
        target = next;
        if (target) {
          resize.observe(target);
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
