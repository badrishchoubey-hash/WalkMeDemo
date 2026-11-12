import { isRecord, isWorkflowId } from './workflow-types';
import type { GuideStep, GuideWorkflow, Route } from './workflow-types';
import { workflows, validateWorkflow } from './workflows';

export const catalogKey = 'guidance:workflowCatalog:v1';
export const draftsKey = 'guidance:workflowDrafts:v1';
const routes: Route[] = [
  'dashboard',
  'parts',
  'documents',
  'changes',
  'task',
  'documentation',
];
function text(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new Error(`${label} is required (maximum ${max} characters).`);
  return value;
}
function route(value: unknown): Route {
  const found = routes.find((item) => item === value);
  if (!found) throw new Error('Choose a supported portal page.');
  return found;
}
function selector(value: unknown): string {
  const result = text(value, 'Target selector', 300);
  // Use stable attributes or element IDs, never executable expressions or arbitrary page-wide selectors.
  if (
    !/^(?:#[a-zA-Z][\w-]*|\[data-(?:guide|info|route)="[a-zA-Z0-9_-]+"\])$/.test(
      result,
    )
  )
    throw new Error(
      'Use an element ID or a single data-guide, data-info, or data-route selector.',
    );
  return result;
}
function step(value: unknown): GuideStep {
  if (!isRecord(value)) throw new Error('Invalid workflow step.');
  const id = text(value.id, 'Step ID', 80);
  if (!/^[a-z0-9-]+$/.test(id))
    throw new Error(
      'Step IDs must use lowercase letters, numbers, and hyphens.',
    );
  const action = value.action;
  if (
    action !== 'click' &&
    action !== 'input' &&
    action !== 'next' &&
    action !== 'confirm' &&
    action !== 'wait'
  )
    throw new Error('Invalid step action.');
  const result: GuideStep = {
    id,
    title: text(value.title, 'Step title', 160),
    description: text(value.description, 'Step description', 3000),
    selector: selector(value.selector),
    action,
  };
  if (value.highlightSelector !== undefined)
    result.highlightSelector = selector(value.highlightSelector);
  if (value.navigateSelector !== undefined)
    result.navigateSelector = selector(value.navigateSelector);
  if (value.fallbackSelectors !== undefined) {
    if (
      !Array.isArray(value.fallbackSelectors) ||
      value.fallbackSelectors.length > 8
    )
      throw new Error('Invalid fallback selectors.');
    result.fallbackSelectors = value.fallbackSelectors.map(selector);
  }
  if (value.inputValue !== undefined)
    result.inputValue = text(value.inputValue, 'Expected input', 1000);
  if (value.expectedText !== undefined)
    result.expectedText = text(value.expectedText, 'Expected result', 1000);
  if (value.autofill !== undefined) {
    if (typeof value.autofill !== 'boolean')
      throw new Error('Invalid autofill setting.');
    result.autofill = value.autofill;
  }
  if (value.linkedWorkflow !== undefined) {
    if (!isWorkflowId(value.linkedWorkflow))
      throw new Error('Invalid linked workflow.');
    result.linkedWorkflow = value.linkedWorkflow;
  }
  if (value.timeoutMs !== undefined) {
    if (
      !Number.isInteger(value.timeoutMs) ||
      typeof value.timeoutMs !== 'number' ||
      value.timeoutMs < 100 ||
      value.timeoutMs > 120000
    )
      throw new Error('Timeout must be between 100 and 120000 milliseconds.');
    result.timeoutMs = value.timeoutMs;
  }
  return result;
}
export function parseWorkflow(value: unknown): GuideWorkflow {
  if (!isRecord(value) || !isWorkflowId(value.id))
    throw new Error('Invalid workflow ID.');
  if (
    typeof value.version !== 'number' ||
    !Number.isInteger(value.version) ||
    value.version < 1
  )
    throw new Error('Invalid workflow version.');
  if (
    !Array.isArray(value.steps) ||
    value.steps.length < 1 ||
    value.steps.length > 50
  )
    throw new Error('Add between 1 and 50 steps.');
  if (!Array.isArray(value.supportedRoutes) || !value.supportedRoutes.length)
    throw new Error('Choose an available page.');
  const result: GuideWorkflow = {
    id: value.id,
    version: value.version,
    title: text(value.title, 'Workflow name', 160),
    description: text(value.description, 'Workflow description', 3000),
    route: route(value.route),
    supportedRoutes: value.supportedRoutes.map(route),
    steps: value.steps.map(step),
  };
  if (!result.supportedRoutes.includes(result.route))
    throw new Error('The starting page must be included in available pages.');
  const baseline = workflows.find((item) => item.id === result.id);
  for (const confirmation of baseline?.steps.filter(
    (item) => item.action === 'confirm',
  ) ?? []) {
    if (
      !result.steps.some(
        (item) =>
          item.id === confirmation.id &&
          item.action === 'confirm' &&
          item.selector === confirmation.selector,
      )
    )
      throw new Error('Keep the existing user confirmation step and target.');
  }
  return result;
}
export function readOverrides(value: unknown): GuideWorkflow[] {
  if (value === undefined) return [];
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.workflows) ||
    value.workflows.length > 50
  )
    throw new Error(
      'Workflow content is incompatible. Open the editor and save valid definitions.',
    );
  const parsed = value.workflows.map(parseWorkflow);
  if (new Set(parsed.map((item) => item.id)).size !== parsed.length)
    throw new Error('Workflow IDs must be unique.');
  const catalog = mergeCatalog(parsed);
  for (const item of parsed) validateWorkflow(item, catalog);
  return parsed;
}
export function mergeCatalog(overrides: GuideWorkflow[]): GuideWorkflow[] {
  return [
    ...workflows.map(
      (item) => overrides.find((override) => override.id === item.id) ?? item,
    ),
    ...overrides.filter(
      (item) => !workflows.some((builtin) => builtin.id === item.id),
    ),
  ];
}
export function readCatalog(value: unknown): GuideWorkflow[] {
  return mergeCatalog(readOverrides(value));
}
