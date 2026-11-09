import {
  getRoute,
  isSupportedUrl,
} from '../../../../packages/shared/workflow-types';
import {
  checkpointKey,
  checkpointOwnerKey,
  isCheckpointRequest,
  recoverCheckpoint,
} from './checkpoint';

// Ordering prevents an older asynchronous write from overwriting a newer step.
// This map coordinates operations only; durable checkpoints live in storage.session.
const pending = new Map<number, Promise<unknown>>();
function enqueue<T>(tabId: number, operation: () => Promise<T>): Promise<T> {
  const previous = pending.get(tabId) ?? Promise.resolve();
  const next = previous.then(operation, operation);
  pending.set(tabId, next);
  void next
    .finally(() => {
      if (pending.get(tabId) === next) pending.delete(tabId);
    })
    .catch(() => {
      /* Failure is returned through the message response below. */
    });
  return next;
}
export function registerSessionCheckpoints(): void {
  chrome.runtime.onMessage.addListener((message: unknown, sender, respond) => {
    if (
      !isCheckpointRequest(message) ||
      sender.id !== chrome.runtime.id ||
      sender.frameId !== 0 ||
      !sender.documentId ||
      sender.tab?.id === undefined ||
      !isSupportedUrl(sender.url)
    )
      return;
    const tabId = sender.tab.id;
    const documentId = sender.documentId;
    void enqueue(tabId, async () => {
      const key = checkpointKey(tabId);
      const ownerKey = checkpointOwnerKey(tabId);
      if (message.type === 'READ') {
        const stored = await chrome.storage.session.get(key);
        await chrome.storage.session.set({ [ownerKey]: documentId });
        return {
          requestId: message.requestId,
          ok: true,
          checkpoint: stored[key],
        };
      }
      // A new document claims the tab on READ. Late writes from the old one cannot win.
      const owner = await chrome.storage.session.get(ownerKey);
      if (owner[ownerKey] !== documentId)
        throw new Error('Stale document checkpoint.');
      if (message.type === 'CLEAR') await chrome.storage.session.remove(key);
      else {
        // Sender URL metadata can retain the injection-time hash after SPA navigation.
        const tab = await chrome.tabs.get(tabId);
        if (!isSupportedUrl(tab.url))
          throw new Error('Unsupported checkpoint context.');
        if (
          !recoverCheckpoint(
            message.checkpoint,
            getRoute(new URL(tab.url!).hash),
          )
        )
          throw new Error('Invalid guide checkpoint.');
        await chrome.storage.session.set({ [key]: message.checkpoint });
      }
      return { requestId: message.requestId, ok: true };
    }).then(respond, () =>
      respond({
        requestId: message.requestId,
        ok: false,
        error:
          'Guide progress could not be saved or restored. You can continue, but refresh recovery is unavailable.',
      }),
    );
    return true;
  });
  chrome.tabs.onRemoved.addListener((tabId) => {
    void enqueue(tabId, () =>
      chrome.storage.session.remove([
        checkpointKey(tabId),
        checkpointOwnerKey(tabId),
      ]),
    ).catch((error) =>
      console.error('Extension Demo checkpoint cleanup failed', error),
    );
  });
}
