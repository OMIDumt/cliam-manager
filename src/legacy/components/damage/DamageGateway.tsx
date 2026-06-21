import React, { useState } from 'react';

export interface ManualDelayDays {
  excusable: number;
  nonExcusable: number;
  excusableCompensable: number;
  excusableNonCompensable: number;
}

interface Props {
  isDark: boolean;
  onGoToDelayAnalysis: () => void;
  onSubmitManual: (days: ManualDelayDays) => void;
}

const DamageGateway: React.FC<Props> = ({ isDark, onGoToDelayAnalysis, onSubmitManual }) => {
  const [mode, setMode] = useState<'choose' | 'manual'>('choose');
  const [days, setDays] = useState<ManualDelayDays>({
    excusable: 0, nonExcusable: 0, excusableCompensable: 0, excusableNonCompensable: 0,
  });

  const card = `rounded-2xl border p-6 ${isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white border-slate-200/70 shadow-sm'}`;
  const lbl = `block text-[11px] font-bold mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  const inp = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`;

  if (mode === 'manual') {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>ورود دستی روزهای تاخیر</h2>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          مقادیر زیر را بر حسب روز وارد کنید. این داده‌ها به‌عنوان «داده دستی» در لایحه ضرر و زیان علامت‌گذاری می‌شوند.
        </p>
        <div className={card}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {([
              ['excusable', 'تاخیرات مجاز (روز)'],
              ['nonExcusable', 'تاخیرات غیرمجاز (روز)'],
              ['excusableCompensable', 'تاخیرات مجاز قابل جبران مالی (روز)'],
              ['excusableNonCompensable', 'تاخیرات مجاز غیرقابل جبران (روز)'],
            ] as Array<[keyof ManualDelayDays, string]>).map(([k, label]) => (
              <div key={k}>
                <label className={lbl}>{label}</label>
                <input
                  type="number" min={0} className={inp}
                  value={days[k] || ''}
                  onChange={(e) => setDays({ ...days, [k]: Number(e.target.value) || 0 })}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-5">
            <button
              onClick={() => onSubmitManual(days)}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow hover:shadow-lg"
            >
              ادامه به لایحه ضرر و زیان
            </button>
            <button
              onClick={() => setMode('choose')}
              className={`py-3 px-4 rounded-xl text-sm font-bold border ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              بازگشت
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="text-center">
        <h2 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>پیش از ورود به لایحه ضرر و زیان</h2>
        <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          برای محاسبه ضرر و زیان نیاز به روزهای تاخیر تفکیک‌شده دارید. یکی از دو مسیر زیر را انتخاب کنید.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={card}>
          <div className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>مسیر ۱ — مسیر استاندارد</div>
          <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            ابتدا تحلیل تاخیرات را انجام دهید تا روزها به‌صورت خودکار محاسبه و منتقل شوند.
          </p>
          <button
            onClick={onGoToDelayAnalysis}
            className="w-full py-3 px-4 rounded-xl text-sm font-black text-white bg-gradient-to-r from-violet-600 to-indigo-600 shadow hover:shadow-lg"
          >
            ابتدا تحلیل تاخیرات انجام شود
          </button>
        </div>
        <div className={card}>
          <div className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>مسیر ۲ — ورود دستی</div>
          <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            اگر روزهای تاخیر را از پیش می‌دانید، می‌توانید مستقیماً وارد کنید. توجه: داده‌ها در لایحه با banner مشخص خواهند شد.
          </p>
          <button
            onClick={() => setMode('manual')}
            className={`w-full py-3 px-4 rounded-xl text-sm font-black border-2 ${isDark ? 'border-amber-500/40 text-amber-300 hover:bg-amber-500/10' : 'border-amber-300 text-amber-700 hover:bg-amber-50'}`}
          >
            ورود مستقیم با درج دستی
          </button>
        </div>
      </div>
    </div>
  );
};

export default DamageGateway;
