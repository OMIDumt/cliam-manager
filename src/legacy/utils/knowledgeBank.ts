// Knowledge Bank — 8 default articles for delay-analysis methods.
// Each article has: name (fa + en), short description, key feature, requirements.
// Loaded by default when the bank is empty.

import { TECH_METHODS, type TechMethodId } from './delayMethods';

export interface KnowledgeArticle {
  id: string;
  index: number;
  name: string;        // فارسی
  nameEn: string;      // English
  description: string; // توضیح کوتاه
  feature: string;     // ویژگی کلیدی
  requirements: string[]; // ملزومات
  tags?: string[];
}

const METHOD_DESCRIPTIONS: Record<TechMethodId, { description: string; requirements: string[] }> = {
  SUM: {
    description: 'ساده‌ترین روش تحلیل که در آن تمام تاخیرات به‌صورت جبری با هم جمع می‌شوند، بدون توجه به هم‌پوشانی یا مسیر بحرانی.',
    requirements: ['فهرست رویدادهای تاخیر با مدت زمان مشخص'],
  },
  GANTT: {
    description: 'نمایش گرافیکی فعالیت‌ها و تاخیرات روی نمودار میله‌ای زمان‌بندی که هم‌پوشانی فعالیت‌ها را رعایت می‌کند اما تاخیرات همزمان را تفکیک نمی‌کند.',
    requirements: ['نمودار گانت فعالیت‌ها', 'تاریخ شروع/پایان رویدادها'],
  },
  IAP: {
    description: 'روش آینده‌نگر ساده (Impacted As-Planned) که در آن رویدادهای تاخیر به ترتیب زمانی (Stepped) روی برنامه اولیه اعمال می‌شوند تا اثر تجمعی روی تاریخ پایان مشخص شود.',
    requirements: ['برنامه زمان‌بندی اولیه (Baseline)', 'لینک هر رویداد به فعالیت مرتبط'],
  },
  TIA: {
    description: 'روش آینده‌نگر پیشرفته (Time Impact Analysis) که تاخیرات را به ترتیب وقوع روی آخرین برنامه به‌روز شده اعمال می‌کند و نزدیک‌ترین تخمین واقع‌گرایانه از تاثیر را می‌دهد.',
    requirements: ['برنامه اولیه یا میانی به‌روز', 'لینک هر رویداد به فعالیت مرتبط', 'ترتیب زمانی رویدادها'],
  },
  APvsAB: {
    description: 'روش گذشته‌نگر ساده (As-Planned vs As-Built) که با مقایسه مشاهده‌ای برنامه اولیه و چون‌ساخت، انحرافات و علل تاخیر را شناسایی می‌کند.',
    requirements: ['برنامه اولیه', 'برنامه چون‌ساخت (As-Built)', 'لینک هر رویداد به فعالیت مرتبط'],
  },
  CAB: {
    description: 'روش گذشته‌نگر نیمه‌ساده (Collapsed As-Built) که تاخیرات را به ترتیب معکوس زمانی از As-Built حذف می‌کند تا تاریخ پایان بدون تاخیر بدست آید.',
    requirements: ['برنامه چون‌ساخت', 'لینک هر رویداد به فعالیت مرتبط', 'ترتیب معکوس زمانی رویدادها'],
  },
  WA: {
    description: 'روش گذشته‌نگر پیشرفته پنجره‌به‌پنجره (Windows Analysis) که بازه زمانی پروژه را به پنجره‌هایی تقسیم و تاثیر هر تاخیر را در پنجره مربوطه ارزیابی می‌کند.',
    requirements: ['برنامه اولیه', 'برنامه‌های میانی به‌روز', 'لینک هر رویداد به فعالیت مرتبط'],
  },
  CONTRACT: {
    description: 'روش قراردادی که در آن مبنا و رویه تحلیل تاخیر طبق متن قرارداد مشخص می‌شود؛ پارامترها از مفاد قرارداد استخراج می‌شوند.',
    requirements: ['متن کامل قرارداد', 'بندهای مرتبط با تاخیر و خسارت'],
  },
};

export const DEFAULT_ARTICLES: KnowledgeArticle[] = TECH_METHODS.map((m) => {
  const d = METHOD_DESCRIPTIONS[m.id];
  return {
    id: `method-${m.id.toLowerCase()}`,
    index: m.index,
    name: m.faName,
    nameEn: m.enName === '—' ? '' : m.enName,
    description: d.description,
    feature: m.keyFeature,
    requirements: d.requirements,
    tags: ['تحلیل تاخیر', `روش ${m.index}`],
  };
});

const STORAGE_KEY = 'cm.knowledgeBank.v1';

export function loadKnowledgeBank(): KnowledgeArticle[] {
  if (typeof window === 'undefined') return DEFAULT_ARTICLES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ARTICLES;
    const parsed = JSON.parse(raw) as KnowledgeArticle[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_ARTICLES;
    return parsed;
  } catch {
    return DEFAULT_ARTICLES;
  }
}

export function saveKnowledgeBank(items: KnowledgeArticle[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* noop */ }
}

export function searchArticles(items: KnowledgeArticle[], query: string): KnowledgeArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((a) => {
    const hay = [
      a.name, a.nameEn, a.description, a.feature,
      ...(a.requirements ?? []), ...(a.tags ?? []),
    ].join(' ').toLowerCase();
    return hay.includes(q);
  });
}
