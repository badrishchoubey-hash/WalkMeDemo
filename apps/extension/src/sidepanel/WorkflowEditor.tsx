import { useState } from 'react';
import type {
  GuideStep,
  GuideWorkflow,
  Route,
} from '../../../../packages/shared/workflow-types';
import { parseWorkflow } from '../../../../packages/shared/workflow-catalog';
import { validateWorkflow } from '../../../../packages/shared/workflows';

const pages: Route[] = [
  'dashboard',
  'parts',
  'documents',
  'changes',
  'task',
  'documentation',
];
function newStep(): GuideStep {
  return {
    id: `step-${crypto.randomUUID()}`,
    title: '',
    description: '',
    selector: '',
    action: 'next',
  };
}
export function WorkflowEditor({
  workflow,
  catalog,
  onSave,
  onCancel,
}: {
  workflow?: GuideWorkflow;
  catalog: GuideWorkflow[];
  onSave: (value: GuideWorkflow) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<GuideWorkflow>(() =>
    workflow
      ? structuredClone(workflow)
      : {
          id: `custom-${crypto.randomUUID()}`,
          version: 1,
          title: '',
          description: '',
          route: 'dashboard',
          supportedRoutes: ['dashboard'],
          steps: [newStep()],
        },
  );
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  function update(index: number, changes: Partial<GuideStep>) {
    setDraft((current) => ({
      ...current,
      steps: current.steps.map((step, position) =>
        position === index ? { ...step, ...changes } : step,
      ),
    }));
  }
  function move(index: number, offset: number) {
    setDraft((current) => {
      const steps = [...current.steps];
      const from = steps[index];
      const to = steps[index + offset];
      if (!from || !to) return current;
      steps[index] = to;
      steps[index + offset] = from;
      return { ...current, steps };
    });
  }
  return (
    <form
      className="workflow-editor"
      aria-label="Workflow editor"
      onSubmit={(event) => {
        event.preventDefault();
        setError('');
        setSaving(true);
        void (async () => {
          try {
            const validated = parseWorkflow({
              ...draft,
              version: workflow ? workflow.version + 1 : 1,
            });
            validateWorkflow(validated, [
              ...catalog.filter((item) => item.id !== validated.id),
              validated,
            ]);
            for (const step of validated.steps) {
              // Syntax is checked here; page availability is checked by the live engine.
              document.createDocumentFragment().querySelector(step.selector);
              if (step.highlightSelector)
                document
                  .createDocumentFragment()
                  .querySelector(step.highlightSelector);
            }
            await onSave(validated);
          } catch (failure) {
            setError(
              failure instanceof Error
                ? failure.message
                : 'Could not save this workflow.',
            );
          } finally {
            setSaving(false);
          }
        })();
      }}
    >
      <h3>{workflow ? 'Edit workflow' : 'Create workflow'}</h3>
      <p>
        Save a draft, then Publish to update normal users in this browser.
        Targets must exist on the selected portal page.
      </p>
      <label>
        Workflow name
        <input
          required
          maxLength={160}
          value={draft.title}
          onChange={(event) =>
            setDraft({ ...draft, title: event.target.value })
          }
        />
      </label>
      <label>
        Workflow description
        <textarea
          required
          maxLength={3000}
          value={draft.description}
          onChange={(event) =>
            setDraft({ ...draft, description: event.target.value })
          }
        />
      </label>
      <label>
        Starting page
        <select
          aria-label="Starting page"
          value={draft.route}
          onChange={(event) => {
            const route = pages.find((page) => page === event.target.value);
            if (route) setDraft({ ...draft, route, supportedRoutes: [route] });
          }}
        >
          {pages.map((page) => (
            <option key={page} value={page}>
              {page === 'dashboard' ? 'Overview' : page}
            </option>
          ))}
        </select>
      </label>
      <p>
        <small>
          ID: {draft.id} ·{' '}
          {workflow ? `Next version: ${workflow.version + 1}` : 'Version: 1'}
        </small>
      </p>
      {draft.steps.map((step, index) => (
        <fieldset key={step.id}>
          <legend>Step {index + 1}</legend>
          <label>
            Step title
            <input
              required
              maxLength={160}
              value={step.title}
              onChange={(event) => update(index, { title: event.target.value })}
            />
          </label>
          <label>
            Instructions
            <textarea
              required
              maxLength={3000}
              value={step.description}
              onChange={(event) =>
                update(index, { description: event.target.value })
              }
            />
          </label>
          <label>
            Target selector
            <input
              required
              value={step.selector}
              placeholder={'[data-guide="create-part"]'}
              onChange={(event) =>
                update(index, { selector: event.target.value })
              }
            />
          </label>
          <label>
            Highlight selector (optional)
            <input
              value={step.highlightSelector ?? ''}
              placeholder="Defaults to target selector"
              onChange={(event) =>
                update(index, {
                  highlightSelector: event.target.value || undefined,
                })
              }
            />
          </label>
          <label>
            Progression
            <select
              aria-label="Progression"
              value={step.action}
              onChange={(event) => {
                const action = event.target.value;
                if (
                  action === 'next' ||
                  action === 'click' ||
                  action === 'input' ||
                  action === 'confirm' ||
                  action === 'wait'
                )
                  update(index, {
                    action,
                    expectedText:
                      action === 'wait' ? step.expectedText : undefined,
                    inputValue:
                      action === 'input' ? step.inputValue : undefined,
                  });
              }}
            >
              <option value="next">Informational — Next</option>
              <option value="click">User clicks target</option>
              <option value="input">User enters a value</option>
              <option value="confirm">User confirms</option>
              <option value="wait">Wait for visible result</option>
            </select>
          </label>
          {step.action === 'input' && (
            <label>
              Expected input text (optional)
              <input
                value={step.inputValue ?? ''}
                onChange={(event) =>
                  update(index, { inputValue: event.target.value || undefined })
                }
              />
            </label>
          )}
          {step.action === 'wait' && (
            <label>
              Expected result text (optional)
              <input
                value={step.expectedText ?? ''}
                onChange={(event) =>
                  update(index, {
                    expectedText: event.target.value || undefined,
                  })
                }
              />
            </label>
          )}
          {step.autofill && (
            <p>
              This existing step fills an allowlisted demo field. The user still
              confirms the change.
            </p>
          )}
          {step.navigateSelector && (
            <p>
              Existing configured tab navigation:{' '}
              <code>{step.navigateSelector}</code>
            </p>
          )}
          {step.linkedWorkflow && (
            <p>
              Linked walkthrough: <code>{step.linkedWorkflow}</code>
            </p>
          )}
          <div className="editor-actions">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => move(index, -1)}
              aria-label={`Move step ${index + 1} up`}
            >
              Move up
            </button>
            <button
              type="button"
              disabled={index === draft.steps.length - 1}
              onClick={() => move(index, 1)}
              aria-label={`Move step ${index + 1} down`}
            >
              Move down
            </button>
            <button
              type="button"
              disabled={draft.steps.length === 1 || step.action === 'confirm'}
              onClick={() =>
                setDraft({
                  ...draft,
                  steps: draft.steps.filter(
                    (_, position) => position !== index,
                  ),
                })
              }
              aria-label={`Remove step ${index + 1}`}
            >
              Remove step
            </button>
          </div>
        </fieldset>
      ))}
      <p>
        Use a single <code>data-guide</code>, <code>data-info</code>,{' '}
        <code>data-route</code>, or element ID selector. No scripts or automatic
        form submission are supported.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="editor-actions">
        <button
          type="button"
          disabled={draft.steps.length >= 50}
          onClick={() =>
            setDraft({ ...draft, steps: [...draft.steps, newStep()] })
          }
        >
          Add step
        </button>
        <button type="submit" className="primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        <button type="button" onClick={onCancel}>
          Cancel editing
        </button>
      </div>
    </form>
  );
}
