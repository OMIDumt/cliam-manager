// Delay-event domain model + invariant helpers.

export type DelayType = 'excusable' | 'nonExcusable';
export type DelayCompensability = 'compensable' | 'nonCompensable' | null;

export interface DelayEvent {
  id: string;
  title: string;
  /** "مکاتبات" | "قراردادها/صورتجلسات" | "گزارشات پیشرفت" | "برنامه‌ها" | "سایر" */
  category: string;
  /** source document name(s) */
  startSourceDoc: string;
  endSourceDoc: string;
  startDate: string;   // ISO yyyy-mm-dd
  endDate: string;     // ISO yyyy-mm-dd
  /** duration as extracted directly from document text */
  extractedDurationDays: number;
  /** computed from startDate/endDate (inclusive) */
  computedDurationDays: number;
  /** user-confirmed final value used in calculations */
  finalDurationDays: number;
  /** delay-type classification — MUST NOT be mutated by method switching */
  delayType: DelayType;
  compensability: DelayCompensability;
  /** linked schedule activity (required for IAP/TIA/APvsAB/CAB/WA) */
  linkedActivityId?: string | null;
  /** audit trail: filled when the user edits delayType/compensability */
  userEdited?: boolean;
  userEditReason?: string;
}

export function computeDurationDays(startIso: string, endIso: string): number {
  const a = new Date(startIso).getTime();
  const b = new Date(endIso).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0;
  return Math.round((b - a) / 86_400_000) + 1;
}

/** returns absolute percentage diff between extracted and computed (0..1+) */
export function durationDiffRatio(extracted: number, computed: number): number {
  const base = Math.max(extracted, computed);
  if (base <= 0) return 0;
  return Math.abs(extracted - computed) / base;
}

export const DURATION_WARN_THRESHOLD = 0.2; // 20%

export function durationHasWarning(e: Pick<DelayEvent, 'extractedDurationDays' | 'computedDurationDays'>): boolean {
  return durationDiffRatio(e.extractedDurationDays, e.computedDurationDays) > DURATION_WARN_THRESHOLD;
}

// Methods that require linking to a schedule activity
export const METHODS_REQUIRING_ACTIVITY = new Set(['IAP', 'TIA', 'APvsAB', 'CAB', 'WA']);

export function requiresActivityLink(methodId: string | null): boolean {
  return !!methodId && METHODS_REQUIRING_ACTIVITY.has(methodId);
}

// Summary recomputation from events only. Method affects ordering/concurrency,
// NEVER the per-event delayType — that is fixed at extraction time.
export function recomputeSummary(events: DelayEvent[], methodId: string | null) {
  const isGantt = methodId === 'GANTT';
  const excusable = events.filter((e) => e.delayType === 'excusable').length;
  const nonExcusable = events.filter((e) => e.delayType === 'nonExcusable').length;
  const excusableCompensable = events.filter((e) => e.delayType === 'excusable' && e.compensability === 'compensable').length;
  const excusableNonCompensable = events.filter((e) => e.delayType === 'excusable' && e.compensability === 'nonCompensable').length;
  // simple overlap-based concurrent count (skipped for Gantt by spec)
  const concurrent = isGantt ? 0 : countConcurrent(events);
  return {
    excusable,
    nonExcusable,
    concurrent,
    excusableCompensable,
    excusableNonCompensable,
    critical: 0,
    nonCritical: 0,
  };
}

function countConcurrent(events: DelayEvent[]): number {
  let n = 0;
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i], b = events[j];
      if (new Date(a.startDate) <= new Date(b.endDate) && new Date(b.startDate) <= new Date(a.endDate)) n++;
    }
  }
  return n;
}

// Group events by document category for breakdown UI
export function groupByCategory(events: DelayEvent[]): Record<string, DelayEvent[]> {
  return events.reduce<Record<string, DelayEvent[]>>((acc, e) => {
    (acc[e.category] = acc[e.category] || []).push(e);
    return acc;
  }, {});
}
