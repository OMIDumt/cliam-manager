// Document quality & coverage panel — three sub-sections per spec.
import React, { useMemo } from 'react';
import type { ProcessedFile } from '../../types';
import { getScheduleStatus } from '../../utils/scheduleMethods';
import { TECH_METHODS, missingForTechMethod, type TechMethodId } from '../../utils/delayMethods';

interface Props {
  files: ProcessedFile[];
  isDark: boolean;
  selectedMethod?: TechMethodId | null;
}

type Status = 'ok' | 'warn' | 'fail';

const StatusBadge: React.FC<{ status: Status; isDark: boolean }> = ({ status, isDark }) => {
  const map = {
    ok:   { icon: '✅', cls: isDark ? 'text-emerald-300' : 'text-emerald-600' },
    warn: { icon: '⚠️', cls: isDark ? 'text-amber-300'   : 'text-amber-600'   },
    fail: { icon: '❌', cls: isDark ? 'text-rose-300'    : 'text-rose-600'    },
  } as const;
  const x = map[status];
  return <span className={`font-bold text-sm ${x.cls}`}>{x.icon}</span>;
};

const Row: React.FC<{ label: string; status: Status; isDark: boolean; detail?: string }> = ({ label, status, isDark, detail }) => (
  <div className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border ${
    isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'
  }`}>
    <div className="flex items-center gap-2">
      <StatusBadge status={status} isDark={isDark} />
      <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{label}</span>
    </div>
    {detail && (
      <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{detail}</span>
    )}
  </div>
);

const SectionTitle: React.FC<{ title: string; subtitle: string; isDark: boolean }> = ({ title, subtitle, isDark }) => (
  <div className="mb-2">
    <div className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</div>
    <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</div>
  </div>
);

const DocumentQualityPanel: React.FC<Props> = ({ files, isDark, selectedMethod }) => {
  const stats = useMemo(() => {
    const sched = getScheduleStatus(files);
    const hasContract = files.some((f) => /قرارداد|الحاقی|متمم|صورتجلس|دستورکار/.test(f.category));
    const hasCorrespondence = files.some((f) => /مکاتبات/.test(f.category));
    const hasReports = files.some((f) => /گزارش/.test(f.category));
    // readability heuristic — text-based file types are readable
    const readableCount = files.filter((f) => /pdf|word|document|sheet|text|excel|xls|csv/i.test(f.mimeType ?? '') || !!f.textContent || !!f.base64Data).length;
    const allReadable = files.length > 0 && readableCount === files.length;
    // Linked Logic heuristic — needs a schedule file (baseline or intermediate)
    const hasSchedule = sched.baseline_schedule.uploaded || sched.intermediate_schedule.uploaded || sched.as_built_schedule.uploaded;
    return {
      sched,
      hasContract,
      hasCorrespondence,
      hasReports,
      hasSchedule,
      allReadable,
      readableCount,
      totalFiles: files.length,
    };
  }, [files]);

  const toStatus = (b: boolean): Status => (b ? 'ok' : 'fail');
  const triState = (b: boolean, warn: boolean): Status => (b ? 'ok' : warn ? 'warn' : 'fail');

  return (
    <div className={`rounded-2xl border p-4 space-y-5 ${
      isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-slate-200/70 shadow-sm'
    }`} dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
          📋 کیفیت و پوشش مستندات
        </h3>
      </div>

      {/* Section 1 — coverage */}
      <div>
        <SectionTitle
          title="پوشش اسناد کلیدی"
          subtitle="نشان می‌دهد کدام اسناد کلیدی آپلود شده‌اند."
          isDark={isDark}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Row label="قرارداد" status={toStatus(stats.hasContract)} isDark={isDark} />
          <Row label="برنامه اولیه" status={toStatus(stats.sched.baseline_schedule.uploaded)} isDark={isDark} />
          <Row label="برنامه میانی" status={toStatus(stats.sched.intermediate_schedule.uploaded)} isDark={isDark} detail={`${stats.sched.intermediate_schedule.count} فایل`} />
          <Row label="چون‌ساخت" status={toStatus(stats.sched.as_built_schedule.uploaded)} isDark={isDark} />
          <Row label="مکاتبات" status={toStatus(stats.hasCorrespondence)} isDark={isDark} />
          <Row label="گزارشات" status={toStatus(stats.hasReports)} isDark={isDark} />
        </div>
      </div>

      {/* Section 2 — preconditions */}
      <div>
        <SectionTitle
          title="پیش‌نیازهای تحلیل"
          subtitle={selectedMethod
            ? `پیش‌نیازهای متناسب با روش انتخابی: ${TECH_METHODS.find((m) => m.id === selectedMethod)?.faName ?? '—'}`
            : 'برای مشاهده پیش‌نیازهای دقیق، ابتدا یکی از ۸ روش تحلیل را در بالای صفحه انتخاب کنید.'}
          isDark={isDark}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(() => {
            const m = selectedMethod ? TECH_METHODS.find((x) => x.id === selectedMethod) : null;
            const rows: React.ReactNode[] = [];
            if (m) {
              const missing = missingForTechMethod(m, stats.sched, stats.hasContract);
              const req = m.scheduleReq;
              if (req.kind === 'contract') {
                rows.push(<Row key="ct" label="متن قرارداد" status={toStatus(stats.hasContract)} isDark={isDark} />);
              } else if (req.kind === 'all' || req.kind === 'any') {
                const titles: Record<string, string> = {
                  baseline_schedule: 'برنامه اولیه',
                  intermediate_schedule: 'برنامه میانی',
                  as_built_schedule: 'برنامه چون‌ساخت',
                };
                req.keys.forEach((k) => {
                  rows.push(<Row key={k} label={titles[k]} status={toStatus(stats.sched[k].uploaded)} isDark={isDark} />);
                });
              } else {
                rows.push(<Row key="none" label="بدون پیش‌نیاز برنامه" status="ok" isDark={isDark} />);
              }
              if (m.requiresActivityLink) {
                rows.push(<Row key="al" label="اتصال رویدادها به فعالیت‌ها" status={toStatus(stats.sched.baseline_schedule.uploaded || stats.sched.intermediate_schedule.uploaded)} isDark={isDark} />);
              }
              rows.push(
                <Row key="rd" label="قابل خواندن بودن اسناد"
                  status={triState(stats.allReadable, stats.totalFiles > 0 && stats.readableCount > 0)}
                  isDark={isDark}
                  detail={`${stats.readableCount.toLocaleString('fa-IR')}/${stats.totalFiles.toLocaleString('fa-IR')}`}
                />,
              );
              if (missing.length > 0) {
                rows.push(
                  <div key="miss" className={`sm:col-span-3 text-[11px] font-bold px-3 py-2 rounded-lg border ${isDark ? 'bg-rose-500/10 border-rose-500/40 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-700'}`}>
                    موارد ناقص برای این روش: {missing.join(' · ')}
                  </div>,
                );
              }
            } else {
              rows.push(<Row key="ct" label="وجود قرارداد" status={toStatus(stats.hasContract)} isDark={isDark} />);
              rows.push(<Row key="sc" label="وجود برنامه زمان‌بندی" status={toStatus(stats.hasSchedule)} isDark={isDark} />);
              rows.push(
                <Row key="rd" label="قابل خواندن بودن اسناد"
                  status={triState(stats.allReadable, stats.totalFiles > 0 && stats.readableCount > 0)}
                  isDark={isDark}
                  detail={`${stats.readableCount.toLocaleString('fa-IR')}/${stats.totalFiles.toLocaleString('fa-IR')}`}
                />,
              );
            }
            return rows;
          })()}
        </div>
      </div>

      {/* Section 3 — standards compliance */}
      <div>
        <SectionTitle
          title="انطباق با استانداردهای تحلیل ادعا"
          subtitle="بررسی می‌کند مستندات با استانداردهای تحلیل ادعا مطابقت دارند."
          isDark={isDark}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Row label="Linked Logic در برنامه" status={toStatus(stats.hasSchedule)} isDark={isDark} />
          <Row label="قابل پردازش متنی بودن اسناد" status={toStatus(stats.allReadable)} isDark={isDark} />
        </div>
      </div>
    </div>
  );
};

export default DocumentQualityPanel;
