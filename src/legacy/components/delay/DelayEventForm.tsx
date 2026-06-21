import React, { useState } from 'react';
import { computeDurationDays, requiresActivityLink, type DelayEvent } from '../../utils/delayEvents';

interface Props {
  isDark: boolean;
  /** currently selected technical method, used for activity-link gating */
  selectedMethodId: string | null;
  /** available schedule activities to link to */
  activities: Array<{ id: string; name: string }>;
  onAdd: (event: DelayEvent) => void;
}

const CATEGORIES = ['مکاتبات', 'قراردادها/صورتجلسات', 'گزارشات پیشرفت', 'برنامه‌ها', 'سایر'];

const DelayEventForm: React.FC<Props> = ({ isDark, selectedMethodId, activities, onAdd }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [extractedDurationDays, setExtracted] = useState<number>(0);
  const [startSourceDoc, setStartSrc] = useState('');
  const [endSourceDoc, setEndSrc] = useState('');
  const [linkedActivityId, setLinked] = useState('');

  const activityRequired = requiresActivityLink(selectedMethodId);
  const computed = startDate && endDate ? computeDurationDays(startDate, endDate) : 0;
  const canSave = title.trim() && startDate && endDate && (!activityRequired || linkedActivityId);

  const lbl = `block text-[11px] font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const inp = `w-full px-2 py-1.5 rounded border text-sm ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`;

  const submit = () => {
    if (!canSave) return;
    onAdd({
      id: `evt-${Date.now()}`,
      title: title.trim(),
      category,
      startDate, endDate,
      startSourceDoc: startSourceDoc || '—',
      endSourceDoc: endSourceDoc || '—',
      extractedDurationDays: extractedDurationDays || computed,
      computedDurationDays: computed,
      finalDurationDays: extractedDurationDays || computed,
      delayType: 'excusable',
      compensability: null,
      linkedActivityId: linkedActivityId || null,
    });
    setTitle(''); setStartDate(''); setEndDate(''); setExtracted(0); setStartSrc(''); setEndSrc(''); setLinked('');
  };

  return (
    <div className={`rounded-2xl border p-4 ${isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-slate-200/70 shadow-sm'}`}>
      <div className={`text-xs font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>ثبت دستی رویداد تاخیر</div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
        <div><label className={lbl}>عنوان</label><input className={inp} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div>
          <label className={lbl}>دسته سند</label>
          <select className={inp} value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>مدت استخراج‌شده از سند (روز)</label>
          <input type="number" min={0} className={inp} value={extractedDurationDays || ''} onChange={(e) => setExtracted(Number(e.target.value) || 0)} />
        </div>
        <div><label className={lbl}>تاریخ شروع</label><input type="date" className={inp} value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div><label className={lbl}>منبع سند (شروع)</label><input className={inp} value={startSourceDoc} onChange={(e) => setStartSrc(e.target.value)} /></div>
        <div><label className={lbl}>تاریخ پایان</label><input type="date" className={inp} value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        <div><label className={lbl}>منبع سند (پایان)</label><input className={inp} value={endSourceDoc} onChange={(e) => setEndSrc(e.target.value)} /></div>
        <div className="md:col-span-2">
          <label className={lbl}>
            فعالیت مرتبط در برنامه زمان‌بندی
            {activityRequired && <span className="text-rose-500"> *</span>}
          </label>
          <select className={inp} value={linkedActivityId} onChange={(e) => setLinked(e.target.value)}>
            <option value="">{activityRequired ? '— الزامی برای روش انتخاب‌شده —' : '— انتخاب کنید (اختیاری) —'}</option>
            {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>
      {activityRequired && !linkedActivityId && (
        <div className={`text-[11px] font-bold mb-2 ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>
          روش انتخاب‌شده ({selectedMethodId}) نیازمند انتخاب «فعالیت مرتبط» است. ذخیره تا قبل از انتخاب ممنوع است.
        </div>
      )}
      <div className="flex justify-end">
        <button
          onClick={submit} disabled={!canSave}
          className={`text-xs font-bold px-4 py-2 rounded-lg text-white ${canSave ? 'bg-gradient-to-r from-violet-600 to-indigo-600' : 'bg-slate-400 cursor-not-allowed'}`}
        >
          ذخیره رویداد
        </button>
      </div>
    </div>
  );
};

export default DelayEventForm;
