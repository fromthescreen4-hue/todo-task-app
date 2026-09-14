import React, { useState, useEffect } from 'react';

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Smooth progress loading bar (0% -> 100%)
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.floor(Math.random() * 14 + 10);
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setFadeOut(true);
            setTimeout(() => {
              if (onFinish) onFinish();
            }, 650); // 650ms smooth transition out
          }, 150);
          return 100;
        }
        return next;
      });
    }, 90);

    return () => clearInterval(interval);
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white text-slate-800 transition-all duration-700 ease-in-out ${
        fadeOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Premium Coral & Rose Gradient Radial Canvas */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-100/50 via-white to-slate-50/80 pointer-events-none" />

      {/* Floating Ambient Glowing Halo matching Logo (#ff7052 / coral orange) */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-[#ff7052]/20 via-orange-300/15 to-rose-300/15 blur-3xl animate-coral-glow pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[380px] h-[380px] rounded-full bg-gradient-to-tl from-rose-200/20 via-amber-200/15 to-transparent blur-3xl animate-float-slow pointer-events-none" />

      {/* Main Glass Card & Branding Container */}
      <div className="relative flex flex-col items-center space-y-7 z-10 px-4 animate-logo-entrance max-w-xs sm:max-w-sm w-full">
        
        {/* Premium Glassmorphic Logo Card */}
        <div className="relative p-8 sm:p-10 bg-white/95 backdrop-blur-2xl border border-orange-100/80 rounded-3xl shadow-[0_25px_60px_-15px_rgba(255,107,87,0.18)] flex items-center justify-center group overflow-hidden transition-all duration-500 hover:shadow-[0_30px_70px_-12px_rgba(255,107,87,0.25)] hover:-translate-y-1">
          
          {/* Coral Ambient Outer Glow Ring */}
          <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-[#ff7052]/30 via-orange-400/25 to-rose-400/30 blur-lg animate-coral-glow" />
          
          {/* Shimmer Reflection Ray */}
          <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-shimmer-sweep pointer-events-none z-20" />

          {/* DO THIS Logo with Floating Physics */}
          <div className="relative z-10 animate-logo-float">
            <img 
              src="/dothis-logo.png" 
              alt="DO THIS Logo" 
              className="h-20 sm:h-24 w-auto object-contain drop-shadow-[0_4px_12px_rgba(255,107,87,0.15)] select-none"
            />
          </div>
        </div>

        {/* Minimalist Subtitle */}
        <div className="text-center space-y-1">
          <p className="text-[11px] font-black tracking-[0.2em] text-[#ff7052] uppercase">
            PRODUCTIVITY SUITE
          </p>
        </div>

        {/* Logo-Matched Coral Gradient Progress Bar */}
        <div className="w-full space-y-2 pt-1">
          <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/70 shadow-inner">
            <div 
              className="relative h-full bg-gradient-to-r from-[#ff7052] via-[#f97316] to-[#ff8c42] rounded-full transition-all duration-150 ease-out shadow-sm shadow-[#ff7052]/40"
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              {/* Glowing progress tip */}
              <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white/90 rounded-full shadow-md shadow-white" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-bold tracking-widest text-slate-400 px-1 uppercase">
            <span className="text-slate-400">Loading</span>
            <span className="text-[#ff7052] font-mono font-extrabold text-xs">{Math.min(progress, 100)}%</span>
          </div>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 text-[11px] font-extrabold text-slate-300 tracking-[0.15em] uppercase">
        DO THIS • Smart Task Management
      </div>
    </div>
  );
}



