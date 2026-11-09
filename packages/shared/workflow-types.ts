import type { InformationState } from './information-highlights';
export const PORTAL_ORIGIN = 'http://127.0.0.1:5173';
export type Route = 'dashboard' | 'parts' | 'documents' | 'changes';
export type WorkflowId = 'create-part' | 'find-document' | 'create-change';
export type Status =
  'idle' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed';
export type GuideStep = {
  id: string;
  title: string;
  description: string;
  selector: string;
  fallbackSelectors?: string[];
  action: 'click' | 'input' | 'wait' | 'confirm';
  timeoutMs?: number;
  inputValue?: string;
};
export type GuideWorkflow = {
  id: WorkflowId;
  version: number;
  title: string;
  description: string;
  supportedRoutes: Route[];
  route: Route;
  steps: GuideStep[];
};
export type GuideState = {
  status: Status;
  workflowId?: WorkflowId;
  stepIndex: number;
  error?: string;
  recovered?: boolean;
};
export type Context = {
  route: Route;
  state: GuideState;
  recoveryWarning?: string;
  information?: InformationState;
};
export type Command =
  | { type: 'GET_CONTEXT' }
  | { type: 'SET_INFORMATION_HIGHLIGHTS'; enabled: boolean }
  | { type: 'START_WORKFLOW'; workflowId: WorkflowId }
  | {
      type:
        | 'PAUSE_WORKFLOW'
        | 'RESUME_WORKFLOW'
        | 'CANCEL_WORKFLOW'
        | 'RETRY_STEP'
        | 'AUTOFILL';
    };
export type Request = {
  channel: 'smartguide';
  requestId: string;
  command: Command;
};
export type Reply =
  | { requestId: string; ok: true; context: Context }
  | { requestId: string; ok: false; error: string };
export const workflowIds: WorkflowId[] = [
  'create-part',
  'find-document',
  'create-change',
];
export function isSupportedUrl(url: string | undefined): boolean {
  try {
    return Boolean(url && new URL(url).origin === PORTAL_ORIGIN);
  } catch {
    return false;
  }
}
export function getRoute(hash: string): Route {
  const route = hash.replace(/^#\/?/, '');
  return route === 'parts' || route === 'documents' || route === 'changes'
    ? route
    : 'dashboard';
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
export function isRequest(value: unknown): value is Request {
  if (
    !isRecord(value) ||
    value.channel !== 'smartguide' ||
    typeof value.requestId !== 'string' ||
    value.requestId.length > 100 ||
    !isRecord(value.command)
  )
    return false;
  const c = value.command;
  if (c.type === 'SET_INFORMATION_HIGHLIGHTS')
    return typeof c.enabled === 'boolean';
  if (c.type === 'START_WORKFLOW')
    return workflowIds.includes(c.workflowId as WorkflowId);
  return [
    'GET_CONTEXT',
    'PAUSE_WORKFLOW',
    'RESUME_WORKFLOW',
    'CANCEL_WORKFLOW',
    'RETRY_STEP',
    'AUTOFILL',
  ].includes(String(c.type));
}
export function isContext(value: unknown): value is Context {
  if (
    !isRecord(value) ||
    !['dashboard', 'parts', 'documents', 'changes'].includes(
      String(value.route),
    ) ||
    !isRecord(value.state)
  )
    return false;
  const s = value.state;
  return (
    ['idle', 'running', 'paused', 'completed', 'cancelled', 'failed'].includes(
      String(s.status),
    ) &&
    Number.isInteger(s.stepIndex) &&
    Number(s.stepIndex) >= 0 &&
    (s.workflowId === undefined ||
      workflowIds.includes(s.workflowId as WorkflowId)) &&
    (s.error === undefined || typeof s.error === 'string') &&
    (s.recovered === undefined || typeof s.recovered === 'boolean') &&
    (value.recoveryWarning === undefined ||
      typeof value.recoveryWarning === 'string') &&
    (value.information === undefined ||
      (isRecord(value.information) &&
        typeof value.information.enabled === 'boolean' &&
        typeof value.information.supported === 'boolean' &&
        typeof value.information.suspended === 'boolean' &&
        Number.isInteger(value.information.matchedCount) &&
        Number(value.information.matchedCount) >= 0))
  );
}
