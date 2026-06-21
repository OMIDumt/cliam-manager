import React, { useMemo, useState } from 'react';
import type { ProcessedFile } from '../../types';
import {
  SCHEDULE_TITLES,
  getScheduleStatus,
  METHOD_SCHEDULE_REQUIREMENTS,
  isMethodAvailable,
  type DelayMethodKey,
} from '../../utils/scheduleMethods';
import ReportChatbot from '../ReportChatbot';

type DashPage =
  | 'main'
  | 'subscription'
  | 'delay'
  | 'damage-gateway'
  | 'damage'
  | 'knowledge';

interface ProjectHistoryItem {
  id: string;
  name: string;
  createdAt: number;
  fileCount: number;
  hasReport: boolean;
}

interface Props {
  files: ProcessedFile[];
  isDark: boolean;
  onNavigate: (page: DashPage) => void;
  onScrollToUploader?: () => void;
  onStartFullAnalysis?: () => void;
  /** Final analysis report (markdown) — when present, AI chat is enabled */
  result?: string | null;
  analysisType?: string;
  /** Remove a single uploaded file */
  onRemoveFile?: (id: string) => void;
  /** Clear ALL uploaded files (keep project state) */
  onClearAllFiles?: () => void;
  /** Reset entire workspace to a fresh project */
  onNewProject?: () => void;
  /** Saved previous projects (in-memory history) */
  projectHistory?: ProjectHistoryItem[];
  /** Restore a project from history */
  onRestoreProject?: (id: string) => void;
  /** Delete a project from history */
  onDeleteProject?: (id: string) => void;
  /** Name of current project (displayed in history menu) */
  currentProjectName?: string;
}

/* ─────────────────────────── Mock adapters ─────────────────────────── */
type ActionType = 'RFI' | 'CONTRACT' | 'DELAY' | 'UPLOAD' | 'REPORT' | 'PAYMENT';
type Priority = 'high' | 'med' | 'low';
interface ActionItem {
  id: string;
  title: string;
  type: ActionType;
  due: string; // ISO
  priority: Priority;
  status: 'overdue' | 'soon' | 'blocked';
  target: DashPage;
}
const TYPE_LABEL: Record<ActionType, string> = {
  RFI: 'پرسش/پاسخ فنی',
  CONTRACT: 'رویداد قراردادی',
  DELAY: 'بازبینی تأخیر',
  UPLOAD: 'سند ضروری',
  REPORT: 'گزارش در انتظار',
  PAYMENT: 'تأخیر پرداخت',
};
const TYPE_COLOR: Record<ActionType, string> = {
  RFI: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
  CONTRACT: 'bg-indigo-500/15 text-indigo-300 border-indigo-400/30',
  DELAY: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  UPLOAD: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/30',
  REPORT: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  PAYMENT: 'bg-red-500/15 text-red-300 border-red-400/30',
};

const todayMinus = (d: number) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  return t.toISOString();
};
const todayPlus = (d: number) => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  return t.toISOString();
};

function buildActions(
  files: ProcessedFile[],
  blocked: number,
  hasReport: boolean,
  analysisType?: string,
): ActionItem[] {
  const items: ActionItem[] = [];
  // No files = no actionable items yet (project not "activated" with documents)
  if (files.length === 0) return items;

  // ── Derived from uploaded documents (real project state) ──
  const hasContract = files.some((f) => f.category === 'قراردادها/الحاقیه‌ها/متمم‌ها/صورتجلسات/دستورکارها');
  const hasCorr = files.some((f) => f.category === 'مکاتبات');
  const hasBaseline = files.some((f) => f.category === 'برنامه زمان‌بندی اولیه');
  const hasAsBuilt = files.some((f) => f.category === 'برنامه زمان‌بندی چون‌ساخت (As-Built)');
  const hasProgress = files.some((f) => f.category === 'گزارشات پیشرفت/روزانه/هفتگی/ماهانه');
  const hasPayments = files.some((f) => f.category === 'صورت‌وضعیت' || f.category === 'مالی');

  if (!hasContract) items.push({ id: 'doc-contract', title: 'بارگذاری قرارداد اصلی پروژه', type: 'UPLOAD', due: todayMinus(2), priority: 'high', status: 'overdue', target: 'main' });
  if (!hasCorr) items.push({ id: 'doc-corr', title: 'بارگذاری مکاتبات کلیدی پروژه', type: 'UPLOAD', due: todayPlus(3), priority: 'med', status: 'soon', target: 'main' });
  if (!hasBaseline) items.push({ id: 'doc-baseline', title: 'بارگذاری برنامه زمان‌بندی اولیه (Baseline)', type: 'UPLOAD', due: todayPlus(1), priority: 'high', status: 'soon', target: 'main' });
  if (hasBaseline && !hasAsBuilt) items.push({ id: 'doc-asbuilt', title: 'بارگذاری برنامه چون‌ساخت برای تحلیل دقیق‌تر', type: 'UPLOAD', due: todayPlus(7), priority: 'low', status: 'soon', target: 'main' });
  if (!hasProgress) items.push({ id: 'doc-progress', title: 'بارگذاری گزارش‌های پیشرفت دوره‌ای', type: 'UPLOAD', due: todayPlus(5), priority: 'med', status: 'soon', target: 'main' });

  // ── Derived from analysis state ──
  if (!hasReport && hasContract) {
    items.push({ id: 'an-run', title: 'اجرای تحلیل جامع روی اسناد بارگذاری‌شده', type: 'REPORT', due: todayPlus(0), priority: 'high', status: 'soon', target: 'main' });
  }
  if (hasReport) {
    items.push({ id: 'an-review', title: 'بازبینی نتایج تحلیل و تأیید رویدادهای تأخیر', type: 'DELAY', due: todayPlus(2), priority: 'high', status: 'soon', target: 'delay' });
    if (analysisType !== 'DAMAGE') {
      items.push({ id: 'an-damage', title: 'برآورد ضرر و زیان بر اساس تأخیرات شناسایی‌شده', type: 'PAYMENT', due: todayPlus(5), priority: 'med', status: 'soon', target: 'damage-gateway' });
    }
  }
  if (blocked > 0) {
    items.push({ id: 'sched-blocked', title: `${blocked} روش تحلیل تأخیر مسدود است (نیازمند برنامه زمان‌بندی)`, type: 'CONTRACT', due: todayPlus(7), priority: 'low', status: 'blocked', target: 'delay' });
  }
  return items;
}

/* ──────────────────────────── Helpers ──────────────────────────────── */
const fmtPersianDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
};
const daysFromNow = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);

/* ──────────────────────────── Component ────────────────────────────── */
const ControlCenter: React.FC<Props> = ({ files, isDark, onNavigate, onScrollToUploader, onStartFullAnalysis, result, analysisType, onRemoveFile, onClearAllFiles, onNewProject, projectHistory = [], onRestoreProject, onDeleteProject, currentProjectName }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showFilesPanel, setShowFilesPanel] = useState(false);
  const [confirmReset, setConfirmReset] = useState<null | 'clear' | 'project'>(null);
  const [highlightQuote, setHighlightQuote] = useState<string>('');
  const hasReport = !!(result && result.trim().length > 0);
  // highlightQuote is retained for future cross-component highlight wiring;
  // currently consumed when scrolling to the unified ResultsDisplay panel.
  void highlightQuote;

  const scrollToReport = () => {
    const el = document.getElementById('results-display-anchor');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCitationClick = (quote: string) => {
    if (!quote) return;
    setHighlightQuote(quote);
    setShowAiChat(false);
    setTimeout(scrollToReport, 80);
  };

  // Inline report rendering removed — delegated to the unified ResultsDisplay
  // panel below; highlightQuote is kept for future cross-panel highlight wiring.
  const sched = useMemo(() => getScheduleStatus(files), [files]);
  const methods = Object.keys(METHOD_SCHEDULE_REQUIREMENTS) as DelayMethodKey[];
  const blockedMethods = methods.filter((m) => !isMethodAvailable(m, sched)).length;

  const coverage = useMemo(() => {
    const cat = (name: string) => files.filter((f) => f.category === name).length;
    // Category titles must match those defined in FileUploader.tsx
    return {
      contract: cat('قراردادها/الحاقیه‌ها/متمم‌ها/صورتجلسات/دستورکارها') > 0,
      baseline: sched.baseline_schedule.uploaded,
      intermediate: sched.intermediate_schedule.count,
      asbuilt: sched.as_built_schedule.uploaded,
      corr: cat('مکاتبات') > 0,
      reports: cat('گزارشات پیشرفت/روزانه/هفتگی/ماهانه') > 0,
    };
  }, [files, sched]);

  const allActions = useMemo(() => buildActions(files, blockedMethods, hasReport, analysisType), [files, blockedMethods, hasReport, analysisType]);
  const [actionFilter, setActionFilter] = useState<'all' | 'overdue' | 'soon' | 'blocked'>('all');
  const [actionQuery, setActionQuery] = useState('');
  const filteredActions = useMemo(() => {
    return allActions.filter((a) => {
      if (actionFilter !== 'all' && a.status !== actionFilter) return false;
      if (actionQuery.trim() && !a.title.includes(actionQuery.trim())) return false;
      return true;
    });
  }, [allActions, actionFilter, actionQuery]);

  const overdueCount = allActions.filter((a) => a.status === 'overdue').length;
  const soonCount = allActions.filter((a) => a.status === 'soon').length;

  // Weekly insights — derived from analysis report + uploaded documents.
  // Strategy:
  //  1) If a final report exists, try to mine the top delay drivers from
  //     it (lines that mention "+N روز" / "X روز تأخیر" etc.).
  //  2) Otherwise fall back to a project-state diagnostic (what is
  //     missing / what to do next).
  const weeklyInsights = useMemo(() => {
    const items: { text: string; impact?: string; tone: 'amber' | 'red' | 'emerald' | 'slate' }[] = [];
    if (hasReport && result) {
      const text = result;
      // pattern: "... — اثر +12 روز" / "+۱۲ روز" / "12 روز تأخیر"
      const reDay = /([+\-]?\s*[\d۰-۹]{1,4})\s*روز/g;
      const scored: { line: string; days: number }[] = [];
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0 && l.length < 260);
      const toEn = (s: string) => s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
      for (const ln of lines) {
        let m: RegExpExecArray | null;
        let maxDays = 0;
        reDay.lastIndex = 0;
        while ((m = reDay.exec(ln)) !== null) {
          const n = Math.abs(parseInt(toEn(m[1].replace(/\s/g, '')), 10));
          if (Number.isFinite(n) && n > maxDays && n <= 3650) maxDays = n;
        }
        if (maxDays > 0 && /(تأخیر|تاخیر|اثر|دستور تغییر|ادعا|claim|delay)/i.test(ln)) {
          scored.push({ line: ln.replace(/^[\-\*•\d\.\)\s]+/, ''), days: maxDays });
        }
      }
      scored.sort((a, b) => b.days - a.days);
      const seen = new Set<string>();
      for (const s of scored) {
        const key = s.line.slice(0, 60);
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({ text: s.line.length > 140 ? s.line.slice(0, 140) + '…' : s.line, impact: `+${s.days.toLocaleString('fa-IR')} روز`, tone: 'amber' });
        if (items.length >= 3) break;
      }
      if (items.length === 0) {
        items.push({ text: 'گزارش تحلیل آماده است؛ محرک‌های اصلی قابل استخراج خودکار از متن یافت نشد. برای جزئیات گزارش را مرور کنید.', tone: 'emerald' });
      }
    } else if (files.length === 0) {
      items.push({ text: 'هنوز سندی آپلود نشده است؛ برای فعال‌سازی بینش هفته، اسناد پروژه را بارگذاری کنید.', tone: 'slate' });
    } else {
      if (!coverage.contract) items.push({ text: 'قرارداد پروژه بارگذاری نشده — مرجع اولویت‌دار شناسایی تأخیرات و ادعاها.', tone: 'red' });
      if (!coverage.baseline) items.push({ text: 'برنامه زمان‌بندی اولیه (Baseline) موجود نیست — بدون آن پیش‌بینی پایان امکان‌پذیر نیست.', tone: 'red' });
      if (!coverage.corr) items.push({ text: 'مکاتبات پروژه بارگذاری نشده — منبع اصلی اثبات علت و تاریخ تأخیرات.', tone: 'amber' });
      if (items.length < 3 && !hasReport) items.push({ text: 'پس از تنظیم ویژگی‌های تحلیل، گزارش جامع را اجرا کنید تا محرک‌های هفته استخراج شوند.', tone: 'amber' });
      if (items.length < 3 && coverage.intermediate === 0) items.push({ text: 'برنامه‌های زمان‌بندی به‌روز (میانی) موجود نیست — مانع از روش‌های TIA/WA.', tone: 'amber' });
    }
    return items.slice(0, 3);
  }, [hasReport, result, files.length, coverage]);

  // Project health
  const healthScore = (coverage.contract ? 1 : 0) + (coverage.baseline ? 1 : 0) + (coverage.corr ? 1 : 0) + (overdueCount === 0 ? 1 : 0);
  const health = healthScore >= 3 ? { label: 'سالم', tone: 'emerald' } : healthScore === 2 ? { label: 'نیازمند توجه', tone: 'amber' } : { label: 'بحرانی', tone: 'red' };

  // End-date trend (mock)
  const initialEnd = '2025-12-20T00:00:00.000Z';
  const forecastEnd = '2026-02-14T00:00:00.000Z';
  const slipDays = daysFromNow(forecastEnd) - daysFromNow(initialEnd);

  // Card chrome
  const card = `rounded-2xl border ${isDark ? 'bg-slate-900/70 border-slate-700/60' : 'bg-white/95 border-slate-200'} backdrop-blur-md shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)] hover:shadow-[0_8px_32px_-8px_rgba(99,102,241,0.18)] transition-shadow duration-300`;
  const muted = isDark ? 'text-slate-400' : 'text-slate-500';
  const heading = isDark ? 'text-white' : 'text-slate-900';

  /* ─── Evidence Graph (derived from uploaded files) ─── */
  const evidenceData = useMemo(() => {
    const byCategory = files.reduce<Record<string, number>>((acc, f) => {
      const key = f.category || 'سایر';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const cats = Object.entries(byCategory);
    if (cats.length === 0) {
      return { nodes: [] as { id: string; label: string; x: number; y: number; kind: string; count?: number }[], links: [] as [string, string][] };
    }
    const centerX = 60;
    const centerY = 120;
    const rightX = 320;
    const step = cats.length > 1 ? 200 / (cats.length - 1) : 0;
    const startY = cats.length > 1 ? 20 : 120;
    const nodes = [
      { id: 'project', label: 'پروژه شما', x: centerX, y: centerY, kind: 'delay' as const },
      ...cats.map(([cat, count], i) => ({
        id: `c${i}`,
        label: `${cat} (${count})`,
        x: rightX,
        y: startY + step * i,
        kind: 'doc' as const,
        count,
      })),
    ];
    const links: [string, string][] = cats.map((_, i) => ['project', `c${i}`]);
    return { nodes, links };
  }, [files]);
  const evidenceNodes = evidenceData.nodes;
  const evidenceLinks = evidenceData.links;
  const nodeColor = (kind: string) =>
    kind === 'delay' ? '#f59e0b' : kind === 'doc' ? '#818cf8' : '#34d399';

  return (
    <section className="grid grid-cols-12 gap-5 lg:gap-6 mb-8" dir="rtl">
      {/* ───────────── A) HERO ───────────── */}
      <div className={`col-span-12 ${card} p-6 md:p-8 relative overflow-hidden`}>
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-16 -right-10 w-72 h-72 bg-fuchsia-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Health + title */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] font-black tracking-[0.3em] uppercase ${muted}`}>operational control center</span>
            </div>
            <h1 className={`text-2xl md:text-3xl font-black ${heading} leading-tight`}>
              مرکز کنترل پروژه
            </h1>
            <p className={`mt-2 text-sm ${muted}`}>
              نمای زنده از سلامت پروژه، اقدامات لازم و کیفیت اسناد در یک نگاه.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 border bg-gradient-to-l from-transparent"
                 style={{ borderColor: `var(--tw-${health.tone})` }}>
              <span className={`w-2 h-2 rounded-full bg-${health.tone}-500 animate-pulse`} />
              <span className={`text-xs font-bold text-${health.tone}-${isDark ? '300' : '700'}`}>وضعیت: {health.label}</span>
            </div>
          </div>

          {/* End-date trend — only shown when baseline schedule uploaded */}
          {coverage.baseline ? (
            <div className="lg:col-span-4 grid grid-cols-2 gap-3">
              <div className={`rounded-xl p-3 ${isDark ? 'bg-slate-800/60' : 'bg-slate-50'} border ${isDark ? 'border-slate-700/50' : 'border-slate-200'}`}>
                <div className={`text-[10px] font-bold uppercase ${muted}`}>پایان اولیه</div>
                <div className={`text-sm font-black mt-1 ${heading}`}>{fmtPersianDate(initialEnd)}</div>
              </div>
              <div className={`rounded-xl p-3 ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'} border border-amber-400/40`}>
                <div className={`text-[10px] font-bold uppercase text-amber-${isDark ? '300' : '700'}`}>پیش‌بینی فعلی</div>
                <div className={`text-sm font-black mt-1 text-amber-${isDark ? '200' : '800'} flex items-center gap-1`}>
                  {fmtPersianDate(forecastEnd)}
                  <span className="text-[10px]">▲ {slipDays} روز</span>
                </div>
              </div>
            </div>
          ) : (
            <div className={`lg:col-span-4 rounded-xl p-4 border border-dashed ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-300 bg-slate-50/50'} flex flex-col items-center justify-center text-center`}>
              <div className={`text-xs font-bold ${heading}`}>پیش‌بینی پایان پروژه</div>
              <div className={`text-[10px] ${muted} mt-1`}>برای محاسبه، برنامه زمان‌بندی پایه (Baseline) را آپلود کنید</div>
            </div>
          )}

          {/* Risk counters — only when there are actions to count */}
          {allActions.length > 0 ? (
            <div className="lg:col-span-3 grid grid-cols-3 gap-2">
              {[
                { v: overdueCount, l: 'معوق', full: 'اقدامات معوق (سررسید گذشته و انجام‌نشده)', c: 'red' },
                { v: soonCount, l: '۷ روز آینده', full: 'اقدامات با سررسید در ۷ روز آینده', c: 'amber' },
                { v: blockedMethods, l: 'مسدود', full: 'روش‌های تحلیل تأخیر مسدود به‌دلیل نبود برنامه زمان‌بندی لازم', c: 'slate' },
              ].map((r) => (
                <div key={r.l} title={r.full} className={`rounded-xl text-center p-2 border ${isDark ? `bg-${r.c}-500/10 border-${r.c}-500/30` : `bg-${r.c}-50 border-${r.c}-200`}`}>
                  <div className={`text-2xl font-black text-${r.c}-${isDark ? '300' : '700'}`}>{r.v}</div>
                  <div className={`text-[10px] font-bold ${muted} leading-tight`}>{r.l}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`lg:col-span-3 rounded-xl p-4 border border-dashed ${isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-300 bg-slate-50/50'} flex items-center justify-center text-center`}>
              <div className={`text-[11px] ${muted}`}>کارت ریسک‌ها پس از فعال‌سازی پروژه و آپلود اسناد فعال می‌شود</div>
            </div>
          )}
        </div>

        {/* Project Selector — list of saved projects + current */}
        {(projectHistory.length > 0 || files.length > 0) && (
          <div className={`relative mt-6 rounded-xl border p-3 ${isDark ? 'bg-slate-900/40 border-slate-700/60' : 'bg-slate-50/80 border-slate-200'}`}>
            <div className={`flex items-center justify-between mb-2`}>
              <span className={`text-[11px] font-black uppercase tracking-wider ${muted}`}>پروژه‌های شما</span>
              <span className={`text-[10px] ${muted}`}>برای فعال‌سازی روی پروژه کلیک کنید</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {files.length > 0 && (
                <div className={`px-3 py-2 rounded-lg border-2 text-xs font-bold ${isDark ? 'bg-indigo-500/15 border-indigo-400/60 text-indigo-200' : 'bg-indigo-50 border-indigo-400 text-indigo-800'}`}>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ml-1.5 animate-pulse" />
                  {currentProjectName || 'پروژه فعلی'} · {files.length.toLocaleString('fa-IR')} سند
                </div>
              )}
              {projectHistory.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onRestoreProject?.(p.id)}
                  className={`px-3 py-2 rounded-lg border text-xs font-bold transition ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-200 hover:bg-slate-700/70' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'}`}
                  title={`بازیابی پروژه «${p.name}»`}
                >
                  📁 {p.name} · {p.fileCount.toLocaleString('fa-IR')} سند
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CTAs */}
        <div className="relative mt-6 flex flex-wrap gap-3 items-center">
          <button
            onClick={() => onNavigate('delay')}
            disabled={files.length === 0}
            title={files.length === 0 ? 'ابتدا اسناد پروژه را آپلود کنید تا تحلیل تأخیرات فعال شود' : 'ورود به ماژول تحلیل تأخیرات'}
            className={`px-5 py-3 rounded-xl font-black text-sm text-white shadow-lg transition ${files.length === 0 ? 'bg-slate-400 cursor-not-allowed opacity-60 shadow-none' : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 shadow-violet-500/30 hover:scale-[1.02]'}`}
          >
            ▶ ادامه / شروع تحلیل تأخیرات
          </button>
          <button
            onClick={() => { onScrollToUploader?.(); }}
            className={`px-5 py-3 rounded-xl font-bold text-sm border ${isDark ? 'bg-slate-800/70 border-slate-600 text-slate-100 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-50'}`}
          >
            ⬆ آپلود سند
          </button>
          <button onClick={() => onNavigate('damage-gateway')} className={`px-4 py-3 rounded-xl text-xs font-bold ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
            + ثبت رویداد تأخیر
          </button>
          <button onClick={() => onStartFullAnalysis?.()} className={`px-4 py-3 rounded-xl text-xs font-bold ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
            📄 تولید گزارش
          </button>
          {files.length === 0 && (
            <span className={`text-[11px] ${muted}`}>برای شروع، ابتدا پروژه را با آپلود اسناد فعال کنید.</span>
          )}
        </div>
      </div>

      {/* ───────────── A2) AI on Final Report + Project Management ───────────── */}
      <div className={`col-span-12 ${card} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${hasReport ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30' : isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            </div>
            <div className="min-w-0">
              <h2 className={`text-base font-black ${heading}`}>هوش مصنوعی روی گزارش نهایی</h2>
              <p className={`text-xs ${muted}`}>
                {hasReport
                  ? `گزارش آماده است (${(result || '').length.toLocaleString('fa-IR')} کاراکتر) — پاسخ‌ها با استناد مستقیم به متن گزارش ارائه می‌شوند.`
                  : 'پس از اجرای تحلیل، می‌توانید با هوش مصنوعی درباره گزارش گفتگو کنید و پاسخ‌ها به متن گزارش استناد خواهند داشت.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAiChat(true)}
              disabled={!hasReport}
              className={`px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all duration-200 ${
                hasReport
                  ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/50 hover:scale-[1.03] active:scale-[0.98] ring-1 ring-white/10'
                  : isDark ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              گفت‌وگوی هوشمند با گزارش
            </button>
            <button
              onClick={scrollToReport}
              disabled={!hasReport}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition ${
                !hasReport
                  ? isDark ? 'bg-slate-800/40 text-slate-600 border-slate-700/50 cursor-not-allowed' : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  : isDark ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/20' : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              📄 مشاهده گزارش
            </button>
            <button
              onClick={() => setShowFilesPanel((v) => !v)}
              disabled={files.length === 0}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition ${
                files.length === 0
                  ? isDark ? 'bg-slate-800/40 text-slate-600 border-slate-700/50 cursor-not-allowed' : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                  : isDark ? 'bg-slate-800/70 text-slate-100 border-slate-600 hover:bg-slate-800' : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
              }`}
            >
              🗂 مدیریت اسناد ({files.length})
            </button>
          </div>
        </div>


        {showFilesPanel && files.length > 0 && (
          <div className={`mt-4 rounded-xl border ${isDark ? 'border-slate-700/60 bg-slate-900/40' : 'border-slate-200 bg-slate-50/60'} divide-y ${isDark ? 'divide-slate-700/50' : 'divide-slate-200/70'} max-h-72 overflow-y-auto`}>
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <span className="text-base">📄</span>
                <div className="flex-1 min-w-0">
                  <div className={`font-bold truncate ${heading}`}>{f.file.name}</div>
                  <div className={`text-[11px] ${muted} truncate`}>{f.category}</div>
                </div>
                <button
                  onClick={() => onRemoveFile?.(f.id)}
                  className="text-xs font-bold px-2 py-1 rounded-lg text-red-400 hover:bg-red-500/10 border border-red-500/30"
                  title="حذف این سند"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Inline report viewer removed — the single source of the report is the
            unified ResultsDisplay panel below (use «مشاهده گزارش» to scroll). */}



        {confirmReset && (
          <div className={`mt-4 rounded-xl border p-4 flex items-center justify-between gap-3 flex-wrap ${isDark ? 'bg-red-500/10 border-red-500/40' : 'bg-red-50 border-red-200'}`}>
            <div className="text-sm">
              <div className={`font-black ${isDark ? 'text-red-200' : 'text-red-800'}`}>
                {confirmReset === 'clear' ? 'حذف همه اسناد بارگذاری شده؟' : 'شروع یک پروژه جدید؟ همه اسناد، تحلیل‌ها و رویدادها پاک می‌شوند.'}
              </div>
              <div className={isDark ? 'text-red-300/80 text-xs mt-0.5' : 'text-red-700/80 text-xs mt-0.5'}>این عملیات قابل بازگشت نیست.</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (confirmReset === 'clear') onClearAllFiles?.();
                  else onNewProject?.();
                  setConfirmReset(null);
                  setShowFilesPanel(false);
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-black hover:bg-red-700"
              >
                تأیید و انجام
              </button>
              <button
                onClick={() => setConfirmReset(null)}
                className={`px-4 py-2 rounded-lg text-xs font-bold border ${isDark ? 'border-slate-600 text-slate-200 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
              >
                انصراف
              </button>
            </div>
          </div>
        )}
      </div>

      {showAiChat && hasReport && (
        <ReportChatbot
          reportContent={result || ''}
          analysisType={analysisType || 'FULL'}
          isOpen={showAiChat}
          onClose={() => setShowAiChat(false)}
          onCitationClick={handleCitationClick}
        />
      )}

      {/* ───────────── B) ACTION CENTER + INSIGHTS ───────────── */}
      <div className={`col-span-12 lg:col-span-8 ${card} p-5`}>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h2 className={`text-base font-black ${heading}`}>اقدامات پیشنهادی نرم‌افزار</h2>
            <p className={`text-xs ${muted} mt-0.5`}>
              فهرست خودکار اقدام‌هایی که بر اساس <b>اسناد بارگذاری‌شده</b> و <b>تحلیل‌های انجام‌شده</b> برای پیشبرد پرونده ادعا لازم است. با هر آپلود یا تحلیل جدید به‌روزرسانی می‌شود.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={actionQuery}
              onChange={(e) => setActionQuery(e.target.value)}
              placeholder="جستجو در اقدامات..."
              className={`text-xs px-3 py-1.5 rounded-lg border ${isDark ? 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-500/40`}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {([
            ['all', 'همه'], ['overdue', 'معوق'], ['soon', '۷ روز'], ['blocked', 'مسدود'],
          ] as const).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setActionFilter(k)}
              className={`text-[11px] font-bold px-3 py-1 rounded-full border transition ${
                actionFilter === k
                  ? 'bg-indigo-500 border-indigo-500 text-white'
                  : isDark ? 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>

        {filteredActions.length === 0 ? (
          <div className={`text-center py-10 rounded-xl border-2 border-dashed ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <p className={`text-sm ${muted} mb-3`}>اقدام فعالی یافت نشد 🎉</p>
            <div className="flex justify-center gap-2">
              <button onClick={onScrollToUploader} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-500 text-white">آپلود اسناد</button>
              <button onClick={() => onNavigate('delay')} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700">افزودن رویداد تأخیر</button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200/40 dark:divide-slate-700/40">
            {filteredActions.map((a) => {
              const d = daysFromNow(a.due);
              return (
                <li key={a.id} className="py-2.5 flex items-center gap-3">
                  <span className={`w-1.5 h-8 rounded-full ${a.priority === 'high' ? 'bg-red-500' : a.priority === 'med' ? 'bg-amber-500' : 'bg-slate-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold ${heading} truncate`}>{a.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${TYPE_COLOR[a.type]}`}>{TYPE_LABEL[a.type]}</span>
                      <span className={`text-[11px] ${a.status === 'overdue' ? 'text-red-400' : muted}`}>
                        {a.status === 'overdue' ? `${Math.abs(d)} روز معوق` : a.status === 'blocked' ? 'مسدود' : `${d} روز مانده`} · {fmtPersianDate(a.due)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate(a.target)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-400/40 hover:bg-indigo-500/25"
                  >
                    برو ←
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Evidence Graph + Insight */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-base font-black ${heading}`}>گراف شواهد</h2>
            <span className={`text-[10px] ${muted}`}>تأخیر ⟷ سند ⟷ فعالیت</span>
          </div>
          {evidenceNodes.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-44 text-center ${muted}`}>
              <span className="text-xs">هنوز سندی آپلود نشده است.</span>
              <span className="text-[10px] mt-1">با آپلود اسناد، گراف ارتباط آن‌ها با پروژه ساخته می‌شود.</span>
            </div>
          ) : (
            <svg viewBox="0 0 400 240" className="w-full h-44">
              {evidenceLinks.map(([a, b], i) => {
                const na = evidenceNodes.find((n) => n.id === a)!;
                const nb = evidenceNodes.find((n) => n.id === b)!;
                return <line key={i} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke={isDark ? '#475569' : '#cbd5e1'} strokeWidth="1.2" strokeDasharray="3 3" />;
              })}
              {evidenceNodes.map((n) => (
                <g key={n.id}>
                  <circle cx={n.x} cy={n.y} r={n.kind === 'delay' ? 11 : 8} fill={nodeColor(n.kind)} opacity={0.9} />
                  <text x={n.x} y={n.y + (n.kind === 'delay' ? 24 : 20)} textAnchor="middle" fontSize="9" fill={isDark ? '#cbd5e1' : '#475569'}>{n.label}</text>
                </g>
              ))}
            </svg>
          )}
          <div className="flex items-center justify-between text-[10px] mt-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> پروژه</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400" /> دسته اسناد</span>
            <span className={`font-bold ${evidenceNodes.length > 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {evidenceNodes.length === 0 ? 'بدون داده' : evidenceNodes.length > 3 ? 'قدرت: قوی' : 'قدرت: متوسط'}
            </span>
          </div>
        </div>

        <div className={`${card} p-5`}>
          <h2 className={`text-base font-black ${heading} mb-1`}>بینش هفته</h2>
          <p className={`text-xs ${muted} mb-3`}>
            {hasReport
              ? 'مهم‌ترین محرک‌های تأخیر استخراج‌شده از گزارش تحلیل اخیر.'
              : files.length === 0
                ? 'پس از آپلود اسناد و اجرای تحلیل، محرک‌های اصلی این‌جا نمایش داده می‌شوند.'
                : 'وضعیت آماده‌سازی پروژه برای تحلیل دقیق.'}
          </p>
          <ul className="space-y-2 text-xs">
            {weeklyInsights.length === 0 ? (
              <li className={`p-3 rounded-lg border text-center ${isDark ? 'bg-slate-800/40 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                داده‌ای برای نمایش وجود ندارد.
              </li>
            ) : (
              weeklyInsights.map((it, i) => {
                const toneColor =
                  it.tone === 'red' ? 'text-red-400' :
                  it.tone === 'emerald' ? 'text-emerald-400' :
                  it.tone === 'slate' ? (isDark ? 'text-slate-300' : 'text-slate-600') :
                  'text-amber-400';
                return (
                  <li key={i} className={`p-2 rounded-lg border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <b className={toneColor}>{(i + 1).toLocaleString('fa-IR')}.</b>{' '}
                    <span className={heading}>{it.text}</span>
                    {it.impact && <> — <b>{it.impact}</b></>}
                  </li>
                );
              })
            )}
          </ul>
          <button onClick={() => onNavigate('delay')} className="mt-3 text-xs font-bold text-indigo-400 hover:text-indigo-300">
            مشاهده جزئیات ←
          </button>
        </div>
      </div>

      {/* ───────────── BOTTOM: Coverage · Quality Gates · Audit Log ───────────── */}
      <div className={`col-span-12 md:col-span-4 ${card} p-5`}>
        <h2 className={`text-base font-black ${heading} mb-1`}>پوشش اسناد</h2>
        <p className={`text-xs ${muted} mb-3`}>نشان می‌دهد کدام اسناد کلیدی آپلود شده‌اند.</p>
        <ul className="space-y-1.5 text-sm">
          {[
            { ok: coverage.contract, label: 'قرارداد' },
            { ok: coverage.baseline, label: SCHEDULE_TITLES.baseline_schedule },
            { ok: coverage.intermediate > 0, label: `${SCHEDULE_TITLES.intermediate_schedule} (${coverage.intermediate})` },
            { ok: coverage.asbuilt, label: SCHEDULE_TITLES.as_built_schedule },
            { ok: coverage.corr, label: 'مکاتبات' },
            { ok: coverage.reports, label: 'گزارشات' },
          ].map((c) => (
            <li key={c.label}>
              <button onClick={onScrollToUploader} className="w-full flex items-center justify-between text-right hover:bg-slate-500/5 rounded px-1.5 py-1">
                <span className={heading}>{c.label}</span>
                <span className={c.ok ? 'text-emerald-400' : 'text-red-400'}>{c.ok ? '✅' : '❌'}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className={`col-span-12 md:col-span-4 ${card} p-5`}>
        <h2 className={`text-base font-black ${heading} mb-1`}>دروازه‌های کیفیت</h2>
        <p className={`text-xs ${muted} mb-3`}>پیش‌نیازهایی که قبل از تحلیل باید برآورده شوند.</p>
        {[
          { ok: coverage.contract, label: 'وجود قرارداد', fix: 'main' as DashPage },
          { ok: coverage.baseline, label: 'پیش‌نیاز برنامه زمان‌بندی', fix: 'main' as DashPage },
          { ok: files.length > 0, label: 'قابل خواندن بودن اسناد', fix: 'main' as DashPage },
          { ok: !coverage.baseline ? true : (coverage.baseline && coverage.asbuilt), label: coverage.baseline && !coverage.asbuilt ? 'بررسی Linked Logic — نیازمند برنامه چون‌ساخت' : 'بررسی Linked Logic', fix: 'main' as DashPage },
        ].map((q) => (
          <div key={q.label} className="flex items-center justify-between py-1.5 text-sm">
            <span className={heading}>{q.ok ? '✅' : '⚠️'} {q.label}</span>
            {!q.ok && (
              <button onClick={() => onNavigate(q.fix)} className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300">رفع ←</button>
            )}
          </div>
        ))}
      </div>

      <div className={`col-span-12 md:col-span-4 ${card} p-5`}>
        <h2 className={`text-base font-black ${heading} mb-1`}>گزارش ممیزی</h2>
        <p className={`text-xs ${muted} mb-3`}>۱۰ فعالیت اخیر سیستم</p>
        <ul className="space-y-2 text-xs">
          {[
            { who: 'کاربر', what: 'ویرایش نوع تأخیر رویداد #۱۲', when: 'دقایقی پیش' },
            { who: 'سیستم', what: 'بارگذاری نسخه جدید برنامه میانی', when: '۲ ساعت پیش' },
            { who: 'کاربر', what: 'اجرای تحلیل APvsAB', when: 'دیروز' },
            { who: 'سیستم', what: 'تأیید مدت رویداد تأخیر #۸', when: 'دیروز' },
          ].map((e, i) => (
            <li key={i} className={`flex items-start gap-2 p-2 rounded-lg ${isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className={`${heading} font-medium`}>{e.what}</div>
                <div className={muted}>{e.who} · {e.when}</div>
              </div>
            </li>
          ))}
        </ul>
        <button className="mt-3 text-xs font-bold text-indigo-400 hover:text-indigo-300">مشاهده همه ←</button>
      </div>
    </section>
  );
};

export default ControlCenter;
