import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionTier, SUBSCRIPTION_LIMITS } from '../types';

interface PricingPlansProps {
  onSelectPlan?: (tier: SubscriptionTier) => void;
  showCurrentBadge?: boolean;
}

const PricingPlans: React.FC<PricingPlansProps> = ({ onSelectPlan, showCurrentBadge = true }) => {
  const { user, updateSubscription } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  const currentTier = user?.subscriptionTier || 'FREE';

  const plans = [
    {
      tier: 'FREE' as SubscriptionTier,
      name: 'رایگان',
      nameEn: 'Free',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: 'برای شروع و آشنایی با سیستم',
      features: [
        { text: `${SUBSCRIPTION_LIMITS.FREE.maxFilesPerAnalysis} فایل در هر تحلیل`, included: true, highlight: false },
        { text: `${SUBSCRIPTION_LIMITS.FREE.maxFileSizeMB} مگابایت حجم فایل`, included: true, highlight: false },
        { text: `${SUBSCRIPTION_LIMITS.FREE.maxAnalysesPerMonth} تحلیل در ماه`, included: true, highlight: false },
        { text: 'خروجی TXT و Markdown', included: true, highlight: false },
        { text: 'تنظیمات پیشرفته', included: false, highlight: false },
        { text: 'پشتیبانی اولویت‌دار', included: false, highlight: false },
        { text: 'تم‌های سفارشی', included: false, highlight: false },
        { text: 'دسترسی به API', included: false, highlight: false },
      ],
      gradient: 'from-slate-400 to-slate-600',
      bgGradient: 'from-slate-50 to-slate-100',
      borderColor: 'border-slate-200',
      accentColor: 'slate',
      shadowColor: 'shadow-slate-200/50',
    },
    {
      tier: 'PRO' as SubscriptionTier,
      name: 'حرفه‌ای',
      nameEn: 'Pro',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      monthlyPrice: 99000,
      yearlyPrice: 990000,
      description: 'برای کاربران حرفه‌ای و تیم‌های کوچک',
      popular: true,
      features: [
        { text: `${SUBSCRIPTION_LIMITS.PRO.maxFilesPerAnalysis} فایل در هر تحلیل`, included: true, highlight: true },
        { text: `${SUBSCRIPTION_LIMITS.PRO.maxFileSizeMB} مگابایت حجم فایل`, included: true, highlight: true },
        { text: `${SUBSCRIPTION_LIMITS.PRO.maxAnalysesPerMonth} تحلیل در ماه`, included: true, highlight: true },
        { text: 'خروجی HTML اضافه', included: true, highlight: false },
        { text: 'تنظیمات پیشرفته', included: true, highlight: true },
        { text: 'پشتیبانی اولویت‌دار', included: true, highlight: false },
        { text: 'تم‌های سفارشی', included: true, highlight: false },
        { text: 'دسترسی به API', included: false, highlight: false },
      ],
      gradient: 'from-indigo-500 to-violet-600',
      bgGradient: 'from-indigo-50 to-violet-50',
      borderColor: 'border-indigo-200',
      accentColor: 'indigo',
      shadowColor: 'shadow-indigo-200/50',
    },
    {
      tier: 'PRO_PLUS' as SubscriptionTier,
      name: 'حرفه‌ای پلاس',
      nameEn: 'Pro+',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      monthlyPrice: 199000,
      yearlyPrice: 1990000,
      description: 'برای سازمان‌ها و پروژه‌های بزرگ',
      features: [
        { text: 'فایل نامحدود', included: true, highlight: true },
        { text: `${SUBSCRIPTION_LIMITS.PRO_PLUS.maxFileSizeMB} مگابایت حجم فایل`, included: true, highlight: true },
        { text: 'تحلیل نامحدود', included: true, highlight: true },
        { text: 'تمام فرمت‌های خروجی', included: true, highlight: true },
        { text: 'تنظیمات پیشرفته', included: true, highlight: false },
        { text: 'پشتیبانی 24/7', included: true, highlight: true },
        { text: 'تم‌های سفارشی', included: true, highlight: false },
        { text: 'دسترسی به API', included: true, highlight: true },
      ],
      gradient: 'from-amber-400 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50',
      borderColor: 'border-amber-200',
      accentColor: 'amber',
      shadowColor: 'shadow-amber-200/50',
    },
  ];

  const formatPrice = (price: number) => {
    if (price === 0) return 'رایگان';
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const handleSelectPlan = (tier: SubscriptionTier) => {
    if (onSelectPlan) {
      onSelectPlan(tier);
    } else {
      updateSubscription(tier);
    }
  };

  const getButtonText = (planTier: SubscriptionTier) => {
    if (planTier === currentTier) return 'طرح فعلی';
    
    const tierOrder = { FREE: 0, PRO: 1, PRO_PLUS: 2 };
    if (tierOrder[planTier] > tierOrder[currentTier]) {
      return 'ارتقا به این طرح';
    }
    return 'تغییر به این طرح';
  };

  return (
    <div className="py-8">
      {/* Period Toggle */}
      <div className="flex justify-center mb-12">
        <div className="relative inline-flex items-center p-1.5 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setSelectedPeriod('monthly')}
            className={`relative px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
              selectedPeriod === 'monthly'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            ماهانه
          </button>
          <button
            onClick={() => setSelectedPeriod('yearly')}
            className={`relative px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${
              selectedPeriod === 'yearly'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            سالانه
            <span className="bg-green-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              ۲ ماه رایگان
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        {plans.map((plan, index) => {
          const isCurrent = plan.tier === currentTier;
          const isHovered = hoveredPlan === plan.tier;
          const price = selectedPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;

          return (
            <div
              key={plan.tier}
              className={`relative transform transition-all duration-500 ${
                plan.popular ? 'md:-mt-6 md:mb-6 z-10' : ''
              } ${isHovered ? 'scale-[1.02]' : ''}`}
              onMouseEnter={() => setHoveredPlan(plan.tier)}
              onMouseLeave={() => setHoveredPlan(null)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <div className="relative">
                    <div className={`absolute inset-0 bg-gradient-to-r ${plan.gradient} rounded-full blur-md opacity-60`}></div>
                    <div className={`relative bg-gradient-to-r ${plan.gradient} text-white text-xs font-black px-5 py-2 rounded-full shadow-lg`}>
                      ✨ پرطرفدار
                    </div>
                  </div>
                </div>
              )}

              {/* Current Plan Badge */}
              {showCurrentBadge && isCurrent && (
                <div className="absolute -top-3 right-4 z-20">
                  <div className="bg-green-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    فعال
                  </div>
                </div>
              )}

              {/* Card */}
              <div className={`relative h-full bg-white rounded-3xl border-2 overflow-hidden transition-all duration-500 ${
                plan.popular 
                  ? `${plan.borderColor} shadow-2xl ${plan.shadowColor}` 
                  : isCurrent
                  ? 'border-green-300 shadow-xl shadow-green-100/50'
                  : 'border-slate-200 hover:border-slate-300 shadow-lg hover:shadow-xl'
              }`}>
                {/* Decorative Top Gradient */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${plan.gradient}`}></div>
                
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
                  backgroundSize: '24px 24px'
                }}></div>

                <div className="relative p-8">
                  {/* Plan Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.bgGradient} mb-4`}>
                        <div className={`bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                          {plan.icon}
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 mb-1">{plan.name}</h3>
                      <span className={`text-sm font-bold bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                        {plan.nameEn}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-500 text-sm mb-6">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-black bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                        {formatPrice(price)}
                      </span>
                      {price > 0 && (
                        <span className="text-slate-400 text-sm font-medium">
                          تومان / {selectedPeriod === 'monthly' ? 'ماه' : 'سال'}
                        </span>
                      )}
                    </div>
                    {selectedPeriod === 'yearly' && price > 0 && (
                      <p className="text-green-600 text-sm font-bold mt-2">
                        صرفه‌جویی {formatPrice(plan.monthlyPrice * 2)} تومان
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center shrink-0 mt-0.5`}>
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                        <span className={`text-sm ${
                          feature.included 
                            ? feature.highlight 
                              ? 'text-slate-800 font-bold' 
                              : 'text-slate-600' 
                            : 'text-slate-400'
                        }`}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleSelectPlan(plan.tier)}
                    disabled={isCurrent}
                    className={`w-full py-4 px-6 rounded-2xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : plan.popular
                        ? `bg-gradient-to-r ${plan.gradient} text-white hover:shadow-lg ${plan.shadowColor} hover:scale-[1.02] active:scale-[0.98]`
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    <span>{getButtonText(plan.tier)}</span>
                    {!isCurrent && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Features Comparison */}
      <div className="mt-16 max-w-4xl mx-auto px-4">
        <h3 className="text-2xl font-black text-slate-800 text-center mb-8">مقایسه ویژگی‌ها</h3>
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-right py-4 px-6 font-bold text-slate-700">ویژگی</th>
                  {plans.map(plan => (
                    <th key={plan.tier} className="py-4 px-6 text-center">
                      <span className={`font-black bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                        {plan.nameEn}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'تعداد فایل در تحلیل', values: ['5', '25', 'نامحدود'] },
                  { name: 'حجم فایل', values: ['10MB', '50MB', '200MB'] },
                  { name: 'تحلیل ماهانه', values: ['10', '100', 'نامحدود'] },
                  { name: 'خروجی PDF/DOCX', values: [false, false, true] },
                  { name: 'تنظیمات پیشرفته', values: [false, true, true] },
                  { name: 'دسترسی API', values: [false, false, true] },
                  { name: 'پشتیبانی اولویت‌دار', values: [false, true, true] },
                  { name: 'تم‌های سفارشی', values: [false, true, true] },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 last:border-0">
                    <td className="py-4 px-6 font-medium text-slate-700">{row.name}</td>
                    {row.values.map((value, vIdx) => (
                      <td key={vIdx} className="py-4 px-6 text-center">
                        {typeof value === 'boolean' ? (
                          value ? (
                            <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100">
                              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                          )
                        ) : (
                          <span className="font-bold text-slate-600">{value}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* FAQ or Note */}
      <div className="mt-12 text-center">
        <p className="text-slate-500 text-sm">
          سوالی دارید؟ با پشتیبانی ما تماس بگیرید. تمام طرح‌ها شامل ۷ روز گارانتی بازگشت وجه هستند.
        </p>
      </div>
    </div>
  );
};

export default PricingPlans;

