import React, { useCallback, useMemo, useState } from 'react';
import type { ProcessedFile } from '../../types';
import { getScheduleStatus } from '../../utils/scheduleMethods';
import {
  TECH_METHODS,
  isTechMethodAvailable,
  missingForTechMethod,
  EMPTY_SUMMARY,
  type TechMethodId,
} from '../../utils/delayMethods';
import { recomputeSummary, type DelayEvent } from '../../utils/delayEvents';
import { runAi, AI_ERROR_MESSAGE } from '../../utils/aiErrors';
import { analyzeLegalDocuments } from '../../services/geminiService';
import DelaySummaryPanel from './DelaySummaryPanel';
import FinancialDelayTab from './FinancialDelayTab';
import DelayEventCard from './DelayEventCard';
import DelayEventForm from './DelayEventForm';
import CategoryBreakdown from './CategoryBreakdown';
import StickyActionBar from './StickyActionBar';
import DocumentQualityPanel from './DocumentQualityPanel';
import type { FinancialDelayRow } from '../../utils/financialDelay';
import { generateDelayPdf, generateDelayDocx } from '../../utils/pdfReport';

export interface DelayDaysSummary {
  excusable: number;
  nonExcusable: number;
  excusableCompensable: number;
  excusableNonCompensable: number;
}

interface Props {
  files: ProcessedFile[];
  isDark: boolean;
  onBack: () => void;
  onGenerateReport?: () => void;
  onGoToDamage?: (days: DelayDaysSummary) => void;
  onFinancialRowsChange?: (rows: FinancialDelayRow[]) => void;
}

type TabKey = 'technical' | 'financial';

const DOCUMENT_CATEGORIES = ['مکاتبات', 'قراردادها/صورتجلسات', 'گزارشات پیشرفت', 'برنامه‌ها', 'سایر'];

const DelayAnalysisPage: React.FC<Props> = ({
  files, isDark, onBack, onGenerateReport, onGoToDamage, onFinancialRowsChange,
}) => {
  const [tab, setTab] = useState<TabKey>('technical');
  const [selectedMethod, setSelectedMethod] = useState<TechMethodId | null>(null);
  const [events, setEvents] = useState<DelayEvent[]>([]);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [docxLoading, setDocxLoading] = useState(false);
  

  // Concurrent-delay configuration (visible only for technical tab; ignored for Gantt)
  const [concurrentEnabled, setConcurrentEnabled] = useState(true);
  const [concurrentMinOverlapDays, setConcurrentMinOverlapDays] = useState(1);
  const [concurrentScope, setConcurrentScope] = useState<'all' | 'criticalOnly'>('all');

  const scheduleStatus = useMemo(() => getScheduleStatus(files), [files]);
  const hasContract = useMemo(() => files.some((f) => /قرارداد/.test(f.category)), [files]);

  // Recompute summary only — never mutate events / delay_type
  const summary = useMemo(() => {
    if (events.length === 0) return EMPTY_SUMMARY;
    const base = { ...EMPTY_SUMMARY, ...recomputeSummary(events, selectedMethod) };
    if (!concurrentEnabled) base.concurrent = 0;
    return base;
  }, [events, selectedMethod, concurrentEnabled]);

  const handleMethodChange = useCallback((id: TechMethodId) => {
    // INVARIANT: only the active method changes. Do NOT touch events[] or delayType.
    setSelectedMethod(id);
  }, []);

  const isGantt = selectedMethod === 'GANTT';

  // AI pipeline: run over ALL document categories (not only letters)
  const runFullAnalysis = useCallback(async () => {
    setAiRunning(true);
    setAiError(null);
    setAiResult(null);
    const res = await runAi(() => analyzeLegalDocuments(files, {
      focusKeywords: '',
      specificSections: selectedMethod ? `روش تحلیل منتخب: ${selectedMethod}` : '',
      excludeSections: '',
      strictMode: false,
      strategy: 'balanced',
      modelPreference: 'auto',
      minConfidence: 70,
      verbosity: 'standard',
      requireCitations: true,
    }, 'DELAY'));
    setAiRunning(false);
    if (!res.ok) { setAiError(res.error ?? AI_ERROR_MESSAGE); return; }
    setAiResult(res.data ? `> **مدل تحلیل‌گر:** ${res.data.modelLabel}\n\n${res.data.markdown}` : null);
  }, [files, selectedMethod]);

  // Activities derived from uploaded schedule files (baseline / intermediate / as-built).
  // We do a lightweight parse of textContent when available; for binary files we fall
  // back to one entry per file so the user can still link rows manually.
  const activities = useMemo(() => {
    const scheduleFiles = files.filter((f) => /برنامه/.test(f.category));
    const out: Array<{ id: string; name: string }> = [];
    const seen = new Set<string>();
    scheduleFiles.forEach((f, fi) => {
      const text = f.textContent?.trim();
      if (text) {
        const lines = text
          .split(/\r?\n/)
          .map((l) => l.replace(/\s+/g, ' ').trim())
          .filter((l) => l.length >= 3 && l.length <= 120);
        lines.slice(0, 200).forEach((l, i) => {
          if (seen.has(l)) return;
          seen.add(l);
          out.push({ id: `act-${fi}-${i}`, name: l });
        });
      } else {
        const name = f.file?.name ?? `برنامه ${fi + 1}`;
        out.push({ id: `act-file-${fi}`, name: `${name} — کل فعالیت‌ها` });
      }
    });
    return out;
  }, [files]);

  const tabBtn = (key: TabKey, label: string) => {
    const active = tab === key;
    return (
      <button
        onClick={() => setTab(key)}
        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
          active
            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
            : isDark ? 'bg-slate-800/60 text-slate-300 hover:bg-slate-800' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-5 pb-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>تحلیل تاخیرات</h2>
        <button
          onClick={onBack}
          className={`text-xs font-bold px-3 py-2 rounded-lg border ${
            isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          بازگشت
        </button>
      </div>

      <div className="flex gap-2">
        {tabBtn('technical', 'تحلیل فنی')}
        {tabBtn('financial', 'تحلیل مالی')}
      </div>

      {tab === 'technical' && (
        <>
          {/* 1) Methods grid — must be first so prerequisites adapt to the chosen method */}
          <div className={`rounded-2xl border p-4 ${isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-slate-200/70 shadow-sm'}`}>
            <div className={`text-xs font-bold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>۸ روش تحلیل فنی تاخیرات</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TECH_METHODS.map((m) => {
                const enabled = isTechMethodAvailable(m, scheduleStatus, hasContract);
                const missing = missingForTechMethod(m, scheduleStatus, hasContract);
                const active = selectedMethod === m.id;
                return (
                  <button
                    key={m.id}
                    disabled={!enabled}
                    onClick={() => enabled && handleMethodChange(m.id)}
                    title={enabled ? `${m.faName} — فعال` : `نیازمند: ${missing.join(' · ')}`}
                    className={`text-right rounded-xl border p-3 transition-all ${
                      !enabled
                        ? isDark ? 'bg-slate-800/30 border-slate-700/40 text-slate-500 opacity-60 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70 cursor-not-allowed'
                        : active
                          ? isDark ? 'bg-violet-500/15 border-violet-500/50 text-violet-200' : 'bg-violet-50 border-violet-300 text-violet-800'
                          : isDark ? 'bg-slate-800/50 border-slate-700/50 text-slate-200 hover:border-violet-500/40' : 'bg-white border-slate-200 text-slate-800 hover:border-violet-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700/60 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                          {m.index.toLocaleString('fa-IR')}
                        </span>
                        <span className="font-bold text-sm">{m.faName}</span>
                        {m.enName !== '—' && <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.enName}</span>}
                      </div>
                      {!enabled && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-rose-500/15 text-rose-300' : 'bg-rose-50 text-rose-600'}`}>غیرفعال</span>}
                    </div>
                    <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{m.keyFeature}</div>
                  </button>
                );
              })}
            </div>
            <div className={`mt-4 text-[11px] rounded-lg border px-3 py-2 ${isDark ? 'bg-slate-800/40 border-slate-700/50 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              توجه: انتخاب روش، پیش‌نیازها و انطباق با استانداردهای تحلیل را در پایین به‌روز می‌کند.
            </div>
          </div>

          {/* 2) Prerequisites & standards (driven by selected method) */}
          <DocumentQualityPanel files={files} isDark={isDark} selectedMethod={selectedMethod} />

          {/* 3) Concurrent-delay configuration */}
          <div className={`rounded-2xl border p-4 ${isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-slate-200/70 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>تنظیمات تاخیرات همزمان</div>
                <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  ویژگی‌های شناسایی تاخیرات همزمان را برای تحلیل تعیین کنید.
                </div>
              </div>
              <label className={`inline-flex items-center gap-2 text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                <input
                  type="checkbox"
                  checked={concurrentEnabled && !isGantt}
                  disabled={isGantt}
                  onChange={(e) => setConcurrentEnabled(e.target.checked)}
                />
                فعال‌سازی تحلیل تاخیرات همزمان
              </label>
            </div>

            {isGantt && (
              <div className={`rounded-lg border-2 px-3 py-2 text-[11px] font-bold ${
                isDark ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800'
              }`}>
                ⚠ روش گانت چارت از تحلیل تاخیرات همزمان پشتیبانی نمی‌کند.
              </div>
            )}

            {!isGantt && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>حداقل روزهای هم‌پوشانی</span>
                  <input
                    type="number" min={1}
                    value={concurrentMinOverlapDays}
                    onChange={(e) => setConcurrentMinOverlapDays(Math.max(1, Number(e.target.value) || 1))}
                    className={`w-20 text-center text-xs font-bold rounded-md border px-2 py-1 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'}`}
                  />
                </label>
                <label className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>دامنه بررسی همزمانی</span>
                  <select
                    value={concurrentScope}
                    onChange={(e) => setConcurrentScope(e.target.value as 'all' | 'criticalOnly')}
                    className={`text-xs font-bold rounded-md border px-2 py-1 ${isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-300 text-slate-800'}`}
                  >
                    <option value="all">همه رویدادها</option>
                    <option value="criticalOnly">فقط مسیر بحرانی</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          {/* 4) Live results summary */}
          <DelaySummaryPanel summary={summary} isDark={isDark} />

          {/* 5) Per-category breakdown */}
          <CategoryBreakdown events={events} isDark={isDark} />

          {/* 6) Event list */}
          {events.length > 0 && (
            <div className="space-y-3">
              <div className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>رویدادهای تاخیر ({events.length.toLocaleString('fa-IR')})</div>
              {events.map((evt) => (
                <DelayEventCard
                  key={evt.id} event={evt} isDark={isDark}
                  onChange={(updated) => setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))}
                />
              ))}
            </div>
          )}

          {/* 7) Manual entry */}
          <DelayEventForm
            isDark={isDark}
            selectedMethodId={selectedMethod}
            activities={activities}
            onAdd={(evt) => setEvents((prev) => [...prev, evt])}
          />

          {/* 8) AI pipeline — runs AFTER user configures method, prerequisites, and settings */}
          <div className={`rounded-2xl border p-4 ${isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-slate-200/70 shadow-sm'}`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>اجرای تحلیل هوشمند اسناد</div>
                <div className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  پس از تعیین روش و تنظیمات بالا، با کلیک بر روی دکمه، تحلیل اجرا و نتیجه در همین صفحه نمایش داده می‌شود.
                </div>
                <div className={`text-[10px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                  بررسی همه دسته‌ها: {DOCUMENT_CATEGORIES.join(' · ')}
                </div>
              </div>
              <button
                onClick={runFullAnalysis} disabled={aiRunning || files.length === 0 || !selectedMethod}
                title={!selectedMethod ? 'ابتدا روش تحلیل را در بالای صفحه انتخاب کنید' : ''}
                className={`text-xs font-bold px-4 py-2 rounded-lg text-white ${aiRunning || files.length === 0 || !selectedMethod ? 'bg-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-indigo-600'}`}
              >
                {aiRunning ? 'در حال پردازش...' : 'اجرای تحلیل'}
              </button>
            </div>
            {aiError && (
              <div className={`rounded-lg border-2 px-3 py-3 flex items-start justify-between gap-3 ${isDark ? 'bg-rose-500/10 border-rose-500/40 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-800'}`}>
                <div className="text-xs font-bold leading-6">
                  {aiError}
                  <div className={`mt-1 text-[10px] font-medium ${isDark ? 'text-rose-200/75' : 'text-rose-700/75'}`}>
                    برای فایل‌های حجیم، ابتدا دسته‌های اصلی مثل قراردادها، مکاتبات و گزارش‌های پیشرفت را تحلیل کنید و سپس فایل‌های برنامه زمان‌بندی/تصاویر را اضافه کنید.
                  </div>
                </div>
                <button onClick={runFullAnalysis} className={`text-[11px] font-bold px-3 py-1.5 rounded-lg ${isDark ? 'bg-rose-500/20 hover:bg-rose-500/30' : 'bg-white hover:bg-rose-100 border border-rose-300'}`}>
                  تلاش مجدد
                </button>
              </div>
            )}
            {aiResult && !aiError && (
              <div className={`mt-3 rounded-lg border ${isDark ? 'bg-slate-800/40 border-slate-700/50' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`px-3 py-2 border-b text-[11px] font-bold ${isDark ? 'border-slate-700/50 text-slate-200' : 'border-slate-200 text-slate-700'}`}>
                  گزارش تحلیل فنی تاخیرات
                </div>
                <div className={`px-3 py-3 text-[12px] leading-7 whitespace-pre-wrap ${isDark ? 'text-slate-200' : 'text-slate-800'}`} dir="rtl">
                  {aiResult}
                </div>
              </div>
            )}
            {!aiResult && !aiError && !aiRunning && (
              <div className={`text-[11px] mt-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                پس از پایان تحلیل، می‌توانید با استفاده از نوار پایین صفحه، گزارش PDF قابل ویرایش را دریافت کنید.
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'financial' && (
        <FinancialDelayTab isDark={isDark} onRowsChange={onFinancialRowsChange} />
      )}

      <StickyActionBar
        isDark={isDark}
        onRunAnalysis={runFullAnalysis}
        analysisRunning={aiRunning}
        onReport={async (scope) => {
          setReportLoading(true);
          try {
            const methodLabel = selectedMethod ? (TECH_METHODS.find((m) => m.id === selectedMethod)?.faName ?? '—') : '—';
            const scopedEvents =
              scope === 'both'
                ? events
                : events.filter((e) => e.delayType === scope);
            const scopeLabel =
              scope === 'excusable' ? 'فقط تاخیرات مجاز (خارج از قصور پیمانکار)'
              : scope === 'nonExcusable' ? 'فقط تاخیرات غیرمجاز (در قصور پیمانکار)'
              : 'هر دو نوع تاخیر (مجاز و غیرمجاز)';
            await generateDelayPdf({
              project: { projectName: 'پروژه', briefScope: scopeLabel } as any,
              methodLabel,
              summary: {
                excusable: scope === 'nonExcusable' ? 0 : summary.excusable,
                nonExcusable: scope === 'excusable' ? 0 : summary.nonExcusable,
                concurrent: summary.concurrent,
                excusableCompensable: scope === 'nonExcusable' ? 0 : summary.excusableCompensable,
                excusableNonCompensable: scope === 'nonExcusable' ? 0 : summary.excusableNonCompensable,
                critical: summary.critical, nonCritical: summary.nonCritical,
                originalEndDate: (summary as any).originalEndDate, newEndDate: (summary as any).newEndDate,
              },
              events: scopedEvents.map((e) => ({
                title: e.title, category: e.category, startDate: e.startDate, endDate: e.endDate,
                finalDurationDays: e.finalDurationDays, delayType: e.delayType,
              })),
            });
          } catch (err) { console.error(err); alert('خطا در تهیه گزارش PDF'); }
          finally { setReportLoading(false); }
        }}
        onReportDocx={async (scope) => {
          setDocxLoading(true);
          try {
            const methodLabel = selectedMethod ? (TECH_METHODS.find((m) => m.id === selectedMethod)?.faName ?? '—') : '—';
            const scopedEvents =
              scope === 'both' ? events : events.filter((e) => e.delayType === scope);
            const scopeLabel =
              scope === 'excusable' ? 'فقط تاخیرات مجاز (خارج از قصور پیمانکار)'
              : scope === 'nonExcusable' ? 'فقط تاخیرات غیرمجاز (در قصور پیمانکار)'
              : 'هر دو نوع تاخیر (مجاز و غیرمجاز)';
            await generateDelayDocx({
              project: { projectName: 'پروژه', briefScope: scopeLabel },
              methodLabel,
              summary: {
                excusable: scope === 'nonExcusable' ? 0 : summary.excusable,
                nonExcusable: scope === 'excusable' ? 0 : summary.nonExcusable,
                concurrent: summary.concurrent,
                excusableCompensable: scope === 'nonExcusable' ? 0 : summary.excusableCompensable,
                excusableNonCompensable: scope === 'nonExcusable' ? 0 : summary.excusableNonCompensable,
                critical: summary.critical, nonCritical: summary.nonCritical,
                originalEndDate: (summary as any).originalEndDate, newEndDate: (summary as any).newEndDate,
              },
              events: scopedEvents.map((e) => ({
                title: e.title, category: e.category, startDate: e.startDate, endDate: e.endDate,
                finalDurationDays: e.finalDurationDays, delayType: e.delayType,
              })),
            });
          } catch (err) { console.error(err); alert('خطا در تهیه فایل Word'); }
          finally { setDocxLoading(false); }
        }}
        onDamage={() => {
          // Aggregate analysis results into total DAYS (sum of finalDurationDays per bucket)
          // so the damage page receives meaningful, transferred values — not zeros.
          const sumDays = (filter: (e: typeof events[number]) => boolean) =>
            events.filter(filter).reduce((s, e) => s + (Number(e.finalDurationDays) || 0), 0);
          onGoToDamage?.({
            excusable: sumDays((e) => e.delayType === 'excusable'),
            nonExcusable: sumDays((e) => e.delayType === 'nonExcusable'),
            excusableCompensable: sumDays((e) => e.delayType === 'excusable' && (e as any).compensability === 'compensable'),
            excusableNonCompensable: sumDays((e) => e.delayType === 'excusable' && (e as any).compensability === 'nonCompensable'),
          });
        }}
        onDashboard={onBack}
        reportLoading={reportLoading}
        docxLoading={docxLoading}
      />

    </div>
  );
};

export default DelayAnalysisPage;
