import React from 'react';
import logoAsset from '@/assets/claim-manager-logo.png.asset.json';

interface Props {
  size?: number;
  showText?: boolean;
}

/**
 * Official ClaimAI Manager brand mark with a premium circular halo + spinning ring.
 */
const AnimatedLogo: React.FC<Props> = ({ size = 96, showText = true }) => {
  return (
    <div className="inline-flex flex-col items-center gap-4 select-none">
      <div
        className="relative animated-logo-wrap"
        style={{ width: size, height: size }}
      >
        {/* Outer rotating conic ring */}
        <span
          className="absolute -inset-3 rounded-full opacity-80 logo-ring-spin"
          style={{
            background:
              'conic-gradient(from 0deg, #1e2a78, #f0b53b, #3b82f6, #f0b53b, #1e2a78)',
            WebkitMask:
              'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
            mask: 'radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))',
          }}
          aria-hidden
        />
        {/* Soft halo */}
        <span
          className="absolute -inset-6 rounded-full bg-gradient-to-br from-[#1e2a78]/25 via-[#f0b53b]/25 to-[#3b82f6]/20 blur-3xl logo-halo"
          aria-hidden
        />
        {/* Inner subtle pulse ring */}
        <span
          className="absolute inset-0 rounded-full ring-1 ring-[#f0b53b]/40 logo-pulse"
          aria-hidden
        />
        {/* Logo image (circular) */}
        <img
          src={logoAsset.url}
          alt="ClaimAI Manager"
          width={size}
          height={size}
          className="relative w-full h-full object-cover rounded-full bg-white shadow-[0_10px_30px_-8px_rgba(30,42,120,0.45)] logo-float"
          loading="eager"
          decoding="async"
        />
      </div>

      {showText && (
        <div className="text-center leading-tight">
          <div className="hero-headline text-xl md:text-2xl tracking-tight font-black text-[#1e2a78] dark:text-white">
            Claim<span className="text-[#f0b53b]">AI</span> Manager
          </div>
          <div className="text-[10px] font-bold tracking-[0.32em] uppercase text-slate-500 dark:text-slate-400 mt-1">
            مدیر هوشمند ادعا
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimatedLogo;
