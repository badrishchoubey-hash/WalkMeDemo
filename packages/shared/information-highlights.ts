import type { Route } from './workflow-types';

export type InformationHighlight = {
  id: string;
  supportedRoutes: Route[];
  selector: string;
  title: string;
  description: string;
  whyItMatters: string;
  importance: 'low' | 'medium' | 'high';
};
export type InformationState = {
  enabled: boolean;
  supported: boolean;
  matchedCount: number;
  suspended: boolean;
};
export const informationHighlights: InformationHighlight[] = [
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
    title: 'Document revision',
    description: 'The revision label shown for this document.',
    whyItMatters:
      'Check the revision when referring to engineering instructions. The demo contains seeded labels and does not implement revision history.',
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
