import React, { useMemo, useState } from 'react';
import { loadKnowledgeBank, searchArticles, type KnowledgeArticle } from '../../utils/knowledgeBank';

interface Props {
  isDark: boolean;
  onBack: () => void;
}

const KnowledgeBankPage: React.FC<Props> = ({ isDark, onBack }) => {
  const [items] = useState<KnowledgeArticle[]>(() => loadKnowledgeBank());
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => searchArticles(items, query), [items, query]);

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
            📚 بانک دانش
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            مرجع روش‌ها و مفاهیم تحلیل ادعا — {filtered.length.toLocaleString('fa-IR')} مقاله
          </p>
        </div>
        <button
          onClick={onBack}
          className={`text-xs font-bold px-3 py-2 rounded-lg border ${
            isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          بازگشت
        </button>
      </div>

      {/* Search */}
      <div className={`rounded-2xl border p-3 ${isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-slate-200/70 shadow-sm'}`}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در بانک دانش (نام، توضیح، ویژگی، ملزومات)..."
            className={`w-full px-4 py-3 pr-11 rounded-xl text-sm font-medium border focus:outline-none focus:ring-2 transition ${
              isDark
                ? 'bg-slate-800/60 border-slate-700/60 text-slate-100 placeholder-slate-500 focus:ring-violet-500/40'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-violet-300'
            }`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg opacity-60">🔍</span>
        </div>
      </div>

      {/* Articles list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 && (
          <div className={`md:col-span-2 rounded-2xl border p-6 text-center text-sm ${isDark ? 'bg-slate-900/40 border-slate-700/50 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
            هیچ مقاله‌ای با این جستجو یافت نشد.
          </div>
        )}
        {filtered.map((a) => (
          <article
            key={a.id}
            className={`rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
              isDark ? 'bg-slate-900/40 border-slate-700/50 hover:border-violet-500/40' : 'bg-white border-slate-200/70 hover:border-violet-300 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700/60 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                  {a.index.toLocaleString('fa-IR')}
                </span>
                <h3 className={`font-black text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{a.name}</h3>
                {a.nameEn && (
                  <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{a.nameEn}</span>
                )}
              </div>
            </div>
            <p className={`text-[12px] leading-6 mb-3 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {a.description}
            </p>
            <div className={`rounded-lg border px-3 py-2 mb-2 text-[11px] font-bold ${
              isDark ? 'bg-violet-500/10 border-violet-500/30 text-violet-200' : 'bg-violet-50 border-violet-200 text-violet-700'
            }`}>
              ⭐ ویژگی کلیدی: {a.feature}
            </div>
            <div>
              <div className={`text-[10px] font-bold uppercase tracking-wide mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                ملزومات
              </div>
              <ul className="space-y-1">
                {a.requirements.map((r, i) => (
                  <li key={i} className={`text-[11px] flex items-start gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span className="text-emerald-500 shrink-0">●</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default KnowledgeBankPage;
