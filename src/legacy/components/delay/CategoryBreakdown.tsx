import React from 'react';
import { groupByCategory, type DelayEvent } from '../../utils/delayEvents';

interface Props {
  events: DelayEvent[];
  isDark: boolean;
}

const CategoryBreakdown: React.FC<Props> = ({ events, isDark }) => {
  const groups = groupByCategory(events);
  const categories = Object.keys(groups);
  if (categories.length === 0) return null;
  return (
    <div className={`rounded-2xl border p-4 ${isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-slate-200/70 shadow-sm'}`}>
      <div className={`text-xs font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>تفکیک بر اساس دسته سند</div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {categories.map((c) => {
          const list = groups[c];
          const days = list.reduce((s, e) => s + e.finalDurationDays, 0);
          return (
            <div key={c} className={`rounded-xl border px-3 py-3 ${isDark ? 'bg-slate-800/40 border-slate-700/50 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
              <div className="text-[10px] font-bold opacity-70">{c}</div>
              <div className="text-lg font-black tabular-nums">{list.length.toLocaleString('fa-IR')} رویداد</div>
              <div className={`text-[11px] font-bold tabular-nums ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                {days.toLocaleString('fa-IR')} روز
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryBreakdown;
