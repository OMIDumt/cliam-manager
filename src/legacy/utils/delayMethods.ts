// 8 delay-analysis methods (technical tab).
// Source of truth for IDs, Persian/English names, schedule requirements, key features, and ordering rules.
import type { ScheduleKey, ScheduleStatus } from './scheduleMethods';

export type TechMethodId =
  | 'SUM'        // ۱ جمع جبری تاخیرات
  | 'GANTT'      // ۲ گانت چارت
  | 'IAP'        // ۳ آینده‌نگر ساده
  | 'TIA'        // ۴ آینده‌نگر پیشرفته
  | 'APvsAB'     // ۵ گذشته‌نگر ساده
  | 'CAB'        // ۶ گذشته‌نگر نیمه‌ساده
  | 'WA'         // ۷ گذشته‌نگر پیشرفته
  | 'CONTRACT';  // ۸ روش قرارداد

export type ScheduleReq =
  | { kind: 'none' }
  | { kind: 'all'; keys: ScheduleKey[] }                                   // همه لازم‌اند
  | { kind: 'any'; keys: ScheduleKey[] }                                   // یکی کافی است (مثلا اولیه یا میانی)
  | { kind: 'contract' };                                                  // متن قرارداد

export interface TechMethod {
  id: TechMethodId;
  index: number;
  faName: string;
  enName: string;
  scheduleReq: ScheduleReq;
  keyFeature: string;
  /** ordering rule for applying delay events */
  ordering?: 'stepped-asc' | 'reverse-desc' | null;
  /** UI-level warnings */
  warnings?: string[];
  /** activity-linking required (methods 3–7) */
  requiresActivityLink?: boolean;
}

export const TECH_METHODS: TechMethod[] = [
  {
    id: 'SUM', index: 1,
    faName: 'جمع جبری تاخیرات', enName: '—',
    scheduleReq: { kind: 'none' },
    keyFeature: 'ساده‌ترین روش',
  },
  {
    id: 'GANTT', index: 2,
    faName: 'گانت چارت', enName: 'Gantt Chart',
    scheduleReq: { kind: 'none' },
    keyFeature: 'هم‌پوشانی رعایت می‌شود',
    warnings: ['این روش از تاخیرات همزمان پشتیبانی نمی‌کند'],
  },
  {
    id: 'IAP', index: 3,
    faName: 'آینده‌نگر ساده', enName: 'IAP',
    scheduleReq: { kind: 'all', keys: ['baseline_schedule'] },
    keyFeature: 'اعمال روی برنامه اولیه',
    ordering: 'stepped-asc',
    requiresActivityLink: true,
  },
  {
    id: 'TIA', index: 4,
    faName: 'آینده‌نگر پیشرفته', enName: 'TIA',
    scheduleReq: { kind: 'any', keys: ['baseline_schedule', 'intermediate_schedule'] },
    keyFeature: 'اعمال روی آخرین برنامه به‌روز',
    ordering: 'stepped-asc',
    requiresActivityLink: true,
  },
  {
    id: 'APvsAB', index: 5,
    faName: 'گذشته‌نگر ساده', enName: 'AP vs AB',
    scheduleReq: { kind: 'all', keys: ['baseline_schedule', 'as_built_schedule'] },
    keyFeature: 'مقایسه مشاهده‌ای',
    requiresActivityLink: true,
  },
  {
    id: 'CAB', index: 6,
    faName: 'گذشته‌نگر نیمه‌ساده', enName: 'CAB',
    scheduleReq: { kind: 'all', keys: ['as_built_schedule'] },
    keyFeature: 'حذف تاخیرات از As-Built',
    ordering: 'reverse-desc',
    requiresActivityLink: true,
  },
  {
    id: 'WA', index: 7,
    faName: 'گذشته‌نگر پیشرفته', enName: 'WA',
    scheduleReq: { kind: 'all', keys: ['baseline_schedule', 'intermediate_schedule'] },
    keyFeature: 'پنجره به پنجره',
    requiresActivityLink: true,
  },
  {
    id: 'CONTRACT', index: 8,
    faName: 'روش قرارداد', enName: '—',
    scheduleReq: { kind: 'contract' },
    keyFeature: 'از متن قرارداد استخراج می‌شود',
  },
];

export function isTechMethodAvailable(m: TechMethod, status: ScheduleStatus, hasContract: boolean): boolean {
  const r = m.scheduleReq;
  if (r.kind === 'none') return true;
  if (r.kind === 'contract') return hasContract;
  if (r.kind === 'all') return r.keys.every((k) => status[k].uploaded);
  if (r.kind === 'any') return r.keys.some((k) => status[k].uploaded);
  return false;
}

export function missingForTechMethod(m: TechMethod, status: ScheduleStatus, hasContract: boolean): string[] {
  const r = m.scheduleReq;
  const titles: Record<ScheduleKey, string> = {
    baseline_schedule: 'برنامه اولیه',
    intermediate_schedule: 'برنامه‌های میانی',
    as_built_schedule: 'برنامه چون‌ساخت',
  };
  if (r.kind === 'none') return [];
  if (r.kind === 'contract') return hasContract ? [] : ['قرارداد'];
  if (r.kind === 'all') return r.keys.filter((k) => !status[k].uploaded).map((k) => titles[k]);
  if (r.kind === 'any') {
    const has = r.keys.some((k) => status[k].uploaded);
    return has ? [] : [r.keys.map((k) => titles[k]).join(' یا ')];
  }
  return [];
}

// Summary panel data shape (7 counters + 2 dates).
export interface DelaySummary {
  excusable: number;
  nonExcusable: number;
  concurrent: number;
  excusableCompensable: number;
  excusableNonCompensable: number;
  critical: number;
  nonCritical: number;
  originalFinish?: string | null;
  newFinish?: string | null;
}

export const EMPTY_SUMMARY: DelaySummary = {
  excusable: 0,
  nonExcusable: 0,
  concurrent: 0,
  excusableCompensable: 0,
  excusableNonCompensable: 0,
  critical: 0,
  nonCritical: 0,
  originalFinish: null,
  newFinish: null,
};
