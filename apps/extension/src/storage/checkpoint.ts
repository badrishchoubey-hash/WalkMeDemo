import { isRecord } from '../../../../packages/shared/workflow-types';
import type {
  GuideState,
  GuideWorkflow,
  Route,
} from '../../../../packages/shared/workflow-types';
import { workflows } from '../../../../packages/shared/workflows';

export const checkpointKey = (tabId: number) =>
  `smartguide:checkpoint:v1:${tabId}`;
export const checkpointOwnerKey = (tabId: number) =>
  `${checkpointKey(tabId)}:document`;
export const checkpointEvents = [
  'start',
  'complete-step',
  'pause',
  'resume',
  'fail',
  'retry',
] as const;
export type CheckpointEvent = (typeof checkpointEvents)[number];
export type Checkpoint = {
  schemaVersion: 1;
  workflowId: string;
  workflowVersion: number;
  route: Route;
  stepId: string;
  status: 'running' | 'paused' | 'failed' | 'completed';
  lastEvent: CheckpointEvent;
};
export function makeCheckpoint(
  state: GuideState,
  workflow: GuideWorkflow,
  route: Route,
  lastEvent: CheckpointEvent,
): Checkpoint | undefined {
  if (
    state.status === 'idle' ||
    state.status === 'cancelled' ||
    state.workflowId !== workflow.id ||
    route !== workflow.route
  )
    return;
  const step =
    workflow.steps[
      state.status === 'completed' ? workflow.steps.length - 1 : state.stepIndex
    ];
  if (!step) return;
  return {
    schemaVersion: 1,
    workflowId: workflow.id,
    workflowVersion: workflow.version,
    route,
    stepId: step.id,
    status: state.status,
    lastEvent,
  };
}
export function recoverCheckpoint(
  value: unknown,
  route: Route,
): { workflow: GuideWorkflow; state: GuideState } | undefined {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    value.route !== route ||
    !checkpointEvents.includes(value.lastEvent as CheckpointEvent)
  )
    return;
  if (
    Object.keys(value).some(
      (key) =>
        ![
          'schemaVersion',
          'workflowId',
          'workflowVersion',
          'route',
          'stepId',
          'status',
          'lastEvent',
        ].includes(key),
    )
  )
    return;
  const workflow = workflows.find(
    (item) =>
      item.id === value.workflowId &&
      item.version === value.workflowVersion &&
      item.route === route,
  );
  if (
    !workflow ||
    !['running', 'paused', 'failed', 'completed'].includes(String(value.status))
  )
    return;
  const index = workflow.steps.findIndex((step) => step.id === value.stepId);
  if (
    index < 0 ||
    (value.status === 'completed' && index !== workflow.steps.length - 1)
  )
    return;
  return {
    workflow,
    state: {
      workflowId: workflow.id,
      stepIndex: value.status === 'completed' ? workflow.steps.length : index,
      status: value.status === 'completed' ? 'completed' : 'paused',
      recovered: true,
    },
  };
}
export type CheckpointOperation =
  | { channel: 'smartguide-checkpoint'; type: 'READ' }
  | { channel: 'smartguide-checkpoint'; type: 'WRITE'; checkpoint: unknown }
  | { channel: 'smartguide-checkpoint'; type: 'CLEAR' };
export type CheckpointRequest = CheckpointOperation & { requestId: string };
export function isCheckpointRequest(
  value: unknown,
): value is CheckpointRequest {
  return (
    isRecord(value) &&
    typeof value.requestId === 'string' &&
    value.requestId.length > 0 &&
    value.requestId.length <= 100 &&
    value.channel === 'smartguide-checkpoint' &&
    (value.type === 'READ' ||
      value.type === 'CLEAR' ||
      (value.type === 'WRITE' && isRecord(value.checkpoint)))
  );
}
