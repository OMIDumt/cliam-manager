import React, { useState, useEffect } from 'react';
import { ProcessedFile } from '../types';

// Inline file thumbnail: image preview for images, extension badge otherwise
const FileThumb: React.FC<{ file: File; isDark: boolean }> = ({ file, isDark }) => {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const u = URL.createObjectURL(file);
      setUrl(u);
      return () => URL.revokeObjectURL(u);
    }
  }, [file]);
  const ext = (file.name.split('.').pop() || '?').toUpperCase().slice(0, 4);
  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="w-10 h-10 rounded-lg object-cover border border-slate-500/30 shadow-sm shrink-0"
      />
    );
  }
  return (
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-black border shrink-0 ${
        isDark
          ? 'bg-slate-800 border-slate-600 text-violet-300'
          : 'bg-white border-slate-200 text-indigo-600'
      }`}
      title={file.type || ext}
    >
      {ext}
    </div>
  );
};
import { useTheme } from '../contexts/ThemeContext';
import { SCHEDULE_TITLES } from '../utils/scheduleMethods';
// (brand-logo imports removed — each upload card now uses its own contextual icon)

// Brand logos were previously shown on upload cards, but they belonged to
// other product features and confused users about each zone's purpose.
// Each card now shows its own topic-specific SVG icon defined inside the
// category config below.
const BRAND_LOGOS: Record<string, string> = {};

interface FileUploaderProps {
  onFilesSelected: (files: FileList | null, category: string) => void | Promise<void>;
  selectedFiles: ProcessedFile[];
  onRemoveFile: (id: string) => void;
  isLoading: boolean;
  maxFiles?: number;
  maxFileSizeMB?: number;
}


const CATEGORIES = [
  {
    id: 'minutes',
    // RID-04: renamed display label (key 'minutes' unchanged for backward compat)
    title: 'قراردادها/الحاقیه‌ها/متمم‌ها/صورتجلسات/دستورکارها',
    subtitle: 'جلسات و تصمیمات',
    formats: 'PDF, Word, Excel',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ),
    color: 'emerald'
  },
  {
    id: 'correspondence',
    title: 'مکاتبات',
    subtitle: 'نامه‌ها و مراسلات رسمی',
    formats: 'PDF, Word, Email',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
      </svg>
    ),
    color: 'indigo'
  },
  {
    id: 'reports',
    // RID-05: renamed display label (key 'reports' unchanged)
    title: 'گزارشات پیشرفت/روزانه/هفتگی/ماهانه',
    subtitle: 'گزارش‌های دوره‌ای',
    formats: 'PDF, Word, PPT',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
      </svg>
    ),
    color: 'blue'
  },
  // Schedule split into 3 zones (canonical keys from glossary)
  {
    id: 'baseline_schedule',
    title: SCHEDULE_TITLES.baseline_schedule,
    subtitle: 'چند فایل · مورد نیاز: IAP، TIA، APvsAB، WA',
    formats: 'MPP, XER, XML, XLSX',
    single: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 2a1 1 0 011 1v1h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2h2V3a1 1 0 112 0v1h2V3a1 1 0 011-1z" />
      </svg>
    ),
    color: 'orange',
  },
  {
    id: 'intermediate_schedule',
    title: SCHEDULE_TITLES.intermediate_schedule,
    subtitle: 'چند فایل · مورد نیاز: TIA، APvsAB، WA',
    formats: 'MPP, XER, XML, XLSX',
    single: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 4a2 2 0 012-2h2a2 2 0 012 2v2H3V4zm8 0a2 2 0 012-2h2a2 2 0 012 2v2h-6V4zM3 8h6v8H3V8zm8 0h6v8h-6V8z" />
      </svg>
    ),
    color: 'amber',
  },
  {
    id: 'as_built_schedule',
    title: SCHEDULE_TITLES.as_built_schedule,
    subtitle: 'چند فایل · مورد نیاز: APvsAB، CAB، WA',
    formats: 'MPP, XER, XML, XLSX',
    single: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    color: 'yellow',
  },

  {
    id: 'claims',
    title: 'ادعاها و اعتراضات',
    subtitle: 'لایحه‌های تاخیرات',
    formats: 'PDF, Word, Excel',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    color: 'rose'
  },
  {
    id: 'financial',
    title: 'اسناد مالی',
    subtitle: 'صورت‌وضعیت، فاکتور',
    formats: 'PDF, Excel, CSV',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.699c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
      </svg>
    ),
    color: 'teal'
  }
];

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFilesSelected, 
  selectedFiles, 
  onRemoveFile, 
  isLoading,
  maxFiles = -1,
  maxFileSizeMB = 200
}) => {
  const { theme } = useTheme();
  const isDark = theme.isDark;
  // Per-zone independent uploading state — keyed by categoryId so concurrent
  // uploads in different zones don't clobber each other's spinner.
  const [uploadingByZone, setUploadingByZone] = useState<Record<string, boolean>>({});

  const clearZoneFiles = (categoryTitle: string) => {
    selectedFiles
      .filter((f) => f.category === categoryTitle)
      .forEach((f) => onRemoveFile(f.id));
  };

  const runWithSpinner = async (categoryId: string, files: FileList | null) => {
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    if (!cat || !files || files.length === 0) return;
    setUploadingByZone((prev) => ({ ...prev, [categoryId]: true }));
    try {
      await Promise.resolve(onFilesSelected(files, cat.title));
    } finally {
      setUploadingByZone((prev) => {
        const next = { ...prev };
        delete next[categoryId];
        return next;
      });
    }
  };

  // Open a fresh, isolated <input type="file"> for THIS specific zone.
  // No shared refs → two zones can upload concurrently without interfering.
  const openPicker = (categoryId: string, mode: 'file' | 'folder') => {
    const cat = CATEGORIES.find((c) => c.id === categoryId);
    if (!cat) return;
    // Clean up any orphaned hidden inputs from previous opens that were
    // cancelled (oncancel isn't fired in all browsers) — they can
    // accumulate and trap focus, causing the next picker to misbehave
    // (some browsers then show the previously-selected directory as empty).
    document.querySelectorAll('input[data-claim-picker="1"]').forEach((n) => n.remove());

    const input = document.createElement('input');
    input.type = 'file';
    input.dataset.claimPicker = '1';
    input.value = '';
    if (mode === 'folder') {
      (input as any).webkitdirectory = true;
      (input as any).directory = true;
      input.multiple = true;
    } else {
      input.multiple = true;
      input.accept = '.pdf,.docx,.doc,.txt,.xls,.xlsx,.csv,.mpp,.xml,.xer,.msg,.eml,.ppt,.pptx,image/*';
    }
    input.style.display = 'none';
    const cleanup = () => {
      try { input.remove(); } catch { /* ignore */ }
    };
    input.onchange = () => {
      const picked = input.files;
      void runWithSpinner(categoryId, picked);
      setTimeout(cleanup, 0);
    };
    // Modern browsers fire 'cancel' when the user dismisses the picker.
    (input as any).oncancel = cleanup;
    // Belt-and-suspenders: when window regains focus without a change event,
    // clean the input on next tick.
    const focusCleanup = () => {
      window.removeEventListener('focus', focusCleanup);
      setTimeout(() => { if (!input.files || input.files.length === 0) cleanup(); }, 300);
    };
    window.addEventListener('focus', focusCleanup);

    document.body.appendChild(input);
    input.click();
  };

  const handleFileClick = (categoryId: string) => {
    if (isLoading || uploadingByZone[categoryId]) return;
    openPicker(categoryId, 'file');
  };

  const handleFolderClick = (e: React.MouseEvent, categoryId: string) => {
    e.stopPropagation();
    if (isLoading || uploadingByZone[categoryId]) return;
    openPicker(categoryId, 'folder');
  };

  const categoryColorClasses: Record<string, { light: string; dark: string; icon: string }> = {
    emerald: {
      light: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-500/30 hover:border-emerald-500',
      dark: 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 hover:border-emerald-500/60',
      icon: 'bg-emerald-500/20'
    },
    indigo: {
      light: 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-500/30 hover:border-indigo-500',
      dark: 'text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 hover:border-indigo-500/60',
      icon: 'bg-indigo-500/20'
    },
    blue: {
      light: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-500/30 hover:border-blue-500',
      dark: 'text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 hover:border-blue-500/60',
      icon: 'bg-blue-500/20'
    },
    orange: {
      light: 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-500/30 hover:border-orange-500',
      dark: 'text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 hover:border-orange-500/60',
      icon: 'bg-orange-500/20'
    },
    amber: {
      light: 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-500/30 hover:border-amber-500',
      dark: 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 hover:border-amber-500/60',
      icon: 'bg-amber-500/20'
    },
    yellow: {
      light: 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100 border-yellow-500/30 hover:border-yellow-500',
      dark: 'text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 hover:border-yellow-500/60',
      icon: 'bg-yellow-500/20'
    },
    rose: {
      light: 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-500/30 hover:border-rose-500',
      dark: 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 hover:border-rose-500/60',
      icon: 'bg-rose-500/20'
    },
    teal: {
      light: 'text-teal-600 bg-teal-50 hover:bg-teal-100 border-teal-500/30 hover:border-teal-500',
      dark: 'text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/30 hover:border-teal-500/60',
      icon: 'bg-teal-500/20'
    },
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
        {CATEGORIES.map((category) => {
           const zoneFiles = selectedFiles.filter(f => f.category === category.title);
           const fileCount = zoneFiles.length;
           const colorConfig = categoryColorClasses[category.color] || categoryColorClasses['blue'];
           const colorClass = isDark ? colorConfig.dark : colorConfig.light;
           const zoneBusy = !!uploadingByZone[category.id];

           return (
            <div
              key={category.id}
              onClick={() => handleFileClick(category.id)}
              className={`relative border border-dashed rounded-3xl p-5 flex flex-col items-center justify-between text-center transition-all duration-300 min-h-[190px] cursor-pointer group shadow-sm hover:shadow-xl hover:-translate-y-1 ${
                isLoading || zoneBusy
                  ? isDark ? 'opacity-60 cursor-not-allowed bg-slate-900' : 'opacity-60 cursor-not-allowed bg-slate-50'
                  : isDark ? 'bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800' : 'bg-white/80 backdrop-blur-sm hover:bg-white'
              } ${colorClass.split(' ').filter(c => c.includes('border')).join(' ')}`}
            >
              {zoneBusy && (
                <div className="absolute top-2 left-2 z-30 flex items-center gap-1 bg-violet-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-md">
                  <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  در حال آپلود
                </div>
              )}
              {fileCount > 0 && (
                <span className="absolute top-2 right-2 z-30 inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-md ring-2 ring-white/10">
                  {fileCount}
                </span>
              )}
              <div className={`relative p-3 rounded-2xl shadow-sm mb-3 transition-transform duration-300 group-hover:scale-110 ${colorConfig.icon} brand-logo-wrap`}>
                <span className="brand-logo-halo" aria-hidden />
                {BRAND_LOGOS[category.id] ? (
                  <img
                    src={BRAND_LOGOS[category.id]}
                    alt=""
                    loading="lazy"
                    className="relative w-16 h-16 object-contain rounded-xl brand-logo-img"
                  />
                ) : (
                  <div className={colorClass.split(' ')[0]}>{category.icon}</div>
                )}
              </div>

              <div className="space-y-1 w-full z-10">
                <h3 className={`font-black text-sm leading-snug ${isDark ? 'text-white' : 'text-slate-800'}`}>{category.title}</h3>
                <p className={`text-[10px] font-medium px-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{category.subtitle}</p>
                <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md mt-1 ${isDark ? 'bg-slate-700 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                  چند فایل
                </span>
              </div>

              {/* Per-card inline file list — every file gets its own luxe delete button */}
              {fileCount > 0 && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`mt-3 w-full text-right space-y-1.5 rounded-2xl p-2 z-20 max-h-44 overflow-y-auto ${
                    isDark
                      ? 'bg-slate-900/70 border border-slate-700/60 shadow-inner shadow-black/30'
                      : 'bg-white/90 border border-slate-200 shadow-inner shadow-slate-200/40'
                  }`}
                >
                  {zoneFiles.map((f) => (
                    <div
                      key={f.id}
                      className={`group/file flex items-center gap-2 rounded-xl p-1.5 transition ${
                        isDark ? 'hover:bg-slate-800/80' : 'hover:bg-slate-50'
                      }`}
                    >
                      <FileThumb file={f.file} isDark={isDark} />
                      <span
                        className={`flex-1 truncate text-[11px] font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}
                        title={f.file.name}
                        dir="ltr"
                      >
                        {f.file.name}
                      </span>
                      {!isLoading && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemoveFile(f.id); }}
                          title="حذف این فایل"
                          aria-label="حذف این فایل"
                          className={`shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg border transition-all duration-200 hover:scale-110 active:scale-95 ${
                            isDark
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/40 hover:bg-rose-500/20 hover:border-rose-400 hover:shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                              : 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 hover:border-rose-400 hover:shadow-[0_4px_12px_rgba(244,63,94,0.18)]'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}


              <div className="mt-4 w-full flex items-center justify-between gap-2 z-20">
                 <div className={`text-[10px] py-1 px-2 rounded-lg font-bold transition-all ${
                  fileCount > 0
                    ? isDark ? 'bg-violet-500 text-white shadow-md' : 'bg-slate-800 text-white shadow-md'
                    : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-400'
                }`}>
                  {fileCount > 0 ? `${fileCount} فایل آپلود شده` : 'خالی — برای آپلود کلیک کنید'}
                </div>

                <button
                  onClick={(e) => handleFolderClick(e, category.id)}
                  title="آپلود پوشه (Folder)"
                  className={`p-1.5 rounded-lg border transition-colors shadow-sm ${
                    isDark
                      ? 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-violet-400 hover:border-violet-500/50 hover:bg-violet-500/10'
                      : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v4m0 0l-2-2m2 2l2-2" />
                  </svg>
                </button>
              </div>
            </div>
           );
        })}
      </div>

      {/* Aggregate "selectedFiles" panel removed — each upload card now lists its own files with delete buttons. */}
    </div>
  );
};

export default FileUploader;
