import React, { useState } from 'react';
import {
  DURATION_WARN_THRESHOLD,
  computeDurationDays,
  durationDiffRatio,
  durationHasWarning,
  type DelayEvent,
  type DelayCompensability,
  type DelayType,
} from '../../utils/delayEvents';

interface Props {
  event: DelayEvent;
  isDark: boolean;
  onChange: (e: DelayEvent) => void;
}

const DelayEventCard: React.FC<Props> = ({ event, isDark, onChange }) => {
  const [showCalc, setShowCalc] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const card = `rounded-2xl border p-4 ${isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-slate-200/70 shadow-sm'}`;
  const badge = (cls: string) => `text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`;
  const btn = `text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`;

  const warn = durationHasWarning(event);
  const ratio = Math.round(durationDiffRatio(event.extractedDurationDays, event.computedDurationDays) * 100);

  return (
    <div className={card}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{event.title}</h4>
            <span className={badge(isDark ? 'bg-slate-700/60 text-slate-300' : 'bg-slate-100 text-slate-600')}>
              {event.category}
            </span>
            <span className={badge(
              event.delayType === 'excusable'
                ? (isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700')
                : (isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-50 text-rose-700')
            )}>
              {event.delayType === 'excusable' ? 'مجاز' : 'غیرمجاز'}
            </span>
            {event.compensability && (
              <span className={badge(isDark ? 'bg-sky-500/15 text-sky-300' : 'bg-sky-50 text-sky-700')}>
                {event.compensability === 'compensable' ? 'قابل جبران' : 'غیرقابل جبران'}
              </span>
            )}
            {event.userEdited && (
              <span className={badge(isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700')}>
                ✎ ویرایش‌شده توسط کاربر
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setShowCalc((s) => !s)} className={btn}>نحوه محاسبه</button>
          <button onClick={() => setShowEdit((s) => !s)} className={btn}>ویرایش نوع تاخیر</button>
        </div>
      </div>

      {/* Two-duration display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        <div className={`rounded-lg border px-3 py-2 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>مدت استخراج‌شده از سند</div>
          <div className={`text-lg font-black tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {event.extractedDurationDays.toLocaleString('fa-IR')} روز
          </div>
        </div>
        <div className={`rounded-lg border px-3 py-2 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>مدت محاسبه‌شده از تاریخ</div>
          <div className={`text-lg font-black tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {event.computedDurationDays.toLocaleString('fa-IR')} روز
          </div>
        </div>
        <div className={`rounded-lg border px-3 py-2 ${isDark ? 'bg-violet-500/10 border-violet-500/30' : 'bg-violet-50 border-violet-200'}`}>
          <label className={`block text-[10px] font-bold mb-1 ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
            مقدار نهایی برای محاسبات (قابل ویرایش)
          </label>
          <input
            type="number" min={0}
            value={event.finalDurationDays}
            onChange={(e) => onChange({ ...event, finalDurationDays: Number(e.target.value) || 0 })}
            className={`w-full px-2 py-1 rounded border text-sm font-bold tabular-nums ${
              isDark ? 'bg-slate-900/60 border-violet-500/40 text-violet-100' : 'bg-white border-violet-300 text-violet-900'
            }`}
          />
        </div>
      </div>

      {/* >20% diff warning */}
      {warn && (
        <div className={`rounded-lg border-2 px-3 py-2 mb-3 flex items-start gap-2 text-xs font-bold ${
          isDark ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800'
        }`}>
          <span>⚠</span>
          <span>
            اختلاف بین مدت استخراج‌شده و محاسبه‌شده {ratio.toLocaleString('fa-IR')}٪ است (آستانه: {(DURATION_WARN_THRESHOLD * 100).toLocaleString('fa-IR')}٪). لطفاً مقدار نهایی را بازبینی کنید.
          </span>
        </div>
      )}

      {/* Calculation dialog */}
      {showCalc && (
        <div className={`rounded-lg border p-3 mb-2 text-xs ${isDark ? 'bg-slate-800/50 border-slate-700/50 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
          <div className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>نحوه محاسبه</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div><span className="font-bold">تاریخ شروع: </span><span className="tabular-nums">{event.startDate}</span></div>
            <div><span className="font-bold">منبع سند: </span>{event.startSourceDoc}</div>
            <div><span className="font-bold">تاریخ پایان: </span><span className="tabular-nums">{event.endDate}</span></div>
            <div><span className="font-bold">منبع سند: </span>{event.endSourceDoc}</div>
          </div>
          <div className={`mt-2 font-mono text-[11px] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
            فرمول: (تاریخ پایان − تاریخ شروع) + ۱ = {computeDurationDays(event.startDate, event.endDate).toLocaleString('fa-IR')} روز
          </div>
        </div>
      )}

      {/* Edit-type dialog */}
      {showEdit && (
        <EditTypeDialog
          event={event}
          isDark={isDark}
          onCancel={() => setShowEdit(false)}
          onSave={(patch) => { onChange({ ...event, ...patch, userEdited: true }); setShowEdit(false); }}
        />
      )}
    </div>
  );
};

const EditTypeDialog: React.FC<{
  event: DelayEvent;
  isDark: boolean;
  onCancel: () => void;
  onSave: (patch: { delayType: DelayType; compensability: DelayCompensability; userEditReason: string }) => void;
}> = ({ event, isDark, onCancel, onSave }) => {
  const [delayType, setDelayType] = useState<DelayType>(event.delayType);
  const [comp, setComp] = useState<DelayCompensability>(event.compensability);
  const [reason, setReason] = useState(event.userEditReason || '');
  const inp = `w-full px-2 py-1.5 rounded border text-sm ${isDark ? 'bg-slate-900/60 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`;

  return (
    <div className={`rounded-lg border p-3 mb-2 ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
      <div className={`font-bold mb-2 text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>ویرایش نوع تاخیر</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
        <label className="text-xs">
          <span className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>نوع</span>
          <select className={inp} value={delayType} onChange={(e) => setDelayType(e.target.value as DelayType)}>
            <option value="excusable">مجاز</option>
            <option value="nonExcusable">غیرمجاز</option>
          </select>
        </label>
        <label className="text-xs">
          <span className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>زیردسته</span>
          <select
            className={inp}
            value={comp ?? ''}
            disabled={delayType !== 'excusable'}
            onChange={(e) => setComp((e.target.value || null) as DelayCompensability)}
          >
            <option value="">—</option>
            <option value="compensable">قابل جبران</option>
            <option value="nonCompensable">غیرقابل جبران</option>
          </select>
        </label>
      </div>
      <label className="text-xs block mb-2">
        <span className={`block font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>دلیل تغییر</span>
        <textarea rows={2} className={inp} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="توضیح دلیل ویرایش..." />
      </label>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border ${isDark ? 'border-slate-700 text-slate-300' : 'border-slate-200 text-slate-700'}`}>انصراف</button>
        <button
          onClick={() => onSave({ delayType, compensability: delayType === 'excusable' ? comp : null, userEditReason: reason })}
          disabled={!reason.trim()}
          className={`text-[11px] font-bold px-3 py-1.5 rounded-lg text-white ${reason.trim() ? 'bg-gradient-to-r from-violet-600 to-indigo-600' : 'bg-slate-400 cursor-not-allowed'}`}
        >
          ذخیره
        </button>
      </div>
    </div>
  );
};

export default DelayEventCard;
