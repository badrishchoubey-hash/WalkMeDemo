import {
  isRequest,
  isSupportedUrl,
} from '../../../../packages/shared/workflow-types';
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('SmartGuide panel setup failed', error));
chrome.runtime.onMessage.addListener((message: unknown, sender, respond) => {
  if (
    sender.id !== chrome.runtime.id ||
    sender.url !== chrome.runtime.getURL('sidepanel.html') ||
    !isRequest(message)
  )
    return;
  const request = message;
  void (async () => {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        windowId: sender.tab?.windowId ?? chrome.windows.WINDOW_ID_CURRENT,
      });
      if (!tab?.id || !isSupportedUrl(tab.url))
        throw new Error('Open http://127.0.0.1:5173 to use SmartGuide.');
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
