import React, { useEffect, useMemo, useState } from 'react';
import type { ManualDelayDays } from './DamageGateway';
import {
  FORMULAS,
  VARIABLE_LABEL,
  evaluateFormulas,
  seedFromDelayDays,
  type FormulaResult,
  type VariableKey,
  type Variables,
} from '../../utils/lossFormulas';
import { generateDamagePdf } from '../../utils/pdfReport';

interface Props {
  isDark: boolean;
  source: 'analysis' | 'manual';
  days: ManualDelayDays;
  onBack: () => void;
}

const fmt = (n: number) => n.toLocaleString('fa-IR', { maximumFractionDigits: 2 });

const DamageClaimPage: React.FC<Props> = ({ isDark, source, days, onBack }) => {
  const [vars, setVars] = useState<Variables>(() => seedFromDelayDays(days));
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FormulaResult[] | null>(null);
  const [editing, setEditing] = useState<VariableKey | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleGeneratePdf = async () => {
    setPdfLoading(true);
    try {
      await generateDamagePdf({
        project: { projectName: 'پروژه' },
        source,
        days,
        formulas: (results ?? []).map((r) => {
          const def = FORMULAS.find((f) => f.id === r.id)!;
          return {
            label: def.title,
            value: r.computable ? fmt(r.value) : '—',
            status: r.computable ? 'ok' : 'incomplete',
            missing: r.computable ? [] : (r.missing.map((k) => VARIABLE_LABEL[k] ?? k)),
          };
        }),
        totalLoss: results ? fmt(grandTotal) : undefined,
      });
    } catch (e) { console.error(e); alert('خطا در تهیه گزارش PDF'); }
    finally { setPdfLoading(false); }
  };

  // Re-seed if delay days change (e.g., gateway re-entry)
  useEffect(() => { setVars((v) => ({ ...seedFromDelayDays(days), ...v })); }, [days]);

  const computable = results?.filter((r) => r.computable).length ?? 0;
  const total = FORMULAS.length;
  const grandTotal = useMemo(
    () => (results ?? []).filter((r) => r.computable).reduce((s, r) => s + r.value, 0),
    [results],
  );

  const runCalculation = () => {
    setLoading(true);
    setResults(null);
    // Simulated short processing to expose loading state in UI
    setTimeout(() => {
      setResults(evaluateFormulas(vars));
      setLoading(false);
    }, 500);
  };

  const setVariable = (k: VariableKey, value: number) => {
    setVars((prev) => ({ ...prev, [k]: value }));
    if (results) setResults(evaluateFormulas({ ...vars, [k]: value }));
  };

  const card = `rounded-2xl border p-4 ${isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-slate-200/70 shadow-sm'}`;
  const inp = `w-full px-2 py-1.5 rounded border text-sm tabular-nums ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`;

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>زیان‌نگار — لایحه ضرر و زیان</h2>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            موتور محاسبه فرمول‌های ضرر و زیان بر اساس روزهای تاخیر و متغیرهای مالی قرارداد.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGeneratePdf}
            disabled={pdfLoading}
            className="text-xs font-black px-3 py-2 rounded-lg text-white bg-gradient-to-r from-rose-600 to-red-600 shadow hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {pdfLoading ? (<>
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ⏳ در حال تهیه گزارش...
            </>) : '📑 تهیه گزارش لایحه ضرر و زیان'}
          </button>
          <button
            onClick={onBack}
            className={`text-xs font-bold px-3 py-2 rounded-lg border ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            بازگشت
          </button>
        </div>
      </div>


      {source === 'analysis' && (
        <div className={`rounded-xl border-2 px-4 py-3 flex items-start gap-3 ${isDark ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-800'}`}>
          <span className="text-lg">✅</span>
          <div className="text-xs font-bold leading-relaxed">
            داده‌های روزهای تاخیر به‌صورت خودکار از <span className="underline">تحلیل تاخیرات</span> منتقل شده‌اند.
            مقادیر زیر بر اساس جمع مدت رویدادهای ثبت‌شده (به روز) برای هر دسته محاسبه گردیده است و می‌توانید در صورت نیاز در فرمول‌ها، متغیرها را اصلاح کنید.
          </div>
        </div>
      )}

      {source === 'manual' && (
        <div className={`rounded-xl border-2 px-4 py-3 flex items-start gap-3 ${isDark ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800'}`}>
          <span className="text-lg">⚠</span>
          <div className="text-xs font-bold leading-relaxed">
            توجه: داده‌های روزهای تاخیر به‌صورت <span className="underline">دستی</span> توسط کاربر وارد شده‌اند.
          </div>
        </div>
      )}

      {/* Library notice */}
      <div className={`rounded-xl border-2 px-4 py-3 flex items-start gap-3 ${isDark ? 'bg-sky-500/10 border-sky-500/40 text-sky-200' : 'bg-sky-50 border-sky-300 text-sky-800'}`}>
        <span className="text-lg">ℹ</span>
        <div className="text-xs font-bold leading-relaxed">
          فهرست کامل سرفصل‌ها و فرمول‌های پیشنهادی در حال تکمیل است و به‌زودی اضافه خواهد شد.
        </div>
      </div>

      {/* Days summary */}
      <div className={card}>
        <div className={`text-xs font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>روزهای تاخیر ورودی</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {([
            ['excusable', 'تاخیرات مجاز', days.excusable],
            ['nonExcusable', 'تاخیرات غیرمجاز', days.nonExcusable],
            ['excusableCompensable', 'مجاز قابل جبران', days.excusableCompensable],
            ['excusableNonCompensable', 'مجاز غیرقابل جبران', days.excusableNonCompensable],
          ] as const).map(([k, label, val]) => (
            <div key={k} className={`rounded-xl border px-3 py-3 text-center ${isDark ? 'bg-slate-800/50 border-slate-700/50 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
              <div className="text-2xl font-black tabular-nums">{fmt(val)}</div>
              <div className="text-[10px] font-bold mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Run + progress */}
      <div className={card}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>وضعیت محاسبه</div>
            {results ? (
              <div className={`mt-1 text-sm font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                فرمول‌های قابل محاسبه: {fmt(computable)} از {fmt(total)}
              </div>
            ) : (
              <div className={`mt-1 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>هنوز محاسبه اجرا نشده است.</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {results && (
              <div className={`text-xs font-black px-3 py-2 rounded-lg ${isDark ? 'bg-violet-500/15 text-violet-200' : 'bg-violet-50 text-violet-800'}`}>
                جمع کل قابل محاسبه: {fmt(grandTotal)}
              </div>
            )}
            <button
              onClick={runCalculation} disabled={loading}
              className={`text-xs font-bold px-4 py-2 rounded-lg text-white ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-lg'}`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" className="opacity-75" />
                  </svg>
                  در حال پردازش...
                </span>
              ) : 'اجرای محاسبه'}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {results && (
          <div className={`mt-3 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
              style={{ width: `${total === 0 ? 0 : (computable / total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Formula library */}
      <div className="space-y-2">
        <div className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>کتابخانه فرمول‌ها</div>

        {(results ?? FORMULAS.map((f) => ({ id: f.id, computable: false, missing: f.needs, value: 0 }))).map((r) => {
          const def = FORMULAS.find((f) => f.id === r.id)!;
          const ok = r.computable;
          return (
            <div key={r.id} className={card}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-slate-700/60 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                      {def.category}
                    </span>
                    <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{def.title}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ok
                        ? isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                        : isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {ok ? 'قابل محاسبه ✅' : 'ناقص ⚠️'}
                    </span>
                  </div>
                  <div className={`mt-1 text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {def.formula}
                  </div>
                </div>
                {ok && results && (
                  <div className={`text-lg font-black tabular-nums ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    {fmt(r.value)}
                  </div>
                )}
              </div>

              {!ok && (
                <div className={`rounded-lg border px-3 py-2 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-[11px] font-bold mb-2 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                    متغیرهای کم: {r.missing.map((m) => VARIABLE_LABEL[m]).join(' · ')}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {r.missing.map((m) => (
                      <div key={m} className="flex items-center gap-2">
                        <label className={`text-[11px] flex-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{VARIABLE_LABEL[m]}</label>
                        {editing === m ? (
                          <input
                            autoFocus type="number" className={`${inp} max-w-[160px]`}
                            value={vars[m] ?? ''}
                            onChange={(e) => setVariable(m, Number(e.target.value) || 0)}
                            onBlur={() => setEditing(null)}
                          />
                        ) : (
                          <button
                            onClick={() => setEditing(m)}
                            className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isDark ? 'bg-violet-500/15 text-violet-200 hover:bg-violet-500/25' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'}`}
                          >
                            ✎ ورود دستی
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DamageClaimPage;
