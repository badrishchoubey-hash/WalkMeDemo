import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type {
  Command,
  Context,
  Request,
} from '../../../../packages/shared/workflow-types';
import {
  isContext,
  isRecord,
} from '../../../../packages/shared/workflow-types';
import { workflows } from '../../../../packages/shared/workflows';
import './styles.css';
async function send(command: Command): Promise<Context> {
  const request: Request = {
    channel: 'smartguide',
    requestId: crypto.randomUUID(),
    command,
  };
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const reply: unknown = await Promise.race([
    chrome.runtime.sendMessage(request),
    new Promise(
      (_, reject) =>
        (timeout = setTimeout(
          () =>
            reject(
              new Error(
                'The portal did not respond. Refresh the portal and try again.',
              ),
            ),
          4000,
        )),
    ),
  ]).finally(() => clearTimeout(timeout));
  if (!isRecord(reply) || reply.requestId !== request.requestId)
    throw new Error('Invalid response from the extension.');
  if (reply.ok === true && isContext(reply.context)) return reply.context;
  throw new Error(
    typeof reply.error === 'string'
      ? reply.error
      : 'Unable to connect to the portal.',
  );
}
function Panel() {
  const [context, setContext] = useState<Context>();
  const [error, setError] = useState('');
  const [commandError, setCommandError] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      if (inFlight.current) {
        timer = setTimeout(() => void refresh(), 900);
        return;
      }
      const current = ++generation.current;
      try {
        const result = await send({ type: 'GET_CONTEXT' });
        if (!disposed && current === generation.current) {
          setContext(result);
          setError('');
        }
      } catch (failure) {
        if (!disposed && current === generation.current) {
          setContext(undefined);
          setError(
            failure instanceof Error
              ? failure.message
              : 'Connection unavailable.',
          );
        }
      }
      if (!disposed) timer = setTimeout(() => void refresh(), 900);
    }
    void refresh();
    return () => {
      disposed = true;
      clearTimeout(timer);
      generation.current++;
    };
  }, []);
  async function command(value: Command) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setCommandError('');
    const current = ++generation.current;
    try {
      const result = await send(value);
      if (current === generation.current) {
        setContext(result);
        setError('');
      }
    } catch (failure) {
      setCommandError(
        failure instanceof Error ? failure.message : 'The command failed.',
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }
  const state = context?.state;
  const workflow = workflows.find((item) => item.id === state?.workflowId);
  const step = workflow?.steps[state?.stepIndex ?? 0];
  const active =
    state && ['running', 'paused', 'failed'].includes(state.status);
  return (
    <main>
      <header>
        <span className="logo">S</span>
        <div>
          <strong>SmartGuide</strong>
          <small>YOUR WORKFLOW COMPANION</small>
        </div>
        <span className="local">LOCAL</span>
      </header>
      <section className="intro">
        <span className="eyebrow">LESS FRICTION. MORE PROGRESS.</span>
        <h1>A clear next step.</h1>
        <p>Contextual guidance for your engineering workspace.</p>
      </section>
      <div className="context">
        <span className={context ? 'dot' : 'dot offline'} />
        <span>
          {context
            ? `Connected · ${context.route === 'changes' ? 'Change requests' : context.route.charAt(0).toUpperCase() + context.route.slice(1)}`
            : 'Waiting for the demo portal'}
        </span>
      </div>
      {(error || commandError) && (
        <p className="error" role="alert">
          {commandError || error}
        </p>
      )}
      {context?.recoveryWarning && (
        <p className="error" role="status">
          {context.recoveryWarning}
        </p>
      )}
      {state?.recovered && state.status !== 'completed' && (
        <p className="context" role="status">
          Saved guide restored after refresh. Review the page, then resume your
          saved step. No actions were replayed.
        </p>
      )}
      {!context && (
        <section className="help">
          <h2>Start in your workspace</h2>
          <p>
            Open the local portal, then refresh its tab if you just installed or
            reloaded this extension.
          </p>
          <a href="http://127.0.0.1:5173" target="_blank" rel="noreferrer">
            Open demo portal ↗
          </a>
        </section>
      )}
      {active && workflow ? (
        <section className="active-card" aria-live="polite">
          <div className="section-label">
            {state.status.toUpperCase()}{' '}
            <span>
              {Math.min(state.stepIndex + 1, workflow.steps.length)} /{' '}
              {workflow.steps.length}
            </span>
          </div>
          <h2>{workflow.title}</h2>
          <div className="progress">
            <span
              style={{
                width: `${(state.stepIndex / workflow.steps.length) * 100}%`,
              }}
            />
          </div>
          <h3>{step?.title}</h3>
          <p>{step?.description}</p>
          {state.error && <p className="error">{state.error}</p>}
          <div className="controls">
            {state.status === 'running' ? (
              <button
                disabled={busy}
                onClick={() => void command({ type: 'PAUSE_WORKFLOW' })}
              >
                Pause
              </button>
            ) : (
              <button
                disabled={busy}
                onClick={() =>
                  void command({
                    type:
                      state.status === 'failed'
                        ? 'RETRY_STEP'
                        : 'RESUME_WORKFLOW',
                  })
                }
              >
                {state.status === 'failed'
                  ? 'Retry step'
                  : state.recovered
                    ? 'Resume saved step'
                    : 'Resume'}
              </button>
            )}
            <button
              disabled={busy}
              onClick={() => void command({ type: 'CANCEL_WORKFLOW' })}
            >
              Cancel
            </button>
          </div>
          {state.status === 'running' && step?.action === 'input' && (
            <button
              className="fill"
              disabled={busy}
              onClick={() => void command({ type: 'AUTOFILL' })}
            >
              ✦ Fill demo values
            </button>
          )}
          <small className="safety">
            You stay in control. Autofill never submits a form.
          </small>
        </section>
      ) : (
        <>
          {state?.status === 'completed' && (
            <section className="complete" role="status">
              <span>✓</span>
              <h2>Workflow complete.</h2>
              <p>{workflow?.title} finished successfully.</p>
            </section>
          )}
          {state?.status === 'cancelled' && (
            <p className="cancel-note" role="status">
              Guide cancelled. You can start again below.
            </p>
          )}
          {context && (
            <>
              <div className="section-label">
                AVAILABLE GUIDES{' '}
                <span>
                  {
                    workflows.filter((item) =>
                      item.supportedRoutes.includes(context.route),
                    ).length
                  }
                </span>
              </div>
              <div className="guide-list">
                {workflows
                  .filter((item) =>
                    item.supportedRoutes.includes(context.route),
                  )
                  .map((item, index) => (
                    <button
                      className="guide"
                      key={item.id}
                      disabled={busy}
                      onClick={() =>
                        void command({
                          type: 'START_WORKFLOW',
                          workflowId: item.id,
                        })
                      }
                    >
                      <div className="guide-number">0{index + 1}</div>
                      <div>
                        <h2>{item.title}</h2>
                        <p>{item.description}</p>
                        <small>
                          {item.steps.length} steps · Guided workflow
                        </small>
                      </div>
                      <span>→</span>
                    </button>
                  ))}
              </div>
            </>
          )}
        </>
      )}
      <footer>
        <span>⌁</span>
        <div>
          Built for confident engineering.
          <small>Independent PLM demo · No production connection</small>
        </div>
      </footer>
    </main>
  );
}
const root = document.getElementById('root');
if (!root) throw new Error('Side panel root missing.');
createRoot(root).render(<Panel />);
