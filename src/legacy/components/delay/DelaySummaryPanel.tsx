import React from 'react';
import type { DelaySummary } from '../../utils/delayMethods';

interface Props {
  summary: DelaySummary;
  isDark: boolean;
}

const COUNTERS: Array<{ key: keyof DelaySummary; label: string; tone: string }> = [
  { key: 'excusable',                label: 'مجاز',                 tone: 'emerald' },
  { key: 'nonExcusable',             label: 'غیرمجاز',              tone: 'rose' },
  { key: 'concurrent',               label: 'همزمان',               tone: 'amber' },
  { key: 'excusableCompensable',     label: 'مجاز قابل جبران',      tone: 'sky' },
  { key: 'excusableNonCompensable',  label: 'مجاز غیرقابل جبران',   tone: 'indigo' },
  { key: 'critical',                 label: 'بحرانی',               tone: 'red' },
  { key: 'nonCritical',              label: 'غیربحرانی',            tone: 'slate' },
];

const TONES: Record<string, { dark: string; light: string }> = {
  emerald: { dark: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300', light: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  rose:    { dark: 'bg-rose-500/10 border-rose-500/30 text-rose-300',          light: 'bg-rose-50 border-rose-200 text-rose-700' },
  amber:   { dark: 'bg-amber-500/10 border-amber-500/30 text-amber-300',       light: 'bg-amber-50 border-amber-200 text-amber-700' },
  sky:     { dark: 'bg-sky-500/10 border-sky-500/30 text-sky-300',             light: 'bg-sky-50 border-sky-200 text-sky-700' },
  indigo:  { dark: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',    light: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  red:     { dark: 'bg-red-500/10 border-red-500/30 text-red-300',             light: 'bg-red-50 border-red-200 text-red-700' },
  slate:   { dark: 'bg-slate-500/10 border-slate-500/30 text-slate-300',       light: 'bg-slate-100 border-slate-200 text-slate-700' },
};

const DelaySummaryPanel: React.FC<Props> = ({ summary, isDark }) => {
  return (
    <div className={`rounded-2xl border p-4 ${isDark ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-slate-200/70 shadow-sm'}`}>
      <div className={`text-xs font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        خلاصه نتایج تحلیل تاخیرات
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {COUNTERS.map(({ key, label, tone }) => {
          const c = TONES[tone];
          return (
            <div key={key} className={`rounded-xl border px-3 py-2 text-center ${isDark ? c.dark : c.light}`}>
              <div className="text-xl font-black tabular-nums">{(summary[key] as number) ?? 0}</div>
              <div className="text-[10px] font-bold mt-0.5">{label}</div>
            </div>
          );
        })}
      </div>
      <div className={`mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
        <div className={`rounded-lg border px-3 py-2 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
          <span className="font-bold">تاریخ اولیه پایان: </span>
          <span className="tabular-nums">{summary.originalFinish ?? '—'}</span>
        </div>
        <div className={`rounded-lg border px-3 py-2 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
          <span className="font-bold">تاریخ پایان جدید: </span>
          <span className="tabular-nums">{summary.newFinish ?? '—'}</span>
        </div>
      </div>
    </div>
  );
};

export default DelaySummaryPanel;
