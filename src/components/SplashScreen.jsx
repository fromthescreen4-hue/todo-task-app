import React, { useState, useEffect } from 'react';

export default function SplashScreen({ onFinish }) {
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Smooth entrance trigger
    const tEnter = setTimeout(() => {
      setLoaded(true);
    }, 40);

    // Fade out after 1.5s
    const tFade = setTimeout(() => {
      setIsFadingOut(true);
    }, 1500);

    // Unmount callback
    const tDone = setTimeout(() => {
      if (onFinish) onFinish();
    }, 1900);

    return () => {
      clearTimeout(tEnter);
      clearTimeout(tFade);
      clearTimeout(tDone);
    };
  }, [onFinish]);

  function handleSkip() {
    setIsFadingOut(true);
    setTimeout(() => {
      if (onFinish) onFinish();
    }, 200);
  }

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[#0D0F12] select-none transition-opacity duration-500 ease-out cursor-pointer ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle warm golden ambient radial aura */}
      <div className="absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-[#FFAE00]/15 filter blur-3xl pointer-events-none" />

      {/* Large PNG Logo with Smooth Entrance (No Background Box, No Extra Text) */}
      <div
        className={`relative z-10 w-[280px] sm:w-[380px] md:w-[440px] max-w-[88vw] flex items-center justify-center transition-all duration-700 ease-out ${
          loaded ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-3'
        }`}
      >
        <img
          src="/core-fit-logo.png"
          alt="CORE FIT"
          className="w-full h-auto object-contain filter drop-shadow-[0_8px_24px_rgba(255,174,0,0.2)]"
        />
      </div>
    </div>
  );
}
