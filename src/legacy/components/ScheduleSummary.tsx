// Read-only summary of the 3 schedule zones; used in delay-analysis area.
import React from 'react';
import type { ProcessedFile } from '../types';
import { getScheduleStatus } from '../utils/scheduleMethods';

interface ScheduleSummaryProps {
  files: ProcessedFile[];
  isDark?: boolean;
}

const Chip: React.FC<{ label: string; ok: boolean; detail: string; isDark?: boolean }> = ({
  label,
  ok,
  detail,
  isDark,
}) => (
  <div
    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold ${
      ok
        ? isDark
          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : isDark
        ? 'bg-slate-800/60 border-slate-700/60 text-slate-400'
        : 'bg-slate-50 border-slate-200 text-slate-500'
    }`}
  >
    <span>{ok ? '✅' : '❌'}</span>
    <span>{label}:</span>
    <span className="font-mono opacity-80">{detail}</span>
  </div>
);

const ScheduleSummary: React.FC<ScheduleSummaryProps> = ({ files, isDark }) => {
  const s = getScheduleStatus(files);
  return (
    <div
      className={`rounded-2xl border p-3 flex flex-wrap gap-2 items-center ${
        isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white/70 border-slate-200/60'
      }`}
      dir="rtl"
    >
      <span className={`text-[11px] font-bold uppercase tracking-wide ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        وضعیت برنامه‌ها
      </span>
      <Chip
        label="برنامه اولیه"
        ok={s.baseline_schedule.uploaded}
        detail={s.baseline_schedule.uploaded ? 'آپلود شد' : 'ناموجود'}
        isDark={isDark}
      />
      <Chip
        label="برنامه‌های میانی"
        ok={s.intermediate_schedule.uploaded}
        detail={`${s.intermediate_schedule.count} فایل`}
        isDark={isDark}
      />
      <Chip
        label="چون‌ساخت"
        ok={s.as_built_schedule.uploaded}
        detail={s.as_built_schedule.uploaded ? 'آپلود شد' : 'ناموجود'}
        isDark={isDark}
      />
    </div>
  );
};

export default ScheduleSummary;
