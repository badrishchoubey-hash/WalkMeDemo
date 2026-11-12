import { isRecord, workflowIds, isWorkflowId } from './workflow-types';
import type { WorkflowId } from './workflow-types';
export const publicationKey = 'guidance:publication:v1';
export const autoStartKey = 'guidance:autoStart:v1';
export function publishedIds(value: unknown): WorkflowId[] {
  if (value === undefined) return [...workflowIds];
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    !Array.isArray(value.workflowIds) ||
    !value.workflowIds.every((id) => isWorkflowId(id))
  )
    return [];
  const selected = value.workflowIds;
  return [...new Set(selected.filter(isWorkflowId))];
}
