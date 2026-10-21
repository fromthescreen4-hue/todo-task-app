import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, X, Volume2, VolumeX } from 'lucide-react';

export default function RestTimer({ isOpen, onClose }) {
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [initialSeconds, setInitialSeconds] = useState(90);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft(prev => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsRunning(false);
      if (soundEnabled) {
        playBeep();
      }
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, secondsLeft, soundEnabled]);

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  }

  function setPreset(secs) {
    setIsRunning(false);
    setInitialSeconds(secs);
    setSecondsLeft(secs);
  }

  function reset() {
    setIsRunning(false);
    setSecondsLeft(initialSeconds);
  }

  if (!isOpen) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progressPct = initialSeconds > 0 ? ((initialSeconds - secondsLeft) / initialSeconds) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="ui-card w-full max-w-sm p-6 bg-[#FFFFFF] space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-[#FFAE00]" />
            <span className="text-sm font-bold text-[#15171A] uppercase tracking-wide">Rest Interval Timer</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-[6px] text-[#555B63] hover:text-[#15171A] hover:bg-[#F6F6F7]"
              title={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-[#DC2626]" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[6px] text-[#555B63] hover:text-[#15171A] hover:bg-[#F6F6F7]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Big Digital Display */}
        <div className="text-center py-4 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2]">
          <div className="text-5xl font-black font-mono tracking-tight text-[#15171A]">
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
          <p className="text-xs text-[#555B63] mt-1 font-medium">
            {secondsLeft === 0 ? 'Rest complete. Start your set!' : isRunning ? 'Rest in progress...' : 'Ready'}
          </p>
          {/* Progress bar */}
          <div className="w-full bg-[#D9DDE2] h-1.5 mt-4 overflow-hidden rounded-full">
            <div
              className="bg-[#FFAE00] h-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Presets */}
        <div className="grid grid-cols-5 gap-1.5">
          {[30, 60, 90, 120, 180].map(s => (
            <button
              key={s}
              onClick={() => setPreset(s)}
              className={`py-1.5 text-xs font-bold rounded-[6px] border transition-colors ${
                initialSeconds === s
                  ? 'bg-[#FFAE00] text-white border-[#FFAE00]'
                  : 'bg-[#FFFFFF] text-[#555B63] border-[#D9DDE2] hover:bg-[#F6F6F7]'
              }`}
            >
              {s < 60 ? `${s}s` : `${s / 60}m`}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="btn btn-primary flex-1 py-2.5 text-xs font-bold"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isRunning ? 'Pause Timer' : 'Start Timer'}</span>
          </button>
          <button
            onClick={reset}
            className="btn btn-secondary px-4 py-2.5"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4 text-[#555B63]" />
          </button>
        </div>
      </div>
    </div>
  );
}
