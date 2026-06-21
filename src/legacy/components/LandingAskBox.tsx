import React, { useState } from 'react';
import PromptLibraryModal from './PromptLibraryModal';

interface Props {
  variant?: 'dark' | 'light';
}

const SHORTCUTS = [
  { icon: '📄', label: 'تنظیم قرارداد' },
  { icon: '📑', label: 'تنظیم لایحه و اظهارنامه' },
  { icon: '🗂', label: 'بررسی اسناد' },
  { icon: '⚖️', label: 'دستیار حقوقی' },
];

const QUICK_ACTIONS = [
  { icon: '🔍', label: 'جستجو در وب' },
  { icon: '🧠', label: 'تحلیل' },
  { icon: '📚', label: 'پژوهش عمیق' },
];

const LandingAskBox: React.FC<Props> = ({ variant = 'dark' }) => {
  const [text, setText] = useState('');
  const [showPrompts, setShowPrompts] = useState(false);

  const isDark = variant === 'dark';

  const boxClasses = isDark
    ? 'bg-slate-900/60 backdrop-blur-xl border border-white/10'
    : 'bg-white border border-slate-200 shadow-xl';

  const textareaClasses = isDark
    ? 'bg-transparent text-white placeholder:text-slate-400'
    : 'bg-transparent text-slate-900 placeholder:text-slate-600';

  const chipBase = isDark
    ? 'bg-slate-700/70 hover:bg-slate-600/80 border border-white/15 text-white shadow-sm'
    : 'bg-slate-200 hover:bg-slate-300 border border-slate-400 text-slate-900 shadow-sm';

  const shortcutBase = isDark
    ? 'bg-slate-700/70 hover:bg-slate-600/80 border border-white/15 text-white shadow-sm'
    : 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-900 shadow-sm';

  return (
    <div className="w-full max-w-3xl mx-auto fade-in-up relative">
      {/* Floating ambient orbs behind hero */}
      <div className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-violet-500/20 blur-3xl orb-drift" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl orb-drift-2" />

      {/* Hero text intentionally minimal — branding lives in the top navbar and capability suite */}


      {/* Ask Box */}
      <div className={`rounded-3xl ${boxClasses} ring-gradient p-4 md:p-5 relative glass-premium`}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="سوال خود را در حوزه ادعاهای ساخت رایگان بپرسید..."
          rows={5}
          dir="rtl"
          className={`w-full resize-none outline-none text-sm md:text-base leading-loose ${textareaClasses}`}
        />

        {/* Bottom row: prompts + quick actions + send */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowPrompts(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${chipBase}`}
          >
            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs flex items-center justify-center">+</span>
            پرامپت‌های من
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${chipBase}`}
              >
                <span>{a.icon}</span>
                {a.label}
              </button>
            ))}

            <button
              type="button"
              disabled={!text.trim()}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-indigo-500/30 transition"
              aria-label="ارسال"
            >
              <svg className="w-4 h-4 -rotate-180" viewBox="0 0 24 24" fill="currentColor"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Shortcut buttons row (like adadai bottom shortcuts) */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {SHORTCUTS.map((s, i) => (
          <button
            key={s.label}
            type="button"
            style={{ animationDelay: `${i * 80}ms` }}
            className={`fade-in-up lift-on-hover flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-xs md:text-sm font-bold transition ${shortcutBase}`}
          >
            <span className="text-base">{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      <PromptLibraryModal
        open={showPrompts}
        onClose={() => setShowPrompts(false)}
        onPick={(p) => { setText((prev) => (prev ? prev + '\n\n' + p : p)); }}
      />
    </div>
  );
};

export default LandingAskBox;
