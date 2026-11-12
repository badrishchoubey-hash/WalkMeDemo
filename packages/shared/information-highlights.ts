import type { Route } from './workflow-types';

export type InformationHighlight = {
  id: string;
  supportedRoutes: Route[];
  selector: string;
  presentation?: 'card';
  valueSelector?: string;
  title: string;
  description: string;
  whyItMatters: string;
  importance: 'low' | 'medium' | 'high';
  documentation?: { label: string; path: string };
};
export type InformationState = {
  enabled: boolean;
  supported: boolean;
  matchedCount: number;
  suspended: boolean;
};
export const informationHighlights: InformationHighlight[] = [
  {
    id: 'overview-task',
    supportedRoutes: ['dashboard'],
    selector: '[data-info="overview-task"]',
    presentation: 'card',
    valueSelector: '[data-guide="overview-task-link"]',
    title: 'My tasks',
    description:
      'Open this sample collaboration task to review instructions and participant setup.',
    whyItMatters:
      'The task page offers a guided tour and a linked tab-renaming walkthrough. This is a synthetic work item.',
    importance: 'high',
    documentation: {
      label: 'View sample process guide',
      path: '/#/documentation',
    },
  },
  {
    id: 'overview-parts-count',
    supportedRoutes: ['dashboard'],
    selector: '[data-info="overview-parts-count"]',
    presentation: 'card',
    valueSelector: 'strong',
    title: 'Engineering parts',
    description:
      'The number of engineering part records in this local demo workspace.',
    whyItMatters:
      'Open the card to browse or create sample part records. This is not a production inventory count.',
    importance: 'medium',
  },
  {
    id: 'overview-documents-count',
    supportedRoutes: ['dashboard'],
    selector: '[data-info="overview-documents-count"]',
    presentation: 'card',
    valueSelector: 'strong',
    title: 'Controlled documents',
    description: 'The number of sample documents available in the library.',
    whyItMatters:
      'Open the card to search the demo specifications and instructions. These documents are synthetic.',
    importance: 'medium',
  },
  {
    id: 'overview-changes-count',
    supportedRoutes: ['dashboard'],
    selector: '[data-info="overview-changes-count"]',
    presentation: 'card',
    valueSelector: 'strong',
    title: 'Change requests',
    description: 'The number of change requests stored in this demo workspace.',
    whyItMatters:
      'Open the card to review sample requests or create one with explicit confirmation.',
    importance: 'medium',
  },
  {
    id: 'participant-instructions',
    supportedRoutes: ['task'],
    selector: '[data-info="participant-instructions"]',
    title: 'Participant Instructions',
    description:
      'Review the applicable instructions before completing participant setup.',
    whyItMatters:
      'These representative instructions are demonstration content, not official customer policy.',
    importance: 'high',
    documentation: {
      label: 'View sample process guide',
      path: '/#/documentation',
    },
  },
  {
    id: 'part-number',
    supportedRoutes: ['parts'],
    selector: '[data-info="part-number"]',
    title: 'Part number',
    description: 'The identifier used to distinguish this part record.',
    whyItMatters:
      'Use the identifier to reference the correct component in engineering work. The demo rejects duplicate part numbers.',
    importance: 'high',
  },
  {
    id: 'part-revision',
    supportedRoutes: ['parts'],
    selector: '[data-info="part-revision"]',
    title: 'Revision',
    description: 'The revision label displayed for this engineering part.',
    whyItMatters:
      'Revision labels help distinguish engineering changes. This demo shows a fixed A.1 label; revision history and a release policy are not implemented.',
    importance: 'medium',
  },
  {
    id: 'part-status',
    supportedRoutes: ['parts'],
    selector: '[data-info="part-status"]',
    title: 'Part status',
    description: 'The status currently displayed in the part table.',
    whyItMatters:
      'Status helps users interpret the record. Released is a fixed demo label, not proof of an approval process or a specific Windchill lifecycle policy.',
    importance: 'high',
  },
  {
    id: 'document-number',
    supportedRoutes: ['documents'],
    selector: '[data-info="document-number"]',
    title: 'Document identifier',
    description: 'The reference identifying this document in the demo library.',
    whyItMatters:
      'Use this reference to distinguish the correct specification or instruction.',
    importance: 'medium',
  },
  {
    id: 'document-revision',
    supportedRoutes: ['documents'],
    selector: '[data-info="document-revision"]',
    title: 'Document version',
    description:
      'The letter identifies a version of this document. For example, version C comes after versions A and B.',
    whyItMatters:
      'Check the version so you refer to the intended set of instructions. These are sample version labels; this demo does not store version history.',
    importance: 'high',
  },
  {
    id: 'document-owner',
    supportedRoutes: ['documents'],
    selector: '[data-info="document-owner"]',
    title: 'Document owner',
    description: 'The team listed as responsible for this document.',
    whyItMatters:
      'Helps identify the relevant team when a specification needs clarification. It does not grant permissions.',
    importance: 'medium',
  },
  {
    id: 'change-number',
    supportedRoutes: ['changes'],
    selector: '[data-info="change-number"]',
    title: 'Change request identifier',
    description: 'The reference for this engineering change request.',
    whyItMatters:
      'Use this reference when discussing or tracking the proposed change.',
    importance: 'medium',
  },
  {
    id: 'change-part',
    supportedRoutes: ['changes'],
    selector: '[data-info="change-part"]',
    title: 'Affected part',
    description: 'The part number associated with this change request.',
    whyItMatters: 'Connects the proposed change to the component it concerns.',
    importance: 'high',
  },
  {
    id: 'change-status',
    supportedRoutes: ['changes'],
    selector: '[data-info="change-status"]',
    title: 'Change status',
    description: 'The status currently displayed for this change request.',
    whyItMatters:
      'Helps distinguish the stage shown for a proposal. In review is a fixed demo label; approval transitions are not implemented.',
    importance: 'high',
  },
];
export function informationForRoute(route: Route): InformationHighlight[] {
  return informationHighlights.filter((item) =>
    item.supportedRoutes.includes(route),
  );
}
