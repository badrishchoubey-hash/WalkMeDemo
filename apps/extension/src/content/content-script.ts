import {
  getRoute,
  isRequest,
  isSupportedUrl,
  isRecord,
} from '../../../../packages/shared/workflow-types';
import type {
  Context,
  GuideState,
  GuideStep,
  GuideWorkflow,
  Reply,
  Request,
} from '../../../../packages/shared/workflow-types';
import {
  validateWorkflow,
  workflows,
} from '../../../../packages/shared/workflows';
import { idleState, transition } from '../engine/workflow-engine';
import type { Transition } from '../engine/workflow-engine';
import { resolveTarget } from './selector-resolver';
import { createOverlay } from './overlay-manager';
import { autofill } from './autofill';
import { makeCheckpoint, recoverCheckpoint } from '../storage/checkpoint';
import type {
  CheckpointOperation,
  CheckpointEvent,
} from '../storage/checkpoint';

// Manifest host matching is broader than our configured port; enforce the exact origin before any DOM access.
if (isSupportedUrl(location.href)) {
  if (document.getElementById('portal-main')) initialize();
  else {
    // A refreshed Vite/React page may mount after document_idle. Wait once, bounded.
    const observer = new MutationObserver(() => {
      if (document.getElementById('portal-main')) {
        observer.disconnect();
        clearTimeout(timeout);
        initialize();
      }
    });
    observer.observe(document.getElementById('root') ?? document.body, {
      childList: true,
      subtree: true,
    });
    const timeout = setTimeout(() => observer.disconnect(), 10000);
  }
}
function initialize() {
  const root = document.getElementById('root');
  if (!root || !document.getElementById('portal-main')) return;
  const portal: HTMLElement = root;
  let state: GuideState = { ...idleState };
  let workflow: GuideWorkflow | undefined;
  let route = getRoute(location.hash);
  let cleanup: (() => void) | undefined;
  let run = 0;
  let filling = false;
  let advanceFilled: (() => void) | undefined;
  let recoveryWarning: string | undefined;
  const replies = new Map<string, Reply>();
  const context = (): Context => ({ route, state, recoveryWarning });
  let saveQueue: Promise<void> = Promise.resolve();
  async function checkpointRequest(
    operation: CheckpointOperation,
  ): Promise<unknown> {
    const request = { ...operation, requestId: crypto.randomUUID() };
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const response: unknown = await Promise.race([
      chrome.runtime.sendMessage(request),
      new Promise((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new Error(
                'Guide storage did not respond. Refresh recovery is unavailable.',
              ),
            ),
          2500,
        );
      }),
    ]).finally(() => clearTimeout(timeout));
    if (
      !isRecord(response) ||
      response.requestId !== request.requestId ||
      response.ok !== true
    )
      throw new Error(
        'Guide progress could not be saved or restored. You can continue, but refresh recovery is unavailable.',
      );
    return response.checkpoint;
  }
  function persist(event: Transition['type']) {
    const checkpoint =
      workflow && event !== 'cancel'
        ? makeCheckpoint(state, workflow, route, event as CheckpointEvent)
        : undefined;
    const request: CheckpointOperation = checkpoint
      ? { channel: 'smartguide-checkpoint', type: 'WRITE', checkpoint }
      : { channel: 'smartguide-checkpoint', type: 'CLEAR' };
    // Dispatch immediately so a rapid refresh cannot discard unsent queued transitions.
    const pending = (async () => {
      try {
        await checkpointRequest(request);
        recoveryWarning = undefined;
      } catch (error) {
        recoveryWarning =
          error instanceof Error
            ? error.message
            : 'Refresh recovery is unavailable.';
      }
    })();
    saveQueue = Promise.all([saveQueue, pending]).then(() => undefined);
  }
  function change(event: Transition) {
    cleanup?.();
    cleanup = undefined;
    advanceFilled = undefined;
    run++;
    if (!workflow) return;
    state = transition(state, event, workflow);
    state = { ...state, recovered: false };
    persist(event.type);
    if (state.status === 'running') execute();
  }
  function execute() {
    if (!workflow) return;
    const step = workflow.steps[state.stepIndex];
    if (!step) return;
    const currentRun = run;
    const abort = new AbortController();
    let target: HTMLElement | undefined;
    let missingTimer: ReturnType<typeof setTimeout> | undefined;
    let frame = 0;
    let done = false;
    const overlay = createOverlay(
      step,
      state.stepIndex,
      workflow.steps.length,
      () => change({ type: 'cancel' }),
    );
    function complete() {
      if (done || run !== currentRun || !workflow) return;
      done = true;
      change({ type: 'complete-step', stepId: step!.id });
    }
    function fail(message: string) {
      if (run === currentRun) change({ type: 'fail', error: message });
    }
    function check() {
      frame = 0;
      if (run !== currentRun) return;
      try {
        const next = resolveTarget(portal, step!);
        if (next !== target) {
          target = next;
          if (target)
            target.scrollIntoView({ block: 'center', behavior: 'instant' });
        }
        overlay.update(target);
        if (target) {
          clearTimeout(missingTimer);
          missingTimer = undefined;
          if (step!.action === 'wait') {
            complete();
            return;
          }
        } else if (!missingTimer)
          missingTimer = setTimeout(
            () =>
              fail(
                `Could not find “${step!.title}”. Restore the required page or form, then retry.`,
              ),
            step!.timeoutMs ?? 10000,
          );
      } catch (error) {
        fail(
          error instanceof Error
            ? error.message
            : 'Unable to locate this step.',
        );
      }
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(check);
    }
    function matchesInput(
      element: HTMLElement | undefined,
      definition: GuideStep,
    ): boolean {
      if (!(
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ))
        return false;
      return (
        Boolean(element.value.trim()) &&
        element.checkValidity() &&
        (!definition.inputValue ||
          element.value
            .toLowerCase()
            .includes(definition.inputValue.toLowerCase()))
      );
    }
    const interact = (event: Event) => {
      if (
        !target ||
        !target.isConnected ||
        !(event.target instanceof Node) ||
        !(target === event.target || target.contains(event.target))
      )
        return;
      if (
        (step.action === 'click' || step.action === 'confirm') &&
        event.type === 'click' &&
        event.isTrusted
      ) {
        // A submit click only counts when its form passes native validation.
        const form = target.closest('form');
        if (form && !form.checkValidity()) return;
        complete();
      } else if (
        step.action === 'input' &&
        (event.type === 'change' || event.type === 'focusout') &&
        !filling &&
        matchesInput(target, step)
      )
        complete();
    };
    for (const name of ['click', 'change', 'focusout'])
      portal.addEventListener(name, interact, {
        capture: true,
        signal: abort.signal,
      });
    // Observe the portal root only. Shadow-root overlay contents are not observed;
    // modal guidance may mount its host inside a dialog to avoid native inertness.
    const observer = new MutationObserver(schedule);
    observer.observe(portal, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [
        'class',
        'style',
        'hidden',
        'disabled',
        'open',
        'data-guide',
      ],
    });
    cleanup = () => {
      abort.abort();
      observer.disconnect();
      clearTimeout(missingTimer);
      cancelAnimationFrame(frame);
      overlay.remove();
    };
    advanceFilled = () => {
      // Commands can arrive before the observer's next animation frame after a form opens.
      target = resolveTarget(portal, step);
      if (
        state.status === 'running' &&
        step.action === 'input' &&
        matchesInput(target, step)
      ) {
        complete();
        queueMicrotask(() => advanceFilled?.());
      }
    };
    check();
  }
  window.addEventListener('hashchange', () => {
    route = getRoute(location.hash);
    if (
      state.status === 'running' ||
      state.status === 'paused' ||
      state.status === 'failed'
    )
      change({ type: 'cancel' });
  });
  window.addEventListener('pagehide', () => cleanup?.(), { once: true });
  function handle(request: Request): Reply {
    if (replies.has(request.requestId)) return replies.get(request.requestId)!;
    try {
      const command = request.command;
      switch (command.type) {
        case 'GET_CONTEXT':
          break;
        case 'START_WORKFLOW': {
          const next = workflows.find((item) => item.id === command.workflowId);
          if (!next || !next.supportedRoutes.includes(route))
            throw new Error(
              'This workflow is not available on the current page.',
            );
          if (portal.querySelector('dialog[open]'))
            throw new Error(
              'Close the current form before starting a new guide.',
            );
          validateWorkflow(next);
          cleanup?.();
          workflow = next;
          if (route !== next.route) {
            // Navigate via a real portal link. Start after React handles its hashchange listener.
            location.hash = `/${next.route}`;
            state = { status: 'idle', stepIndex: 0 };
            const requestedWorkflow = next;
            window.addEventListener(
              'hashchange',
              () => {
                setTimeout(() => {
                  if (workflow === requestedWorkflow) change({ type: 'start' });
                }, 0);
              },
              { once: true },
            );
          } else change({ type: 'start' });
          break;
        }
        case 'PAUSE_WORKFLOW':
          change({ type: 'pause' });
          break;
        case 'RESUME_WORKFLOW':
          if (state.recovered && workflow) {
            const savedStep = workflow.steps[state.stepIndex];
            if (!savedStep || !resolveTarget(portal, savedStep))
              throw new Error(
                'The saved step is not available on this page. Reopen its form, or Cancel and start the guide again. No actions have been replayed.',
              );
          }
          change({ type: 'resume' });
          break;
        case 'CANCEL_WORKFLOW':
          change({ type: 'cancel' });
          break;
        case 'RETRY_STEP':
          change({ type: 'retry' });
          break;
        case 'AUTOFILL':
          if (!workflow || state.status !== 'running' || filling)
            throw new Error(
              'Start or resume a guide before filling demo values.',
            );
          filling = true;
          try {
            autofill(portal, workflow.id);
          } finally {
            filling = false;
          }
          queueMicrotask(() => advanceFilled?.());
          break;
      }
      const reply: Reply = {
        requestId: request.requestId,
        ok: true,
        context: context(),
      };
      if (request.command.type !== 'GET_CONTEXT') {
        replies.set(request.requestId, reply);
        if (replies.size > 100) {
          const first = replies.keys().next().value;
          if (first) replies.delete(first);
        }
      }
      return reply;
    } catch (error) {
      return {
        requestId: request.requestId,
        ok: false,
        error:
          error instanceof Error ? error.message : 'The guide command failed.',
      };
    }
  }
  chrome.runtime.onMessage.addListener((message: unknown, sender, respond) => {
    if (
      sender.id !== chrome.runtime.id ||
      !sender.url?.startsWith(chrome.runtime.getURL('')) ||
      !isRequest(message)
    )
      return;
    void ready
      .then(async () => {
        const reply = handle(message);
        // Commands acknowledge durable progress; context reads observe prior queued saves.
        await saveQueue;
        respond(reply.ok ? { ...reply, context: context() } : reply);
      })
      .catch(() =>
        respond({
          requestId: message.requestId,
          ok: false,
          error:
            'Unable to restore guide progress. Refresh the portal and try again.',
        }),
      );
    return true;
  });
  const ready = (async () => {
    try {
      const stored = await checkpointRequest({
        channel: 'smartguide-checkpoint',
        type: 'READ',
      });
      const recovered = recoverCheckpoint(stored, route);
      if (recovered) {
        workflow = recovered.workflow;
        state = recovered.state;
      } else if (stored !== undefined)
        await checkpointRequest({
          channel: 'smartguide-checkpoint',
          type: 'CLEAR',
        });
    } catch (error) {
      recoveryWarning =
        error instanceof Error
          ? error.message
          : 'Refresh recovery is unavailable.';
    }
  })();
}
