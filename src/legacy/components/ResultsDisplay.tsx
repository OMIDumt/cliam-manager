import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AnalysisStatus, AnalysisType, SubscriptionTier, SUBSCRIPTION_LIMITS } from '../types';
import { generateHTMLReport, formatReportForPDF } from '../services/reportFormatter';
import ReportChatbot from './ReportChatbot';

interface ResultsDisplayProps {
  status: AnalysisStatus;
  result: string | null;
  error: string | null;
  analysisType?: AnalysisType;
  subscriptionTier?: SubscriptionTier;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ 
  status, 
  result, 
  error,
  analysisType = 'FULL',
  subscriptionTier = 'FREE'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'submitted'>('idle');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return text;
    }
    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    
    const parts = text.split(new RegExp(`(${escapeRegExp(highlight)})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === highlight.toLowerCase() ? 
        <mark key={i} className="bg-violet-400/30 text-violet-100 rounded-sm px-1 font-semibold">{part}</mark> : 
        part
    );
  };

  const handleDownload = (format: 'md' | 'html' | 'txt' | 'pdf' | 'docx') => {
    if (!result) return;
    
    const allowedFormats = SUBSCRIPTION_LIMITS[subscriptionTier].exportFormats;
    
    if (!allowedFormats.includes(format) && format !== 'html') {
      alert(`این فرمت خروجی برای طرح ${subscriptionTier} در دسترس نیست. لطفا طرح خود را ارتقا دهید.`);
      return;
    }

    const date = new Date().toLocaleDateString('fa-IR');
    let content = result;
    let mimeType = 'text/markdown;charset=utf-8';
    let extension = 'md';

    if (format === 'html') {
      content = generateHTMLReport(result, analysisType, {
        reportDate: date,
      });
      mimeType = 'text/html;charset=utf-8';
      extension = 'html';
    } else if (format === 'txt') {
      content = formatReportForPDF(result, analysisType, {
        reportDate: date,
      });
      mimeType = 'text/plain;charset=utf-8';
      extension = 'txt';
    } else if (format === 'md') {
      content = formatReportForPDF(result, analysisType, {
        reportDate: date,
      });
      mimeType = 'text/markdown;charset=utf-8';
      extension = 'md';
    } else if (format === 'pdf') {
      content = generateHTMLReport(result, analysisType, {
        reportDate: date,
      });
      mimeType = 'text/html;charset=utf-8';
      extension = 'html';
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(content);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
      return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ClaimManager_Report_${date.replace(/\//g, '-')}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleFeedback = (type: 'positive' | 'negative') => {
    console.log(`User feedback received: ${type}`);
    setFeedbackStatus('submitted');
    setTimeout(() => {
        setFeedbackStatus('idle');
    }, 5000);
  };

  const getReportTitle = () => {
    switch (analysisType) {
      case 'DELAY':
        return 'لایحه تحلیل تأخیرات پروژه';
      case 'DAMAGE':
        return 'لایحه تحلیل ضرر و زیان';
      default:
        return 'گزارش جامع تحلیل ادعا';
    }
  };

  // Per-section quality bar based on extracted confidence values and citation coverage.
  // Section boundaries are H2 (##) headings. For each section we collect:
  //   - confidences: numbers found in «درصد اطمینان: NN٪»
  //   - transparency items: occurrences of «شفافیت تحلیل»
  //   - direct citations: occurrences of «استناد مستقیم»
  // Coverage = min(1, citations / items). Risk = below user's min confidence threshold.
  const minConfThreshold: number = (() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('cm.analysisQualitySettings.v1') : null;
      const v = raw ? JSON.parse(raw)?.minConfidence : null;
      return typeof v === 'number' ? v : 70;
    } catch { return 70; }
  })();

  const sectionStats = useMemo(() => {
    const map = new Map<number, { avgConf: number; coverage: number; items: number; samples: number }>();
    if (!result) return map;
    const lines = result.split('\n');
    const boundaries: number[] = [];
    lines.forEach((l, i) => { if (l.startsWith('## ')) boundaries.push(i); });
    boundaries.push(lines.length);
    for (let b = 0; b < boundaries.length - 1; b++) {
      const start = boundaries[b];
      const end = boundaries[b + 1];
      const body = lines.slice(start + 1, end).join('\n');
      const confs = Array.from(body.matchAll(/درصد\s*اطمینان[^\d]{0,30}(\d{1,3})/g))
        .map((m) => Math.min(100, parseInt(m[1], 10)))
        .filter((n) => !Number.isNaN(n));
      const items = (body.match(/شفافیت\s*تحلیل/g) || []).length;
      const citations = (body.match(/استناد\s*مستقیم/g) || []).length;
      const avgConf = confs.length ? Math.round(confs.reduce((a, c) => a + c, 0) / confs.length) : 0;
      const coverage = items > 0 ? Math.min(1, citations / items) : (citations > 0 ? 1 : 0);
      map.set(start, { avgConf, coverage, items, samples: confs.length });
    }
    return map;
  }, [result]);

  const renderSectionQualityBar = (stats: { avgConf: number; coverage: number; items: number; samples: number }) => {
    if (stats.samples === 0 && stats.items === 0) return null;
    const conf = stats.avgConf;
    const cov = Math.round(stats.coverage * 100);
    const isRisk = conf > 0 && conf < minConfThreshold;
    const isGood = conf >= minConfThreshold && cov >= 70;
    const tone = isGood ? 'emerald' : isRisk ? 'red' : 'amber';
    const toneText = isGood ? 'کیفیت قابل قبول' : isRisk ? 'ریسک — اطمینان زیر آستانه' : 'نیازمند بازبینی';
    const palette: Record<string, { bg: string; bar: string; text: string; border: string }> = {
      emerald: { bg: 'bg-emerald-50', bar: 'bg-emerald-500', text: 'text-emerald-800', border: 'border-emerald-200' },
      amber:   { bg: 'bg-amber-50',   bar: 'bg-amber-500',   text: 'text-amber-800',   border: 'border-amber-200' },
      red:     { bg: 'bg-red-50',     bar: 'bg-red-500',     text: 'text-red-800',     border: 'border-red-200' },
    };
    const p = palette[tone];
    return (
      <div className={`my-3 rounded-lg border ${p.border} ${p.bg} px-3 py-2 print:bg-white`} dir="rtl">
        <div className={`flex items-center justify-between text-[11px] font-bold ${p.text} mb-1.5`}>
          <span>نوار کیفیت/ریسک این بخش — {toneText}</span>
          <span>اطمینان متوسط: {conf || '—'}٪ • پوشش استنادها: {cov}٪ • آستانه: {minConfThreshold}٪</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-slate-600 mb-0.5">میانگین درصد اطمینان ({stats.samples} مورد)</div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className={`h-full ${p.bar} transition-all`} style={{ width: `${Math.max(2, conf)}%` }} />
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-600 mb-0.5">پوشش نقل قول‌های مستقیم ({stats.items} آیتم)</div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className={`h-full ${p.bar} transition-all`} style={{ width: `${Math.max(2, cov)}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  };


  if (status === AnalysisStatus.IDLE) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center p-8 glass-card rounded-[2.5rem] relative overflow-hidden group">
        {/* Background effects */}
        <div className="absolute inset-0 bg-grid opacity-50"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-violet-600/10 rounded-full filter blur-[80px] group-hover:bg-violet-600/20 transition-all duration-1000"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-600/10 rounded-full filter blur-[80px] group-hover:bg-cyan-600/20 transition-all duration-1000"></div>
        
        <div className="relative max-w-lg text-center z-10">
           <div className="mb-8 relative inline-block">
             <div className="absolute inset-0 bg-violet-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
             <div className="w-40 h-40 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] mx-auto flex items-center justify-center border border-slate-700/50 shadow-2xl shadow-violet-500/10 transform group-hover:rotate-6 group-hover:scale-105 transition-all duration-700 ease-out">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500 group-hover:text-violet-400 transition-colors duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
             </div>
             <div className="absolute -top-4 -right-4 bg-slate-800 p-3 rounded-2xl shadow-lg border border-slate-700/50 animate-bounce" style={{ animationDuration: '3s' }}>
                <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
           </div>
          
          <h3 className="text-3xl font-black text-white mb-4 tracking-tight">فضای کاری شما آماده است</h3>
          <p className="text-slate-400 leading-loose text-lg font-medium">
            اسناد، مدارک و مستندات خود را از پنل سمت راست بارگذاری کنید.<br/>
            <span className="text-violet-400">ClaimManager</span> با دقت حقوقی بالا آنها را برای شما تحلیل می‌کند.
          </p>
        </div>
      </div>
    );
  }

  if (status === AnalysisStatus.PROCESSING) {
    return (
      <div className="min-h-[420px] flex flex-col items-center justify-center p-12 glass-card rounded-[2.5rem] relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-cyan-900/20"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent animate-progress"></div>
        
        <div className="relative mb-12">
           <div className="w-32 h-32 border-4 border-slate-700 border-t-violet-500 rounded-full animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-20 h-20 bg-violet-500/20 rounded-full flex items-center justify-center animate-pulse backdrop-blur-sm">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-violet-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
               </svg>
             </div>
           </div>
        </div>
        <h3 className="text-3xl font-black text-white mb-3">در حال تحلیل هوشمند</h3>
        <p className="text-slate-400 font-medium">لطفا صبور باشید، هوش مصنوعی در حال مطالعه اسناد شماست...</p>
        
        {/* Progress steps */}
        <div className="mt-8 flex items-center gap-4">
          {['خواندن اسناد', 'تحلیل حقوقی', 'تولید گزارش'].map((step, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs text-slate-500">
              <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-violet-500 animate-pulse' : 'bg-slate-700'}`}></div>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (status === AnalysisStatus.ERROR) {
    return (
      <div className="min-h-[420px] glass-card p-12 rounded-[2.5rem] border-red-500/20 flex items-center justify-center">
        <div className="text-center max-w-lg">
          <div className="bg-red-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
          <h3 className="text-2xl font-black text-red-400 mb-4">متاسفانه خطایی رخ داده است</h3>
          <p className="text-red-300/80 mb-8 leading-relaxed font-medium">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all font-bold text-sm"
          >
            بارگذاری مجدد سیستم
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-[2rem] overflow-hidden flex flex-col max-h-[calc(100vh-10rem)] min-h-[420px] relative border-gradient">
        {/* Header */}
        <div className="bg-slate-900/80 border-b border-slate-700/50 px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-6 shrink-0 backdrop-blur-sm z-20">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 p-2.5 rounded-xl shrink-0 border border-emerald-500/30">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
               </svg>
            </div>
            <div className="hidden sm:block">
              <h2 className="text-xl font-black text-white">{getReportTitle()}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                 <p className="text-xs text-slate-400 font-medium">تحلیل کامل شد</p>
              </div>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative w-full md:w-96 group">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="جستجو در متن گزارش..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pr-12 pl-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-sm text-white font-medium placeholder:text-slate-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto justify-end relative" ref={exportMenuRef}>
              {/* Chatbot — primary luxe action */}
              <button 
                onClick={() => setShowChatbot(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white rounded-xl text-sm font-black flex items-center gap-2 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-[1.03] active:scale-[0.98] ring-1 ring-white/10"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                گفت‌وگو با گزارش
              </button>

              {/* Unified luxe Download + Print group */}
              <div className="flex items-stretch rounded-xl overflow-hidden border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm shadow-lg shadow-black/20">
                <div className="relative">
                  <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className={`h-full px-4 py-2.5 text-sm font-bold flex items-center gap-2 transition-all border-l border-slate-700/60 ${
                      showExportMenu 
                        ? 'bg-violet-500/15 text-white' 
                        : 'text-slate-200 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                    </svg>
                    دانلود گزارش
                    <svg className={`h-3 w-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                       <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </button>

                  {showExportMenu && (() => {
                    const allowedFormats = SUBSCRIPTION_LIMITS[subscriptionTier].exportFormats;
                    const exportFormats: Array<{format: 'html' | 'md' | 'txt' | 'pdf' | 'docx', label: string, desc: string, icon: string, color: string, alwaysAvailable?: boolean}> = [
                      { format: 'html', label: 'قالب رسمی (HTML)', desc: 'مناسب چاپ و ارائه', icon: 'HTML', color: 'orange', alwaysAvailable: true },
                      { format: 'md', label: 'فایل Markdown', desc: 'برای ویرایش در ادیتورها', icon: 'MD', color: 'slate' },
                      { format: 'txt', label: 'متن ساده', desc: 'بدون استایل', icon: 'TXT', color: 'slate' },
                      { format: 'pdf', label: 'فایل PDF', desc: 'قالب قابل چاپ', icon: 'PDF', color: 'red' },
                      { format: 'docx', label: 'Microsoft Word', desc: 'قالب Word', icon: 'DOCX', color: 'blue' },
                    ];

                    return (
                      <div className="absolute top-full left-0 mt-2 w-60 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/50 border border-slate-700/70 overflow-hidden z-50 animate-fadeIn ring-1 ring-white/5">
                        <div className="px-3 py-2 border-b border-slate-700/50 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                          خروجی گزارش
                        </div>
                        <div className="p-1.5 space-y-0.5">
                          {exportFormats.map((fmt) => {
                            const isAvailable = fmt.alwaysAvailable || allowedFormats.includes(fmt.format);
                            const colorClasses: Record<string, string> = {
                              orange: 'bg-orange-500/20 text-orange-400',
                              slate: 'bg-slate-600/30 text-slate-400',
                              red: 'bg-red-500/20 text-red-400',
                              blue: 'bg-blue-500/20 text-blue-400',
                            };

                            return (
                              <button
                                key={fmt.format}
                                onClick={() => handleDownload(fmt.format)}
                                disabled={!isAvailable}
                                className={`w-full text-right px-3 py-2.5 text-sm font-medium rounded-lg flex items-center gap-3 transition-colors ${
                                  isAvailable
                                    ? 'text-slate-200 hover:bg-violet-500/20 hover:text-white'
                                    : 'text-slate-600 cursor-not-allowed opacity-50'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[fmt.color]}`}>
                                  <span className="font-black text-xs">{fmt.icon}</span>
                                </div>
                                <div className="flex flex-col flex-1">
                                  <span>{fmt.label}</span>
                                  <span className="text-[10px] text-slate-500">{fmt.desc}</span>
                                  {!isAvailable && (
                                    <span className="text-[10px] text-amber-500 font-bold">نیاز به ارتقا</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <button 
                  onClick={() => window.print()}
                  title="چاپ گزارش"
                  className="px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-slate-700/50 hover:text-white flex items-center gap-2 transition-all"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>
                  </svg>
                  چاپ
                </button>
              </div>
          </div>
        </div>

        {/* Document View */}
        <div className="flex-grow overflow-y-auto bg-slate-900/30 p-8">
          <div className="max-w-[210mm] mx-auto bg-white shadow-2xl shadow-black/50 min-h-[297mm] p-[20mm] relative print:shadow-none">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden print:hidden">
              <h1 className="text-[100px] font-black text-slate-100 -rotate-45 select-none whitespace-nowrap opacity-30">
                ClaimManager
              </h1>
            </div>

            {/* Report Header - Enhanced */}
            <div className="flex justify-between items-end border-b-2 border-slate-900 pb-4 mb-8 relative z-10">
               <div className="text-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl blur-lg opacity-50"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-xl flex items-center justify-center mb-1 shadow-xl">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
               </div>
               <div className="text-center flex-grow px-8">
                 <h1 className="text-3xl font-black text-slate-900 mb-2 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{getReportTitle()}</h1>
                 <div className="flex items-center justify-center gap-2">
                   <div className="h-1 w-12 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"></div>
                   <p className="text-sm font-medium text-slate-600">تحلیل هوشمند اسناد حقوقی و پیمان</p>
                   <div className="h-1 w-12 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"></div>
                 </div>
               </div>
               <div className="text-left text-xs font-mono text-slate-500 leading-relaxed bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                 <div className="font-bold text-slate-700 mb-1">تاریخ:</div>
                 <div>{new Date().toLocaleDateString('fa-IR')}</div>
                 <div className="font-bold text-slate-700 mt-2 mb-1">شماره:</div>
                 <div className="font-mono">CM-{Date.now().toString().slice(-6)}</div>
               </div>
            </div>

            {/* Report Structure Info */}
            {analysisType === 'DELAY' && (
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl print:bg-orange-50">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-orange-800">ساختار لایحه تاخیرات</span>
                </div>
                <p className="text-xs text-orange-700">این گزارش مطابق با ساختار استاندارد لایحه تاخیرات تهیه شده است.</p>
              </div>
            )}

            {analysisType === 'DAMAGE' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl print:bg-red-50">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-bold text-red-800">ساختار لایحه ضرر و زیان</span>
                </div>
                <p className="text-xs text-red-700">این گزارش مطابق با ساختار استاندارد لایحه ضرر و زیان تهیه شده است.</p>
              </div>
            )}

            {/* Report Content - Enhanced */}
            <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-800 prose-p:text-justify prose-p:leading-8 prose-li:text-justify relative z-10 dir-rtl">
              {result?.split('\n').map((line, index) => {
                // Enhanced markdown parsing with better styling
                if (line.startsWith('# ')) {
                  return (
                    <h1 key={index} className="text-3xl mt-10 mb-6 pb-3 border-b-2 border-indigo-200 font-black text-slate-900 relative">
                      <span className="absolute right-0 top-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full"></span>
                      <span className="pr-3">{getHighlightedText(line.replace('# ', ''), searchTerm)}</span>
                    </h1>
                  );
                }
                if (line.startsWith('## ')) {
                  const stats = sectionStats.get(index);
                  return (
                    <React.Fragment key={index}>
                      <h2 className="text-2xl mt-8 mb-4 font-black text-indigo-700 relative pr-4">
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-indigo-400 to-violet-400 rounded-full"></span>
                        {getHighlightedText(line.replace('## ', ''), searchTerm)}
                      </h2>
                      {stats && renderSectionQualityBar(stats)}
                    </React.Fragment>
                  );
                }
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={index} className="text-xl mt-6 mb-3 font-bold text-slate-800 bg-slate-50 px-4 py-2 rounded-lg border-r-4 border-indigo-400">
                      {getHighlightedText(line.replace('### ', ''), searchTerm)}
                    </h3>
                  );
                }
                if (line.startsWith('|') && line.includes('|')) {
                  // Table row - check if it's header row
                  const cells = line.split('|').filter(c => c.trim());
                  const isHeader = line.includes('---') || index === 0 || result.split('\n')[index - 1]?.includes('---');
                  if (isHeader) {
                    return null; // Skip separator rows
                  }
                  return (
                    <tr key={index} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      {cells.map((cell, i) => (
                        <td key={i} className="px-4 py-2 text-sm text-slate-700">
                          {getHighlightedText(cell.trim(), searchTerm)}
                        </td>
                      ))}
                    </tr>
                  );
                }
                if (line.startsWith('- ')) {
                  return (
                    <li key={index} className="mr-6 mb-2 list-disc marker:text-indigo-500 marker:font-bold text-slate-700 leading-relaxed">
                      <span className="mr-2">{getHighlightedText(line.replace('- ', ''), searchTerm)}</span>
                    </li>
                  );
                }
                if (line.trim() === '' || line.trim() === '---') {
                  return <br key={index} />;
                }
                // Regular paragraph with enhanced styling
                const boldText = line.match(/\*\*(.*?)\*\*/g);
                if (boldText) {
                  let processedLine = line;
                  boldText.forEach(bold => {
                    const text = bold.replace(/\*\*/g, '');
                    processedLine = processedLine.replace(bold, `<strong class="font-black text-slate-900">${text}</strong>`);
                  });
                  return (
                    <p 
                      key={index} 
                      className="mb-3 text-sm text-slate-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: getHighlightedText(processedLine, searchTerm) }}
                    />
                  );
                }
                return (
                  <p key={index} className="mb-3 text-sm text-slate-700 leading-relaxed">
                    {getHighlightedText(line, searchTerm)}
                  </p>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-20 pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 relative z-10">
              <span>تهیه شده توسط سامانه هوشمند ClaimManager</span>
              <span>صفحه ۱</span>
            </div>
          </div>

           {/* Feedback Section */}
           <div className="max-w-[210mm] mx-auto mt-8 flex justify-center no-print">
               {feedbackStatus === 'idle' ? (
                   <div className="flex items-center gap-4 bg-slate-800/50 px-6 py-3 rounded-full border border-slate-700/50">
                       <span className="text-xs font-bold text-slate-400">آیا این تحلیل مفید بود؟</span>
                       <div className="flex gap-2">
                           <button onClick={() => handleFeedback('positive')} className="p-1.5 hover:bg-emerald-500/20 rounded-full text-slate-500 hover:text-emerald-400 transition-colors">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                   <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                               </svg>
                           </button>
                           <button onClick={() => handleFeedback('negative')} className="p-1.5 hover:bg-rose-500/20 rounded-full text-slate-500 hover:text-rose-400 transition-colors">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                   <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                               </svg>
                           </button>
                       </div>
                   </div>
               ) : (
                   <div className="bg-emerald-500/10 text-emerald-400 px-6 py-3 rounded-full text-xs font-bold border border-emerald-500/30 animate-fadeIn">
                       با تشکر از بازخورد شما!
                   </div>
               )}
           </div>
        </div>
      </div>

      {/* Chatbot Modal */}
      <ReportChatbot
        reportContent={result || ''}
        analysisType={analysisType}
        isOpen={showChatbot}
        onClose={() => setShowChatbot(false)}
      />
    </>
  );
};

export default ResultsDisplay;
