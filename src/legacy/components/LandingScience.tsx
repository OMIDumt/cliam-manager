import React from 'react';

/**
 * Curated, credible legal/engineering knowledge — presented as an
 * elegant ordered list with real citations (real-data feel).
 */
interface Article {
  tag: string;
  title: string;
  body: string;
  source: string;
  sourceUrl?: string;
}

const ARTICLES: Article[] = [
  {
    tag: 'شرایط عمومی پیمان',
    title: 'ماده ۳۰ — تغییر مدت پیمان',
    body: 'در تأخیرات مجاز ناشی از کارفرما، حوادث قهری یا تغییر مقادیر، مدت پیمان قابل تمدید است؛ پیمانکار باید درخواست را همراه با مستندات ارائه دهد.',
    source: 'نشریه ۴۳۱۱ سازمان برنامه و بودجه',
    sourceUrl: 'https://sama.mporg.ir/',
  },
  {
    tag: 'قانون مدنی ایران',
    title: 'ماده ۲۲۱ — وجه التزام',
    body: 'هرگاه ضمن معامله شرط شده باشد که در صورت تخلف، متخلف مبلغی به‌عنوان خسارت بپردازد، طرف مقابل می‌تواند آن مبلغ را بدون اثبات ورود ضرر مطالبه کند.',
    source: 'قانون مدنی، مصوب ۱۳۰۷',
    sourceUrl: 'https://rc.majlis.ir/fa/law/show/97026',
  },
  {
    tag: 'AACE International',
    title: 'RP 29R-03 — تحلیل ادعای زمانی',
    body: 'استاندارد Forensic Schedule Analysis شامل ۹ روش (IAP، TIA، APvsAB، CAB، WA، SUM، …) برای انتساب علمی تأخیرات به طرفین قرارداد.',
    source: 'AACE International Recommended Practice',
    sourceUrl: 'https://web.aacei.org/resources/recommended-practices',
  },
  {
    tag: 'شرایط عمومی پیمان',
    title: 'ماده ۴۹ — فسخ پیمان',
    body: 'کارفرما در موارد تأخیر غیرمجاز پیمانکار، عدم تأمین ماشین‌آلات یا انحلال شرکت، با اخطار کتبی پیمان را فسخ می‌کند؛ حقوق طرفین در صورت‌مجلس قطعی ثبت می‌شود.',
    source: 'نشریه ۴۳۱۱، فصل پنجم',
  },
  {
    tag: 'قانون مدنی ایران',
    title: 'ماده ۲۲۹ — فورس ماژور',
    body: 'اگر متعهد بواسطه حادثه‌ای که دفع آن خارج از حیطه اقتدار اوست نتواند از عهده تعهد برآید، محکوم به تأدیه خسارت نخواهد بود.',
    source: 'قانون مدنی، باب تعهدات',
  },
  {
    tag: 'PMI / مدیریت ادعا',
    title: 'ساختار استاندارد EOT Claim',
    body: 'هر ادعای تمدید مدت شامل: ۱) شرح رویداد ۲) مستندات (مکاتبات، صورت‌جلسات) ۳) تحلیل اثر بر مسیر بحرانی ۴) محاسبه روزهای مجاز ۵) مطالبه مالی هم‌زمان.',
    source: 'PMBOK Guide & Construction Extension',
  },
];

const LandingScience: React.FC = () => {
  return (
    <section className="w-full max-w-4xl mx-auto mt-10 px-2" dir="rtl">
      <div className="text-center mb-7">
        <span className="inline-block text-[10px] font-black tracking-[0.3em] uppercase text-indigo-300 bg-indigo-500/10 border border-indigo-400/30 rounded-full px-3 py-1">
          knowledge base · داده‌های مرجع
        </span>
        <h2 className="hero-headline text-2xl md:text-3xl text-shimmer mt-3">
          مرجع علمی و کاربردی
        </h2>
        <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto leading-7">
          گزیده‌ای از مواد قانونی، شرایط عمومی پیمان و استانداردهای بین‌المللی تحلیل ادعا — با ذکر منبع.
        </p>
      </div>

      <ol className="science-list space-y-3">
        {ARTICLES.map((a, i) => (
          <li
            key={a.title}
            style={{ animationDelay: `${i * 70}ms` }}
            className="fade-in-up science-item group"
          >
            <span className="science-num" aria-hidden>{String(i + 1).padStart(2, '0')}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-200/90 bg-indigo-500/10 border border-indigo-400/30 rounded-full px-2 py-0.5">
                  {a.tag}
                </span>
                <h3 className="text-[15px] font-black text-white leading-snug">
                  {a.title}
                </h3>
              </div>
              <p className="text-[13px] leading-7 text-slate-300/95">
                {a.body}
              </p>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 015.656 5.656l-3 3a4 4 0 01-5.656-5.656M10.172 13.828a4 4 0 01-5.656-5.656l3-3a4 4 0 015.656 5.656" /></svg>
                {a.sourceUrl ? (
                  <a href={a.sourceUrl} target="_blank" rel="noreferrer" className="hover:text-indigo-300 transition-colors underline-offset-2 hover:underline">
                    منبع: {a.source}
                  </a>
                ) : (
                  <span>منبع: {a.source}</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default LandingScience;
