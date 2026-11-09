import { isRecord } from '../../../../packages/shared/workflow-types';
import type { Route } from '../../../../packages/shared/workflow-types';
import { documents } from './store';

const KEY = 'sg:workspace-session:v1';
export type Draft = {
  kind: 'part' | 'change';
  values: Record<string, string>;
  review: boolean;
};
export type Notice = { kind: 'part' | 'change'; text: string };
type Snapshot = {
  schemaVersion: 1;
  route: Route;
  draft?: Draft;
  notice?: Notice;
  documentContext?: { query: string; documentId?: string };
};
const allowedFields = {
  part: ['name', 'number', 'category', 'description'],
  change: ['title', 'part', 'reason'],
};
export function parseSnapshot(
  value: unknown,
  route: Route,
): Snapshot | undefined {
  if (!isRecord(value) || value.schemaVersion !== 1 || value.route !== route)
    return;
  const result: Snapshot = { schemaVersion: 1, route };
  if (value.draft !== undefined) {
    const draft = value.draft;
    if (
      !isRecord(draft) ||
      (draft.kind !== 'part' && draft.kind !== 'change') ||
      (draft.kind === 'part' ? route !== 'parts' : route !== 'changes') ||
      !isRecord(draft.values) ||
      typeof draft.review !== 'boolean'
    )
      return;
    const fields = allowedFields[draft.kind];
    if (
      !Object.entries(draft.values).every(
        ([key, field]) =>
          fields.includes(key) &&
          typeof field === 'string' &&
          field.length <= 10000,
      )
    )
      return;
    const values: Record<string, string> = {};
    for (const key of fields) {
      const field = draft.values[key];
      if (typeof field === 'string') values[key] = field;
    }
    const complete =
      fields.every((key) => values[key]?.trim()) &&
      (draft.kind === 'part'
        ? ['Mechanical', 'Electrical', 'Software'].includes(
            values.category ?? '',
          ) &&
          /^[A-Za-z0-9-]+$/.test(values.number ?? '') &&
          (values.name?.length ?? 0) <= 120 &&
          (values.number?.length ?? 0) <= 120
        : (values.title?.length ?? 0) <= 120);
    // Saved data is untrusted. An incomplete draft always returns to editing.
    result.draft = {
      kind: draft.kind,
      values,
      review: draft.review && complete,
    };
  }
  if (value.notice !== undefined) {
    const notice = value.notice;
    if (
      !isRecord(notice) ||
      (notice.kind !== 'part' && notice.kind !== 'change') ||
      typeof notice.text !== 'string' ||
      notice.text.length > 1000 ||
      (notice.kind === 'part' ? route !== 'parts' : route !== 'changes')
    )
      return;
    result.notice = { kind: notice.kind, text: notice.text };
  }
  if (value.documentContext !== undefined) {
    const context = value.documentContext;
    if (
      route !== 'documents' ||
      !isRecord(context) ||
      typeof context.query !== 'string' ||
      context.query.length > 10000 ||
      (context.documentId !== undefined &&
        !documents.some((doc) => doc.id === context.documentId))
    )
      return;
    result.documentContext = {
      query: context.query,
      documentId:
        typeof context.documentId === 'string' ? context.documentId : undefined,
    };
  }
  return result;
}
export function readSession(route: Route): Snapshot | undefined {
  try {
    return parseSnapshot(
      JSON.parse(sessionStorage.getItem(KEY) ?? 'null'),
      route,
    );
  } catch {
    return undefined;
  }
}
export function saveSession(
  route: Route,
  draft?: Draft,
  notice?: Notice,
  documentContext?: Snapshot['documentContext'],
): string | undefined {
  try {
    if (!draft && !notice && !documentContext) sessionStorage.removeItem(KEY);
    else
      sessionStorage.setItem(
        KEY,
        JSON.stringify({
          schemaVersion: 1,
          route,
          draft,
          notice,
          documentContext,
        }),
      );
  } catch {
    return 'This tab cannot save its draft for refresh recovery. Keep the page open until you finish.';
  }
}
