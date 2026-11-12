import type { InformationState } from './information-highlights';
import { PORTAL_ORIGIN } from './config';
export { PORTAL_ORIGIN } from './config';
export type Route =
  | 'dashboard'
  | 'parts'
  | 'documents'
  | 'changes'
  | 'task'
  | 'documentation'
  | 'unsupported';
export type WorkflowId =
  | 'create-part'
  | 'find-document'
  | 'create-change'
  | 'collaboration-tour'
  | 'rename-tab'
  | `custom-${string}`;
export type Status =
  'idle' | 'running' | 'paused' | 'completed' | 'cancelled' | 'failed';
export type GuideStep = {
  id: string;
  title: string;
  description: string;
  selector: string;
  highlightSelector?: string;
  fallbackSelectors?: string[];
  action: 'click' | 'input' | 'wait' | 'confirm' | 'next';
  navigateSelector?: string;
  autofill?: boolean;
  linkedWorkflow?: WorkflowId;
  expectedText?: string;
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
  'collaboration-tour',
  'rename-tab',
  'create-part',
  'find-document',
  'create-change',
];
export function isWorkflowId(value: unknown): value is WorkflowId {
  return (
    typeof value === 'string' &&
    (workflowIds.some((id) => id === value) ||
      /^custom-[a-z0-9-]{1,64}$/.test(value))
  );
}
export function isSupportedUrl(url: string | undefined): boolean {
  try {
    return Boolean(url && new URL(url).origin === PORTAL_ORIGIN);
  } catch {
    return false;
  }
}
export function getRoute(hash: string): Route {
  const route = hash.replace(/^#\/?/, '');
  if (!route || route === 'dashboard') return 'dashboard';
  return ['parts', 'documents', 'changes', 'task', 'documentation'].includes(
    route,
  )
    ? (route as Route)
    : 'unsupported';
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
export function isRequest(value: unknown): value is Request {
  if (
    !isRecord(value) ||
    value.channel !== 'smartguide' ||
    typeof value.requestId !== 'string' ||
    value.requestId.length === 0 ||
    value.requestId.length > 100 ||
    !isRecord(value.command)
  )
    return false;
  const c = value.command;
  if (c.type === 'SET_INFORMATION_HIGHLIGHTS')
    return typeof c.enabled === 'boolean';
  if (c.type === 'START_WORKFLOW') return isWorkflowId(c.workflowId);
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
    ![
      'dashboard',
      'parts',
      'documents',
      'changes',
      'task',
      'documentation',
      'unsupported',
    ].includes(String(value.route)) ||
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
    (s.workflowId === undefined || isWorkflowId(s.workflowId)) &&
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
