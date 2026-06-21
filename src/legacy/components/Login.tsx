import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { validatePhone } from '../services/smsOtp';
import PromptLibraryModal from './PromptLibraryModal';
import LandingAskBox from './LandingAskBox';
import AnimatedLogo from './brand/AnimatedLogo';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";


const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const Login: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  // RID-12: Phone number for future SMS OTP
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const { login } = useAuth();

  const validateEmail = (v: string): string | null => {
    const t = v.trim();
    if (!t) return 'لطفاً ایمیل خود را وارد کنید.';
    if (t.length > 254) return 'ایمیل بسیار طولانی است.';
    if (!EMAIL_RE.test(t)) return 'فرمت ایمیل معتبر نیست. مثال: name@example.com';
    return null;
  };
  const validateFullName = (v: string): string | null => {
    const t = v.trim();
    if (!t) return 'لطفاً نام و نام خانوادگی را وارد کنید.';
    if (t.length < 3) return 'نام وارد شده بسیار کوتاه است.';
    if (t.length > 80) return 'نام بسیار طولانی است.';
    return null;
  };
  const validatePassword = (v: string): string | null => {
    if (!v) return 'لطفاً رمز عبور را وارد کنید.';
    if (v.length < 6) return 'رمز عبور باید حداقل ۶ کاراکتر باشد.';
    if (v.length > 128) return 'رمز عبور بسیار طولانی است.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const nErr = validateFullName(fullName);
    const eErr = validateEmail(email);
    const pwErr = validatePassword(password);
    const pErr = validatePhone(phone);
    setFullNameError(nErr);
    setEmailError(eErr);
    setPasswordError(pwErr);
    setPhoneError(pErr);
    if (nErr || eErr || pwErr || pErr) return;
    setIsLoading(true);
    try {
      await login(email.trim(), password, { name: fullName.trim(), phone: phone.trim() });
    } catch (err: any) {
      setError(err?.message || 'خطا در ورود به سیستم. لطفاً دوباره تلاش کنید.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (tier: 'FREE' | 'PRO' | 'PRO_PLUS') => {
    const demoEmails = {
      FREE: 'demo@free.claimmanager.com',
      PRO: 'demo@pro.claimmanager.com',
      PRO_PLUS: 'demo@proplus.claimmanager.com',
    };
    setEmail(demoEmails[tier]);
    setPassword('demo123');
  };

  const plans = [
    {
      tier: 'FREE' as const,
      name: 'رایگان',
      nameEn: 'Free',
      price: '0',
      currency: 'تومان',
      period: '/ماه',
      description: 'برای شروع و آشنایی با سیستم',
      features: [
        { text: '5 فایل در هر تحلیل', included: true },
        { text: '10 مگابایت حجم فایل', included: true },
        { text: '10 تحلیل در ماه', included: true },
        { text: 'خروجی TXT و Markdown', included: true },
        { text: 'تنظیمات پیشرفته', included: false },
        { text: 'پشتیبانی اولویت‌دار', included: false },
      ],
      gradient: 'from-slate-500 to-slate-700',
      shadowColor: 'shadow-slate-500/20',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      tier: 'PRO' as const,
      name: 'حرفه‌ای',
      nameEn: 'Pro',
      price: '۹۹,۰۰۰',
      currency: 'تومان',
      period: '/ماه',
      description: 'برای کاربران حرفه‌ای و تیم‌های کوچک',
      popular: true,
      features: [
        { text: '25 فایل در هر تحلیل', included: true },
        { text: '50 مگابایت حجم فایل', included: true },
        { text: '100 تحلیل در ماه', included: true },
        { text: 'خروجی HTML اضافه', included: true },
        { text: 'تنظیمات پیشرفته', included: true },
        { text: 'پشتیبانی اولویت‌دار', included: true },
      ],
      gradient: 'from-indigo-600 to-violet-600',
      shadowColor: 'shadow-indigo-500/30',
      badgeColor: 'bg-indigo-100 text-indigo-700',
    },
    {
      tier: 'PRO_PLUS' as const,
      name: 'حرفه‌ای پلاس',
      nameEn: 'Pro+',
      price: '۱۹۹,۰۰۰',
      currency: 'تومان',
      period: '/ماه',
      description: 'برای سازمان‌ها و پروژه‌های بزرگ',
      features: [
        { text: 'فایل نامحدود', included: true },
        { text: '200 مگابایت حجم فایل', included: true },
        { text: 'تحلیل نامحدود', included: true },
        { text: 'تمام فرمت‌های خروجی', included: true },
        { text: 'دسترسی به API', included: true },
        { text: 'پشتیبانی 24/7', included: true },
      ],
      gradient: 'from-amber-500 to-orange-600',
      shadowColor: 'shadow-amber-500/30',
      badgeColor: 'bg-amber-100 text-amber-700',
    },
  ];

  if (showPlans) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/50 via-slate-900 to-violet-950/50"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full filter blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full filter blur-[120px] animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-amber-500/10 rounded-full filter blur-[100px] animate-pulse delay-500"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-12">
          {/* Back Button */}
          <button
            onClick={() => setShowPlans(false)}
            className="mb-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">بازگشت به ورود</span>
          </button>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-indigo-300">طرح‌های اشتراک</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              طرح مناسب خود را انتخاب کنید
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              با انتخاب طرح مناسب، به تمام امکانات ClaimManager دسترسی پیدا کنید
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={plan.tier}
                className={`relative group ${plan.popular ? 'md:-mt-4 md:mb-4' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/50">
                      محبوب‌ترین
                    </div>
                  </div>
                )}

                {/* Card */}
                <div className={`relative h-full bg-gradient-to-b from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl border transition-all duration-500 overflow-hidden ${
                  plan.popular 
                    ? 'border-indigo-500/50 shadow-2xl shadow-indigo-500/20' 
                    : 'border-slate-700/50 hover:border-slate-600/50'
                }`}>
                  {/* Glow Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${plan.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                  
                  <div className="relative p-8">
                    {/* Plan Header */}
                    <div className="mb-6">
                      <div className={`inline-flex items-center gap-2 ${plan.badgeColor} rounded-full px-3 py-1 text-xs font-bold mb-4`}>
                        {plan.nameEn}
                      </div>
                      <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                      <p className="text-slate-400 text-sm">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-8">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-5xl font-black bg-gradient-to-r ${plan.gradient} bg-clip-text text-transparent`}>
                          {plan.price}
                        </span>
                        <span className="text-slate-400 text-sm">{plan.currency}{plan.period}</span>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          {feature.included ? (
                            <div className={`w-5 h-5 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center shrink-0`}>
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                              <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                          )}
                          <span className={feature.included ? 'text-slate-200' : 'text-slate-500'}>{feature.text}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => {
                        handleDemoLogin(plan.tier);
                        setShowPlans(false);
                      }}
                      className={`w-full py-4 px-6 rounded-2xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 group/btn ${
                        plan.popular
                          ? `bg-gradient-to-r ${plan.gradient} hover:shadow-lg ${plan.shadowColor} hover:scale-[1.02]`
                          : 'bg-slate-700 hover:bg-slate-600'
                      }`}
                    >
                      <span>شروع کنید</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform group-hover/btn:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center mt-12">
            <p className="text-slate-500 text-sm">
              همه طرح‌ها شامل 7 روز استفاده رایگان هستند. لغو اشتراک در هر زمان ممکن است.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
      {/* Top Navigation Bar — Luxe */}
      <nav className="top-navbar luxe">
        <div className="nav-aurora" aria-hidden />
        <div className="nav-inner">
          <a
            href="#top"
            className="nav-brand-lux group"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <span className="nav-brand-mark">
              <span className="nav-brand-mark-inner">CM</span>
            </span>
            <span className="nav-brand-text">
              <span className="nav-brand-title">Claim<em>AI</em> Manager</span>
              <span className="nav-brand-sub">مدیر هوشمند ادعا · صنعت ساخت</span>
            </span>
          </a>

          <ul className="nav-links">
            <li><button type="button" onClick={() => document.getElementById('info-about')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>درباره ما</button></li>
            <li><button type="button" onClick={() => document.getElementById('info-terms')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>شرایط و قوانین</button></li>
            <li><button type="button" onClick={() => document.getElementById('info-faq')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>سوالات متداول</button></li>
            <li><button type="button" onClick={() => document.getElementById('info-guide')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>راهنما</button></li>
            <li><button type="button" onClick={() => document.getElementById('info-security')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>امنیت و محرمانگی</button></li>
            <li><button type="button" onClick={() => setShowPlans(true)}>قیمت</button></li>
          </ul>

          <div className="nav-cta-wrap">
            <button type="button" className="nav-cta lux" onClick={() => document.getElementById('login-form-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
              <span className="nav-cta-dot" />
              ورود / ثبت‌نام
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div className="flex flex-1">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950">
          <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-600/30 rounded-full filter blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-violet-600/30 rounded-full filter blur-[100px] animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full filter blur-[120px] animate-pulse delay-500"></div>
        </div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-start w-full p-8 lg:p-10 pt-10 text-white overflow-y-auto">
          {/* Primary H1 for SEO/a11y — visually hidden but available to crawlers and screen readers */}
          <h1 className="sr-only">ClaimAI Manager — سامانه هوشمند مدیریت ادعا و قراردادهای صنعت ساخت</h1>
          {/* Animated brand logo */}
          <div className="mb-3">
            <AnimatedLogo size={96} />
          </div>

          {/* Enterprise capability suite — primary entry points */}
          <div className="w-full max-w-5xl mt-2">
            <div className="text-center mb-5">
              <span className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.3em] uppercase text-indigo-300 bg-indigo-500/10 border border-indigo-400/30 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                core capabilities
              </span>
              <h2 className="mt-3 text-xl md:text-2xl font-black text-white">
                قابلیت‌های اصلی <span className="text-fuchsia-300">ClaimManager</span>
              </h2>
              <p className="text-xs text-slate-400 mt-2">برای استفاده از قابلیت‌های فعال، روی کارت کلیک کنید و وارد پنل کاربری شوید.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {([
                { key: 'delay',     icon: '⏱️', title: 'تحلیل تأخیرات و تهیه لایحه', desc: 'تهیه لایحه فنی - حقوقی تأخیرات', active: true,  pending: 'delay' as const },
                { key: 'damage',    icon: '💰', title: 'تحلیل خسارت و تهیه لایحه',  desc: 'تهیه لایحه فنی - حقوقی ضرر و زیان', active: true,  pending: 'damage' as const },
                { key: 'draft',     icon: '📝', title: 'تهیه و تنظیم قرارداد',        desc: 'تولید قرارداد بر اساس اطلاعات دریافتی', active: false },
                { key: 'review',    icon: '🔍', title: 'بررسی قرارداد',               desc: 'تحلیل ریسک‌های قرارداد تهیه شده',     active: false },
                { key: 'arbitrate', icon: '⚖️', title: 'قضاوت / داوری / کارشناسی',    desc: 'حل‌اختلاف دعاوی صنعت ساخت',           active: false },
                { key: 'laws',      icon: '📚', title: 'جست‌وجوی قوانین و بخشنامه‌ها', desc: 'پایگاه اطلاعات قوانین و دستورالعمل‌ها', active: false },
              ]).map((c, i) => {
                const onCardClick = () => {
                  if (!c.active || !c.pending) return;
                  try { sessionStorage.setItem('cm_pending_feature', c.pending); } catch {}
                  const el = document.getElementById('login-form-anchor');
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  const first = document.getElementById('fullName');
                  setTimeout(() => first?.focus(), 450);
                };
                return (
                  <button
                    type="button"
                    key={c.key}
                    onClick={onCardClick}
                    disabled={!c.active}
                    aria-disabled={!c.active}
                    className={`group relative text-right rounded-2xl p-5 border backdrop-blur-md transition-all duration-300 fade-in-up overflow-hidden ${
                      c.active
                        ? 'bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-fuchsia-500/10 border-indigo-400/40 hover:border-fuchsia-400/60 hover:scale-[1.02] cursor-pointer shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-900/50 border-slate-700/50 cursor-not-allowed opacity-80'
                    }`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    {c.active ? (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-black tracking-wider uppercase text-emerald-200 bg-emerald-500/20 border border-emerald-400/40 rounded-full px-2 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        فعال
                      </span>
                    ) : (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-black tracking-wider uppercase text-amber-200 bg-amber-500/15 border border-amber-400/40 rounded-full px-2 py-0.5">
                        در حال توسعه
                      </span>
                    )}
                    <div className={`text-3xl mb-3 ${c.active ? '' : 'grayscale opacity-70'}`}>{c.icon}</div>
                    <h3 className="text-white font-black text-sm md:text-base mb-1.5 leading-snug">{c.title}</h3>
                    <p className="text-slate-300 text-xs leading-6 font-medium">{c.desc}</p>
                    {c.active && (
                      <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-fuchsia-200 group-hover:text-fuchsia-100">
                        ورود و شروع
                        <svg className="w-3.5 h-3.5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>



          {/* Hero ask-box (adadai-style) */}
          <LandingAskBox variant="dark" />

          {/* ───────── What ClaimManager does for you ───────── */}
          <div className="w-full max-w-5xl mt-14">
            <div className="text-center mb-3">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                آنچه <span className="text-fuchsia-300">ClaimManager</span> برای شما انجام می‌دهد
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {[
                {
                  icon: '⏱️',
                  title: 'تحلیل تأخیرات و تهیه لایحه',
                  badge: 'تهیه لایحه فنی – حقوقی',
                  desc: 'اسناد پروژه خود را آپلود کنید و یک لایحه تأخیرات فنی، حقوقی و مستند دریافت کنید.',
                  active: true,
                },
                {
                  icon: '💰',
                  title: 'تحلیل خسارت و تهیه لایحه',
                  badge: 'تهیه لایحه فنی – حقوقی',
                  desc: 'اسناد پروژه خود را آپلود کنید و یک لایحه خسارت فنی، حقوقی و مستند دریافت کنید.',
                  active: true,
                },
                {
                  icon: '📝',
                  title: 'تهیه و تنظیم قرارداد',
                  badge: 'تهیه قرارداد بر اساس اطلاعات دریافتی',
                  desc: 'اطلاعات پروژه و ذی‌نفعان را وارد کنید تا یک قرارداد استاندارد و قابل ویرایش برای پروژه خود دریافت کنید.',
                  active: false,
                },
                {
                  icon: '🔍',
                  title: 'بررسی قرارداد',
                  badge: 'تحلیل ریسک‌های قرارداد تهیه شده',
                  desc: 'قرارداد خود را آپلود کنید تا ریسک‌ها را بشناسید و بر اساس پیشنهادات، آن را بهبود دهید.',
                  active: false,
                },
                {
                  icon: '⚖️',
                  title: 'قضاوت / داوری / کارشناسی دعاوی',
                  badge: 'حل‌اختلاف دعاوی ساخت',
                  desc: 'اطلاعات دعاوی خود را وارد کنید تا منصفانه و عادلانه، نتیجه نهایی آن مورد کارشناسی، داوری و قضاوت قرار گیرد.',
                  active: false,
                },
                {
                  icon: '📚',
                  title: 'جست‌وجوی قوانین، بخشنامه‌ها و دستورالعمل‌ها',
                  badge: 'پایگاه اطلاعات',
                  desc: 'مجموعه‌ای از قوانین، بخشنامه‌ها، قراردادها، دستورالعمل‌ها و استفساریه‌ها در مراجع داخلی و بین‌المللی.',
                  active: false,
                },
              ].map((f, idx) => (
                <div
                  key={f.title}
                  className={`relative group rounded-2xl p-5 border backdrop-blur-md transition-all duration-300 fade-in-up text-right ${
                    f.active
                      ? 'bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-fuchsia-500/10 border-indigo-400/40 hover:border-fuchsia-400/60 hover:shadow-lg hover:shadow-indigo-500/10'
                      : 'bg-slate-900/50 border-slate-700/50 opacity-90'
                  }`}
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  {f.active ? (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-black tracking-wider uppercase text-emerald-200 bg-emerald-500/20 border border-emerald-400/40 rounded-full px-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      فعال
                    </span>
                  ) : (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[10px] font-black tracking-wider uppercase text-amber-200 bg-amber-500/15 border border-amber-400/40 rounded-full px-2 py-0.5">
                      در حال توسعه
                    </span>
                  )}
                  <div className={`text-3xl mb-3 ${f.active ? '' : 'grayscale opacity-70'}`}>{f.icon}</div>
                  <h3 className="text-white font-black text-sm md:text-base mb-1 leading-snug">{f.title}</h3>
                  <p className="text-[11px] font-bold text-indigo-300 mb-2">{f.badge}</p>
                  <p className="text-slate-300 text-xs leading-6 font-medium">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>


          {/* ───────── Who is ClaimManager for ───────── */}
          <div className="w-full max-w-5xl mt-14">
            <div className="text-center mb-3">
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                <span className="text-fuchsia-300">ClaimManager</span> برای چه کسانی است؟
              </h2>
            </div>
            <p className="text-center text-sm text-slate-300 max-w-3xl mx-auto leading-7 mb-8">
              ClaimManager برای متخصصان حرفه‌ای صنعت ساخت طراحی شده است. فرقی نمی‌کند متخصص ادعا، کارشناس داوری، وکیل دعاوی یا مدیر پروژه هستید — ابزارهای هوشمند ما در کنار شماست.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: '📋',
                  title: 'متخصصان ادعا و قراردادهای ساخت',
                  desc: 'مدیریت حرفه‌ای ادعاها، تحلیل دقیق تأخیرات و بررسی تخصصی قراردادها با ابزارهای یکپارچه و هوشمند.',
                  color: 'text-sky-400',
                },
                {
                  icon: '⚖️',
                  title: 'کارشناسان، داوران و وکلای حوزه ساخت',
                  desc: 'تسریع در فرآیندهای داوری، کارشناسی و وکالت دعاوی ساختمانی با پشتیبانی فنی و حقوقی مبتنی بر داده.',
                  color: 'text-amber-400',
                },
                {
                  icon: '🏗️',
                  title: 'شرکت‌های پیمانکاری و کارفرمایی',
                  desc: 'مدیریت بهینه قراردادها، کاهش ریسک‌های حقوقی و تسریع در حل‌و‌فصل اختلافات پروژه در مقیاس سازمانی.',
                  color: 'text-emerald-400',
                },
              ].map((p, idx) => (
                <div
                  key={p.title}
                  className="relative group rounded-2xl p-5 bg-slate-900/70 backdrop-blur-md border border-slate-700/60 hover:border-indigo-400/50 hover:shadow-[0_8px_32px_-8px_rgba(99,102,241,0.4)] transition-all duration-300 fade-in-up text-center"
                  style={{ animationDelay: `${idx * 90}ms` }}
                >
                  <div className={`text-4xl mb-3 ${p.color} drop-shadow-lg`}>{p.icon}</div>
                  <h3 className="text-white font-black text-base mb-2">{p.title}</h3>
                  <div className="w-10 h-[2px] bg-gradient-to-l from-indigo-400 to-fuchsia-400 mx-auto mb-3 rounded-full" />
                  <p className="text-slate-300 text-xs leading-6 font-medium">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>


      {/* Right Side - Login Form */}
      <div id="login-form-anchor" className="w-full lg:w-1/2 flex items-center justify-center p-8 relative scroll-mt-20">
        {/* Subtle Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-[#0a0a0f]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full filter blur-[100px]"></div>

        <div className="relative z-10 w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <AnimatedLogo size={88} />
          </div>

          {/* Welcome / Tagline */}
          <div className="mb-8 brand-tagline">
            <h2 className="tagline-display">
              جایی که دانش فنی - حقوقی با هوشمندی یکی می‌شود
            </h2>
          </div>


          {/* Login Form */}
          <div className="glass-premium ring-gradient rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase text-emerald-300 bg-emerald-500/10 border border-emerald-400/30 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                secure login
              </span>
            </div>
            <h3 className="hero-headline text-2xl text-shimmer text-center mb-6">ورود به سامانه</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Full name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-bold text-slate-100 mb-2">
                  نام و نام خانوادگی *
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); if (fullNameError) setFullNameError(null); }}
                  onBlur={() => setFullNameError(validateFullName(fullName))}
                  required
                  maxLength={80}
                  autoComplete="name"
                  placeholder="مثلاً: علی رضایی"
                  aria-invalid={!!fullNameError}
                  className={`input-premium w-full px-5 py-4 text-white placeholder-slate-300 text-right ${fullNameError ? 'ring-2 ring-red-500/60 border-red-500/60' : ''}`}
                />
                {fullNameError && (
                  <p className="mt-2 text-xs font-medium text-red-400 flex items-center gap-1">
                    <span aria-hidden>⚠️</span>{fullNameError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-100 mb-2">
                  ایمیل
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                    onBlur={() => setEmailError(validateEmail(email))}
                    required
                    autoComplete="email"
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'email-error' : undefined}
                    className={`input-premium w-full pl-12 pr-5 py-4 text-white placeholder-slate-300 ${emailError ? 'ring-2 ring-red-500/60 border-red-500/60' : ''}`}
                    placeholder="example@domain.com"
                    dir="ltr"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${emailError ? 'text-red-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                {emailError && (
                  <p id="email-error" className="mt-2 text-xs font-medium text-red-400 flex items-center gap-1">
                    <span aria-hidden>⚠️</span>{emailError}
                  </p>
                )}
              </div>

              {/* RID-12: Phone number field */}
              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-slate-100 mb-2">
                  شماره تماس *
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  onBlur={() => setPhoneError(validatePhone(phone))}
                  required
                  maxLength={11}
                  autoComplete="tel"
                  dir="ltr"
                  placeholder="09121234567"
                  className="input-premium w-full px-5 py-4 text-white placeholder-slate-300 text-left"
                />
                {phoneError && (
                  <p className="mt-2 text-sm font-medium" style={{ color: '#d32f2f' }}>
                    {phoneError}
                  </p>
                )}
              </div>


              <div>
                <label htmlFor="password" className="block text-sm font-bold text-slate-100 mb-2">
                  رمز عبور
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(null); }}
                    onBlur={() => setPasswordError(validatePassword(password))}
                    required
                    minLength={6}
                    autoComplete="current-password"
                    aria-invalid={!!passwordError}
                    aria-describedby={passwordError ? 'password-error' : undefined}
                    className={`input-premium w-full px-5 py-4 pl-20 text-white placeholder-slate-300 ${passwordError ? 'ring-2 ring-red-500/60 border-red-500/60' : ''}`}
                    placeholder="حداقل ۶ کاراکتر"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute left-12 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-indigo-300 px-1.5 py-0.5 rounded"
                    aria-label={showPassword ? 'پنهان کردن رمز' : 'نمایش رمز'}
                  >
                    {showPassword ? 'پنهان' : 'نمایش'}
                  </button>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${passwordError ? 'text-red-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                {passwordError ? (
                  <p id="password-error" className="mt-2 text-xs font-medium text-red-400 flex items-center gap-1">
                    <span aria-hidden>⚠️</span>{passwordError}
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-500">حداقل ۶ کاراکتر — ترکیب حروف و عدد توصیه می‌شود.</p>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`btn-glow w-full py-4 px-6 rounded-2xl font-black text-white text-base transition-transform duration-300 ${
                  isLoading ? 'cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    در حال ورود...
                  </span>
                ) : (
                  <span className="relative z-10">ورود به سیستم</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-slate-800/50 px-4 text-slate-500 font-medium">یا</span>
              </div>
            </div>

            {/* Demo Accounts */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-4 text-center tracking-wider">ورود با حساب آزمایشی</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('FREE')}
                  className="px-3 py-3 text-sm font-bold text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-xl transition-all hover:scale-105 border border-slate-600/50"
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('PRO')}
                  className="px-3 py-3 text-sm font-bold text-indigo-300 bg-indigo-900/30 hover:bg-indigo-900/50 rounded-xl transition-all hover:scale-105 border border-indigo-500/30"
                >
                  Pro
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('PRO_PLUS')}
                  className="px-3 py-3 text-sm font-bold text-amber-300 bg-amber-900/30 hover:bg-amber-900/50 rounded-xl transition-all hover:scale-105 border border-amber-500/30"
                >
                  Pro+
                </button>
              </div>
            </div>
          </div>

          {/* View Plans Link */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowPlans(true)}
              className="text-indigo-400 hover:text-indigo-300 font-medium text-sm transition-colors flex items-center justify-center gap-2 mx-auto group"
            >
              <span>مشاهده طرح‌های اشتراک</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 mt-6">
            با ورود به سیستم، شما قوانین و مقررات استفاده را می‌پذیرید
          </p>
        </div>
      </div>
      </div>

      {/* ─── FAQ Section ─── */}
      <section id="info-faq" className="max-w-5xl mx-auto px-6 py-16 scroll-mt-24">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.25em] uppercase text-indigo-300 bg-indigo-500/10 border border-indigo-400/30 rounded-full px-4 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            FAQ
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white">سوالات متداول</h2>
          <p className="text-sm text-slate-400 mt-3 max-w-2xl mx-auto leading-7">
            پاسخ جامع و تخصصی به پرسش‌های رایج در حوزه تحلیل تاخیرات، محاسبه خسارت، مراجع حقوقی و نحوه استفاده از سامانه
          </p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-700/50 rounded-3xl p-6 md:p-8">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="faq-1" className="border-slate-700/50">
              <AccordionTrigger className="text-white text-sm md:text-base font-bold hover:no-underline hover:text-indigo-300 transition-colors [&>svg]:text-slate-400">
                روش‌های تحلیل تاخیرات چیست و چه تفاوتی دارند؟
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 text-sm leading-7 text-right">
                ClaimManager از ۸ روش استاندارد بین‌المللی و قراردادی پشتیبانی می‌کند:
                <ul className="list-disc list-inside space-y-1 mt-2 pr-2">
                  <li><strong className="text-indigo-300">جمع جبری تاخیرات (SUM)</strong> — ساده‌ترین روش بدون نیاز به برنامه زمان‌بندی.</li>
                  <li><strong className="text-indigo-300">گانت چارت (Gantt Chart)</strong> — نمایش گرافیکی با رعایت هم‌پوشانی.</li>
                  <li><strong className="text-indigo-300">آینده‌نگر ساده (IAP)</strong> — اعمال تاخیرات به ترتیب روی برنامه اولیه.</li>
                  <li><strong className="text-indigo-300">آینده‌نگر پیشرفته (TIA)</strong> — اعمال روی آخرین برنامه به‌روز شده.</li>
                  <li><strong className="text-indigo-300">گذشته‌نگر ساده (AP vs AB)</strong> — مقایسه مشاهده‌ای برنامه اولیه و چون‌ساخت.</li>
                  <li><strong className="text-indigo-300">گذشته‌نگر نیمه‌ساده (CAB)</strong> — حذف تاخیرات از As-Built.</li>
                  <li><strong className="text-indigo-300">گذشته‌نگر پیشرفته (WA)</strong> — تحلیل پنجره‌به‌پنجره.</li>
                  <li><strong className="text-indigo-300">روش قرارداد</strong> — استخراج مبنای تحلیل از متن قرارداد.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-2" className="border-slate-700/50">
              <AccordionTrigger className="text-white text-sm md:text-base font-bold hover:no-underline hover:text-indigo-300 transition-colors [&>svg]:text-slate-400">
                روش‌های محاسبه خسارت و ضرر و زیان چگونه است؟
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 text-sm leading-7 text-right">
                سیستم بر اساس مبانی حقوقی و فنی، خسارات مستقیم (Direct Costs)، غیرمستقیم (Indirect Costs / Overheads)، سود از دست رفته (Loss of Profit)، هزینه‌های تأمین مالی (Financing Costs) و هزینه‌های بیکاری نیرو و تجهیزات (Idling Costs) را محاسبه و در قالب لایحه فنی-حقوقی مستندسازی می‌کند. تمام محاسبات با استناد به متن قرارداد و قوانین معتبر صورت می‌پذیرد.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-3" className="border-slate-700/50">
              <AccordionTrigger className="text-white text-sm md:text-base font-bold hover:no-underline hover:text-indigo-300 transition-colors [&>svg]:text-slate-400">
                مراجع حقوقی و قراردادی مورد استفاده در گزارش‌ها کدام‌اند؟
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 text-sm leading-7 text-right">
                گزارش‌ها با استناد به قوانین و مقررات داخلی شامل قانون مدنی، آیین‌دادرسی مدنی، قانون کار، قانون محاسبات عمومی و همچنین مقررات بین‌المللی نظیر FIDIC (نمونه‌های ۱۹۹۹ و ۲۰۱۷)، NEC4 و ICC و با لحاظ دقیق متن قرارداد خاص پروژه تنظیم و استدلال‌بندی می‌شوند.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-4" className="border-slate-700/50">
              <AccordionTrigger className="text-white text-sm md:text-base font-bold hover:no-underline hover:text-indigo-300 transition-colors [&>svg]:text-slate-400">
                فرمت فایل‌های قابل قبول برای آپلود چیست؟
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 text-sm leading-7 text-right">
                فرمت‌های PDF، DOC/DOCX، XLS/XLSX، JPG/PNG و ZIP (فشرده) پذیرفته می‌شوند. حداکثر حجم فایل بسته به طرح اشتراک از ۱۰ مگابایت (طرح رایگان) تا ۲۰۰ مگابایت (طرح سازمانی) متغیر است.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-5" className="border-slate-700/50">
              <AccordionTrigger className="text-white text-sm md:text-base font-bold hover:no-underline hover:text-indigo-300 transition-colors [&>svg]:text-slate-400">
                محدودیت‌های طرح‌های اشتراک چیست؟
              </AccordionTrigger>
              <AccordionContent className="text-slate-300 text-sm leading-7 text-right">
                <ul className="list-disc list-inside space-y-1 mt-2 pr-2">
                  <li><strong className="text-indigo-300">طرح رایگان:</strong> ۵ فایل در هر تحلیل، حجم ۱۰ مگابایت، ۱۰ تحلیل در ماه.</li>
                  <li><strong className="text-indigo-300">طرح حرفه‌ای:</strong> ۲۵ فایل در هر تحلیل، حجم ۵۰ مگابایت، ۱۰۰ تحلیل در ماه.</li>
                  <li><strong className="text-indigo-300">طرح سازمانی:</strong> فایل و تحلیل نامحدود، حجم ۲۰۰ مگابایت، دسترسی API و پشتیبانی ۲۴/۷.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* ─── About Section ─── */}
      <section id="info-about" className="max-w-5xl mx-auto px-6 py-16 scroll-mt-24">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.25em] uppercase text-indigo-300 bg-indigo-500/10 border border-indigo-400/30 rounded-full px-4 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            About Us
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-white">درباره ما</h2>
        </div>
        <div className="bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-fuchsia-500/10 backdrop-blur-md border border-indigo-400/20 rounded-3xl p-8 md:p-10 text-center">
          <p className="text-slate-200 text-base md:text-lg leading-8 font-medium max-w-3xl mx-auto">
            تیمی از متخصصان حقوق ساخت و مهندسان داده با هدف کاهش زمان و هزینه و افزایش دقت مدیریت ادعاهای صنعت ساخت برای پیمانکاران، کارفرمایان و فعالان این حوزه.
          </p>
        </div>
      </section>

      {/* Info sections (anchored by top navbar) */}
      <section className="info-sections">
        {[
          { id: 'info-security', title: 'امنیت و محرمانگی', body: 'تمامی اسناد در محیط امن پردازش می‌شوند. داده‌های شما متعلق به خودتان است؛ بدون اشتراک‌گذاری با اشخاص ثالث و با رمزنگاری در حال انتقال و در حال ذخیره.' },
          { id: 'info-guide', title: 'راهنمای استفاده', body: 'پروژه بسازید، اسناد قراردادی و برنامه‌های زمانبندی را آپلود کنید، روش تحلیل را انتخاب کرده و گزارش حرفه‌ای دریافت کنید. در هر مرحله از چت هوش مصنوعی کمک بگیرید.' },
          { id: 'info-terms', title: 'شرایط و قوانین', body: 'استفاده از پلتفرم منوط به پذیرش شرایط خدمات است. خروجی‌های هوش مصنوعی جنبه مشورتی دارند و جایگزین مشاوره حقوقی رسمی نیستند.' },
        ].map((s) => (
          <div key={s.id} id={s.id} className="info-card">
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </div>
        ))}
      </section>
    </div>


  );
};

export default Login;
