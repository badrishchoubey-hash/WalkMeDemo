import {
  isRequest,
  isSupportedUrl,
} from '../../../../packages/shared/workflow-types';
import { registerSessionCheckpoints } from '../storage/session-checkpoints';
import { PORTAL_ORIGIN, PORTAL_MATCH_PATTERN } from '../../../../packages/shared/config';
registerSessionCheckpoints();
// Authoring tools live in a separate extension tab; normal users stay on the page.
chrome.action.onClicked.addListener(() => {
  void chrome.tabs.create({ url: chrome.runtime.getURL('admin.html') }).catch(error => console.error('Admin page could not be opened.', error));
});
chrome.runtime.onMessage.addListener((message: unknown, sender, respond) => {
  if (
    sender.id !== chrome.runtime.id ||
    sender.url !== chrome.runtime.getURL('admin.html') ||
    !isRequest(message)
  )
    return;
  const request = message;
  void (async () => {
    try {
      let [tab] = await chrome.tabs.query({
        active: true,
        windowId: sender.tab?.windowId ?? chrome.windows.WINDOW_ID_CURRENT,
      });
      if (!isSupportedUrl(tab?.url)) {
        const candidates = await chrome.tabs.query({
          url: PORTAL_MATCH_PATTERN,
          windowId: sender.tab?.windowId ?? chrome.windows.WINDOW_ID_CURRENT,
        });
        tab = candidates
          .filter((item) => isSupportedUrl(item.url))
          .sort((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))[0];
      }
      if (!tab?.id || !isSupportedUrl(tab.url))
        throw new Error(
          `Open ${PORTAL_ORIGIN} to use Windchill Extension Demo.`,
        );
      const reply: unknown = await chrome.tabs.sendMessage(tab.id, request);
      respond(reply);
    } catch (error) {
      respond({
        requestId: request.requestId,
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Portal unavailable. Refresh the portal after loading the extension.',
      });
    }
  })();
  return true;
});
