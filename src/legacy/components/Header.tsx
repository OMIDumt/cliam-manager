import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AppLogo from './brand/AppLogo';

interface HeaderProps {
  onNavigate?: (page: 'main' | 'subscription' | 'delay' | 'damage-gateway' | 'damage' | 'knowledge') => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const { currentTheme, setTheme, availableThemes, theme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  const isDark = theme.isDark;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier) {
      case 'PRO_PLUS':
        return 'bg-gradient-to-r from-amber-500 to-orange-500';
      case 'PRO':
        return 'bg-gradient-to-r from-violet-500 to-indigo-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getSubscriptionName = (tier: string) => {
    switch (tier) {
      case 'PRO_PLUS':
        return 'Pro+';
      case 'PRO':
        return 'Pro';
      default:
        return 'Free';
    }
  };

  return (
    <header className={`glass-panel sticky top-0 z-50 border-b transition-all duration-300 ${isDark ? 'border-slate-700/50' : 'border-white/20'}`}>
      <div className="max-w-[1600px] mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-5">
          {/* Logo (RID-07: via AppLogo) */}
          <AppLogo variant="header" onClick={() => onNavigate?.('main')} />
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          {/* System Status */}
          <div className="flex flex-col items-end">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>وضعیت سیستم</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              </span>
              <span className="text-xs font-black text-emerald-500">آنلاین و آماده</span>
            </div>
          </div>
          
          <button
            onClick={() => onNavigate?.('knowledge')}
            className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md ${
              isDark
                ? 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border-violet-500/30 hover:border-violet-500/50'
                : 'bg-white hover:bg-violet-50 text-violet-700 border-violet-200 hover:border-violet-300'
            }`}
          >
            <span>📚</span>
            بانک دانش
          </button>

          <div className={`h-8 w-px ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>

          {/* Theme Switcher */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className={`flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md group ${
                isDark 
                  ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border-slate-700/50 hover:border-slate-600' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              تم
            </button>
            
            {showThemeMenu && (
              <div className={`absolute left-0 mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-50 ${
                isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-100'
              }`}>
                {availableThemes.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => {
                      setTheme(t.name);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full text-right px-4 py-3 text-sm font-medium transition-colors ${
                      currentTheme === t.name
                        ? isDark ? 'bg-violet-500/20 text-violet-300' : 'bg-indigo-50 text-indigo-700'
                        : isDark ? 'text-slate-300 hover:bg-slate-700/50' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${t.isDark ? 'bg-slate-800 border border-slate-600' : 'bg-white border border-slate-300'}`}></div>
                      {t.displayName}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Menu */}
          {user && (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-3 text-xs font-bold px-4 py-2.5 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md group ${
                  isDark 
                    ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 border-slate-700/50 hover:border-slate-600' 
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black text-white ${getSubscriptionBadgeColor(user.subscriptionTier)}`}>
                      {getSubscriptionName(user.subscriptionTier)}
                    </span>
                    <span className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{user.name}</span>
                  </div>
                  <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{user.email}</span>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isDark 
                    ? 'bg-violet-500/20 text-violet-400 group-hover:bg-violet-500 group-hover:text-white' 
                    : 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
              
              {showUserMenu && (
                <div className={`absolute left-0 mt-2 w-64 rounded-xl shadow-xl border overflow-hidden z-50 ${
                  isDark ? 'bg-slate-800 border-slate-700/50' : 'bg-white border-slate-100'
                }`}>
                  <div className={`p-4 border-b ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isDark ? 'bg-violet-500/20 text-violet-400' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className={`font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{user.name}</div>
                        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user.email}</div>
                        <div className={`mt-1 inline-block px-2 py-0.5 rounded text-[10px] font-black text-white ${getSubscriptionBadgeColor(user.subscriptionTier)}`}>
                          {getSubscriptionName(user.subscriptionTier)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate?.('subscription');
                      }}
                      className={`w-full text-right px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isDark 
                          ? 'text-slate-300 hover:bg-violet-500/20 hover:text-violet-300' 
                          : 'text-slate-700 hover:bg-indigo-50 hover:text-indigo-700'
                      }`}
                    >
                      مدیریت اشتراک
                    </button>
                    <button
                      onClick={logout}
                      className={`w-full text-right px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isDark ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      خروج از حساب
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
