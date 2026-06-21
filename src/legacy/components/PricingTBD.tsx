// RID-01: Pricing TBD — replace with finalized pricing when determined
import React from 'react';

const PricingTBD: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto my-12 p-10 rounded-3xl glass-card border border-violet-500/20 text-center" dir="rtl">
      <div className="text-6xl mb-4">💼</div>
      <h2 className="text-2xl font-black text-white mb-3">تعرفه‌های اشتراک</h2>
      <p className="text-slate-300 leading-relaxed">
        تعرفه‌ها با توجه به نسخه نهایی و قابل عرضه نرم‌افزار تعیین خواهد شد.
        <br />
        برای اطلاع از قیمت‌گذاری، با تیم پشتیبانی در تماس باشید.
      </p>
      {/* TODO [RID-01]: Implement pricing tiers when finalized by product team */}
    </div>
  );
};

export default PricingTBD;
