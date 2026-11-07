import type { GuideStep, GuideWorkflow } from './workflow-types';
const click = (id: string, title: string, description: string): GuideStep => ({
  id,
  title,
  description,
  selector: `[data-guide="${id}"]`,
  action: 'click',
});
const input = (
  id: string,
  title: string,
  description: string,
  inputValue?: string,
): GuideStep => ({
  id,
  title,
  description,
  selector: `[data-guide="${id}"]`,
  action: 'input',
  inputValue,
});
export const workflows: GuideWorkflow[] = [
  {
    id: 'create-part',
    version: 1,
    title: 'Create a new part',
    description: 'From part definition to a reviewed engineering record.',
    supportedRoutes: ['dashboard', 'parts'],
    route: 'parts',
    steps: [
      click(
        'create-part',
        'Start a part record',
        'Select Create part. We will walk through the required engineering information.',
      ),
      input(
        'part-name',
        'Name the part',
        'Enter a meaningful part name, then leave the field. Or use Fill demo values in the side panel.',
      ),
      input(
        'part-number',
        'Assign a unique number',
        'Enter a unique part number. Duplicate numbers are rejected by the portal.',
      ),
      input(
        'part-category',
        'Classify the part',
        'Choose the engineering category.',
      ),
      input(
        'part-description',
        'Describe its purpose',
        'Add a description for the next engineer who uses this record.',
      ),
      click(
        'review-part',
        'Validate and review',
        'Select Review part. The portal validates required fields before showing the review.',
      ),
      {
        ...click(
          'confirm-part',
          'Confirm creation',
          'Review the summary. Only your explicit click on Confirm create saves this part.',
        ),
        action: 'confirm',
      },
      {
        id: 'part-success',
        title: 'Verify creation',
        description:
          'Waiting for the portal to confirm the record was created.',
        selector: '[data-guide="part-success"]',
        action: 'wait',
      },
    ],
  },
  {
    id: 'find-document',
    version: 1,
    title: 'Find an engineering document',
    description: 'Search the library and open the correct specification.',
    supportedRoutes: ['dashboard', 'documents'],
    route: 'documents',
    steps: [
      input(
        'document-search',
        'Search the library',
        'Type bracket, then leave the search field. Results arrive asynchronously.',
        'bracket',
      ),
      click(
        'document-result',
        'Open the matching specification',
        'Select the mounting bracket specification from the filtered results.',
      ),
      {
        id: 'document-detail',
        title: 'Document located',
        description: 'Checking that the document detail is open.',
        selector: '[data-guide="document-detail"]',
        action: 'wait',
      },
    ],
  },
  {
    id: 'create-change',
    version: 1,
    title: 'Create a change request',
    description: 'Document a proposed change with an explicit review.',
    supportedRoutes: ['dashboard', 'changes'],
    route: 'changes',
    steps: [
      click(
        'create-change',
        'Propose an engineering change',
        'Select New change request to open the form.',
      ),
      input(
        'change-title',
        'Summarize the change',
        'Enter a short, descriptive title.',
      ),
      input(
        'change-part',
        'Identify the affected part',
        'Select the part affected by the proposal.',
      ),
      input(
        'change-reason',
        'Explain the reason',
        'Describe the engineering reason and expected benefit.',
      ),
      click(
        'review-change',
        'Review the request',
        'Validate required fields and inspect the proposed request.',
      ),
      {
        ...click(
          'confirm-change',
          'Confirm submission',
          'Only your explicit confirmation creates this change request.',
        ),
        action: 'confirm',
      },
      {
        id: 'change-success',
        title: 'Verify submission',
        description: 'Waiting for confirmation from the portal.',
        selector: '[data-guide="change-success"]',
        action: 'wait',
      },
    ],
  },
];
export function validateWorkflow(workflow: GuideWorkflow): void {
  if (
    !workflow.id ||
    !Number.isInteger(workflow.version) ||
    workflow.version < 1 ||
    !workflow.steps.length
  )
    throw new Error('Invalid workflow definition.');
  const ids = new Set<string>();
  for (const step of workflow.steps) {
    if (
      !step.id ||
      ids.has(step.id) ||
      !['click', 'input', 'wait', 'confirm'].includes(step.action) ||
      !step.selector ||
      (step.timeoutMs !== undefined &&
        (step.timeoutMs <= 0 || step.timeoutMs > 120000))
    )
      throw new Error('Invalid or duplicate workflow step.');
    ids.add(step.id);
  }
}
