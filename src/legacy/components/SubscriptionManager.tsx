import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionTier, SUBSCRIPTION_LIMITS } from '../types';

const SubscriptionManager: React.FC = () => {
  const { user, updateSubscription } = useAuth();

  if (!user) return null;

  const currentTier = user.subscriptionTier;

  const plans: Array<{ 
    tier: SubscriptionTier; 
    name: string; 
    nameEn: string;
    price: string; 
    features: string[]; 
    gradient: string;
    bgGradient: string;
  }> = [
    {
      tier: 'FREE',
      name: 'رایگان',
      nameEn: 'Free',
      price: 'رایگان',
      gradient: 'from-slate-400 to-slate-600',
      bgGradient: 'from-slate-50 to-slate-100',
      features: [
        `حداکثر ${SUBSCRIPTION_LIMITS.FREE.maxFilesPerAnalysis} فایل در هر تحلیل`,
        `حداکثر ${SUBSCRIPTION_LIMITS.FREE.maxFileSizeMB} مگابایت حجم فایل`,
        `${SUBSCRIPTION_LIMITS.FREE.maxAnalysesPerMonth} تحلیل در ماه`,
        'خروجی: TXT, Markdown',
      ],
    },
    {
      tier: 'PRO',
      name: 'حرفه‌ای',
      nameEn: 'Pro',
      price: '۹۹,۰۰۰ تومان/ماه',
      gradient: 'from-indigo-500 to-violet-600',
      bgGradient: 'from-indigo-50 to-violet-50',
      features: [
        `حداکثر ${SUBSCRIPTION_LIMITS.PRO.maxFilesPerAnalysis} فایل در هر تحلیل`,
        `حداکثر ${SUBSCRIPTION_LIMITS.PRO.maxFileSizeMB} مگابایت حجم فایل`,
        `${SUBSCRIPTION_LIMITS.PRO.maxAnalysesPerMonth} تحلیل در ماه`,
        'خروجی: TXT, Markdown, HTML',
        'تنظیمات پیشرفته',
        'پشتیبانی اولویت‌دار',
        'تم‌های حرفه‌ای',
        'سفارشی‌سازی گزارش',
      ],
    },
    {
      tier: 'PRO_PLUS',
      name: 'حرفه‌ای پلاس',
      nameEn: 'Pro+',
      price: '۱۹۹,۰۰۰ تومان/ماه',
      gradient: 'from-amber-400 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50',
      features: [
        'نامحدود فایل در هر تحلیل',
        `حداکثر ${SUBSCRIPTION_LIMITS.PRO_PLUS.maxFileSizeMB} مگابایت حجم فایل`,
        'تحلیل نامحدود در ماه',
        'خروجی: تمام فرمت‌ها (PDF, DOCX, HTML, ...)',
        'تمام ویژگی‌های Pro',
        'دسترسی به API',
        'پشتیبانی 24/7',
        'تم‌های سفارشی',
      ],
    },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200 p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-800 mb-2">طرح‌های اشتراک</h2>
        <p className="text-slate-600">
          طرح فعلی شما: 
          <span className={`font-bold mr-1 bg-gradient-to-r ${plans.find(p => p.tier === currentTier)?.gradient} bg-clip-text text-transparent`}>
            {plans.find(p => p.tier === currentTier)?.name}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          const tierOrder = { FREE: 0, PRO: 1, PRO_PLUS: 2 };
          const isUpgrade = tierOrder[plan.tier] > tierOrder[currentTier];
          const isDowngrade = tierOrder[plan.tier] < tierOrder[currentTier];

          return (
            <div
              key={plan.tier}
              className={`relative rounded-3xl p-6 border-2 transition-all duration-300 hover:shadow-lg ${
                isCurrent
                  ? 'border-green-400 shadow-lg shadow-green-100/50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              {/* Top Gradient Bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${plan.gradient} rounded-t-3xl`}></div>
              
              {isCurrent && (
                <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  فعال
                </div>
              )}
              
              <div className="text-center mb-6 mt-2">
                <div className={`inline-flex items-center gap-1 bg-gradient-to-r ${plan.bgGradient} rounded-full px-3 py-1 text-xs font-bold mb-3`}>
                  <span className={`bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>{plan.nameEn}</span>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">{plan.name}</h3>
                <div className={`text-2xl font-black bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>{plan.price}</div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center shrink-0 mt-0.5`}>
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => updateSubscription(plan.tier)}
                disabled={isCurrent}
                className={`w-full py-3.5 px-4 rounded-xl font-bold transition-all duration-300 ${
                  isCurrent
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : isUpgrade
                    ? `bg-gradient-to-r ${plan.gradient} text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isCurrent ? 'طرح فعلی' : isUpgrade ? 'ارتقا' : isDowngrade ? 'تغییر طرح' : 'انتخاب'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionManager;
