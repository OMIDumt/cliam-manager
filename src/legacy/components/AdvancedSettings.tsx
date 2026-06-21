import React from 'react';
import { AnalysisSettings } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface AdvancedSettingsProps {
  settings: AnalysisSettings;
  onSettingsChange: (newSettings: AnalysisSettings) => void;
  disabled: boolean;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ settings, onSettingsChange, disabled }) => {
  const { theme } = useTheme();
  const isDark = theme.isDark;
  
  const handleChange = (field: keyof AnalysisSettings, value: string | boolean) => {
    onSettingsChange({
      ...settings,
      [field]: value
    });
  };

  return (
    <div className={`glass-card rounded-2xl shadow-xl overflow-hidden border ${
      isDark ? 'border-slate-700/50' : 'border-slate-200/50'
    }`}>
      <div className={`p-5 border-b ${
        isDark 
          ? 'bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-slate-700/50' 
          : 'bg-gradient-to-r from-slate-50 to-white border-slate-100'
      }`}>
        <h2 className={`text-base font-black flex items-center gap-2 ${
          isDark ? 'text-white' : 'text-slate-800'
        }`}>
          <span className={`p-1.5 rounded-lg ${
            isDark 
              ? 'bg-orange-500/20 text-orange-400' 
              : 'bg-orange-100 text-orange-600'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </span>
          پارامترهای تحلیل هوشمند
        </h2>
      </div>

      <div className="p-5 space-y-5">
        <div className="space-y-1.5">
          <label className={`text-xs font-bold block ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            تمرکز بر کلمات کلیدی
          </label>
          <input
            type="text"
            value={settings.focusKeywords}
            onChange={(e) => handleChange('focusKeywords', e.target.value)}
            disabled={disabled}
            placeholder="مثال: تعلیق، ماده ۴۸، صورت وضعیت قطعی"
            className={`w-full rounded-xl transition-all text-sm p-3 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500/20 ${
              isDark
                ? 'bg-slate-800/50 border-slate-700/50 text-white focus:bg-slate-800 focus:border-violet-500'
                : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'
            } border`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1.5">
            <label className={`text-xs font-bold block ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              بخش‌های ویژه (فیلتر)
            </label>
            <input
              type="text"
              value={settings.specificSections}
              onChange={(e) => handleChange('specificSections', e.target.value)}
              disabled={disabled}
              placeholder="مثال: فصل سوم، پیوست مالی"
              className={`w-full rounded-xl transition-all text-sm p-3 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500/20 ${
                isDark
                  ? 'bg-slate-800/50 border-slate-700/50 text-white focus:bg-slate-800 focus:border-violet-500'
                  : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'
              } border`}
            />
          </div>

          <div className="space-y-1.5">
            <label className={`text-xs font-bold block ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}>
              نادیده گرفتن بخش‌ها
            </label>
            <input
              type="text"
              value={settings.excludeSections}
              onChange={(e) => handleChange('excludeSections', e.target.value)}
              disabled={disabled}
              placeholder="مثال: نقشه‌ها، لیست پرسنل"
              className={`w-full rounded-xl transition-all text-sm p-3 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500/20 ${
                isDark
                  ? 'bg-slate-800/50 border-slate-700/50 text-white focus:bg-slate-800 focus:border-violet-500'
                  : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500'
              } border`}
            />
          </div>
        </div>

        <div className={`pt-2 border-t ${
          isDark ? 'border-slate-700/50' : 'border-slate-100'
        } flex items-center justify-between ${disabled ? 'opacity-50' : 'group cursor-pointer'}`} 
        onClick={() => !disabled && handleChange('strictMode', !settings.strictMode)}>
          <div className="flex flex-col flex-1">
             <div className="flex items-center gap-2">
               <span className={`text-sm font-bold ${
                 isDark ? 'text-white' : 'text-slate-800'
               }`}>حالت سخت‌گیرانه حقوقی</span>
               {disabled && (
                 <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                   isDark 
                     ? 'bg-amber-500/20 text-amber-400' 
                     : 'bg-amber-100 text-amber-700'
                 }`}>Pro</span>
               )}
             </div>
             <span className={`text-[10px] ${
               isDark ? 'text-slate-400' : 'text-slate-400'
             }`}>فقط عبارات صریح و مستند استخراج شوند (بدون استنتاج)</span>
             {disabled && (
               <span className={`text-[10px] font-bold mt-1 ${
                 isDark ? 'text-amber-400' : 'text-amber-600'
               }`}>این ویژگی فقط برای کاربران Pro در دسترس است</span>
             )}
          </div>
          <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${
            disabled 
              ? isDark ? 'bg-slate-700 cursor-not-allowed' : 'bg-slate-200 cursor-not-allowed'
              : settings.strictMode 
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600' 
                : isDark ? 'bg-slate-700' : 'bg-slate-200'
          }`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out shadow-lg ${
              settings.strictMode ? '-translate-x-6' : '-translate-x-1'
            }`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSettings;
