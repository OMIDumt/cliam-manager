// Pre-analysis confirmation: lets the user pick analysis options before
// any report is generated. Replaces the previous "click → instant default
// report" flow that surprised users with a non-tailored output.
import React, { useState, useEffect } from 'react';
import type { AnalysisType } from '../types';
import {
  METHOD_LABELS,
  METHOD_SCHEDULE_REQUIREMENTS,
  isMethodAvailable,
  getScheduleStatus,
  type DelayMethodKey,
} from '../utils/scheduleMethods';
import type { ProcessedFile } from '../types';

export type DelayScope = 'excusable' | 'nonExcusable' | 'both';
export type DamageParty = 'contractor' | 'employer' | 'both';
export type UserRole = 'contractor' | 'employer' | 'consultant' | 'other';
export type ModelPreference = 'auto' | 'pro' | 'gpt5' | 'flash';
export type AnalysisStrategy = 'precision' | 'balanced' | 'fast';
export type ReportVerbosity = 'concise' | 'standard' | 'detailed';
export type AnalysisOptions = {
  method?: DelayMethodKey | 'AUTO';
  scope: DelayScope;
  damageParty: DamageParty;
  userRole: UserRole;
  focusKeywords: string;
  strictMode: boolean;
  modelPreference: ModelPreference;
  strategy: AnalysisStrategy;
  minConfidence: number;
  verbosity: ReportVerbosity;
  requireCitations: boolean;
};

interface Props {
  type: AnalysisType;
  files: ProcessedFile[];
  isDark: boolean;
  defaultFocusKeywords?: string;
  defaultStrictMode?: boolean;
  onConfirm: (opts: AnalysisOptions) => void;
  onCancel: () => void;
}

const TYPE_TITLE: Record<AnalysisType, string> = {
  FULL: 'تحلیل جامع',
  DELAY: 'تحلیل تأخیرات',
  DAMAGE: 'تحلیل ضرر و زیان',
  TENDER: 'تحلیل مناقصه',
};

const AnalysisOptionsModal: React.FC<Props> = ({
  type,
  files,
  isDark,
  defaultFocusKeywords = '',
  defaultStrictMode = false,
  onConfirm,
  onCancel,
}) => {
  const sched = getScheduleStatus(files);
  const methods = Object.keys(METHOD_SCHEDULE_REQUIREMENTS) as DelayMethodKey[];

  const [method, setMethod] = useState<DelayMethodKey | 'AUTO'>('AUTO');
  const [scope, setScope] = useState<DelayScope>('both');
  const [damageParty, setDamageParty] = useState<DamageParty>('both');
  const [userRole, setUserRole] = useState<UserRole>('contractor');
  const [focusKeywords, setFocusKeywords] = useState(defaultFocusKeywords);
  const [strictMode, setStrictMode] = useState(defaultStrictMode);
  // Persisted quality/strategy settings (survive page refresh)
  const STORAGE_KEY = 'cm.analysisQualitySettings.v1';
  type Persisted = {
    modelPreference: ModelPreference;
    strategy: AnalysisStrategy;
    minConfidence: number;
    verbosity: ReportVerbosity;
    requireCitations: boolean;
  };
  const loadPersisted = (): Partial<Persisted> => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  };
  const persisted = loadPersisted();

  const [modelPreference, setModelPreference] = useState<ModelPreference>(persisted.modelPreference ?? 'auto');
  const [strategy, setStrategy] = useState<AnalysisStrategy>(persisted.strategy ?? 'balanced');
  const [minConfidence, setMinConfidence] = useState<number>(persisted.minConfidence ?? 70);
  const [verbosity, setVerbosity] = useState<ReportVerbosity>(persisted.verbosity ?? 'standard');
  const [requireCitations, setRequireCitations] = useState<boolean>(persisted.requireCitations ?? true);

  // Auto-persist on any change
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        modelPreference, strategy, minConfidence, verbosity, requireCitations,
      }));
    } catch { /* ignore quota/SSR */ }
  }, [modelPreference, strategy, minConfidence, verbosity, requireCitations]);

  // Strategy auto-maps to a model preference unless the user overrides it in advanced settings
  const handleStrategy = (s: AnalysisStrategy) => {
    setStrategy(s);
    if (s === 'precision') setModelPreference('pro');
    else if (s === 'fast') setModelPreference('flash');
    else setModelPreference('auto');
  };

  // Human-readable strategy/model summary shown right before the confirm button
  const strategyTextMap: Record<AnalysisStrategy, string> = {
    precision: 'دقیق‌ترین — اولویت کیفیت، مناسب فایل‌های حساس/کم‌حجم',
    balanced: 'متعادل — پیشنهاد پیش‌فرض',
    fast: 'سریع‌تر — مناسب حجم بالای فایل‌ها',
  };
  const modelChainMap: Record<ModelPreference, { primary: string; fallback: string }> = {
    auto:  { primary: 'Google Gemini 2.5 Pro', fallback: 'در صورت خطا: OpenAI GPT-5 → Gemini 2.5 Flash' },
    pro:   { primary: 'Google Gemini 2.5 Pro', fallback: 'در صورت خطا: OpenAI GPT-5' },
    gpt5:  { primary: 'OpenAI GPT-5',          fallback: 'در صورت خطا: Google Gemini 2.5 Pro' },
    flash: { primary: 'Google Gemini 2.5 Flash', fallback: 'در صورت خطا: Google Gemini 2.5 Pro' },
  };
  const totalSizeMB = files.reduce((sum, f) => sum + (f.file?.size || 0), 0) / (1024 * 1024);

  const needsMethod = type === 'DELAY' || type === 'FULL';
  const needsScope = type === 'DELAY' || type === 'DAMAGE' || type === 'FULL';
  const needsDamageParty = type === 'DAMAGE' || type === 'FULL';

  const bg = isDark ? 'bg-slate-900' : 'bg-white';
  const border = isDark ? 'border-slate-700' : 'border-slate-200';
  const text = isDark ? 'text-slate-100' : 'text-slate-800';
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const sub = isDark ? 'text-slate-300' : 'text-slate-700';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className={`${bg} ${border} border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
        <div className={`p-5 border-b ${border} flex items-center justify-between`}>
          <div>
            <h2 className={`text-lg font-black ${text}`}>تنظیم ویژگی‌های {TYPE_TITLE[type]}</h2>
            <p className={`text-xs mt-1 ${muted}`}>
              پیش از تولید گزارش، پارامترهای تحلیل را مشخص کنید تا خروجی مطابق نیاز شما باشد.
            </p>
          </div>
          <button
            onClick={onCancel}
            className={`text-2xl leading-none ${muted} hover:${text}`}
            aria-label="بستن"
          >
            ×
          </button>
        </div>

        <div className="p-5 space-y-5">
          {needsMethod && (
            <div>
              <label className={`text-xs font-black block mb-2 ${sub}`}>روش تحلیل تأخیر</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('AUTO')}
                  className={`text-right p-2.5 rounded-lg border text-xs font-bold transition ${
                    method === 'AUTO'
                      ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300'
                      : isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  انتخاب خودکار بهترین روش
                  <div className={`text-[10px] font-normal mt-0.5 ${muted}`}>براساس اسناد آپلودشده</div>
                </button>
                {methods.map((m) => {
                  const ok = isMethodAvailable(m, sched);
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={!ok}
                      onClick={() => setMethod(m)}
                      className={`text-right p-2.5 rounded-lg border text-xs font-bold transition ${
                        method === m
                          ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300'
                          : !ok
                          ? isDark ? 'bg-slate-800/30 border-slate-700/50 text-slate-600 cursor-not-allowed' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                          : isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                      title={!ok ? 'برنامه زمان‌بندی لازم برای این روش آپلود نشده' : ''}
                    >
                      {METHOD_LABELS[m]}
                      {!ok && <div className={`text-[10px] font-normal mt-0.5 ${muted}`}>برنامه لازم آپلود نشده</div>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {needsScope && (
            <div>
              <label className={`text-xs font-black block mb-2 ${sub}`}>دامنه تحلیل</label>
              <div className="flex flex-wrap gap-2">
                {([
                  { v: 'excusable', l: 'فقط تأخیرات مجاز' },
                  { v: 'nonExcusable', l: 'فقط تأخیرات غیرمجاز' },
                  { v: 'both', l: 'هر دو نوع' },
                ] as { v: DelayScope; l: string }[]).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setScope(opt.v)}
                    className={`px-3 py-2 rounded-lg border text-xs font-bold transition ${
                      scope === opt.v
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300'
                        : isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User role (always asked, neutralizes report tone) */}
          <div>
            <label className={`text-xs font-black block mb-2 ${sub}`}>نقش شما در پروژه</label>
            <div className="flex flex-wrap gap-2">
              {([
                { v: 'contractor', l: 'پیمانکار' },
                { v: 'employer', l: 'کارفرما' },
                { v: 'consultant', l: 'مشاور' },
                { v: 'other', l: 'سایر / بی‌طرف' },
              ] as { v: UserRole; l: string }[]).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setUserRole(opt.v)}
                  className={`px-3 py-2 rounded-lg border text-xs font-bold transition ${
                    userRole === opt.v
                      ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300'
                      : isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          {needsDamageParty && (
            <div>
              <label className={`text-xs font-black block mb-2 ${sub}`}>خسارات وارده به چه طرفی تحلیل شود؟</label>
              <div className="flex flex-wrap gap-2">
                {([
                  { v: 'contractor', l: 'خسارات وارده به پیمانکار' },
                  { v: 'employer', l: 'خسارات وارده به کارفرما' },
                  { v: 'both', l: 'هر دو طرف' },
                ] as { v: DamageParty; l: string }[]).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setDamageParty(opt.v)}
                    className={`px-3 py-2 rounded-lg border text-xs font-bold transition ${
                      damageParty === opt.v
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300'
                        : isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={`text-xs font-black block mb-2 ${sub}`}>تمرکز بر کلمات کلیدی (اختیاری)</label>
            <input
              type="text"
              value={focusKeywords}
              onChange={(e) => setFocusKeywords(e.target.value)}
              placeholder="مثال: تعلیق، ماده ۴۸، صورت‌وضعیت قطعی"
              className={`w-full rounded-lg text-sm p-2.5 border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
              }`}
            />
          </div>

          <label className={`flex items-center gap-2 cursor-pointer ${sub}`}>
            <input
              type="checkbox"
              checked={strictMode}
              onChange={(e) => setStrictMode(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-xs font-bold">حالت سخت‌گیرانه (پایبندی دقیق به متن اسناد)</span>
          </label>

          {/* Strategy: precision vs balanced vs fast — convenient mapping for file-size based quality */}
          <div>
            <label className={`text-xs font-black block mb-2 ${sub}`}>استراتژی تحلیل</label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { v: 'precision', l: 'دقیق‌ترین', d: 'مناسب فایل‌های کم و حساس' },
                { v: 'balanced',  l: 'متعادل',   d: 'پیشنهاد پیش‌فرض' },
                { v: 'fast',      l: 'سریع‌تر',   d: 'مناسب حجم بالا' },
              ] as { v: AnalysisStrategy; l: string; d: string }[]).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => handleStrategy(opt.v)}
                  className={`text-right p-2.5 rounded-lg border text-xs font-bold transition ${
                    strategy === opt.v
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                      : isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.l}
                  <div className={`text-[10px] font-normal mt-0.5 ${muted}`}>{opt.d}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quality panel: min confidence + verbosity + citation requirement */}
          <div className={`rounded-xl border p-3 ${isDark ? 'border-slate-700 bg-slate-800/40' : 'border-slate-200 bg-slate-50'}`}>
            <div className={`text-xs font-black mb-2 ${sub}`}>پنل تنظیمات کیفیت تحلیل</div>

            <div className="mb-3">
              <div className={`flex items-center justify-between text-[11px] font-bold mb-1 ${sub}`}>
                <span>حداقل درصد اطمینان برای درج هر یافته</span>
                <span className="text-emerald-400">{minConfidence}٪</span>
              </div>
              <input
                type="range" min={0} max={100} step={5}
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                className="w-full"
              />
              <p className={`text-[10px] mt-1 ${muted}`}>یافته‌هایی با اطمینان کمتر از این مقدار به‌صورت «نیازمند بررسی» علامت‌گذاری می‌شوند.</p>
            </div>

            <div className="mb-3">
              <div className={`text-[11px] font-bold mb-1 ${sub}`}>سطح جزئیات خروجی</div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: 'concise',  l: 'خلاصه' },
                  { v: 'standard', l: 'استاندارد' },
                  { v: 'detailed', l: 'جامع و مفصل' },
                ] as { v: ReportVerbosity; l: string }[]).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setVerbosity(opt.v)}
                    className={`p-2 rounded-lg border text-xs font-bold transition ${
                      verbosity === opt.v
                        ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300'
                        : isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt.l}
                  </button>
                ))}
              </div>
            </div>

            <label className={`flex items-center gap-2 cursor-pointer ${sub}`}>
              <input
                type="checkbox"
                checked={requireCitations}
                onChange={(e) => setRequireCitations(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-xs font-bold">نمایش استناد مستقیم (نقل قول از متن منبع) برای هر عدد/فیلد استخراج‌شده</span>
            </label>
          </div>

          {/* Advanced: model selection (auto-set by strategy, can be overridden) */}
          <details className={`rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-white'}`}>
            <summary className={`cursor-pointer text-xs font-black px-3 py-2 ${sub}`}>تنظیمات پیشرفته: انتخاب مدل دستی</summary>
            <div className="p-3 grid grid-cols-2 gap-2">
              {([
                { v: 'auto', l: 'خودکار (با جایگزینی در صورت خطا)' },
                { v: 'pro',  l: 'Gemini 2.5 Pro (دقت حداکثری)' },
                { v: 'gpt5', l: 'OpenAI GPT-5 (دقت حداکثری)' },
                { v: 'flash',l: 'Gemini 2.5 Flash (سریع‌تر)' },
              ] as { v: ModelPreference; l: string }[]).map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setModelPreference(opt.v)}
                  className={`text-right p-2.5 rounded-lg border text-xs font-bold transition ${
                    modelPreference === opt.v
                      ? 'bg-indigo-500/15 border-indigo-500 text-indigo-300'
                      : isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </details>

          {/* Pre-analysis summary: strategy + final model that will be used */}
          <div className={`rounded-xl border p-3 ${isDark ? 'border-emerald-700/50 bg-emerald-500/10' : 'border-emerald-300 bg-emerald-50'}`}>
            <div className={`text-xs font-black mb-1.5 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
              ▸ خلاصهٔ تنظیمات پیش از شروع تحلیل
            </div>
            <ul className={`text-[11px] leading-6 ${isDark ? 'text-emerald-100' : 'text-emerald-900'}`}>
              <li><b>استراتژی:</b> {strategyTextMap[strategy]}</li>
              <li><b>مدل اصلی پیشنهادی:</b> {modelChainMap[modelPreference].primary}</li>
              <li><b>زنجیرهٔ جایگزینی:</b> {modelChainMap[modelPreference].fallback}</li>
              <li><b>اعمال‌شده روی:</b> {files.length} فایل (≈ {totalSizeMB.toFixed(1)} مگابایت) — همین مدل برای همهٔ فایل‌ها استفاده می‌شود.</li>
              <li><b>حداقل اطمینان:</b> {minConfidence}٪ — <b>سطح جزئیات:</b> {verbosity === 'concise' ? 'خلاصه' : verbosity === 'detailed' ? 'جامع' : 'استاندارد'} — <b>استناد مستقیم:</b> {requireCitations ? 'فعال' : 'غیرفعال'}</li>
            </ul>
          </div>
        </div>


        <div className={`p-4 border-t ${border} flex items-center justify-end gap-2`}>
          <button
            onClick={onCancel}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold border ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
          >
            انصراف
          </button>
          <button
            onClick={() => onConfirm({
              method: needsMethod ? method : undefined,
              scope,
              damageParty,
              userRole,
              focusKeywords,
              strictMode,
              modelPreference,
              strategy,
              minConfidence,
              verbosity,
              requireCitations,
            })}
            className="px-5 py-2.5 rounded-xl text-sm font-black text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/30 hover:scale-[1.02] transition"
          >
            تأیید و شروع تحلیل
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisOptionsModal;
