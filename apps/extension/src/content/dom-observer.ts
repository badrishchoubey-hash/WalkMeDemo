/** Observe only the portal root; shadow-root overlays and their host changes are ignored. */
export function observePortal(
  root: HTMLElement,
  onChange: () => void,
): () => void {
  let frame = 0;
  const isOverlay = (node: Node) =>
    node instanceof Element &&
    Boolean(node.closest('[data-extension-overlay]'));
  const observer = new MutationObserver((records) => {
    const relevant = records.some((record) => {
      if (isOverlay(record.target)) return false;
      if (record.type !== 'childList') return true;
      return [...record.addedNodes, ...record.removedNodes].some(
        (node) => !isOverlay(node),
      );
    });
    if (relevant && !frame)
      frame = requestAnimationFrame(() => {
        frame = 0;
        onChange();
      });
  });
  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: [
      'class',
      'style',
      'hidden',
      'disabled',
      'open',
      'data-guide',
      'data-info',
      'aria-hidden',
      'aria-disabled',
    ],
  });
  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
  };
}
