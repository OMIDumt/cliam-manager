import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import PricingTBD from './PricingTBD';

interface SubscriptionPageProps {
  onNavigate?: (page: 'main' | 'subscription') => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => onNavigate?.('main')}
            className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium transition-colors group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            بازگشت به صفحه اصلی
          </button>
          
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-bold text-indigo-700">طرح‌های اشتراک</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-slate-800 mb-4">
              طرح <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">مناسب</span> خود را انتخاب کنید
            </h1>
            
            <p className="text-slate-600 text-lg leading-relaxed">
              با انتخاب طرح مناسب، به تمام امکانات ClaimManager دسترسی داشته باشید و تحلیل‌های حرفه‌ای‌تری انجام دهید
            </p>
          </div>
        </div>

        {/* Current Subscription Info */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  user.subscriptionTier === 'PRO_PLUS' 
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                    : user.subscriptionTier === 'PRO'
                    ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
                    : 'bg-gradient-to-br from-slate-400 to-slate-600'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-500">طرح فعلی شما</p>
                  <p className="text-xl font-black text-slate-800">
                    {user.subscriptionTier === 'PRO_PLUS' 
                      ? 'حرفه‌ای پلاس (Pro+)' 
                      : user.subscriptionTier === 'PRO'
                      ? 'حرفه‌ای (Pro)'
                      : 'رایگان (Free)'}
                  </p>
                </div>
              </div>
              {user.subscriptionExpiresAt && (
                <div className="text-left">
                  <p className="text-sm text-slate-500">اعتبار تا</p>
                  <p className="text-sm font-bold text-slate-700">
                    {new Date(user.subscriptionExpiresAt).toLocaleDateString('fa-IR')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RID-01: Pricing TBD */}
        <PricingTBD />

        {/* Features Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h2 className="text-2xl font-black text-slate-800 text-center mb-8">چرا ClaimManager؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'سرعت بالا',
                description: 'تحلیل اسناد حقوقی در کمترین زمان با استفاده از هوش مصنوعی پیشرفته'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                title: 'امنیت تضمین‌شده',
                description: 'اطلاعات شما با بالاترین استانداردهای امنیتی محافظت می‌شود'
              },
              {
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: 'گزارش‌های حرفه‌ای',
                description: 'خروجی‌های متنوع و قابل ویرایش برای استفاده در پرونده‌های حقوقی'
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-2">{feature.title}</h3>
                <p className="text-slate-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 bg-slate-100 rounded-full px-6 py-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-slate-700 font-medium">سوالی دارید؟</span>
            <button className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
              با پشتیبانی تماس بگیرید
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
