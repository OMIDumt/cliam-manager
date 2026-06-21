// Schedule taxonomy + delay-analysis method gating.
// Canonical keys match the domain glossary in PROMPT_00.
import type { ProcessedFile } from '../types';

export type ScheduleKey =
  | 'baseline_schedule'
  | 'intermediate_schedule'
  | 'as_built_schedule';

export const SCHEDULE_TITLES: Record<ScheduleKey, string> = {
  baseline_schedule: 'برنامه زمان‌بندی اولیه',
  intermediate_schedule: 'برنامه‌های زمان‌بندی به‌روزشده میانی',
  as_built_schedule: 'برنامه زمان‌بندی چون‌ساخت (As-Built)',
};

export const SCHEDULE_SUBTITLES: Record<ScheduleKey, string> = {
  baseline_schedule: 'چند فایل — مرجع تحلیل',
  intermediate_schedule: 'چند فایل — به‌روزرسانی‌های دوره‌ای',
  as_built_schedule: 'چند فایل — وضعیت واقعی اجرا',
};

export const SCHEDULE_SINGLE: Record<ScheduleKey, boolean> = {
  baseline_schedule: false,
  intermediate_schedule: false,
  as_built_schedule: false,
};

// Method → required schedule keys (per spec)
export type DelayMethodKey = 'IAP' | 'TIA' | 'APvsAB' | 'WA' | 'CAB';

export const METHOD_SCHEDULE_REQUIREMENTS: Record<DelayMethodKey, ScheduleKey[]> = {
  IAP: ['baseline_schedule'],
  TIA: ['baseline_schedule', 'intermediate_schedule'],
  APvsAB: ['baseline_schedule', 'intermediate_schedule', 'as_built_schedule'],
  WA: ['baseline_schedule', 'intermediate_schedule', 'as_built_schedule'],
  CAB: ['as_built_schedule'],
};

export const METHOD_LABELS: Record<DelayMethodKey, string> = {
  IAP: 'Impacted As-Planned (IAP)',
  TIA: 'Time Impact Analysis (TIA)',
  APvsAB: 'As-Planned vs As-Built (AP vs AB)',
  WA: 'Window Analysis (WA)',
  CAB: 'Collapsed As-Built (CAB)',
};

export interface ScheduleStatus {
  baseline_schedule: { uploaded: boolean; count: number };
  intermediate_schedule: { uploaded: boolean; count: number };
  as_built_schedule: { uploaded: boolean; count: number };
}

export function getScheduleStatus(files: ProcessedFile[]): ScheduleStatus {
  const count = (key: ScheduleKey) =>
    files.filter((f) => f.category === SCHEDULE_TITLES[key]).length;
  return {
    baseline_schedule: { uploaded: count('baseline_schedule') > 0, count: count('baseline_schedule') },
    intermediate_schedule: { uploaded: count('intermediate_schedule') > 0, count: count('intermediate_schedule') },
    as_built_schedule: { uploaded: count('as_built_schedule') > 0, count: count('as_built_schedule') },
  };
}

export function isMethodAvailable(method: DelayMethodKey, status: ScheduleStatus): boolean {
  return METHOD_SCHEDULE_REQUIREMENTS[method].every((k) => status[k].uploaded);
}

export function getMissingSchedulesForMethod(
  method: DelayMethodKey,
  status: ScheduleStatus,
): ScheduleKey[] {
  return METHOD_SCHEDULE_REQUIREMENTS[method].filter((k) => !status[k].uploaded);
}
