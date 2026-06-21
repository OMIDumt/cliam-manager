import React from 'react';

export type DelayBriefScope = 'excusable' | 'nonExcusable' | 'both';

interface Props {
  isDark: boolean;
  onRunAnalysis: () => void | Promise<void>;
  onReport: (scope: DelayBriefScope) => void | Promise<void>;
  onReportDocx: (scope: DelayBriefScope) => void | Promise<void>;
  onDamage: () => void;
  onDashboard: () => void;
  analysisRunning?: boolean;
  reportLoading?: boolean;
  docxLoading?: boolean;
}

const Spinner = () => (
  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin align-[-2px]" />
);

const StickyActionBar: React.FC<Props> = ({
  isDark, onRunAnalysis, onReport, onReportDocx, onDamage, onDashboard, analysisRunning, reportLoading, docxLoading,
}) => {
  const [scope, setScope] = React.useState<DelayBriefScope>('both');

  const options: { id: DelayBriefScope; title: string; sub: string }[] = [
    { id: 'excusable',    title: 'فقط تاخیرات مجاز',     sub: 'خارج از قصور پیمانکار' },
    { id: 'nonExcusable', title: 'فقط تاخیرات غیرمجاز',  sub: 'در قصور پیمانکار' },
    { id: 'both',         title: 'هر دو نوع تاخیر',      sub: 'مجاز و غیرمجاز' },
  ];

  return (
    <div className={`mt-6 -mx-4 px-4 py-3 border-t ${
      isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-white border-slate-300'
    }`}>
      <div className="max-w-[1600px] mx-auto space-y-3">
        {/* Delay-brief scope selector */}
        <div className={`rounded-xl border p-3 ${isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-slate-100 border-slate-300'}`}>
          <div className={`text-[11px] font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
            دامنه لایحه تاخیرات — انتخاب کنید کدام دسته از تاخیرات در لایحه لحاظ شود:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {options.map((o) => {
              const active = scope === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setScope(o.id)}
                  className={`text-right px-3 py-2 rounded-lg border text-xs font-bold transition ${
                    active
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-transparent shadow'
                      : isDark
                        ? 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:border-violet-500/50'
                        : 'bg-white border-slate-300 text-slate-900 hover:border-indigo-400 hover:bg-indigo-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{o.title}</span>
                    <span className={`text-[10px] ${active ? 'text-white/85' : isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {o.sub}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          با کلیک روی «تحلیل تاخیرات»، هم تحلیل فنی (بر اساس اسناد و روش انتخاب‌شده) و هم تحلیل مالی (بر اساس صورت‌وضعیت‌ها و پیکربندی روش انتخاب‌شده) به‌صورت یکپارچه اجرا می‌شوند.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2" dir="rtl">
          <button
            onClick={() => onRunAnalysis()}
            disabled={analysisRunning}
            className="py-3 rounded-xl text-sm font-black text-white bg-gradient-to-r from-sky-600 to-blue-600 shadow hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {analysisRunning ? <><Spinner /> ⏳ در حال تحلیل...</> : '🔎 تحلیل تاخیرات (فنی + مالی)'}
          </button>

          <button
            onClick={() => onReport(scope)}
            disabled={reportLoading}
            className="py-3 rounded-xl text-sm font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {reportLoading ? <><Spinner /> ⏳ در حال تهیه گزارش...</> : '📄 لایحه تاخیرات (PDF)'}
          </button>
          <button
            onClick={() => onReportDocx(scope)}
            disabled={docxLoading}
            className="py-3 rounded-xl text-sm font-black text-white bg-gradient-to-r from-cyan-600 to-sky-600 shadow hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {docxLoading ? <><Spinner /> ⏳ در حال تهیه فایل Word...</> : '📝 نسخه قابل ویرایش (Word)'}
          </button>
          <button onClick={onDamage} className="py-3 rounded-xl text-sm font-black text-white bg-gradient-to-r from-amber-600 to-orange-600 shadow hover:shadow-lg">
            ⚖️ ادامه به محاسبه ضرر و زیان
          </button>
          <button onClick={onDashboard} className={`py-3 rounded-xl text-sm font-black border-2 ${
            isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-400 text-slate-900 hover:bg-slate-100 bg-white'
          }`}>
            🏠 بازگشت به داشبورد
          </button>
        </div>
      </div>
    </div>
  );
};

export default StickyActionBar;
