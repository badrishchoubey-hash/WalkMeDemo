import { useEffect, useState } from 'react';
import {
  workflows,
  validateWorkflow,
} from '../../../../packages/shared/workflows';
import {
  publicationKey,
  autoStartKey,
  publishedIds,
} from '../../../../packages/shared/publication';
import type {
  WorkflowId,
  GuideWorkflow,
} from '../../../../packages/shared/workflow-types';
import { acknowledgmentKey } from '../../../../packages/shared/release';
import {
  catalogKey,
  draftsKey,
  readOverrides,
  mergeCatalog,
} from '../../../../packages/shared/workflow-catalog';
import { WorkflowEditor } from './WorkflowEditor';
import { portalUrl } from '../../../../packages/shared/config';

export function AdminGuide() {
  const [selected, setSelected] = useState<WorkflowId[]>(
    workflows.map((item) => item.id),
  );
  const [status, setStatus] = useState('');
  const [docs, setDocs] = useState(false);
  const [automatic, setAutomatic] = useState(true);
  const [drafts, setDrafts] = useState<GuideWorkflow[]>([]);
  const [editing, setEditing] = useState<GuideWorkflow | 'new' | undefined>();
  const [chosen, setChosen] = useState<WorkflowId>('create-part');
  const [loaded, setLoaded] = useState(false);
  const catalog = mergeCatalog(drafts);
  useEffect(() => {
    void chrome.storage.local
      .get([publicationKey, autoStartKey, draftsKey, catalogKey])
      .then((value) => {
        setSelected(publishedIds(value[publicationKey]));
        setAutomatic(value[autoStartKey] !== false);
        setDrafts(
          readOverrides(
            value[draftsKey] === undefined
              ? value[catalogKey]
              : value[draftsKey],
          ),
        );
        setLoaded(true);
      })
      .catch(() => setStatus('Publication settings could not be loaded.'));
  }, []);
  async function publish() {
    try {
      readOverrides({ schemaVersion: 1, workflows: drafts });
      for (const item of catalog.filter((item) => selected.includes(item.id))) {
        validateWorkflow(item, catalog);
        if (
          item.steps.some(
            (step) =>
              step.linkedWorkflow && !selected.includes(step.linkedWorkflow),
          )
        )
          throw new Error(
            'Include Rename a tab when publishing the linked collaboration tour.',
          );
      }
      await chrome.storage.local.set({
        [catalogKey]: { schemaVersion: 1, workflows: drafts },
        [publicationKey]: { schemaVersion: 1, workflowIds: selected },
      });
      setStatus(
        'Published to this browser. Open the portal to try the normal user experience.',
      );
      setDocs(true);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Publication failed.');
    }
  }
  return (
    <section
      className="admin-workspace"
      aria-label="Developer and admin workspace"
    >
      <span className="section-label">DEVELOPER / ADMIN</span>
      <h1>Manage guidance</h1>
      <p>
        Create or edit workflow drafts, then choose what normal users see.
        Publish updates this browser only.
      </p>
      <fieldset>
        <legend>Published workflows</legend>
        {catalog.map((item) => (
          <label key={item.id}>
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...current, item.id]
                    : current.filter((id) => id !== item.id),
                )
              }
            />
            {item.title}
          </label>
        ))}
      </fieldset>
      <label>
        <input
          type="checkbox"
          checked={automatic}
          onChange={(event) => {
            const enabled = event.target.checked;
            void chrome.storage.local
              .set({ [autoStartKey]: enabled })
              .then(() => setAutomatic(enabled))
              .catch(() =>
                setStatus('Automatic guidance setting could not be saved.'),
              );
          }}
        />
        Start page guidance automatically
      </label>
      <div className="admin-actions">
        <button
          onClick={() => {
            void chrome.storage.local
              .remove(acknowledgmentKey)
              .then(() => setStatus('Release announcement reset for the demo.'))
              .catch(() => setStatus('Announcement reset failed.'));
          }}
        >
          Reset release announcement for demo
        </button>
        <button
          className="primary"
          disabled={!loaded}
          onClick={() => void publish()}
        >
          Publish
        </button>
        <button onClick={() => setDocs(!docs)} aria-expanded={docs}>
          Sample documentation
        </button>
        <a
          href={portalUrl()}
          target="_blank"
          rel="noreferrer"
        >
          Open user experience ↗
        </a>
      </div>
      <p role="status">{status}</p>
      <section className="workflow-authoring" aria-label="Workflow authoring">
        <h2>Workflow editor</h2>
        <p>
          Drafts stay private to this editor until you choose Publish. Existing
          confirmation and allowlisted automation rules are preserved.
        </p>
        <div className="editor-actions">
          <button
            disabled={!loaded}
            onClick={() => {
              setEditing('new');
              setStatus('');
            }}
          >
            Create workflow
          </button>
          <label>
            Workflow to edit
            <select
              aria-label="Workflow to edit"
              value={chosen}
              onChange={(event) => {
                const item = catalog.find(
                  (workflow) => workflow.id === event.target.value,
                );
                if (item) setChosen(item.id);
              }}
            >
              {catalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                  {drafts.some((draft) => draft.id === item.id)
                    ? ' · Draft saved'
                    : ''}
                </option>
              ))}
            </select>
          </label>
          <button
            disabled={!loaded}
            onClick={() => {
              setEditing(catalog.find((item) => item.id === chosen));
              setStatus('');
            }}
          >
            Edit selected workflow
          </button>
        </div>
        {editing && (
          <WorkflowEditor
            key={editing === 'new' ? 'new' : `${editing.id}:${editing.version}`}
            workflow={editing === 'new' ? undefined : editing}
            catalog={catalog}
            onCancel={() => setEditing(undefined)}
            onSave={async (value) => {
              const next = [
                ...drafts.filter((item) => item.id !== value.id),
                value,
              ];
              readOverrides({ schemaVersion: 1, workflows: next });
              await chrome.storage.local.set({
                [draftsKey]: { schemaVersion: 1, workflows: next },
              });
              setDrafts(next);
              setChosen(value.id);
              setSelected((current) =>
                current.includes(value.id) ? current : [...current, value.id],
              );
              setEditing(undefined);
              setStatus(
                'Draft saved. Choose Publish to make this workflow available to users.',
              );
            }}
          />
        )}
      </section>
      {docs && (
        <article className="admin-docs">
          <h2>Sample documentation</h2>
          <p>
            Use Workflow editor to create a workflow or edit an existing one,
            add or reorder steps, and save a draft. Publish applies the saved
            definitions to this browser without rebuilding. Source-based changes
            remain available for new engine capabilities. This is a local POC,
            with no production publishing service or role-based authentication.
          </p>
          <h3>Change an existing workflow</h3>
          <ol>
            <li>
              In Workflow editor, choose a workflow and click Edit selected
              workflow.
            </li>
            <li>
              Edit the name, description, target selectors, progression, or
              expected values. Use synthetic content and stable{' '}
              <code>data-guide</code> targets.
            </li>
            <li>
              Preserve user confirmation for record changes. Informational steps
              use <code>next</code>; interactive steps require actual click,
              input, or result validation.
            </li>
          </ol>
          <h3>Add a workflow</h3>
          <ol>
            <li>
              Click Create workflow, enter its name and description, and choose
              the starting page.
            </li>
            <li>
              Add steps with instructions, real target selectors, and the
              expected progression. Use Next for information and actual
              click/input/result validation for interactive steps.
            </li>
            <li>
              Use Add step, Move up, Move down, or Remove step to arrange the
              guide. Existing confirmation steps remain protected.
            </li>
            <li>
              Save draft, select the workflow for publication, then click
              Publish. Draft changes do not affect users until published.
            </li>
          </ol>
          <h3>Verify and publish</h3>
          <p>
            Publish validates the saved definitions and updates open portal tabs
            in this browser. Try the guide on its starting page. Linked
            workflows must be published together. A guide whose definition
            changes is cancelled safely and can be restarted with the new
            version.
          </p>
          <p>
            New engine actions or automation still need source changes and
            tests: run npm test, npm run lint, npm run build, and npm run
            test:e2e, then reload the extension. Editor-created content needs no
            rebuild. Publishing is local to this browser; it does not upload an
            extension or deploy to another user.
          </p>
        </article>
      )}
    </section>
  );
}
