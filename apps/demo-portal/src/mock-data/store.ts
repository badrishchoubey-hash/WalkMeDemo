export type Part = {
  id: string;
  name: string;
  number: string;
  category: string;
  description: string;
};
export type ChangeRequest = {
  id: string;
  title: string;
  part: string;
  reason: string;
};
export const seedParts: Part[] = [
  {
    id: 'p1',
    name: 'Mounting bracket assembly',
    number: 'PRT-1001',
    category: 'Mechanical',
    description: 'Precision mounting bracket for the drive housing.',
  },
  {
    id: 'p2',
    name: 'Drive shaft coupling',
    number: 'PRT-1002',
    category: 'Mechanical',
    description: 'Flexible coupling for the drive assembly.',
  },
  {
    id: 'p3',
    name: 'Temperature sensor module',
    number: 'PRT-1003',
    category: 'Electrical',
    description: 'Temperature monitoring module.',
  },
  {
    id: 'p4',
    name: 'Controller firmware',
    number: 'PRT-1004',
    category: 'Software',
    description: 'Embedded control firmware.',
  },
];
export const documents = [
  {
    id: 'DOC-201',
    title: 'Mounting bracket specification',
    type: 'Specification',
    revision: 'C',
    owner: 'Mechanical Engineering',
    content:
      'Material: aluminium 6061-T6. Surface finish: anodized. Verify mounting hole alignment and dimensional tolerances before release. This document is synthetic demonstration content.',
  },
  {
    id: 'DOC-202',
    title: 'Drive assembly installation guide',
    type: 'Work instruction',
    revision: 'B',
    owner: 'Manufacturing',
    content:
      'Inspect coupling alignment, follow the assembly sequence, and complete the inspection checklist. Synthetic demonstration content.',
  },
  {
    id: 'DOC-203',
    title: 'Sensor calibration procedure',
    type: 'Test procedure',
    revision: 'A',
    owner: 'Quality Engineering',
    content:
      'Use a calibrated reference source and record measurements at three operating points. Synthetic demonstration content.',
  },
];
export function readRecords<T>(
  key: string,
  fallback: T[],
  valid: (value: unknown) => value is T,
): T[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    return Array.isArray(raw) && raw.every(valid) ? raw : fallback;
  } catch {
    return fallback;
  }
}
export function saveRecords(key: string, records: unknown[]): void {
  localStorage.setItem(key, JSON.stringify(records));
}
const strings = (value: unknown, keys: string[]): boolean =>
  typeof value === 'object' &&
  value !== null &&
  keys.every((key) => typeof Reflect.get(value, key) === 'string');
export const isPart = (value: unknown): value is Part =>
  strings(value, ['id', 'name', 'number', 'category', 'description']);
export const isChange = (value: unknown): value is ChangeRequest =>
  strings(value, ['id', 'title', 'part', 'reason']);
