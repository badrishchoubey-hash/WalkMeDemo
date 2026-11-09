import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getRoute } from '../../../packages/shared/workflow-types';
import type { Route } from '../../../packages/shared/workflow-types';
import { RecordForm } from './components/RecordForm';
import type { Field } from './components/RecordForm';
import {
  documents,
  isChange,
  isPart,
  readRecords,
  saveRecords,
  seedParts,
} from './mock-data/store';
import type { Part, ChangeRequest } from './mock-data/store';
import './styles.css';
import { DemoIcon } from '../../../packages/shared/demo-icon';
import { readSession, saveSession } from './mock-data/session-state';
import type { Notice } from './mock-data/session-state';
const partFields: Field[] = [
  {
    key: 'name',
    label: 'Part name',
    guide: 'part-name',
    placeholder: 'e.g. Precision mounting bracket',
  },
  {
    key: 'number',
    label: 'Part number',
    guide: 'part-number',
    placeholder: 'PRT-1005',
    // HTML patterns use Unicode Sets (v); a literal hyphen must remain escaped.
    pattern: String.raw`[A-Za-z0-9\-]+`,
  },
  {
    key: 'category',
    label: 'Category',
    guide: 'part-category',
    options: ['Mechanical', 'Electrical', 'Software'],
  },
  {
    key: 'description',
    label: 'Description',
    guide: 'part-description',
    multiline: true,
    placeholder: 'Describe the purpose and engineering context',
  },
];
const navigation: { route: Route; icon: string; label: string }[] = [
  { route: 'dashboard', icon: '◈', label: 'Overview' },
  { route: 'parts', icon: '⬡', label: 'Parts' },
  { route: 'documents', icon: '▤', label: 'Documents' },
  { route: 'changes', icon: '⇄', label: 'Change requests' },
];
function App() {
  const [route, setRoute] = useState(getRoute(location.hash));
  const [parts, setParts] = useState(() =>
    readRecords('sg:parts:v1', seedParts, isPart),
  );
  const [changes, setChanges] = useState<ChangeRequest[]>(() =>
    readRecords(
      'sg:changes:v1',
      [
        {
          id: 'ECR-1001',
          title: 'Improve mounting tolerance',
          part: 'PRT-1001',
          reason: 'Reduce assembly variation.',
        },
      ],
      isChange,
    ),
  );
  const [query, setQuery] = useState(
    () => readSession(getRoute(location.hash))?.documentContext?.query ?? '',
  );
  const [delayedQuery, setDelayedQuery] = useState(query);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<'part' | 'change' | null>(
    () => readSession(getRoute(location.hash))?.draft?.kind ?? null,
  );
  const [detail, setDetail] = useState<(typeof documents)[number] | null>(
    () =>
      documents.find(
        (doc) =>
          doc.id ===
          readSession(getRoute(location.hash))?.documentContext?.documentId,
      ) ?? null,
  );
  const [notice, setNotice] = useState<Notice | null>(
    () => readSession(getRoute(location.hash))?.notice ?? null,
  );
  const [sessionWarning, setSessionWarning] = useState('');
  function rememberSession(
    draft?: Parameters<typeof saveSession>[1],
    nextNotice?: Notice,
  ) {
    setSessionWarning(
      saveSession(getRoute(location.hash), draft, nextNotice) ?? '',
    );
  }
  function closeForm() {
    rememberSession();
    setForm(null);
  }
  function rememberDocuments(nextQuery: string, documentId?: string) {
    setSessionWarning(
      saveSession('documents', undefined, undefined, {
        query: nextQuery,
        documentId,
      }) ?? '',
    );
  }
  useEffect(() => {
    const navigate = () => {
      setRoute(getRoute(location.hash));
      setQuery('');
      setDelayedQuery('');
      setForm(null);
      setDetail(null);
      setNotice(null);
      rememberSession();
    };
    window.addEventListener('hashchange', navigate);
    return () => window.removeEventListener('hashchange', navigate);
  }, []);
  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => {
      setDelayedQuery(query);
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [query]);
  const changeFields: Field[] = [
    {
      key: 'title',
      label: 'Change title',
      guide: 'change-title',
      placeholder: 'e.g. Improve bracket durability',
    },
    {
      key: 'part',
      label: 'Affected part',
      guide: 'change-part',
      options: parts.map((part) => part.number),
    },
    {
      key: 'reason',
      label: 'Reason for change',
      guide: 'change-reason',
      multiline: true,
      placeholder: 'Explain the problem and proposed improvement',
    },
  ];
  function save(values: Record<string, string>): string | undefined {
    try {
      if (form === 'part') {
        if (
          parts.some(
            (part) =>
              part.number.toLowerCase() === values.number?.trim().toLowerCase(),
          )
        )
          return 'This part number already exists. Choose a unique number.';
        const part: Part = {
          id: crypto.randomUUID(),
          name: values.name?.trim() ?? '',
          number: values.number?.trim() ?? '',
          category: values.category ?? '',
          description: values.description?.trim() ?? '',
        };
        if (!part.name || !part.number || !part.category || !part.description)
          return 'Complete all required fields.';
        const next = [part, ...parts];
        saveRecords('sg:parts:v1', next);
        setParts(next);
        const nextNotice: Notice = {
          kind: 'part',
          text: `${part.number} — ${part.name} created successfully.`,
        };
        rememberSession(undefined, nextNotice);
        setNotice(nextNotice);
      } else if (form === 'change') {
        const change: ChangeRequest = {
          id: `ECR-${Date.now().toString().slice(-7)}`,
          title: values.title?.trim() ?? '',
          part: values.part ?? '',
          reason: values.reason?.trim() ?? '',
        };
        if (!change.title || !change.part || !change.reason)
          return 'Complete all required fields.';
        const next = [change, ...changes];
        saveRecords('sg:changes:v1', next);
        setChanges(next);
        const nextNotice: Notice = {
          kind: 'change',
          text: `${change.id} created successfully. Ready for engineering review.`,
        };
        rememberSession(undefined, nextNotice);
        setNotice(nextNotice);
      }
      setForm(null);
    } catch {
      return 'Unable to save in local browser storage. Check browser storage settings and try again.';
    }
  }
  const pageTitle =
    navigation.find((item) => item.route === route)?.label ?? 'Overview';
  const filter = query.trim().toLowerCase();
  return (
    <div className="workspace">
      <aside className="sidebar">
        <a className="brand" href="#/dashboard">
          <span className="brand-mark">
            <DemoIcon />
          </span>
          <div>
            Extension Demo<span>ENGINEERING WORKSPACE</span>
          </div>
        </a>
        <div className="workspace-label">
          WORKSPACE <span>DEMO</span>
        </div>
        <nav aria-label="Main navigation">
          {navigation.map((item) => (
            <a
              key={item.route}
              href={`#/${item.route}`}
              aria-current={route === item.route ? 'page' : undefined}
              data-guide={`nav-${item.route}`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
              {route === item.route && <i />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-dot" /> Local demo environment
          <p>Synthetic data · No production connection</p>
          <div className="profile">
            <span>BD</span>
            <div>
              Demo engineer<small>Product development</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            Workspace <span>/</span> <strong>{pageTitle}</strong>
          </div>
          <div className="topbar-right">
            <span className="environment">● Sandbox</span>
            <span className="avatar">BD</span>
          </div>
        </header>
        <main id="portal-main" data-route={route}>
          <div className="page-heading">
            <div>
              <span className="eyebrow">PRODUCT LIFECYCLE MANAGEMENT</span>
              <h1>
                {route === 'dashboard' ? 'Engineering, in focus.' : pageTitle}
              </h1>
              <p>
                {route === 'dashboard'
                  ? 'Your parts, documents, and engineering changes. One connected workspace.'
                  : route === 'parts'
                    ? 'Define, organize, and maintain your engineering part records.'
                    : route === 'documents'
                      ? 'Find the specifications and instructions behind your products.'
                      : 'Track proposed improvements from idea to engineering review.'}
              </p>
            </div>
            <span className="outline-tag">DEMONSTRATION PORTAL</span>
          </div>
          {notice && (
            <div
              className="success"
              role="status"
              data-guide={`${notice.kind}-success`}
            >
              <strong>✓ Record created</strong>
              <span>{notice.text}</span>
              <button
                aria-label="Dismiss notification"
                onClick={() => {
                  setNotice(null);
                  rememberSession();
                }}
              >
                ×
              </button>
            </div>
          )}
          {sessionWarning && (
            <p className="error" role="status">
              {sessionWarning}
            </p>
          )}
          {route === 'dashboard' ? (
            <>
              <section className="stats" aria-label="Workspace statistics">
                {[
                  {
                    value: parts.length,
                    label: 'Engineering parts',
                    icon: '⬡',
                    hint: 'Across 3 disciplines',
                    route: 'parts',
                  },
                  {
                    value: documents.length,
                    label: 'Controlled documents',
                    icon: '▤',
                    hint: 'Specifications & procedures',
                    route: 'documents',
                  },
                  {
                    value: changes.length,
                    label: 'Change requests',
                    icon: '⇄',
                    hint: 'Awaiting engineering review',
                    route: 'changes',
                  },
                ].map((item) => (
                  <a className="stat" href={`#/${item.route}`} key={item.label}>
                    <span className="stat-icon">{item.icon}</span>
                    <span className="stat-label">{item.label}</span>
                    <strong>{String(item.value).padStart(2, '0')}</strong>
                    <small>
                      {item.hint} <span>↗</span>
                    </small>
                  </a>
                ))}
              </section>
              <section className="hero-card">
                <div>
                  <span className="eyebrow">
                    A LITTLE GUIDANCE. A BETTER WORKFLOW.
                  </span>
                  <h2>
                    Move from knowing
                    <br />
                    to getting it done.
                  </h2>
                  <p>
                    Open the Windchill Extension Demo browser extension for
                    contextual, step-by-step help inside your workspace.
                  </p>
                  <a className="primary link-button" href="#/parts">
                    Explore engineering parts <span>→</span>
                  </a>
                </div>
                <div className="guide-preview" aria-hidden="true">
                  <div className="preview-dots">
                    ● ● ● <span>EXTENSION DEMO</span>
                  </div>
                  <div className="preview-check">✓</div>
                  <strong>Your next step, made clear.</strong>
                  <p>Create a new part</p>
                  <div className="preview-progress">
                    <span />
                  </div>
                  <small>Guidance that follows your context</small>
                </div>
              </section>
              <section className="card">
                <div className="section-heading">
                  <h2>Recently added parts</h2>
                  <a href="#/parts">View all parts →</a>
                </div>
                <PartTable parts={parts.slice(0, 4)} />
              </section>
            </>
          ) : (
            <section className="card collection">
              <div className="collection-toolbar">
                <div>
                  <h2>
                    {route === 'parts'
                      ? 'Part library'
                      : route === 'documents'
                        ? 'Document library'
                        : 'Engineering changes'}
                  </h2>
                  <span className="muted">
                    {route === 'parts'
                      ? parts.length
                      : route === 'documents'
                        ? documents.length
                        : changes.length}{' '}
                    records in this workspace
                  </span>
                </div>
                {route !== 'documents' && (
                  <button
                    className="primary"
                    data-guide={
                      route === 'parts' ? 'create-part' : 'create-change'
                    }
                    onClick={() => {
                      setNotice(null);
                      rememberSession({
                        kind: route === 'parts' ? 'part' : 'change',
                        values: {},
                        review: false,
                      });
                      setForm(route === 'parts' ? 'part' : 'change');
                    }}
                  >
                    + {route === 'parts' ? 'Create part' : 'New change request'}
                  </button>
                )}
              </div>
              <div className="search-row">
                <label className="search">
                  <span aria-hidden="true">⌕</span>
                  <input
                    aria-label={
                      route === 'documents'
                        ? 'Search documents'
                        : 'Search records'
                    }
                    data-guide={
                      route === 'documents'
                        ? 'document-search'
                        : 'record-search'
                    }
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setDetail(null);
                      if (route === 'documents')
                        rememberDocuments(event.target.value);
                    }}
                    placeholder={
                      route === 'documents'
                        ? 'Search documents by title or number…'
                        : 'Search by name or number…'
                    }
                  />
                </label>
                <span className="muted">
                  {route === 'documents'
                    ? 'Controlled documents'
                    : 'All records'}
                </span>
              </div>
              {route === 'parts' ? (
                <PartTable
                  parts={parts.filter((part) =>
                    `${part.name} ${part.number}`
                      .toLowerCase()
                      .includes(filter),
                  )}
                />
              ) : route === 'changes' ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Request</th>
                        <th>Title</th>
                        <th>Affected part</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {changes
                        .filter((change) =>
                          `${change.title} ${change.id}`
                            .toLowerCase()
                            .includes(filter),
                        )
                        .map((change) => (
                          <tr key={change.id}>
                            <td className="record-number">
                              <span data-info="change-number">{change.id}</span>
                            </td>
                            <td>{change.title}</td>
                            <td>
                              <span data-info="change-part">{change.part}</span>
                            </td>
                            <td>
                              <span
                                className="badge amber"
                                data-info="change-status"
                              >
                                In review
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {!changes.filter((change) =>
                    `${change.title} ${change.id}`
                      .toLowerCase()
                      .includes(filter),
                  ).length && (
                    <p className="empty">No matching change requests.</p>
                  )}
                </div>
              ) : (
                <div aria-live="polite">
                  {loading ? (
                    <p className="empty">Loading document results…</p>
                  ) : (
                    <div className="document-list">
                      {documents
                        .filter((doc) =>
                          `${doc.title} ${doc.id}`
                            .toLowerCase()
                            .includes(delayedQuery.toLowerCase()),
                        )
                        .map((doc) => (
                          <button
                            className="document-row"
                            key={doc.id}
                            data-guide={
                              doc.id === 'DOC-201'
                                ? 'document-result'
                                : undefined
                            }
                            onClick={() => {
                              setDetail(doc);
                              rememberDocuments(query, doc.id);
                            }}
                          >
                            <span className="document-icon">▤</span>
                            <div>
                              <strong>{doc.title}</strong>
                              <small>
                                <span data-info="document-number">
                                  {doc.id}
                                </span>{' '}
                                · {doc.type} ·{' '}
                                <span data-info="document-owner">
                                  {doc.owner}
                                </span>
                              </small>
                            </div>
                            <span
                              className="badge"
                              data-info="document-revision"
                            >
                              Document version {doc.revision}
                            </span>
                            <span>↗</span>
                          </button>
                        ))}
                      {!documents.some((doc) =>
                        `${doc.title} ${doc.id}`
                          .toLowerCase()
                          .includes(delayedQuery.toLowerCase()),
                      ) && (
                        <p className="empty">
                          No matching documents. Try “bracket”.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
          {detail && (
            <section
              className="card detail"
              data-guide="document-detail"
              aria-labelledby="document-title"
            >
              <span className="eyebrow">
                CONTROLLED DOCUMENT ·{' '}
                <span data-info="document-number">{detail.id}</span>
              </span>
              <h2 id="document-title">{detail.title}</h2>
              <p>{detail.content}</p>
              <span className="badge" data-info="document-revision">
                Document version {detail.revision}
              </span>
              <button
                className="secondary"
                onClick={() => {
                  setDetail(null);
                  rememberDocuments(query);
                }}
              >
                Close details
              </button>
            </section>
          )}
          <footer className="page-footer">
            <span>
              Windchill Extension Demo · Independent proof of concept · Not an
              official PTC product
            </span>
            <span>
              Local data only <span className="footer-dot">●</span>
            </span>
          </footer>
        </main>
      </div>
      {form && (
        <RecordForm
          kind={form}
          fields={form === 'part' ? partFields : changeFields}
          onSave={save}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
function PartTable({ parts }: { parts: Part[] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Part number</th>
            <th>Part name</th>
            <th>Category</th>
            <th>Revision</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((part) => (
            <tr key={part.id}>
              <td className="record-number">
                <span data-info="part-number">{part.number}</span>
              </td>
              <td>
                <strong>{part.name}</strong>
              </td>
              <td>{part.category}</td>
              <td>
                <span data-info="part-revision">A.1</span>
              </td>
              <td>
                <span className="badge" data-info="part-status">
                  Released
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!parts.length && <p className="empty">No matching parts.</p>}
    </div>
  );
}
const root = document.getElementById('root');
if (!root) throw new Error('Portal root is missing.');
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
