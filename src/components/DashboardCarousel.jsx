import React, { useState, useRef, useEffect } from 'react';
import {
  Sun,
  Flame,
  Radio,
  Play,
  TrendingUp,
  Dumbbell,
  Footprints,
  ChevronRight,
  ChevronLeft,
  ArrowRight
} from 'lucide-react';

export default function DashboardCarousel({
  settings,
  onNavigate,
  onStartGpsRun,
  recentWorkouts = [],
  movement = { steps: 0, caloriesBurned: 0, distanceKm: 0 },
  currentWeekWorkouts = []
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef(null);

  // Time-of-day greeting
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  // Derived metrics
  const weeklyTargetDays = settings?.workoutDaysGoal || 4;
  const weeklyWorkoutsPct = Math.min(100, Math.round((currentWeekWorkouts.length / weeklyTargetDays) * 100));
  const stepGoal = settings?.stepGoal || 10000;

  // Safe horizontal scroll that NEVER jerks the window viewport vertically
  function scrollToIndex(idx) {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const card = container.children[idx];
    if (card) {
      container.scrollTo({
        left: card.offsetLeft - container.offsetLeft,
        behavior: 'smooth'
      });
    }
    setActiveSlide(idx);
  }

  // Auto-slide every 3 seconds (pauses when user hovers or touches)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % 3;
        scrollToIndex(next);
        return next;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [isPaused]);

  // Sync active dot on swipe
  function handleScroll() {
    if (!scrollRef.current) return;
    const { scrollLeft, offsetWidth } = scrollRef.current;
    if (offsetWidth > 0) {
      const index = Math.round(scrollLeft / (offsetWidth * 0.85));
      setActiveSlide(Math.min(2, Math.max(0, index)));
    }
  }

  // Compact circular progress ring math
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (weeklyWorkoutsPct / 100) * circumference;

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setTimeout(() => setIsPaused(false), 4000)}
      className="space-y-2 select-none"
    >
      {/* Top Deck Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FFAE00] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#555B63]">
            Today's Highlights
          </span>
        </div>

        {/* Carousel Prev / Next Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scrollToIndex(Math.max(0, activeSlide - 1))}
            disabled={activeSlide === 0}
            className="w-6 h-6 rounded-[6px] bg-[#FFFFFF] border border-[#D9DDE2] flex items-center justify-center text-[#555B63] hover:text-[#15171A] disabled:opacity-25 transition-all"
            title="Previous"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => scrollToIndex(Math.min(2, activeSlide + 1))}
            disabled={activeSlide === 2}
            className="w-6 h-6 rounded-[6px] bg-[#FFFFFF] border border-[#D9DDE2] flex items-center justify-center text-[#555B63] hover:text-[#15171A] disabled:opacity-25 transition-all"
            title="Next"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Clean Modern Yellow Cards */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-1 scrollbar-none scroll-smooth -mx-1 px-1"
      >
        {/* CARD 1: Good Morning / Motivation */}
        <div
          onClick={() => onNavigate('workouts')}
          className="min-w-[92%] sm:min-w-[380px] lg:min-w-[340px] flex-1 snap-start rounded-[14px] bg-gradient-to-br from-[#FFBF1F] via-[#FFAE00] to-[#F59E0B] border border-[#F59E0B]/40 p-4 text-[#1A1D1F] shadow-[0_8px_25px_rgba(255,174,0,0.22)] relative overflow-hidden flex flex-col justify-between cursor-pointer group hover:shadow-[0_10px_30px_rgba(255,174,0,0.32)] transition-all"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase bg-black/15 text-[#1A1D1F] border border-black/10">
                <Sun className="w-3 h-3 text-[#1A1D1F]" />
                <span>{timeGreeting}</span>
              </span>
              <span className="font-mono text-[10px] text-[#065F46] font-extrabold uppercase">
                Ready to Train
              </span>
            </div>

            <div>
              <div className="text-base sm:text-lg font-black tracking-tight text-[#1A1D1F] leading-tight">
                Keep up the momentum
              </div>
              <div className="text-[11px] text-[#3F3728] mt-0.5 font-semibold">
                Goal: {stepGoal.toLocaleString()} steps • Today: Push Workout
              </div>
            </div>

            {/* Quick Data Chips */}
            <div className="grid grid-cols-3 gap-2 p-2 rounded-[8px] bg-white border border-[#E09600]/40 font-mono text-center text-xs shadow-xs">
              <div>
                <span className="text-[9px] text-[#5A4D3D] font-bold block uppercase tracking-wide">Steps</span>
                <span className="font-black text-[#1A1D1F]">{movement.steps.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-[#5A4D3D] font-bold block uppercase tracking-wide">Calories</span>
                <span className="font-black text-[#B91C1C]">{movement.caloriesBurned} kcal</span>
              </div>
              <div>
                <span className="text-[9px] text-[#5A4D3D] font-bold block uppercase tracking-wide">Workout</span>
                <span className="font-black text-[#065F46]">Planned</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-black/15 flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold text-[#2E261B] group-hover:text-black flex items-center gap-1">
              <span>Start Today's Workout</span>
              <ArrowRight className="w-3 h-3 text-[#1A1D1F]" />
            </span>
            <span className="px-2.5 py-1 rounded-[6px] text-[9px] font-black uppercase tracking-wider bg-[#1A1D1F] text-white shadow hover:bg-black transition-all">
              Open Workout
            </span>
          </div>
        </div>

        {/* CARD 2: Direct GPS Running Tracker Trigger */}
        <div
          onClick={() => (onStartGpsRun ? onStartGpsRun() : onNavigate('movement'))}
          className="min-w-[92%] sm:min-w-[380px] lg:min-w-[340px] flex-1 snap-start rounded-[14px] bg-gradient-to-br from-[#FFBF1F] via-[#FFAE00] to-[#F59E0B] border border-[#F59E0B]/40 p-4 text-[#1A1D1F] shadow-[0_8px_25px_rgba(255,174,0,0.22)] relative overflow-hidden flex flex-col justify-between cursor-pointer group hover:shadow-[0_10px_30px_rgba(255,174,0,0.32)] transition-all"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase bg-black/15 text-[#1A1D1F] border border-black/10">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#059669] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#059669]"></span>
                </span>
                <span className="text-[#064E3B] font-extrabold">GPS Satellite Ready</span>
              </div>
              <span className="font-mono text-[10px] text-[#3F3728] font-bold">Outdoor Run</span>
            </div>

            <div>
              <div className="text-base sm:text-lg font-black tracking-tight text-[#1A1D1F] leading-tight">
                Outdoor Running Session
              </div>
              <div className="text-[11px] text-[#3F3728] mt-0.5 font-semibold">
                Live route tracking, distance, duration & pace
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-2 rounded-[8px] bg-white border border-[#E09600]/40 font-mono text-center text-xs shadow-xs">
              <div>
                <span className="text-[9px] text-[#5A4D3D] font-bold block uppercase tracking-wide">Target</span>
                <span className="font-black text-[#1A1D1F]">5.00 km</span>
              </div>
              <div>
                <span className="text-[9px] text-[#5A4D3D] font-bold block uppercase tracking-wide">Avg Pace</span>
                <span className="font-black text-[#1A1D1F]">5'20" /km</span>
              </div>
              <div>
                <span className="text-[9px] text-[#5A4D3D] font-bold block uppercase tracking-wide">Est Burn</span>
                <span className="font-black text-[#B91C1C]">380 kcal</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-black/15 flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold text-[#2E261B] group-hover:text-black flex items-center gap-1">
              <span>Track running session</span>
              <ArrowRight className="w-3 h-3 text-[#1A1D1F]" />
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onStartGpsRun) onStartGpsRun();
                else onNavigate('movement');
              }}
              className="px-3 py-1 rounded-[6px] text-[10px] font-black uppercase tracking-wider bg-[#1A1D1F] hover:bg-black text-white flex items-center gap-1 shadow transition-transform active:scale-95"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Start Run</span>
            </button>
          </div>
        </div>

        {/* CARD 3: Weekly Progress Progress Card */}
        <div
          onClick={() => onNavigate('progress')}
          className="min-w-[92%] sm:min-w-[380px] lg:min-w-[340px] flex-1 snap-start rounded-[14px] bg-gradient-to-br from-[#FFBF1F] via-[#FFAE00] to-[#F59E0B] border border-[#F59E0B]/40 p-4 text-[#1A1D1F] shadow-[0_8px_25px_rgba(255,174,0,0.22)] relative overflow-hidden flex flex-col justify-between cursor-pointer group hover:shadow-[0_10px_30px_rgba(255,174,0,0.32)] transition-all"
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase bg-black/15 text-[#1A1D1F] border border-black/10">
                <TrendingUp className="w-3 h-3 text-[#1A1D1F]" />
                <span>Weekly Progress</span>
              </span>
              <span className="font-mono text-[10px] text-[#3F3728] font-bold">
                This Week
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-base sm:text-lg font-black tracking-tight text-[#1A1D1F] leading-tight">
                  {weeklyWorkoutsPct}% of Weekly Goal
                </div>
                <div className="text-[11px] text-[#3F3728] mt-0.5 font-semibold">
                  {currentWeekWorkouts.length} of {weeklyTargetDays} workouts completed
                </div>
              </div>

              {/* Compact Circular Progress Ring */}
              <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
                  <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    stroke="rgba(0, 0, 0, 0.15)"
                    strokeWidth="4.5"
                    fill="transparent"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r={radius}
                    stroke="#1A1D1F"
                    strokeWidth="4.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <span className="absolute font-mono text-[10px] font-black text-[#1A1D1F]">
                  {weeklyWorkoutsPct}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-2 rounded-[8px] bg-white border border-[#E09600]/40 font-mono text-center text-xs shadow-xs">
              <div>
                <span className="text-[9px] text-[#5A4D3D] font-bold block uppercase tracking-wide">Steps</span>
                <span className="font-black text-[#1A1D1F]">{movement.steps.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-[#5A4D3D] font-bold block uppercase tracking-wide">Calories</span>
                <span className="font-black text-[#B91C1C]">{movement.caloriesBurned} kcal</span>
              </div>
              <div>
                <span className="text-[9px] text-[#5A4D3D] font-bold block uppercase tracking-wide">Pace</span>
                <span className="font-black text-[#065F46]">Good</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-black/15 flex items-center justify-between text-xs">
            <span className="text-[10px] font-bold text-[#2E261B] group-hover:text-black flex items-center gap-1">
              <span>View Progress Reports</span>
              <ArrowRight className="w-3 h-3 text-[#1A1D1F]" />
            </span>
            <span className="px-2.5 py-1 rounded-[6px] text-[9px] font-black uppercase tracking-wider bg-[#1A1D1F] text-white shadow hover:bg-black transition-all">
              Reports
            </span>
          </div>
        </div>
      </div>

      {/* Pagination Indicator Dots */}
      <div className="flex items-center justify-center gap-1.5 pt-0.5">
        {[0, 1, 2].map((idx) => (
          <button
            key={idx}
            onClick={() => scrollToIndex(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeSlide === idx
                ? 'w-5 bg-[#FFAE00]'
                : 'w-1.5 bg-[#D9DDE2] hover:bg-[#8B939E]'
            }`}
            title={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
