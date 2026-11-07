import type {
  GuideState,
  GuideWorkflow,
} from '../../../../packages/shared/workflow-types';
export const idleState: GuideState = { status: 'idle', stepIndex: 0 };
export type Transition =
  | { type: 'start' }
  | { type: 'complete-step'; stepId: string }
  | { type: 'pause' | 'resume' | 'cancel' | 'retry' }
  | { type: 'fail'; error: string };
export function transition(
  state: GuideState,
  event: Transition,
  workflow: GuideWorkflow,
): GuideState {
  switch (event.type) {
    case 'start':
      return { status: 'running', workflowId: workflow.id, stepIndex: 0 };
    case 'complete-step': {
      if (
        state.status !== 'running' ||
        workflow.steps[state.stepIndex]?.id !== event.stepId
      )
        return state;
      const next = state.stepIndex + 1;
      return {
        ...state,
        stepIndex: next,
        status: next === workflow.steps.length ? 'completed' : 'running',
      };
    }
    case 'pause':
      return state.status === 'running'
        ? { ...state, status: 'paused' }
        : state;
    case 'resume':
      return state.status === 'paused'
        ? { ...state, status: 'running', error: undefined }
        : state;
    case 'cancel':
      return { ...state, status: 'cancelled', error: undefined };
    case 'fail':
      return { ...state, status: 'failed', error: event.error };
    case 'retry':
      return state.status === 'failed'
        ? { ...state, status: 'running', error: undefined }
        : state;
  }
}
