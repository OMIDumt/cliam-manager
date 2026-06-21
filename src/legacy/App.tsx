import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import FileUploader from './components/FileUploader';
import ResultsDisplay from './components/ResultsDisplay';
import AdvancedSettingsComponent from './components/AdvancedSettings';
import SubscriptionPage from './components/SubscriptionPage';
import AppFooter from './components/layout/AppFooter';
import UploadWarningModal, { UPLOAD_WARNING_SESSION_KEY } from './components/upload/UploadWarningModal';
import ScheduleSummary from './components/ScheduleSummary';
import DelayAnalysisPage from './components/delay/DelayAnalysisPage';
import DamageGateway, { type ManualDelayDays } from './components/damage/DamageGateway';
import DamageClaimPage from './components/damage/DamageClaimPage';
import KnowledgeBankPage from './components/knowledge/KnowledgeBankPage';
import ControlCenter from './components/dashboard/ControlCenter';
import AnalysisOptionsModal, { type AnalysisOptions } from './components/AnalysisOptionsModal';
import type { FinancialDelayRow } from './utils/financialDelay';
import {
  METHOD_LABELS,
  METHOD_SCHEDULE_REQUIREMENTS,
  SCHEDULE_TITLES,
  getMissingSchedulesForMethod,
  getScheduleStatus,
  isMethodAvailable,
  type DelayMethodKey,
} from './utils/scheduleMethods';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { processFiles } from './utils/fileUtils';
import { analyzeLegalDocuments } from './services/geminiService';
import { ProcessedFile, AnalysisStatus, AnalysisSettings, AnalysisType, SUBSCRIPTION_LIMITS } from './types';

type AppPage = 'main' | 'subscription' | 'delay' | 'damage-gateway' | 'damage' | 'knowledge';

function App() {
  const { user, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme.isDark;
  const [currentPage, setCurrentPage] = useState<AppPage>('main');
  // RID-10: session-based warning modal
  const [warningAcknowledged, setWarningAcknowledged] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem(UPLOAD_WARNING_SESSION_KEY) === 'true';
  });
  const handleWarningConfirm = useCallback(() => {
    sessionStorage.setItem(UPLOAD_WARNING_SESSION_KEY, 'true');
    setWarningAcknowledged(true);
  }, []);
  const [selectedFiles, setSelectedFiles] = useState<ProcessedFile[]>([]);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>('FULL');

  // Project history (in-memory; survives across "New Project" within session)
  type ProjectSnapshot = {
    id: string;
    name: string;
    createdAt: number;
    selectedFiles: ProcessedFile[];
    result: string | null;
    analysisType: AnalysisType;
    delayAnalysisCompleted: boolean;
    financialDelayRows: FinancialDelayRow[];
    manualDelayDays: ManualDelayDays | null;
    damageSource: 'analysis' | 'manual' | null;
  };
  const [projectHistory, setProjectHistory] = useState<ProjectSnapshot[]>([]);
  const [currentProjectName, setCurrentProjectName] = useState<string>('پروژه فعلی');

  // Damage-claim gateway state
  const [delayAnalysisCompleted, setDelayAnalysisCompleted] = useState<boolean>(false);
  const [financialDelayRows, setFinancialDelayRows] = useState<FinancialDelayRow[]>([]);
  const [manualDelayDays, setManualDelayDays] = useState<ManualDelayDays | null>(null);
  const [damageSource, setDamageSource] = useState<'analysis' | 'manual' | null>(null);
  const damageDays: ManualDelayDays = manualDelayDays ?? { excusable: 0, nonExcusable: 0, excusableCompensable: 0, excusableNonCompensable: 0 };

  // Settings State
  const [settings, setSettings] = useState<AnalysisSettings>({
    focusKeywords: '',
    specificSections: '',
    excludeSections: '',
    strictMode: false
  });

  // Get subscription limits (use FREE as fallback)
  const subscriptionLimits = user ? SUBSCRIPTION_LIMITS[user.subscriptionTier] : SUBSCRIPTION_LIMITS.FREE;

  // After login, honor a feature the user picked on the landing page (sessionStorage flag)
  useEffect(() => {
    if (!user) return;
    try {
      const pending = sessionStorage.getItem('cm_pending_feature');
      if (!pending) return;
      sessionStorage.removeItem('cm_pending_feature');
      if (pending === 'delay') setCurrentPage('delay');
      else if (pending === 'damage') setCurrentPage('damage-gateway');
    } catch { /* noop */ }
  }, [user]);

  const handleFilesSelected = useCallback(async (fileList: FileList | null, category: string) => {
    if (!fileList) return;
    
    // Check file limit
    if (subscriptionLimits.maxFilesPerAnalysis !== -1 && 
        selectedFiles.length + fileList.length > subscriptionLimits.maxFilesPerAnalysis) {
      setError(`حداکثر ${subscriptionLimits.maxFilesPerAnalysis} فایل در هر تحلیل مجاز است. برای تحلیل بیشتر، طرح خود را ارتقا دهید.`);
      return;
    }

    // Check file size
    const oversizedFiles = Array.from(fileList).filter(
      file => file.size > subscriptionLimits.maxFileSizeMB * 1024 * 1024
    );
    
    if (oversizedFiles.length > 0) {
      setError(`حجم برخی فایل‌ها بیشتر از ${subscriptionLimits.maxFileSizeMB} مگابایت است. برای آپلود فایل‌های بزرگ‌تر، طرح خود را ارتقا دهید.`);
      return;
    }
    
    if (status === AnalysisStatus.COMPLETED || status === AnalysisStatus.ERROR) {
      setStatus(AnalysisStatus.IDLE);
      setResult(null);
      setError(null);
    }

    const processed = await processFiles(fileList, category);
    setSelectedFiles(prev => [...prev, ...processed]);
  }, [status, selectedFiles.length, subscriptionLimits]);

  const handleRemoveFile = useCallback((id: string) => {
    setSelectedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  // Pre-analysis options gate: opens a modal so the user can pick method/scope
  // before any report is generated. This avoids producing a default report the
  // user did not configure (was a major UX complaint).
  const [pendingAnalysis, setPendingAnalysis] = useState<AnalysisType | null>(null);
  const requestAnalyze = useCallback((type: AnalysisType) => {
    if (selectedFiles.length === 0) return;
    setPendingAnalysis(type);
  }, [selectedFiles.length]);

  const runAnalyze = useCallback(async (type: AnalysisType, mergedSettings: AnalysisSettings) => {
    if (selectedFiles.length === 0) return;

    // Check subscription limits
    if (subscriptionLimits.maxFilesPerAnalysis !== -1 &&
        selectedFiles.length > subscriptionLimits.maxFilesPerAnalysis) {
      setError(`برای این تحلیل به ${selectedFiles.length} فایل نیاز است، اما طرح شما حداکثر ${subscriptionLimits.maxFilesPerAnalysis} فایل را پشتیبانی می‌کند.`);
      return;
    }

    setAnalysisType(type);
    setStatus(AnalysisStatus.PROCESSING);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeLegalDocuments(selectedFiles, mergedSettings, type);
      const banner = `> **مدل تحلیل‌گر:** ${analysis.modelLabel}\n\n`;
      setResult(banner + analysis.markdown);
      setStatus(AnalysisStatus.COMPLETED);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'خطای ناشناخته رخ داده است');
      setStatus(AnalysisStatus.ERROR);
    }
  }, [selectedFiles, subscriptionLimits]);

  const handleConfirmAnalysisOptions = useCallback((opts: AnalysisOptions) => {
    const type = pendingAnalysis;
    setPendingAnalysis(null);
    if (!type) return;
    const scopeLabel =
      opts.scope === 'excusable' ? 'تأخیرات مجاز' :
      opts.scope === 'nonExcusable' ? 'تأخیرات غیرمجاز' : 'تأخیرات مجاز و غیرمجاز';
    const damagePartyLabel =
      opts.damageParty === 'contractor' ? 'خسارات وارده به پیمانکار' :
      opts.damageParty === 'employer' ? 'خسارات وارده به کارفرما' : 'خسارات وارده به هر دو طرف';
    const roleLabel =
      opts.userRole === 'contractor' ? 'پیمانکار' :
      opts.userRole === 'employer' ? 'کارفرما' :
      opts.userRole === 'consultant' ? 'مشاور' : 'سایر/بی‌طرف';
    const methodLabel = opts.method && opts.method !== 'AUTO' ? `روش ${opts.method}` : 'انتخاب خودکار روش';
    const userName = user?.name || 'کاربر محترم';
    const contextLine = `نقش کاربر: ${roleLabel} | نام تهیه‌کننده: ${userName} | دامنه تأخیر: ${scopeLabel} | ${damagePartyLabel} | ${methodLabel}`;
    const merged: AnalysisSettings = {
      ...settings,
      focusKeywords: [opts.focusKeywords, settings.focusKeywords].filter(Boolean).join('، '),
      specificSections: [settings.specificSections, contextLine].filter(Boolean).join(' || '),
      strictMode: opts.strictMode,
      modelPreference: opts.modelPreference,
      strategy: opts.strategy,
      minConfidence: opts.minConfidence,
      verbosity: opts.verbosity,
      requireCitations: opts.requireCitations,
    };
    setSettings(merged);
    runAnalyze(type, merged);
  }, [pendingAnalysis, settings, runAnalyze, user]);


  // Show loading if auth is loading
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-[#030712]' : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50/30'
      }`}>
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-violet-500/20 rounded-full animate-pulse"></div>
            </div>
          </div>
          <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return (
      <>
        <Login />
        <AppFooter />
      </>
    );
  }

  // Delay analysis page (technical + financial tabs)
  if (currentPage === 'delay') {
    return (
      <div className={`flex flex-col min-h-screen font-sans ${
        isDark
          ? 'bg-gradient-to-br from-slate-900 via-[#030712] to-slate-900'
          : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50/30'
      }`}>
        <Header onNavigate={(page) => setCurrentPage(page)} />
        <main className="flex-grow max-w-[1600px] mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
          <DelayAnalysisPage
            files={selectedFiles}
            isDark={isDark}
            onBack={() => setCurrentPage('main')}
            onFinancialRowsChange={(rows) => { setFinancialDelayRows(rows); setDelayAnalysisCompleted(true); }}
            onGenerateReport={() => { setDelayAnalysisCompleted(true); requestAnalyze('DELAY'); setCurrentPage('main'); }}
            onGoToDamage={(days) => {
              setDelayAnalysisCompleted(true);
              setManualDelayDays(days);
              setDamageSource('analysis');
              setCurrentPage('damage');
            }}
          />
        </main>
        <AppFooter />
      </div>
    );
  }

  // Damage-claim gateway (mandatory before damage page)
  if (currentPage === 'damage-gateway') {
    return (
      <div className={`flex flex-col min-h-screen font-sans ${
        isDark ? 'bg-gradient-to-br from-slate-900 via-[#030712] to-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50/30'
      }`}>
        <Header onNavigate={(page) => setCurrentPage(page)} />
        <main className="flex-grow max-w-[1600px] mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
          <DamageGateway
            isDark={isDark}
            onGoToDelayAnalysis={() => setCurrentPage('delay')}
            onSubmitManual={(d) => { setManualDelayDays(d); setDamageSource('manual'); setCurrentPage('damage'); }}
          />
        </main>
        <AppFooter />
      </div>
    );
  }

  // Damage-claim page — URL-guard: deny direct access unless gateway was passed
  if (currentPage === 'damage') {
    if (!damageSource) {
      // bounce back to gateway
      setCurrentPage('damage-gateway');
      return null;
    }
    return (
      <div className={`flex flex-col min-h-screen font-sans ${
        isDark ? 'bg-gradient-to-br from-slate-900 via-[#030712] to-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50/30'
      }`}>
        <Header onNavigate={(page) => setCurrentPage(page)} />
        <main className="flex-grow max-w-[1600px] mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
          <DamageClaimPage
            isDark={isDark}
            source={damageSource}
            days={damageDays}
            onBack={() => { setDamageSource(null); setCurrentPage('main'); }}
          />
        </main>
        <AppFooter />
      </div>
    );
  }

  // Knowledge bank page
  if (currentPage === 'knowledge') {
    return (
      <div className={`flex flex-col min-h-screen font-sans ${
        isDark ? 'bg-gradient-to-br from-slate-900 via-[#030712] to-slate-900' : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50/30'
      }`}>
        <Header onNavigate={(page) => setCurrentPage(page)} />
        <main className="flex-grow max-w-[1600px] mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
          <KnowledgeBankPage isDark={isDark} onBack={() => setCurrentPage('main')} />
        </main>
        <AppFooter />
      </div>
    );
  }


  // Show subscription page if requested
  if (currentPage === 'subscription') {
    return (
      <div className={`flex flex-col min-h-screen font-sans ${
        isDark 
          ? 'bg-gradient-to-br from-slate-900 via-[#030712] to-slate-900' 
          : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50/30'
      }`}>
        <Header onNavigate={(page) => setCurrentPage(page)} />
        <SubscriptionPage onNavigate={(page) => setCurrentPage(page)} />
        <AppFooter />
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen font-sans overflow-x-hidden ${
      isDark 
        ? 'bg-gradient-to-br from-slate-900 via-[#030712] to-slate-900' 
        : 'bg-gradient-to-br from-slate-50 via-white to-indigo-50/30'
    }`}>
      {/* RID-10: one-time per-session upload warning */}
      {!warningAcknowledged && <UploadWarningModal onConfirm={handleWarningConfirm} />}
      <Header onNavigate={(page) => setCurrentPage(page)} />
      
      
      <main className="flex-grow max-w-[1600px] mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 z-10 relative">
        <ControlCenter
          files={selectedFiles}
          isDark={isDark}
          onNavigate={(p) => setCurrentPage(p)}
          onScrollToUploader={() => {
            const el = document.getElementById('uploader-anchor');
            el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          onStartFullAnalysis={() => requestAnalyze('FULL')}
          result={result}
          analysisType={analysisType}
          onRemoveFile={handleRemoveFile}
          onClearAllFiles={() => setSelectedFiles([])}
          onNewProject={() => {
            // Snapshot the current project into history (only if it has content)
            const hasContent =
              selectedFiles.length > 0 || !!result || financialDelayRows.length > 0 || !!manualDelayDays;
            if (hasContent) {
              const snap: ProjectSnapshot = {
                id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                name: currentProjectName && currentProjectName !== 'پروژه فعلی'
                  ? currentProjectName
                  : (selectedFiles[0]?.file.name?.replace(/\.[^.]+$/, '').slice(0, 40) ||
                     `پروژه ${new Date().toLocaleString('fa-IR')}`),
                createdAt: Date.now(),
                selectedFiles,
                result,
                analysisType,
                delayAnalysisCompleted,
                financialDelayRows,
                manualDelayDays,
                damageSource,
              };
              setProjectHistory((prev) => [snap, ...prev].slice(0, 20));
            }
            // Reset to a fresh project
            setSelectedFiles([]);
            setResult(null);
            setError(null);
            setStatus(AnalysisStatus.IDLE);
            setAnalysisType('FULL');
            setDelayAnalysisCompleted(false);
            setFinancialDelayRows([]);
            setManualDelayDays(null);
            setDamageSource(null);
            setCurrentPage('main');
            setCurrentProjectName(`پروژه ${new Date().toLocaleString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`);
          }}
          projectHistory={projectHistory.map((p) => ({
            id: p.id,
            name: p.name,
            createdAt: p.createdAt,
            fileCount: p.selectedFiles.length,
            hasReport: !!p.result,
          }))}
          onRestoreProject={(id) => {
            const snap = projectHistory.find((p) => p.id === id);
            if (!snap) return;
            // Snapshot the *current* project first so user can switch back
            const hasContent =
              selectedFiles.length > 0 || !!result || financialDelayRows.length > 0 || !!manualDelayDays;
            if (hasContent) {
              const cur: ProjectSnapshot = {
                id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                name: currentProjectName,
                createdAt: Date.now(),
                selectedFiles,
                result,
                analysisType,
                delayAnalysisCompleted,
                financialDelayRows,
                manualDelayDays,
                damageSource,
              };
              setProjectHistory((prev) => [cur, ...prev.filter((p) => p.id !== id)].slice(0, 20));
            } else {
              setProjectHistory((prev) => prev.filter((p) => p.id !== id));
            }
            // Restore snapshot
            setSelectedFiles(snap.selectedFiles);
            setResult(snap.result);
            setAnalysisType(snap.analysisType);
            setStatus(snap.result ? AnalysisStatus.COMPLETED : AnalysisStatus.IDLE);
            setError(null);
            setDelayAnalysisCompleted(snap.delayAnalysisCompleted);
            setFinancialDelayRows(snap.financialDelayRows);
            setManualDelayDays(snap.manualDelayDays);
            setDamageSource(snap.damageSource);
            setCurrentProjectName(snap.name);
            setCurrentPage('main');
          }}
          onDeleteProject={(id) => {
            setProjectHistory((prev) => prev.filter((p) => p.id !== id));
          }}
          currentProjectName={currentProjectName}
        />
        <div id="uploader-anchor" className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full items-start">
          
          
          {/* Left Sidebar (Controls) */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 sticky top-28">
            <div className="space-y-6">
              <FileUploader 
                onFilesSelected={handleFilesSelected}
                selectedFiles={selectedFiles}
                onRemoveFile={handleRemoveFile}
                isLoading={status === AnalysisStatus.PROCESSING}
                maxFiles={subscriptionLimits.maxFilesPerAnalysis}
                maxFileSizeMB={subscriptionLimits.maxFileSizeMB}
              />

              <AdvancedSettingsComponent 
                settings={settings}
                onSettingsChange={setSettings}
                disabled={status === AnalysisStatus.PROCESSING || !subscriptionLimits.advancedSettings}
              />

              {/* Subscription Limit Info */}
              {user.subscriptionTier === 'FREE' && (
                <div className={`rounded-xl p-4 border ${
                  isDark 
                    ? 'bg-amber-500/10 border-amber-500/30' 
                    : 'bg-amber-50 border-amber-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <svg className={`w-5 h-5 shrink-0 mt-0.5 ${
                      isDark ? 'text-amber-400' : 'text-amber-600'
                    }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className={`text-sm font-bold mb-1 ${
                        isDark ? 'text-amber-300' : 'text-amber-800'
                      }`}>طرح رایگان</p>
                      <p className={`text-xs ${
                        isDark ? 'text-amber-400/80' : 'text-amber-700'
                      }`}>برای دسترسی به ویژگی‌های بیشتر، طرح خود را ارتقا دهید.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule status summary (read-only) + delay-method availability */}
              <ScheduleSummary files={selectedFiles} isDark={isDark} />
              <div className={`rounded-2xl border p-3 ${isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white/70 border-slate-200/60'}`}>
                <div className={`text-[11px] font-bold uppercase tracking-wide mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  روش‌های تحلیل تاخیر
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(METHOD_SCHEDULE_REQUIREMENTS) as DelayMethodKey[]).map((m) => {
                    const sched = getScheduleStatus(selectedFiles);
                    const ok = isMethodAvailable(m, sched);
                    const missing = getMissingSchedulesForMethod(m, sched).map((k) => SCHEDULE_TITLES[k]).join(' · ');
                    return (
                      <span
                        key={m}
                        title={ok ? `${METHOD_LABELS[m]} — فعال` : `نیازمند: ${missing}`}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border cursor-help ${
                          ok
                            ? isDark ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : isDark ? 'bg-slate-800/60 border-slate-700/60 text-slate-500 line-through opacity-60' : 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-70'
                        }`}
                      >
                        {m}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons were moved to the top of the report area on the right.
                  This keeps the upload sidebar focused on file management only. */}

              
              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-mono opacity-60">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Powered by Google Gemini 2.5 Pro
              </div>
            </div>
          </div>

          {/* Right Main Content (Results) — single, unified report area */}
          <div id="results-display-anchor" className="lg:col-span-7 xl:col-span-8 scroll-mt-24">
            {/* Quick-access analysis buttons at the top of the report area */}
            <div className={`mb-3 rounded-2xl border p-3 ${isDark ? 'bg-slate-900/50 border-slate-700/60' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className={`text-[11px] font-bold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                دسترسی سریع به تحلیل‌های تخصصی: <span className={`font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>برای دریافت گزارش، ابتدا روی یکی از دو دکمه زیر کلیک کنید و سپس مشخصات تحلیل را تنظیم نمایید.</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCurrentPage('delay')}
                  disabled={selectedFiles.length === 0 || status === AnalysisStatus.PROCESSING}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
                    selectedFiles.length === 0 || status === AnalysisStatus.PROCESSING
                      ? isDark ? 'bg-slate-800/40 text-slate-500 border-slate-700/50 cursor-not-allowed' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'text-white bg-gradient-to-r from-orange-500 to-amber-600 border-transparent shadow hover:shadow-lg'
                  }`}
                >
                  ⏱️ تحلیل تاخیرات
                </button>
                <button
                  onClick={() => {
                    if (delayAnalysisCompleted) {
                      setManualDelayDays({ excusable: 0, nonExcusable: 0, excusableCompensable: 0, excusableNonCompensable: 0 });
                      setDamageSource('analysis');
                      setCurrentPage('damage');
                    } else {
                      setCurrentPage('damage-gateway');
                    }
                  }}
                  disabled={selectedFiles.length === 0 || status === AnalysisStatus.PROCESSING}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
                    selectedFiles.length === 0 || status === AnalysisStatus.PROCESSING
                      ? isDark ? 'bg-slate-800/40 text-slate-500 border-slate-700/50 cursor-not-allowed' : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'text-white bg-gradient-to-r from-red-500 to-rose-600 border-transparent shadow hover:shadow-lg'
                  }`}
                >
                  ⚖️ تحلیل ضرر و زیان
                </button>
              </div>
            </div>

            <ResultsDisplay 
              status={status} 
              result={result} 
              error={error}
              analysisType={analysisType}
              subscriptionTier={user.subscriptionTier}
            />
          </div>
        </div>
      </main>
      <AppFooter />
      {pendingAnalysis && (
        <AnalysisOptionsModal
          type={pendingAnalysis}
          files={selectedFiles}
          isDark={isDark}
          defaultFocusKeywords={settings.focusKeywords}
          defaultStrictMode={settings.strictMode}
          onCancel={() => setPendingAnalysis(null)}
          onConfirm={handleConfirmAnalysisOptions}
        />
      )}
    </div>
  );
}

export default App;
