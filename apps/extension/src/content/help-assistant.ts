import type {
  Command,
  Context,
} from '../../../../packages/shared/workflow-types';
import { workflows } from '../../../../packages/shared/workflows';
import { createIsolatedLayer } from './overlay-primitives';
import { createWorkflowFeedback } from './workflow-feedback';
import {
  publicationKey,
  publishedIds,
} from '../../../../packages/shared/publication';

import { acknowledgmentKey } from '../../../../packages/shared/release';
import {
  catalogKey,
  readCatalog,
} from '../../../../packages/shared/workflow-catalog';

export function createHelpAssistant(
  command: (value: Command) => void,
  position: 'left' | 'right' = 'left',
  onSurfaceVisibility: (open: boolean) => void = () => {},
) {
  document.getElementById('guidance-help')?.remove();
  const { host, shadow } = createIsolatedLayer('guidance-help');
  const feedback = createWorkflowFeedback(shadow);
  const style = document.createElement('style');
  style.textContent = `:host{font:14px 'Segoe UI',sans-serif;color:#243b4d}*{box-sizing:border-box}[hidden]{display:none!important}button,a{font:inherit}button{cursor:pointer;border:1px solid #c7d4de;border-radius:6px;background:#fff;color:#243b4d;padding:9px 12px;text-align:left}button:hover{background:#eef5fa}button:focus-visible,a:focus-visible{outline:3px solid #3881b5;outline-offset:3px}.launcher{position:fixed;bottom:20px;${position}:20px;pointer-events:auto;border-radius:50%;width:46px;height:46px;background:#245d86;color:white;font-size:24px;text-align:center;box-shadow:0 4px 16px #102a4040}.panel{position:fixed;bottom:80px;${position}:20px;width:320px;max-width:calc(100vw - 40px);max-height:calc(100vh - 110px);overflow:auto;background:#fff;border:1px solid #c7d4de;border-radius:10px;padding:18px;box-shadow:0 8px 30px #102a4030;pointer-events:auto}.panel button,.panel a{display:block;margin-top:9px;width:100%}h2{font-size:18px;margin:0 0 12px}p{line-height:1.5}small{color:#536c7d}.context{position:fixed;bottom:24px;${position}:80px;pointer-events:auto;max-width:calc(100vw - 110px)}a{color:#245d86}.notice{position:fixed;top:24px;left:50%;transform:translateX(-50%);background:#fff;border:1px solid #b7ccd8;padding:20px;border-radius:8px;width:420px;max-width:calc(100vw - 24px);max-height:calc(100vh - 48px);overflow:auto;box-shadow:0 8px 30px #102a4030;pointer-events:auto}.notice button{margin:8px 8px 0 0}`;
  style.textContent += `:host{font:15px/1.55 'Segoe UI',Arial,sans-serif}h2{font-size:22px;line-height:1.3;font-weight:650;letter-spacing:-.02em}p{margin:0 0 18px;color:#526a7a;line-height:1.65}.panel{width:380px;padding:24px}.panel input{width:100%;font:inherit;padding:12px;border:1px solid #bfced8;border-radius:8px;margin:0 0 14px}.search-label{display:block;font-size:13px;font-weight:600;margin-bottom:8px}.notice{top:50%;transform:translate(-50%,-50%);width:520px;padding:28px}.notice-links{display:grid;gap:12px;margin:22px 0}.notice-links a{display:block;text-underline-offset:3px}.notice-actions{display:flex;align-items:center;justify-content:flex-end;flex-wrap:wrap;gap:12px;border-top:1px solid #e1e8ed;padding-top:20px}.notice-actions button{margin:0;min-height:42px;padding:10px 16px;display:inline-flex;align-items:center;justify-content:center}.notice-actions button:first-child{background:#245d86;color:white;border-color:#245d86}.results button{width:100%;text-align:left;padding:12px}.results small{display:block;margin-top:4px}.result-heading{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#627a89;margin:12px 0}.notice h2{margin-bottom:14px}`;
  const launcher = document.createElement('button');
  style.textContent +=
    'a,a:visited{color:#215d46;text-underline-offset:3px}a:hover{color:#174833}';
  style.textContent +=
    '.launcher:hover{background:#17496b;color:white}input:focus-visible{outline:3px solid #3881b5;outline-offset:2px}';
  launcher.className = 'launcher';
  launcher.textContent = '?';
  launcher.setAttribute('aria-label', 'Help & Guidance');
  launcher.setAttribute('aria-expanded', 'false');
  const panel = document.createElement('section');
  style.textContent +=
    '.launcher{display:flex;align-items:center;justify-content:center;padding:0;line-height:1;font:600 26px/1 "Segoe UI",Arial,sans-serif;left:20%;right:auto}.panel{top:var(--help-main-top,0px);bottom:auto;left:var(--help-panel-left,calc(20% + 58px));right:auto;height:var(--help-main-height,100dvh);max-height:var(--help-main-height,100dvh);width:min(380px,var(--help-panel-width,calc(80vw - 74px)));border-radius:10px}.context{left:calc(20% + 60px);right:auto}';
  panel.className = 'panel';
  style.textContent +=
    '.panel{max-height:min(var(--help-main-height,100dvh),calc(100dvh - var(--help-main-top,0px) - 12px))}';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Help & Guidance');
  const contextual = document.createElement('button');
  contextual.className = 'context';
  contextual.textContent = "See what's new with this task";
  contextual.hidden = true;
  const notice = document.createElement('section');
  notice.className = 'notice';
  notice.hidden = true;
  notice.setAttribute('role', 'region');
  notice.setAttribute('aria-label', 'Release announcement');
  const completion = document.createElement('section');
  completion.className = 'completion';
  completion.hidden = true;
  completion.setAttribute('role', 'region');
  completion.setAttribute('aria-label', 'Walkthrough complete');
  completion.setAttribute('aria-live', 'polite');
  style.textContent +=
    '.completion{position:fixed;right:24px;bottom:24px;width:320px;max-width:calc(100vw - 48px);max-height:calc(100dvh - 48px);overflow:auto;pointer-events:auto;background:white;border:1px solid #d6e6da;border-left:4px solid #2e926b;border-radius:10px;padding:20px;box-shadow:0 12px 45px #16322230}.completion .done{display:block;margin-left:auto;background:#215d46;color:white}.completion .feedback-link{display:block;margin-top:12px;padding:0;border:0;background:transparent;color:#215d46;text-decoration:underline;text-underline-offset:3px}';
  const abort = new AbortController();
  let positionFrame = 0;
  function anchorToMain() {
    positionFrame = 0;
    host.style.setProperty('--help-main-top', '60px');
    host.style.setProperty('--help-main-height', '645px');
    const left = launcher.isConnected
      ? launcher.getBoundingClientRect().right + 12
      : innerWidth * 0.2 + 58;
    host.style.setProperty('--help-panel-left', `${left}px`);
    host.style.setProperty(
      '--help-panel-width',
      `${Math.max(0, innerWidth - left - 16)}px`,
    );
  }
  function schedulePosition() {
    if (!positionFrame) positionFrame = requestAnimationFrame(anchorToMain);
  }
  const mainResize = new ResizeObserver(schedulePosition);
  const main = document.getElementById('portal-main');
  if (main) mainResize.observe(main);
  window.addEventListener('resize', schedulePosition, { signal: abort.signal });
  window.addEventListener('scroll', schedulePosition, {
    capture: true,
    signal: abort.signal,
  });
  anchorToMain();
  let context: Context | undefined;
  let acknowledged = true;
  let dismissed = false;
  let disposed = false;
  let renderedKey = '';
  let searchQuery = '';
  let published = publishedIds(undefined);
  let catalog = [...workflows];
  function closeMenu() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    syncSurfaceVisibility();
  }
  function syncSurfaceVisibility() {
    onSurfaceVisibility(!panel.hidden || !notice.hidden || !completion.hidden);
  }
  function closeCompletion() {
    completion.hidden = true;
    syncSurfaceVisibility();
  }
  function showCompletion() {
    const workflow = catalog.find(
      (item) => item.id === context?.state.workflowId,
    );
    if (!workflow) return;
    completion.replaceChildren();
    const title = document.createElement('h2');
    title.textContent = workflow.steps.at(-1)?.title ?? workflow.title;
    const message = document.createElement('p');
    message.textContent = "Well done! You're finished.";
    completion.append(title, message);
    button(completion, 'Done', () => {
      closeCompletion();
      launcher.focus();
    }).className = 'done';
    const feedbackLink = button(
      completion,
      'Give feedback on this walkthrough',
      () => feedback.open(workflow, feedbackLink),
    );
    feedbackLink.className = 'feedback-link';
    completion.hidden = false;
  }
  function button(parent: HTMLElement, text: string, action: () => void) {
    const item = document.createElement('button');
    item.textContent = text;
    item.onclick = action;
    parent.append(item);
    return item;
  }
  function link(parent: HTMLElement, text: string) {
    const item = document.createElement('a');
    item.textContent = text;
    item.href = `${location.origin}/#/documentation`;
    item.target = '_blank';
    item.rel = 'noopener noreferrer';
    parent.append(item);
  }
  function showRelease() {
    notice.replaceChildren();
    const title = document.createElement('h2');
    title.textContent = 'Windchill Process Update';
    const text = document.createElement('p');
    text.textContent =
      'Sample release: collaboration instructions and participant guidance have changed. Review the sample process guide before continuing. This content defines no official business rules.';
    const links = document.createElement('div');
    links.className = 'notice-links';
    const actions = document.createElement('div');
    actions.className = 'notice-actions';
    notice.append(title, text, links, actions);
    link(links, 'View sample release notes');
    link(links, 'View sample quality documentation');
    button(actions, 'Acknowledge', () => {
      void chrome.storage.local
        .set({ [acknowledgmentKey]: true })
        .then(() => {
          acknowledged = true;
          notice.hidden = true;
          syncSurfaceVisibility();
          launcher.focus();
        })
        .catch(() => {
          text.textContent =
            'Acknowledgment could not be saved. Check extension storage and try again.';
        });
    });
    button(actions, 'Close announcement', () => {
      dismissed = true;
      notice.hidden = true;
      syncSurfaceVisibility();
      launcher.focus();
    });
    notice.hidden = false;
    syncSurfaceVisibility();
  }
  function render() {
    if (!context || disposed) return;
    const key = JSON.stringify([
      context.route,
      context.state,
      [context.information?.enabled, context.information?.supported],
      published,
      catalog,
      Boolean(document.querySelector('[data-guide="customize-tab"]')),
    ]);
    if (key === renderedKey) return;
    renderedKey = key;
    const active = ['running', 'paused', 'failed'].includes(
      context.state.status,
    );
    contextual.hidden =
      context.route !== 'task' ||
      active ||
      !published.includes('collaboration-tour');
    if (context.route !== 'dashboard' || active) notice.hidden = true;
    else if (!acknowledged && !dismissed && notice.hidden) showRelease();
    panel.replaceChildren();
    const title = document.createElement('h2');
    title.textContent = 'How can we help?';
    panel.append(title);
    const label = document.createElement('label');
    label.className = 'search-label';
    label.textContent = 'Search guides and documentation';
    label.htmlFor = 'guidance-search';
    const search = document.createElement('input');
    search.id = 'guidance-search';
    search.type = 'search';
    search.placeholder = 'Try “rename” or “document”';
    search.value = searchQuery;
    search.disabled = active;
    if (active) search.placeholder = 'Exit the current guide to search';
    panel.append(label, search);
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.textContent =
      context.state.error ??
      (context.state.status === 'completed'
        ? 'Walkthrough complete. Choose another guide below.'
        : context.state.status === 'running'
          ? 'Follow the highlighted element on the page.'
          : context.state.status === 'paused'
            ? 'Guidance paused. Restore the task tab or dialog before resuming.'
            : 'Choose help for this page.');
    panel.append(status);
    if (active) {
      if (context.state.status === 'running')
        button(panel, 'Pause guidance', () =>
          command({ type: 'PAUSE_WORKFLOW' }),
        );
      if (context.state.status === 'paused')
        button(panel, 'Resume guidance', () =>
          command({ type: 'RESUME_WORKFLOW' }),
        );
      if (context.state.status === 'failed')
        button(panel, 'Retry step', () => command({ type: 'RETRY_STEP' }));
      button(panel, 'Exit guidance', () => {
        command({ type: 'CANCEL_WORKFLOW' });
        launcher.focus();
      });
      button(panel, 'Fill demo values', () => command({ type: 'AUTOFILL' }));
    } else {
      const results = document.createElement('div');
      results.className = 'results';
      results.setAttribute('aria-live', 'polite');
      panel.append(results);
      const renderResults = () => {
        results.replaceChildren();
        let found = 0;
        for (const workflow of catalog.filter(
          (item) =>
            published.includes(item.id) &&
            item.supportedRoutes.includes(context!.route) &&
            `${item.title} ${item.description}`
              .toLowerCase()
              .includes(searchQuery.trim().toLowerCase()),
        )) {
          // Rename requires the participant tab; the introductory tour navigates there.
          if (
            workflow.id === 'rename-tab' &&
            !document.querySelector('[data-guide="customize-tab"]')
          )
            continue;
          found++;
          button(results, workflow.title, () => {
            closeMenu();
            command({ type: 'START_WORKFLOW', workflowId: workflow.id });
          });
        }
        if (
          !searchQuery ||
          /documentation|document|guide|process|release/.test(
            searchQuery.toLowerCase(),
          )
        ) {
          link(results, 'Related sample documentation');
          found++;
        }
        if (!found) {
          const empty = document.createElement('p');
          empty.textContent =
            'No matching help on this page. Try another search.';
          results.append(empty);
        }
      };
      search.oninput = () => {
        searchQuery = search.value;
        renderResults();
      };
      renderResults();
    }
    if (context.information?.supported)
      button(
        panel,
        context.information?.enabled
          ? 'Hide Important Information'
          : 'Show Important Information',
        () =>
          command({
            type: 'SET_INFORMATION_HIGHLIGHTS',
            enabled: !context?.information?.enabled,
          }),
      );
    else {
      const empty = document.createElement('p');
      empty.textContent = 'No field guidance is configured for this page.';
      panel.append(empty);
    }
    if (context.route === 'dashboard') {
      button(panel, "What's new on this page?", showRelease);
    }
    button(panel, 'Close help', () => {
      closeMenu();
      launcher.focus();
    });
    syncSurfaceVisibility();
  }
  launcher.onclick = () => {
    anchorToMain();
    panel.hidden = !panel.hidden;
    launcher.setAttribute('aria-expanded', String(!panel.hidden));
    syncSurfaceVisibility();
    if (!panel.hidden) panel.querySelector('input')?.focus();
  };
  contextual.onclick = () => {
    closeMenu();
    command({ type: 'START_WORKFLOW', workflowId: 'collaboration-tour' });
  };
  window.addEventListener(
    'keydown',
    (event) => {
      if (feedback.isOpen) return;
      if (event.key === 'Escape' && !completion.hidden) {
        closeCompletion();
        launcher.focus();
        return;
      }
      if (event.key === 'Escape' && (!panel.hidden || !notice.hidden)) {
        closeMenu();
        notice.hidden = true;
        syncSurfaceVisibility();
        dismissed = true;
        launcher.focus();
      } else if (event.key === 'Escape' && context?.information?.enabled) {
        const tip = document
          .getElementById('smartguide-information')
          ?.shadowRoot?.querySelector<HTMLElement>('#information-tooltip');
        // The information controller handles Escape inside its tooltip first.
        if (!tip || tip.hidden)
          command({ type: 'SET_INFORMATION_HIGHLIGHTS', enabled: false });
      }
    },
    { signal: abort.signal },
  );
  shadow.append(style, launcher, panel, contextual, notice, completion);
  document.body.append(host);
  const publicationChanged = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string,
  ) => {
    if (area === 'local' && changes[acknowledgmentKey]) {
      acknowledged = changes[acknowledgmentKey].newValue === true;
      dismissed = false;
      if (acknowledged) notice.hidden = true;
      renderedKey = '';
      render();
    }
    if (area === 'local' && changes[publicationKey]) {
      published = publishedIds(changes[publicationKey].newValue);
    }
    if (area === 'local' && changes[catalogKey]) {
      try {
        catalog = readCatalog(changes[catalogKey].newValue);
      } catch {
        catalog = [];
      }
    }
    if (area === 'local' && (changes[publicationKey] || changes[catalogKey])) {
      renderedKey = '';
      render();
    }
  };
  chrome.storage.onChanged.addListener(publicationChanged);
  void chrome.storage.local
    .get([publicationKey, catalogKey])
    .then((value) => {
      published = publishedIds(value[publicationKey]);
      catalog = readCatalog(value[catalogKey]);
      renderedKey = '';
      render();
    })
    .catch(() => {
      published = [];
      renderedKey = '';
      render();
    });
  void chrome.storage.local
    .get(acknowledgmentKey)
    .then((value) => {
      acknowledged = value[acknowledgmentKey] === true;
      renderedKey = '';
      render();
    })
    .catch(() => {
      acknowledged = false;
      renderedKey = '';
      render();
    });
  return {
    update(value: Context) {
      if (
        context?.state.workflowId !== value.state.workflowId ||
        context?.route !== value.route ||
        value.state.status !== 'completed'
      ) {
        feedback.close();
        closeCompletion();
      }
      const wasRunning = context?.state.status === 'running';
      if (context && context.route !== value.route) closeMenu();
      context = value;
      render();
      if (wasRunning && value.state.status === 'completed') {
        closeMenu();
        showCompletion();
      }
      syncSurfaceVisibility();
    },
    dispose() {
      feedback.close();
      disposed = true;
      abort.abort();
      chrome.storage.onChanged.removeListener(publicationChanged);
      host.remove();
      mainResize.disconnect();
      cancelAnimationFrame(positionFrame);
    },
  };
}
