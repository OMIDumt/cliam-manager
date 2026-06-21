// Centralized brand logo — uses the official ClaimManager mark.
import React from 'react';
import logoAsset from '@/assets/claim-manager-logo.png.asset.json';

interface AppLogoProps {
  variant?: 'header' | 'report' | 'splash';
  className?: string;
  onClick?: () => void;
  showWordmark?: boolean;
}

const sizes = {
  header: { box: 'h-10 w-10', text: 'text-base', sub: 'text-[10px]' },
  report: { box: 'h-14 w-14', text: 'text-lg', sub: 'text-[11px]' },
  splash: { box: 'h-20 w-20', text: 'text-2xl', sub: 'text-xs' },
};

export const AppLogo: React.FC<AppLogoProps> = ({
  variant = 'header',
  className = '',
  onClick,
  showWordmark = true,
}) => {
  const s = sizes[variant];
  return (
    <div
      className={`inline-flex items-center gap-3 cursor-pointer select-none ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? 'صفحه اصلی' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <div className={`relative ${s.box}`}>
        <span
          className="absolute -inset-1 rounded-full opacity-70"
          style={{
            background:
              'conic-gradient(from 0deg, #1e2a78, #f0b53b, #3b82f6, #1e2a78)',
            WebkitMask:
              'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
          }}
          aria-hidden
        />
        <img
          src={logoAsset.url}
          alt="ClaimAI Manager"
          className={`relative ${s.box} object-cover rounded-full bg-white ring-1 ring-[#f0b53b]/40 shadow-[0_4px_14px_-4px_rgba(15,23,42,0.35)]`}
          loading="eager"
          decoding="async"
        />
      </div>
      {showWordmark && (
        <div className="flex flex-col leading-tight">
          <span className={`font-black tracking-tight text-[#1e2a78] dark:text-white ${s.text}`}>
            نرم‌افزار جامع مدیر ادعا
            <span className="mx-1.5 text-slate-400 dark:text-slate-500">|</span>
            <span className="text-[#1e2a78] dark:text-white">Claim</span>
            <span className="text-[#f0b53b]"> Manager</span>
          </span>
          <span className={`font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 ${s.sub}`}>
            ClaimAI · مدیر هوشمند ادعا
          </span>
        </div>
      )}
    </div>
  );
};

export default AppLogo;
