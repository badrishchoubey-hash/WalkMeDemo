export function createIsolatedLayer(id: string): {
  host: HTMLDivElement;
  shadow: ShadowRoot;
} {
  const host = document.createElement('div');
  host.id = id;
  host.dataset.extensionOverlay = 'true';
  host.style.cssText =
    'position:fixed;inset:0;width:100vw;height:100vh;margin:0;padding:0;border:0;background:transparent;pointer-events:none;overflow:visible;z-index:2147483645;';
  // Keep page annotations below help surfaces regardless of DOM insertion order.
  host.style.zIndex =
    id === 'smartguide-information'
      ? '2147483643'
      : id === 'guidance-help'
        ? '2147483646'
        : '2147483645';
  const shadow = host.attachShadow({ mode: 'open' });
  return { host, shadow };
}
export function positionTooltip(
  anchor: { left: number; right: number; top: number; bottom: number },
  width: number,
  height: number,
  viewportWidth: number,
  viewportHeight: number,
  preferSide = false,
): { left: number; top: number } {
  const margin = 12;
  let left = anchor.left;
  let top = anchor.bottom + 14;
  if (preferSide && anchor.right + width + 14 <= viewportWidth - margin) {
    left = anchor.right + 14;
    top = anchor.top;
  } else if (preferSide && anchor.left - width - 14 >= margin) {
    left = anchor.left - width - 14;
    top = anchor.top;
  } else if (top + height > viewportHeight - margin)
    top = anchor.top - height - 14;
  return {
    left: Math.max(margin, Math.min(left, viewportWidth - width - margin)),
    top: Math.max(margin, Math.min(top, viewportHeight - height - margin)),
  };
}
