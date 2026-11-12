import { useRef, useState } from 'react';
import '../task.css';

// Independent application behavior only: the extension owns all walkthroughs.
export function CollaborationTask() {
  const [tab, setTab] = useState('details');
  const [name, setName] = useState('Setup Participants');
  const [draft, setDraft] = useState(name);
  const [menu, setMenu] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <section className="card task-workspace">
      <div data-guide="task-summary" className="task-summary">
        <span className="eyebrow">COLLABORATION TASK · SAMPLE-1042</span>
        <h2>Review collaboration — Sample assembly update</h2>
        <p>
          <span className="badge amber">In progress</span> Assigned to: Demo
          reviewer · Context: Sample product
        </p>
        <p className="muted">
          Representative demonstration. All names, records, and instructions are
          synthetic.
        </p>
      </div>
      <div className="task-tabs" role="tablist" aria-label="Task sections">
        <button
          role="tab"
          data-guide="details-tab"
          aria-selected={tab === 'details'}
          aria-controls="task-panel"
          onClick={() => setTab('details')}
        >
          Details
        </button>
        <button
          role="tab"
          data-guide="participants-tab"
          aria-selected={tab === 'participants'}
          aria-controls="task-panel"
          onClick={() => setTab('participants')}
        >
          {name}
        </button>
        <button
          role="tab"
          aria-selected={tab === 'history'}
          aria-controls="task-panel"
          onClick={() => setTab('history')}
        >
          Process history
        </button>
      </div>
      <div role="tabpanel" id="task-panel" className="task-panel">
        {tab === 'details' ? (
          <>
            <h3>Task details</h3>
            <dl>
              <dt>Subject</dt>
              <dd>Sample assembly documentation</dd>
              <dt>Activity</dt>
              <dd>Collaboration review</dd>
              <dt>Owner</dt>
              <dd>Demo engineering team</dd>
            </dl>
            <section
              data-guide="task-instructions"
              className="task-instructions"
            >
              <h3>Updated task instructions</h3>
              <p>
                Review the attached sample information, then open Setup
                Participants to review the proposed team. Record questions
                before completing your review.
              </p>
              <a href="#/documentation">Read the sample process guide</a>
            </section>
          </>
        ) : tab === 'participants' ? (
          <>
            <div className="section-heading">
              <h3>Participant setup</h3>
              <button
                className="secondary"
                data-guide="customize-tab"
                aria-expanded={menu}
                onClick={() => setMenu(!menu)}
              >
                Customize tab
              </button>
            </div>
            {menu && (
              <div className="tab-actions">
                <button
                  data-guide="rename-action"
                  onClick={() => {
                    setMenu(false);
                    setDraft(name);
                    dialog.current?.showModal();
                  }}
                >
                  Rename
                </button>
              </div>
            )}
            <section
              className="task-instructions"
              data-guide="participant-instructions"
              data-info="participant-instructions"
            >
              <h3>Participant instructions · Sample</h3>
              <p>
                Review the proposed team and consult the sample process guide
                before confirming assignments. No customer eligibility or
                approval rules are represented.
              </p>
              <a href="#/documentation">View sample process guide</a>
            </section>
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Participant</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Reviewer</td>
                  <td>Demo reviewer</td>
                  <td>Proposed</td>
                </tr>
                <tr>
                  <td>Coordinator</td>
                  <td>Sample coordinator</td>
                  <td>Proposed</td>
                </tr>
              </tbody>
            </table>
          </>
        ) : (
          <>
            <h3>Process history</h3>
            <p>
              Sample collaboration task opened for review. No production audit
              history is connected.
            </p>
          </>
        )}
      </div>
      <dialog
        ref={dialog}
        aria-labelledby="rename-title"
        onCancel={() => setDraft(name)}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.trim()) {
              setName(draft.trim());
              dialog.current?.close();
            }
          }}
        >
          <h2 id="rename-title">Rename tab</h2>
          <label>
            Tab name
            <input
              data-guide="tab-name"
              value={draft}
              maxLength={50}
              required
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          <div className="task-dialog-actions">
            <button
              type="button"
              data-guide="rename-cancel"
              onClick={() => dialog.current?.close()}
            >
              Cancel
            </button>
            <button className="primary" data-guide="rename-ok" type="submit">
              OK
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}

export function SampleDocumentation() {
  return (
    <section className="card task-panel sample-docs">
      <span className="eyebrow">SAMPLE DOCUMENTATION · DEMO ONLY</span>
      <h2>Process update — Sample release</h2>
      <p>
        This demonstration adds updated collaboration instructions, participant
        guidance, and tab customization.
      </p>
      <h3>Sample process guide</h3>
      <p>
        Read task instructions, inspect the proposed participants, and record
        review questions. Confirm changes only after checking the displayed
        information.
      </p>
      <h3>Sample quality documentation</h3>
      <p>
        Use the appropriate instructions supplied by your organization in a real
        deployment. This page is illustrative and defines no official quality
        policy.
      </p>
      <p>These local pages do not resolve production document revisions.</p>
      <a href="#/task">Open sample collaboration task</a>
    </section>
  );
}
