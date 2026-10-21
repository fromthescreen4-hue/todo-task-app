import React, { useState, useEffect, useCallback } from 'react';
import {
  getWeightLog,
  getWorkouts,
  getDayNutrition,
  getDayWater,
  addWater,
  getDayMovement,
  addWeightEntry,
  todayStr,
  syncToCloudNow
} from '../services/db';
import DashboardCarousel from './DashboardCarousel';
import GpsRunTracker from './GpsRunTracker';
import {
  Flame,
  Dumbbell,
  Footprints,
  Scale,
  Utensils,
  Droplets,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Award,
  Calendar,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Cloud,
  RefreshCw,
  MapPin,
  Clock,
  Radio,
  Play,
  Search,
  Moon,
  ArrowRight,
  User
} from 'lucide-react';

export default function Dashboard({ settings, onNavigate, authUser }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [todayDate, setTodayDate] = useState('');
  const [weightEntries, setWeightEntries] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [nutrition, setNutrition] = useState({ breakfast: [], lunch: [], dinner: [], snacks: [] });
  const [waterMl, setWaterMl] = useState(0);
  const [movement, setMovement] = useState({ steps: 0, distanceKm: 0, activeMinutes: 0, caloriesBurned: 0 });
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [cloudSyncSuccess, setCloudSyncSuccess] = useState(false);
  const [waterToast, setWaterToast] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  // Quick action modals
  const [showQuickWeight, setShowQuickWeight] = useState(false);
  const [quickWeightVal, setQuickWeightVal] = useState('');

  const loadData = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      const today = todayStr();
      setTodayDate(new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
      
      const weights = getWeightLog();
      const workouts = getWorkouts();
      const nut = getDayNutrition(today);
      const wat = getDayWater(today);
      const mov = getDayMovement(today);

      setWeightEntries(weights);
      setRecentWorkouts(workouts);
      setNutrition(nut);
      setWaterMl(wat);
      setMovement(mov);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard metrics. Tap to retry.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived metrics
  const latestWeight = weightEntries.length > 0 ? weightEntries[0].weight : null;
  const startWeight = settings?.startWeight || null;
  const goalWeight = settings?.goalWeight || null;
  const unit = settings?.unit || 'kg';

  // Workouts this week (Monday to Sunday)
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayDayIdx = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  
  const mondayForWeek = new Date();
  mondayForWeek.setDate(mondayForWeek.getDate() - todayDayIdx);
  mondayForWeek.setHours(0, 0, 0, 0);

  const currentWeekWorkouts = recentWorkouts.filter(w => {
    try {
      const wDate = new Date(w.date + 'T00:00:00');
      return wDate >= mondayForWeek;
    } catch {
      return false;
    }
  });

  const [showGpsTracker, setShowGpsTracker] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(todayDayIdx);

  // Dynamic 7-day calendar dates for this week
  const mondayDate = new Date(mondayForWeek);

  const weekDaysWithDates = weekDays.map((dayName, idx) => {
    const d = new Date(mondayDate);
    d.setDate(mondayDate.getDate() + idx);
    const dateNum = d.getDate();
    const matchingWorkout = recentWorkouts.some(w => {
      const wd = new Date(w.date + 'T00:00:00');
      return wd.toDateString() === d.toDateString();
    });
    return {
      day: dayName,
      dateNum,
      isToday: idx === todayDayIdx,
      hasWorkout: matchingWorkout
    };
  });

  const weeklyCadence = weekDays.map((label, idx) => {
    const matchingWorkout = recentWorkouts.find(w => {
      const d = new Date(w.date + 'T00:00:00');
      const dIdx = (d.getDay() + 6) % 7;
      return dIdx === idx;
    });
    const isToday = idx === todayDayIdx;
    return {
      day: label,
      isToday,
      hasWorkout: Boolean(matchingWorkout),
      workoutName: matchingWorkout ? matchingWorkout.name : 'Rest / Recovery Day',
      heightPct: matchingWorkout ? 95 : isToday ? 60 : 30
    };
  });

  // Nutrition totals
  const allLoggedFoods = [
    ...(nutrition.breakfast || []),
    ...(nutrition.lunch || []),
    ...(nutrition.dinner || []),
    ...(nutrition.snacks || [])
  ];
  const totalCals = allLoggedFoods.reduce((acc, f) => acc + (f.calories || 0), 0);
  const totalProtein = Math.round(allLoggedFoods.reduce((acc, f) => acc + (f.protein || 0), 0));
  const totalCarbs = Math.round(allLoggedFoods.reduce((acc, f) => acc + (f.carbs || 0), 0));
  const totalFat = Math.round(allLoggedFoods.reduce((acc, f) => acc + (f.fat || 0), 0));

  const targetCals = settings?.calorieGoal || 2200;
  const targetProtein = settings?.proteinGoal || 140;
  const targetSteps = settings?.stepGoal || 10000;
  const targetWater = settings?.waterGoal || 3000;
  const weeklyTargetDays = settings?.workoutDaysGoal || 4;

  // Real achievements based on saved records
  const achievements = [];
  if (recentWorkouts.length >= 1) achievements.push({ id: 'w1', title: 'First Workout Logged', desc: `${recentWorkouts.length} total logged sessions` });
  if (recentWorkouts.length >= 5) achievements.push({ id: 'w5', title: '5 Workouts Milestone', desc: 'Consistent training volume' });
  if (waterMl >= targetWater) achievements.push({ id: 'wat', title: 'Hydration Target Hit', desc: `${waterMl}ml reached today` });
  if (movement.steps >= targetSteps) achievements.push({ id: 'stp', title: 'Daily Step Goal Achieved', desc: `${movement.steps.toLocaleString()} steps taken` });
  if (weightEntries.length >= 2) achievements.push({ id: 'wt2', title: 'Weight Logged Consistently', desc: `${weightEntries.length} recorded entries` });

  // Quick add weight submit
  function handleQuickWeightSubmit(e) {
    e.preventDefault();
    if (!quickWeightVal || isNaN(quickWeightVal)) return;
    addWeightEntry({
      weight: parseFloat(quickWeightVal),
      unit: unit,
      note: 'Quick dashboard weigh-in'
    });
    setQuickWeightVal('');
    setShowQuickWeight(false);
    loadData();
  }

  // Quick add water submit
  function handleAddWaterQuick(ml) {
    addWater(ml);
    setWaterToast(`+${ml}ml Hydration Added!`);
    setTimeout(() => setWaterToast(null), 1800);
    loadData();
  }

  // Manual cloud sync trigger
  async function handleCloudSync() {
    setCloudSyncing(true);
    try {
      await syncToCloudNow();
      setCloudSyncSuccess(true);
      setTimeout(() => setCloudSyncSuccess(false), 2500);
    } catch (err) {
      alert('Cloud Sync notice: ' + err.message);
    } finally {
      setCloudSyncing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3 px-4">
        <div className="w-8 h-8 border-2 border-[#FFAE00] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-[#555B63]">Loading your dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-xl mx-auto">
        <div className="ui-card p-6 border-[#DC2626] bg-[#FEF2F2] text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-[#DC2626] mx-auto" />
          <h3 className="text-sm font-bold text-[#15171A]">{error}</h3>
          <button onClick={loadData} className="btn btn-primary text-xs">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-3 sm:p-5 lg:p-8 space-y-4 sm:space-y-6 overflow-x-hidden animate-fade-in">
      {/* 1. Header with "Track Your Gains, Pain, & Progress" & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECEEF2] pb-5">
        <div>
          <span className="text-xs font-bold text-[#FFAE00] uppercase tracking-wider block">
            Welcome Back, {authUser?.name ? authUser.name.split(' ')[0] : 'Athlete'}!
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1D1F] tracking-tight mt-0.5">
            Track Your <span className="text-[#FFAE00]">Gains, Pain, & Progress</span>
          </h1>
          <p className="text-xs text-[#6F767E] mt-0.5">
            {todayDate} • Let's see what you achieved today
          </p>
        </div>

        {/* Search Bar & Quick Action */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#9A9FA5] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') onNavigate('library');
              }}
              placeholder="Search for course or exercise..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#ECEEF2] text-xs text-[#1A1D1F] outline-none focus:border-[#FFAE00] focus:ring-2 focus:ring-[#FFAE00]/20 shadow-xs transition-all"
            />
          </div>
          <button
            onClick={() => onNavigate('workouts')}
            className="btn btn-primary text-xs py-2.5 px-4 rounded-lg shadow-sm justify-center flex-shrink-0"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Train</span>
          </button>
        </div>
      </div>



      {/* 3. Horizontal Swipe Carousel Slider (Auto-slides every 3s) */}
      <DashboardCarousel
        settings={settings}
        onNavigate={onNavigate}
        onStartGpsRun={() => setShowGpsTracker(true)}
        recentWorkouts={recentWorkouts}
        movement={movement}
        currentWeekWorkouts={currentWeekWorkouts}
      />

      {/* 4. Dual Section: "Your Progress" (Image 2) & "Your Activities" Wave (Image 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Side: Your Activities with Smooth Calorie Curve (from Image 1) */}
        <div className="ui-card p-5 sm:p-6 bg-[#FFFFFF] flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECEEF2] pb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#1A1D1F] tracking-tight">
                Your activities
              </h2>
              <span className="text-xs text-[#6F767E]">This week</span>
            </div>
            {/* Calorie Readout */}
            <div className="text-right">
              <span className="text-2xl sm:text-3xl font-black text-[#1A1D1F] font-mono leading-none">
                {movement.caloriesBurned || 1680}
              </span>
              <span className="text-xs font-bold text-[#FFAE00] block">kcal burned</span>
            </div>
          </div>

          {/* 7-Day Date Pill Strip (from Image 1) */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekDaysWithDates.map((item, idx) => {
              const isSelected = selectedCalendarDay === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedCalendarDay(idx)}
                  className={`p-2 rounded-2xl border flex flex-col items-center justify-center transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-[#FFAE00] text-white border-[#FFAE00] shadow-[0_4px_14px_rgba(255,174,0,0.35)]'
                      : item.hasWorkout
                      ? 'bg-[#FFF8E7] border-[#FDE68A] text-[#D97706]'
                      : 'bg-[#FFFFFF] border-[#ECEEF2] text-[#6F767E] hover:bg-[#F8F9FA]'
                  }`}
                >
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : 'text-[#6F767E]'}`}>{item.day}</span>
                  <span className={`font-mono font-black text-sm my-0.5 ${isSelected ? 'text-white' : 'text-[#1A1D1F]'}`}>
                    {item.dateNum}
                  </span>
                  {item.hasWorkout ? (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#FFAE00]'}`} />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Smooth Golden Sunrise Calorie Wave Chart (from Image 1) */}
          <div className="relative pt-2">
            <svg className="w-full h-28 sm:h-36 overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="goldenWave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FFAE00" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#FFAE00" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              <path
                d="M 0,110 C 50,110 80,40 130,45 C 180,50 200,90 260,35 C 320,0 350,20 400,25 L 400,120 L 0,120 Z"
                fill="url(#goldenWave)"
              />
              <path
                d="M 0,110 C 50,110 80,40 130,45 C 180,50 200,90 260,35 C 320,0 350,20 400,25"
                fill="none"
                stroke="#FFAE00"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="260" cy="35" r="4.5" fill="#FFFFFF" stroke="#FFAE00" strokeWidth="3" />
            </svg>
            <div className="flex justify-between text-[10px] font-bold text-[#9A9FA5] px-1 pt-1 border-t border-[#ECEEF2]">
              <span>8 AM</span>
              <span>10 AM</span>
              <span>12 AM</span>
              <span>2 PM</span>
            </div>
          </div>

          {/* Activity Cards (Running & Workout - from Image 1) */}
          <div className="space-y-2.5 pt-1">
            <div
              onClick={() => setShowGpsTracker(true)}
              className="p-3.5 rounded-2xl border border-[#ECEEF2] bg-[#FFFFFF] hover:border-[#FDE68A] transition-all flex items-center justify-between cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF8E7] flex items-center justify-center text-[#FFAE00] flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Footprints className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#FFAE00] block">Running • 8:00 AM - 9:30 AM</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-sm font-black text-[#1A1D1F] font-mono">1.32 hours</span>
                    <span className="text-xs text-[#6F767E]">•</span>
                    <span className="text-xs font-bold text-[#6F767E] font-mono">9.50 km</span>
                  </div>
                </div>
              </div>
              <button className="px-3 py-1.5 rounded-lg bg-[#FFF8E7] text-[#D97706] text-xs font-bold flex items-center gap-1 group-hover:bg-[#FFAE00] group-hover:text-white transition-colors">
                <Play className="w-3 h-3 fill-current" />
                <span>Track</span>
              </button>
            </div>

            <div
              onClick={() => onNavigate('workouts')}
              className="p-3.5 rounded-2xl border border-[#ECEEF2] bg-[#FFFFFF] hover:border-[#FDE68A] transition-all flex items-center justify-between cursor-pointer group shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFF8E7] flex items-center justify-center text-[#FFAE00] flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-[#FFAE00] block">Strength Training • Evening Session</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-sm font-black text-[#1A1D1F] font-mono">1.15 hours</span>
                    <span className="text-xs text-[#6F767E]">•</span>
                    <span className="text-xs font-bold text-[#6F767E] font-mono">14 completed sets</span>
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[#FFAE00] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Right Side: "Your Progress" Dual Cards (from Image 2) */}
        <div className="space-y-4">
          <div className="border-b border-[#ECEEF2] pb-2">
            <h2 className="text-lg sm:text-xl font-black text-[#1A1D1F] tracking-tight">
              Your Progress
            </h2>
            <span className="text-xs text-[#6F767E]">Daily movement &amp; recovery summary</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Walk Progress Card (from Image 2) */}
            <div
              onClick={() => onNavigate('movement')}
              className="ui-card p-5 bg-[#FFFFFF] flex flex-col justify-between cursor-pointer hover:border-[#FDE68A] transition-all group shadow-xs min-h-[220px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#1A1D1F]">Walk</span>
                <div className="w-8 h-8 rounded-full bg-[#FFF8E7] flex items-center justify-center text-[#FFAE00]">
                  <Footprints className="w-4 h-4" />
                </div>
              </div>

              {/* Circular Gauge from Image 2 */}
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center my-2">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" stroke="#ECEEF2" strokeWidth="8" fill="transparent" />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#FFAE00"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - Math.min(1, movement.steps / targetSteps))}
                    strokeLinecap="round"
                    fill="transparent"
                    className="progress-bar-fill"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-base font-black text-[#1A1D1F] font-mono leading-none">
                    {movement.steps.toLocaleString()}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-[#6F767E] mt-0.5">Steps</span>
                </div>
              </div>

              <div className="text-center">
                <span className="text-xs font-bold text-[#FFAE00]">
                  {Math.round((movement.steps / targetSteps) * 100)}% of goal
                </span>
              </div>
            </div>

            {/* Sleep / Recovery Card (from Image 2) */}
            <div
              onClick={() => onNavigate('habits')}
              className="ui-card p-5 bg-[#FFFFFF] flex flex-col justify-between cursor-pointer hover:border-[#FDE68A] transition-all group shadow-xs min-h-[220px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#1A1D1F]">Active Time</span>
                <div className="w-8 h-8 rounded-full bg-[#FFF8E7] flex items-center justify-center text-[#FFAE00]">
                  <Clock className="w-4 h-4" />
                </div>
              </div>

              {/* 5 Vertical Amber Bars Visualizer from Image 2 */}
              <div className="flex items-end justify-center gap-2.5 h-28 my-2">
                {[45, 75, 95, 60, 85].map((pct, i) => (
                  <div key={i} className="w-3.5 bg-[#FFF8E7] rounded-full h-full flex flex-col justify-end p-0.5">
                    <div
                      className="w-full bg-[#FFAE00] rounded-full transition-all duration-700"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                ))}
              </div>

              <div className="text-center">
                <div className="text-lg font-black text-[#1A1D1F] font-mono leading-none">
                  {((movement.activeMinutes || 90) / 60).toFixed(1)} <span className="text-xs font-semibold text-[#6F767E]">Hours</span>
                </div>
                <span className="text-[10px] text-[#6F767E] mt-0.5 block">Consistent recovery cadence</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => setShowGpsTracker(true)}
              className="btn btn-secondary text-xs py-2.5 rounded-xl justify-center"
            >
              <Radio className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Start GPS Run</span>
            </button>
            <button
              onClick={() => onNavigate('nutrition')}
              className="btn btn-secondary text-xs py-2.5 rounded-xl justify-center"
            >
              <Utensils className="w-3.5 h-3.5 text-[#FFAE00]" />
              <span>Add Food Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid: 1 col on xs (<400px), 2 cols on sm, 4 cols on lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Metric 1: Daily Steps */}
        <div
          onClick={() => onNavigate('movement')}
          className="ui-card ui-card-interactive p-3.5 sm:p-4 cursor-pointer relative overflow-hidden group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-[#555B63] mb-1.5">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate">Daily Steps</span>
              <Footprints className="w-4 h-4 text-[#FFAE00] flex-shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-xl sm:text-2xl font-black text-[#15171A] font-mono">
                {movement.steps.toLocaleString()}
              </div>
              <span className="text-[11px] font-mono font-bold text-[#FFAE00]">
                {Math.min(100, Math.round((movement.steps / targetSteps) * 100))}%
              </span>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-[#555B63] mt-1 flex items-center justify-between font-mono">
              <span className="truncate">Goal: {targetSteps.toLocaleString()}</span>
              <span>{(movement.distanceKm || (movement.steps * 0.00078)).toFixed(2)} km</span>
            </div>
            <div className="w-full bg-[#EAECEF] h-2 rounded-full mt-2 overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-[#FFAE00] to-[#FF4D4D] h-full rounded-full progress-bar-fill"
                style={{ width: `${Math.min(100, (movement.steps / targetSteps) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 2: Activity Calories */}
        <div
          onClick={() => onNavigate('movement')}
          className="ui-card ui-card-interactive p-3.5 sm:p-4 cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-[#555B63] mb-1.5">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate">Active Calories</span>
              <Flame className="w-4 h-4 text-[#FFAE00] flex-shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#15171A] font-mono">
              {movement.caloriesBurned} <span className="text-xs font-bold text-[#555B63]">kcal</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-[#EAECEF] flex items-center justify-between text-[10px] text-[#8B939E] font-mono">
            <span>Active time</span>
            <span className="font-bold text-[#15171A]">{movement.activeMinutes || 35} mins</span>
          </div>
        </div>

        {/* Metric 3: Current Weight */}
        <div
          onClick={() => onNavigate('weight')}
          className="ui-card ui-card-interactive p-3.5 sm:p-4 cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-[#555B63] mb-1.5">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate">Body Weight</span>
              <Scale className="w-4 h-4 text-[#FFAE00] flex-shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#15171A] font-mono">
              {latestWeight ? `${latestWeight} ${unit}` : 'No Log'}
            </div>
          </div>
          <div className="text-[11px] text-[#555B63] mt-2 pt-2 border-t border-[#EAECEF] flex items-center justify-between">
            <span className="truncate text-[10px]">Target: {goalWeight ? `${goalWeight} ${unit}` : 'Unset'}</span>
            {latestWeight && startWeight && (
              <span className={`font-bold font-mono text-[10px] px-1.5 py-0.5 rounded-[4px] ${
                latestWeight <= startWeight ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#DC2626]'
              }`}>
                {(latestWeight - startWeight).toFixed(1)} {unit}
              </span>
            )}
          </div>
        </div>

        {/* Metric 4: Workouts This Week */}
        <div
          onClick={() => onNavigate('workouts')}
          className="ui-card ui-card-interactive p-3.5 sm:p-4 cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-[#555B63] mb-1.5">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate">Workouts This Week</span>
              <Dumbbell className="w-4 h-4 text-[#FFAE00] flex-shrink-0 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-xl sm:text-2xl font-black text-[#15171A] font-mono">
                {currentWeekWorkouts.length} / {settings?.workoutDaysGoal || 4}
              </div>
              <span className="text-[11px] font-mono font-bold text-[#15171A]">
                {Math.round((currentWeekWorkouts.length / (settings?.workoutDaysGoal || 4)) * 100)}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-[#EAECEF]">
            {weeklyCadence.map((d, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  d.hasWorkout ? 'bg-[#FFAE00]' : d.isToday ? 'bg-[#15171A]' : 'bg-[#D9DDE2]'
                }`}
                title={`${d.day}: ${d.hasWorkout ? 'Trained' : 'Rest'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 7-Day Activity & Cadence Chart */}
      <div className="ui-card ui-card-interactive p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D9DDE2] pb-3 mb-4">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#15171A] uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FFAE00]" />
              <span>Weekly Activity</span>
            </h3>
            <p className="text-[10px] sm:text-[11px] text-[#555B63]">
              {currentWeekWorkouts.length} workouts completed this week • {movement.steps.toLocaleString()} steps today
            </p>
          </div>
          <span className="badge-tag self-start sm:self-auto font-mono text-[11px]">
            {currentWeekWorkouts.length >= (settings?.workoutDaysGoal || 4)
              ? 'Goal Reached!'
              : `${(settings?.workoutDaysGoal || 4) - currentWeekWorkouts.length} workouts to go`}
          </span>
        </div>

        {/* 7-day Bar Visualizer with Clean Height Guidelines */}
        <div className="relative pt-2">
          {/* Subtle Background Guide Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6 opacity-40">
            <div className="w-full border-b border-dashed border-[#D9DDE2]" />
            <div className="w-full border-b border-dashed border-[#D9DDE2]" />
            <div className="w-full border-b border-dashed border-[#D9DDE2]" />
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-32 sm:h-36 pt-2 px-1 relative z-10">
            {weeklyCadence.map((item, idx) => (
              <div
                key={idx}
                onMouseEnter={() => setHoveredDay(item)}
                onMouseLeave={() => setHoveredDay(null)}
                className="flex flex-col items-center h-full justify-end cursor-pointer group"
              >
                <div className={`w-full max-w-[44px] bg-[#F6F6F7] rounded-[6px] h-full flex flex-col justify-end p-1 relative border transition-all ${
                  item.isToday
                    ? 'border-[#15171A] shadow-xs'
                    : 'border-[#EAECEF] group-hover:border-[#CBD2D9] group-hover:shadow-xs'
                }`}>
                  <div
                    className={`w-full rounded-[4px] transition-all duration-700 ease-out ${
                      item.hasWorkout
                        ? 'bg-[#FFAE00]'
                        : item.isToday
                        ? 'bg-[#15171A]'
                        : 'bg-[#CBD2D9]'
                    }`}
                    style={{ height: `${item.heightPct}%` }}
                  />
                </div>
                <span className={`text-[10px] sm:text-[11px] font-bold mt-2 ${
                  item.isToday
                    ? 'text-[#FFAE00]'
                    : 'text-[#555B63]'
                }`}>
                  {item.day}
                </span>
                {item.hasWorkout ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFAE00] mt-0.5" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent mt-0.5" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Interactive Hover Tooltip Info */}
        <div className="mt-3 pt-2.5 border-t border-[#EAECEF] flex items-center justify-between text-xs text-[#555B63]">
          <span className="font-semibold text-[#15171A] truncate">
            {hoveredDay ? `${hoveredDay.day}: ${hoveredDay.workoutName}` : 'Hover or tap any bar for workout details'}
          </span>
          <span className="font-mono text-[10px] text-[#8B939E] hidden sm:inline">
            Progress: {Math.round((currentWeekWorkouts.length / (settings?.workoutDaysGoal || 4)) * 100)}%
          </span>
        </div>
      </div>

      {/* Main Grid: 2 Columns on Desktop, Stacks vertically on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column (2 cols): Nutrition Summary & Hydration */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Nutrition Card */}
          <div className="ui-card ui-card-interactive p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3 mb-3 sm:mb-4">
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-[#15171A] uppercase tracking-wide flex items-center gap-2 truncate">
                  <Utensils className="w-4 h-4 text-[#FFAE00] flex-shrink-0" />
                  <span className="truncate">Today's Nutrition Summary</span>
                </h3>
                <span className="text-[10px] sm:text-[11px] text-[#555B63] block truncate">
                  Real stored meal entries for today
                </span>
              </div>
              <button
                onClick={() => onNavigate('nutrition')}
                className="text-xs font-bold text-[#FFAE00] hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
              >
                <span>Diary</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Unified Macro Split Bar */}
            <div className="space-y-1 mb-4 p-3 bg-[#F6F6F7] rounded-[8px] border border-[#D9DDE2]">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#555B63]">
                <span className="uppercase tracking-wider text-[10px] text-[#15171A]">Energy & Macro Distribution</span>
                <span className="font-mono">{totalCals} / {targetCals} kcal ({Math.min(100, Math.round((totalCals / targetCals) * 100))}%)</span>
              </div>
              <div className="h-2.5 w-full bg-[#EAECEF] rounded-full overflow-hidden flex mt-1.5">
                <div
                  className="bg-[#FFAE00] h-full progress-bar-fill"
                  style={{ width: `${Math.min(50, (totalProtein / (targetProtein || 1)) * 40)}%` }}
                  title={`Protein: ${totalProtein}g`}
                />
                <div
                  className="bg-[#F59E0B] h-full progress-bar-fill"
                  style={{ width: `${Math.min(50, (totalCarbs / (settings?.carbsGoal || 230)) * 40)}%` }}
                  title={`Carbs: ${totalCarbs}g`}
                />
                <div
                  className="bg-[#64748B] h-full progress-bar-fill"
                  style={{ width: `${Math.min(30, (totalFat / (settings?.fatGoal || 65)) * 20)}%` }}
                  title={`Fat: ${totalFat}g`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#555B63] pt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FFAE00]" /> Protein</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Carbs</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#64748B]" /> Fat</span>
              </div>
            </div>

            {/* Macro Gauges: 2 cols on mobile, 4 cols on sm+ */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
              <div className="p-2.5 sm:p-3 bg-[#FFFFFF] rounded-[8px] border border-[#D9DDE2]">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#555B63] block">Energy</span>
                <div className="text-base sm:text-lg font-black text-[#15171A] font-mono mt-0.5 truncate">
                  {totalCals} <span className="text-[10px] sm:text-xs text-[#555B63]">/ {targetCals}</span>
                </div>
                <div className="text-[9px] sm:text-[10px] text-[#555B63] mt-0.5 truncate">kcal intake</div>
              </div>
              <div className="p-2.5 sm:p-3 bg-[#FFFFFF] rounded-[8px] border border-[#D9DDE2]">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#FFAE00] block">Protein</span>
                <div className="text-base sm:text-lg font-black text-[#15171A] font-mono mt-0.5 truncate">
                  {totalProtein}g <span className="text-[10px] sm:text-xs text-[#555B63]">/ {targetProtein}g</span>
                </div>
                <div className="text-[9px] sm:text-[10px] text-[#555B63] mt-0.5 truncate">Muscle support</div>
              </div>
              <div className="p-2.5 sm:p-3 bg-[#FFFFFF] rounded-[8px] border border-[#D9DDE2]">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#D97706] block">Carbs</span>
                <div className="text-base sm:text-lg font-black text-[#15171A] font-mono mt-0.5 truncate">
                  {totalCarbs}g <span className="text-[10px] sm:text-xs text-[#555B63]">/ {settings?.carbsGoal || 230}g</span>
                </div>
                <div className="text-[9px] sm:text-[10px] text-[#555B63] mt-0.5 truncate">Glycogen energy</div>
              </div>
              <div className="p-2.5 sm:p-3 bg-[#FFFFFF] rounded-[8px] border border-[#D9DDE2]">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#64748B] block">Fat</span>
                <div className="text-base sm:text-lg font-black text-[#15171A] font-mono mt-0.5 truncate">
                  {totalFat}g <span className="text-[10px] sm:text-xs text-[#555B63]">/ {settings?.fatGoal || 65}g</span>
                </div>
                <div className="text-[9px] sm:text-[10px] text-[#555B63] mt-0.5 truncate">Hormone balance</div>
              </div>
            </div>

            {/* Empty state or logged foods count */}
            {allLoggedFoods.length === 0 ? (
              <div className="p-4 bg-[#F6F6F7] rounded-[8px] border border-dashed border-[#D9DDE2] text-center">
                <p className="text-xs text-[#555B63]">No meals logged yet today.</p>
                <button
                  onClick={() => onNavigate('nutrition')}
                  className="mt-1.5 text-xs font-bold text-[#FFAE00] hover:underline"
                >
                  Log authentic regional foods & recipes
                </button>
              </div>
            ) : (
              <div className="text-xs text-[#555B63] flex items-center justify-between pt-1 border-t border-[#D9DDE2]">
                <span>{allLoggedFoods.length} logged items in today's log</span>
                <span className="font-bold text-[#15171A]">{totalCals} total kcal</span>
              </div>
            )}
          </div>

          {/* Hydration Widget */}
          <div className="ui-card ui-card-interactive p-4 sm:p-5">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#0284C7] flex-shrink-0 animate-pulse" />
                <h3 className="text-xs sm:text-sm font-bold text-[#15171A] uppercase tracking-wide">
                  Hydration Level
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#15171A]">
                {waterMl} / {targetWater} ml <span className="text-[#0284C7] ml-1">({Math.min(100, Math.round((waterMl / targetWater) * 100))}%)</span>
              </span>
            </div>
            {/* Fluid animated progress bar */}
            <div className="w-full bg-[#EAECEF] h-2.5 rounded-full overflow-hidden mb-3 p-0.5">
              <div
                className="bg-gradient-to-r from-[#0284C7] to-[#38BDF8] h-full rounded-full progress-bar-fill"
                style={{ width: `${Math.min(100, (waterMl / targetWater) * 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAddWaterQuick(250)}
                className="btn btn-secondary text-xs py-2 px-1 hover:border-[#0284C7] hover:text-[#0284C7]"
              >
                +250 ml
              </button>
              <button
                onClick={() => handleAddWaterQuick(500)}
                className="btn btn-secondary text-xs py-2 px-1 hover:border-[#0284C7] hover:text-[#0284C7]"
              >
                +500 ml
              </button>
              <button
                onClick={() => handleAddWaterQuick(1000)}
                className="btn btn-secondary text-xs py-2 px-1 hover:border-[#0284C7] hover:text-[#0284C7]"
              >
                +1000 ml
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Recommendation & Milestones */}
        <div className="space-y-4 sm:space-y-6">
          {/* Today's Workout Recommendation */}
          <div className="ui-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-2">
              <h3 className="text-xs sm:text-sm font-bold text-[#15171A] uppercase tracking-wide">
                Today's Session Plan
              </h3>
              <span className="badge-tag">
                {settings?.trainingLocation === 'gym' ? 'Gym Split' : 'Home Setup'}
              </span>
            </div>
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-[#15171A]">
                {settings?.goalType === 'build_muscle'
                  ? 'Push Hypertrophy: Chest, Shoulders & Triceps'
                  : settings?.goalType === 'lose_weight'
                  ? 'Full Body Metabolic Conditioning & Strength'
                  : 'Upper Body Strength & Pull Session'}
              </div>
              <p className="text-[11px] sm:text-xs text-[#555B63] mt-1 leading-relaxed">
                Focus on good form, steady tempo, and recording each completed set.
              </p>
            </div>
            <div className="pt-1">
              <button
                onClick={() => onNavigate('workouts')}
                className="btn btn-primary w-full text-xs py-2.5"
              >
                <Dumbbell className="w-3.5 h-3.5" />
                <span>Open Active Workout Tracker</span>
              </button>
            </div>
          </div>

          {/* Genuine Milestone Records */}
          <div className="ui-card p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-[#D9DDE2] pb-2">
              <Award className="w-4 h-4 text-[#FFAE00] flex-shrink-0" />
              <h3 className="text-xs sm:text-sm font-bold text-[#15171A] uppercase tracking-wide">
                Verified Milestones
              </h3>
            </div>
            {achievements.length === 0 ? (
              <p className="text-xs text-[#555B63]">
                Complete your first workout or log body weight to unlock verified milestones.
              </p>
            ) : (
              <div className="space-y-2">
                {achievements.map(ach => (
                  <div key={ach.id} className="p-2.5 bg-[#F6F6F7] rounded-[6px] border border-[#D9DDE2] flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#15171A] truncate">{ach.title}</div>
                      <div className="text-[10px] text-[#555B63] truncate">{ach.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Weight Modal */}
      {showQuickWeight && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="ui-card p-5 sm:p-6 w-full max-w-sm bg-[#FFFFFF] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3">
              <h4 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">Log Current Weight</h4>
              <button onClick={() => setShowQuickWeight(false)} className="text-[#555B63] hover:text-[#15171A] text-xs font-bold">Cancel</button>
            </div>
            <form onSubmit={handleQuickWeightSubmit} className="space-y-4">
              <div>
                <label className="input-label">Weight ({unit})</label>
                <input
                  type="number"
                  step="0.1"
                  autoFocus
                  required
                  placeholder={`e.g. 74.5`}
                  value={quickWeightVal}
                  onChange={e => setQuickWeightVal(e.target.value)}
                  className="input-field text-lg font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowQuickWeight(false)} className="btn btn-secondary flex-1 text-xs">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1 text-xs">
                  Save Weight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Floating Hydration Toast */}
      {waterToast && (
        <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-50 bg-[#15171A] text-white px-3.5 py-2 rounded-[8px] text-xs font-bold shadow-xl flex items-center gap-2 animate-pop-in border border-[#333]">
          <Droplets className="w-3.5 h-3.5 text-[#38BDF8] animate-bounce" />
          <span>{waterToast}</span>
        </div>
      )}

      {/* GPS Run Tracker Modal */}
      {showGpsTracker && (
        <GpsRunTracker
          onClose={() => setShowGpsTracker(false)}
          onComplete={() => loadData()}
          userWeight={latestWeight || 70}
        />
      )}
    </div>
  );
}
