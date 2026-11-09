import { informationForRoute } from '../../../../packages/shared/information-highlights';
import type {
  InformationHighlight,
  InformationState,
} from '../../../../packages/shared/information-highlights';
import type { Route } from '../../../../packages/shared/workflow-types';
import { resolveTargets } from './selector-resolver';
import { createIsolatedLayer, positionTooltip } from './overlay-primitives';
import { observePortal } from './dom-observer';

type Entry = {
  target: HTMLElement;
  definition: InformationHighlight;
  ring: HTMLDivElement;
  button: HTMLButtonElement;
  abort: AbortController;
};
export type InformationController = {
  setEnabled: (enabled: boolean) => void;
  setRoute: (route: Route) => void;
  setWalkthroughRunning: (running: boolean) => void;
  getState: () => InformationState;
  dispose: () => void;
};

export function createInformationController(
  root: HTMLElement,
  initialRoute: Route,
): InformationController {
  let route = initialRoute;
  let enabled = false;
  let running = false;
  let found = 0;
  let modal = false;
  let stopObservation: (() => void) | undefined;
  let layer: ReturnType<typeof createIsolatedLayer> | undefined;
  let events: AbortController | undefined;
  let resize: ResizeObserver | undefined;
  let tooltip: HTMLDivElement | undefined;
  let active: Entry | undefined;
  let previousFocus: Element | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let frame = 0;
  const entries = new Map<HTMLElement, Entry>();

  const currentValue = (entry: Entry) =>
    (entry.target.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 200);
  function hideTooltip() {
    clearTimeout(hideTimer);
    active?.button.removeAttribute('aria-describedby');
    active = undefined;
    if (tooltip) tooltip.hidden = true;
  }
  function deferHide() {
    clearTimeout(hideTimer);
    if (active && layer?.shadow.activeElement === active.button) return;
    hideTimer = setTimeout(hideTooltip, 140);
  }
  function refreshTooltip(entry: Entry) {
    if (!tooltip) return;
    const title = document.createElement('strong');
    title.textContent = entry.definition.title;
    const description = document.createElement('p');
    description.textContent = entry.definition.description;
    const value = document.createElement('p');
    const valueLabel = document.createElement('b');
    valueLabel.textContent = 'Current value: ';
    const valueText = document.createElement('span');
    valueText.textContent = currentValue(entry) || 'Not available';
    value.append(valueLabel, valueText);
    const why = document.createElement('p');
    const whyLabel = document.createElement('b');
    whyLabel.textContent = 'Why it matters: ';
    const whyText = document.createElement('span');
    whyText.textContent = entry.definition.whyItMatters;
    why.append(whyLabel, whyText);
    const importance = document.createElement('small');
    importance.textContent = `${entry.definition.importance.toUpperCase()} IMPORTANCE · Escape to dismiss`;
    tooltip.replaceChildren(title, description, value, why, importance);
  }
  function showTooltip(entry: Entry) {
    clearTimeout(hideTimer);
    if (active !== entry) hideTooltip();
    active = entry;
    entry.button.setAttribute('aria-describedby', 'information-tooltip');
    refreshTooltip(entry);
    if (tooltip) tooltip.hidden = false;
    schedulePosition();
  }
  function position() {
    frame = 0;
    for (const entry of entries.values()) {
      const r = entry.target.getBoundingClientRect();
      const outside =
        !entry.target.isConnected ||
        r.width === 0 ||
        r.height === 0 ||
        r.bottom < 0 ||
        r.top > innerHeight ||
        r.right < 0 ||
        r.left > innerWidth;
      entry.ring.hidden = outside;
      entry.button.hidden = outside;
      if (outside) {
        if (active === entry) hideTooltip();
        continue;
      }
      entry.ring.style.cssText = `left:${r.left - 3}px;top:${r.top - 3}px;width:${r.width + 6}px;height:${r.height + 6}px`;
      entry.button.style.left = `${Math.max(4, Math.min(r.right + 6, innerWidth - 24))}px`;
      entry.button.style.top = `${Math.max(4, Math.min(r.top + (r.height - 20) / 2, innerHeight - 24))}px`;
    }
    if (active && tooltip && !tooltip.hidden) {
      const location = positionTooltip(
        active.button.getBoundingClientRect(),
        tooltip.offsetWidth,
        tooltip.offsetHeight,
        innerWidth,
        innerHeight,
        true,
      );
      tooltip.style.left = `${location.left}px`;
      tooltip.style.top = `${location.top}px`;
    }
  }
  function schedulePosition() {
    if (!frame) frame = requestAnimationFrame(position);
  }
  function clearVisuals() {
    const focused = layer?.shadow.activeElement;
    const restore =
      focused instanceof HTMLButtonElement
        ? ([...entries.values()]
            .find((entry) => entry.button === focused)
            ?.target.closest<HTMLElement>(
              'button, a, input, select, textarea',
            ) ?? previousFocus)
        : null;
    hideTooltip();
    cancelAnimationFrame(frame);
    frame = 0;
    events?.abort();
    for (const entry of entries.values()) entry.abort.abort();
    resize?.disconnect();
    layer?.host.remove();
    entries.clear();
    layer = undefined;
    tooltip = undefined;
    events = undefined;
    resize = undefined;
    if (restore instanceof HTMLElement && restore.isConnected)
      restore.focus({ preventScroll: true });
  }
  function createVisuals() {
    if (layer) return;
    previousFocus = document.activeElement;
    layer = createIsolatedLayer('smartguide-information');
    const style = document.createElement('style');
    style.textContent =
      ':host{font:13px "Segoe UI",sans-serif;color:#263f32}*{box-sizing:border-box}[hidden]{display:none!important}.info-ring{position:fixed;border:1px solid #62977a;border-radius:4px;background:#71a98712;pointer-events:none}.info-icon{position:fixed;display:grid;place-items:center;width:20px;height:20px;padding:0;border:1px solid #47775e;border-radius:50%;background:#f4faf1;color:#28533c;font:bold 12px Georgia,serif;pointer-events:auto;cursor:help}.info-icon:hover,.info-icon:focus-visible{background:#dcefd6;outline:2px solid #32754f;outline-offset:2px}.info-tooltip{position:fixed;pointer-events:auto;width:310px;max-width:calc(100vw - 24px);max-height:calc(100vh - 24px);overflow:auto;background:#fff;border:1px solid #cbdcc7;border-radius:9px;padding:16px;box-shadow:0 10px 36px #17372730;line-height:1.6;overflow-wrap:anywhere}.info-tooltip strong{display:block;font-size:15px;color:#234e37}.info-tooltip p{margin:9px 0;color:#536b58}.info-tooltip small{font-size:9px;letter-spacing:.5px;color:#607b5f}';
    // Icons are appended after the tooltip during reconciliation; explicit stacking
    // keeps those later siblings from painting over an open explanation.
    style.textContent +=
      '.info-ring{z-index:1}.info-icon{z-index:2}.info-tooltip{z-index:3}';
    tooltip = document.createElement('div');
    tooltip.id = 'information-tooltip';
    tooltip.className = 'info-tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.hidden = true;
    events = new AbortController();
    const signal = events.signal;
    tooltip.addEventListener('mouseenter', () => clearTimeout(hideTimer), {
      signal,
    });
    tooltip.addEventListener('mouseleave', deferHide, { signal });
    layer.shadow.append(style, tooltip);
    document.body.append(layer.host);
    resize = new ResizeObserver(schedulePosition);
    resize.observe(root);
    window.addEventListener('scroll', schedulePosition, {
      capture: true,
      signal,
    });
    window.addEventListener('resize', schedulePosition, { signal });
    window.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape' && active) {
          hideTooltip();
          event.stopPropagation();
        }
      },
      { signal },
    );
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (layer && !event.composedPath().includes(layer.host)) hideTooltip();
      },
      { signal },
    );
  }
  function scan() {
    if (!enabled) return;
    const wanted = new Map<HTMLElement, InformationHighlight>();
    for (const definition of informationForRoute(route)) {
      for (const target of resolveTargets(root, definition))
        wanted.set(target, definition);
    }
    found = wanted.size;
    modal = Boolean(root.querySelector('dialog[open]'));
    if (running || modal || wanted.size === 0) {
      clearVisuals();
      return;
    }
    createVisuals();
    for (const [target, entry] of entries) {
      if (!wanted.has(target)) {
        if (active === entry) hideTooltip();
        entry.abort.abort();
        resize?.unobserve(target);
        entry.ring.remove();
        entry.button.remove();
        entries.delete(target);
      }
    }
    for (const [target, definition] of wanted) {
      let entry = entries.get(target);
      if (!entry) {
        const ring = document.createElement('div');
        ring.className = 'info-ring';
        ring.dataset.infoId = definition.id;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'info-icon';
        button.textContent = 'i';
        button.dataset.infoId = definition.id;
        entry = {
          target,
          definition,
          ring,
          button,
          abort: new AbortController(),
        };
        const item = entry;
        const signal = entry.abort.signal;
        button.addEventListener('mouseenter', () => showTooltip(item), {
          signal,
        });
        button.addEventListener('mouseleave', deferHide, { signal });
        button.addEventListener('focus', () => showTooltip(item), { signal });
        button.addEventListener('blur', hideTooltip, { signal });
        button.addEventListener('click', () => showTooltip(item), { signal });
        entries.set(target, entry);
        layer!.shadow.append(ring, button);
        resize?.observe(target);
      }
      entry.button.setAttribute(
        'aria-label',
        `Explain ${definition.title}: ${currentValue(entry)}`,
      );
      if (active === entry) refreshTooltip(entry);
    }
    schedulePosition();
  }
  function observe() {
    stopObservation?.();
    stopObservation = undefined;
    if (enabled && informationForRoute(route).length)
      stopObservation = observePortal(root, scan);
    scan();
  }
  return {
    setEnabled(value) {
      enabled = value;
      if (!enabled) {
        stopObservation?.();
        stopObservation = undefined;
        found = 0;
        modal = false;
        clearVisuals();
      } else observe();
    },
    setRoute(value) {
      route = value;
      clearVisuals();
      found = 0;
      if (enabled) observe();
    },
    setWalkthroughRunning(value) {
      running = value;
      if (enabled) scan();
    },
    getState() {
      return {
        enabled,
        supported: informationForRoute(route).length > 0,
        matchedCount: found,
        suspended: enabled && (running || modal),
      };
    },
    dispose() {
      enabled = false;
      stopObservation?.();
      stopObservation = undefined;
      found = 0;
      clearVisuals();
    },
  };
}
