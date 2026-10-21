import React, { useState, useEffect } from 'react';
import {
  getDayWater,
  addWater,
  resetWater,
  getHabitsLog,
  getDayHabits,
  toggleHabit,
  DEFAULT_HABIT_DEFINITIONS,
  todayStr
} from '../services/db';
import {
  Droplets,
  CheckCircle2,
  Circle,
  Plus,
  RotateCcw,
  Sparkles,
  Flame,
  Calendar,
  Moon,
  Footprints,
  Utensils,
  Activity,
  Pill
} from 'lucide-react';

export default function HabitTracker({ settings }) {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [waterMl, setWaterMl] = useState(0);
  const [completedHabits, setCompletedHabits] = useState([]);
  const [customMl, setCustomMl] = useState('');

  const targetWater = settings?.waterGoal || 3000;

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  function loadData() {
    setWaterMl(getDayWater(selectedDate));
    setCompletedHabits(getDayHabits(selectedDate));
  }

  function handleAddWater(ml) {
    const updated = addWater(ml, selectedDate);
    setWaterMl(updated);
  }

  function handleCustomWaterSubmit(e) {
    e.preventDefault();
    const parsed = parseInt(customMl, 10);
    if (!isNaN(parsed) && parsed > 0) {
      handleAddWater(parsed);
      setCustomMl('');
    }
  }

  function handleResetWater() {
    resetWater(selectedDate);
    setWaterMl(0);
  }

  function handleToggleHabit(habitId) {
    const updated = toggleHabit(selectedDate, habitId);
    setCompletedHabits(updated);
  }

  const iconMap = {
    Moon: Moon,
    Footprints: Footprints,
    Utensils: Utensils,
    Droplets: Droplets,
    Activity: Activity,
    Pill: Pill
  };

  const waterPct = Math.min(100, Math.round((waterMl / targetWater) * 100));
  const habitsPct = Math.round((completedHabits.length / DEFAULT_HABIT_DEFINITIONS.length) * 100);

  return (
    <div className="w-full max-w-5xl mx-auto p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-x-hidden animate-fade-in">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DDE2] pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#FFAE00] block">
            Daily Wellness & Hydration
          </span>
          <h1 className="text-2xl font-extrabold text-[#15171A] tracking-tight">Water & Daily Habits</h1>
          <p className="text-xs text-[#555B63] mt-0.5">
            Log your daily water intake and stay consistent with healthy habits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="input-field text-xs py-2 w-auto font-mono"
          />
        </div>
      </div>

      {/* Hydration Engine */}
      <div className="ui-card p-6 bg-[#FFFFFF] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[10px] bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0284C7] flex-shrink-0">
              <Droplets className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-[#555B63]">Water Intake</span>
              <div className="text-3xl font-black text-[#15171A] font-mono mt-0.5">
                {waterMl} <span className="text-sm font-bold text-[#555B63]">/ {targetWater} ml</span>
              </div>
              <div className="text-xs text-[#555B63] mt-0.5">
                {waterMl >= targetWater ? (
                  <span className="text-[#16A34A] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Target reached for {selectedDate}
                  </span>
                ) : (
                  <span>{targetWater - waterMl} ml remaining</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleResetWater}
            className="btn btn-secondary text-xs self-start sm:self-auto"
            title="Reset water for selected date"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#555B63]" />
            <span>Reset Day</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-[#555B63]">Target Saturation</span>
            <span className="text-[#15171A]">{waterPct}%</span>
          </div>
          <div className="w-full bg-[#EAECEF] h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-[#0284C7] h-full transition-all duration-300"
              style={{ width: `${waterPct}%` }}
            />
          </div>
        </div>

        {/* Quick Add Buttons & Custom Input */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <button
            onClick={() => handleAddWater(250)}
            className="btn btn-secondary text-xs py-2.5"
          >
            +250 ml (Glass)
          </button>
          <button
            onClick={() => handleAddWater(500)}
            className="btn btn-secondary text-xs py-2.5"
          >
            +500 ml (Shaker)
          </button>
          <button
            onClick={() => handleAddWater(750)}
            className="btn btn-secondary text-xs py-2.5"
          >
            +750 ml (Bottle)
          </button>
          <button
            onClick={() => handleAddWater(1000)}
            className="btn btn-secondary text-xs py-2.5"
          >
            +1000 ml (1 Liter)
          </button>
        </div>

        {/* Custom Input */}
        <form onSubmit={handleCustomWaterSubmit} className="flex gap-2 pt-2 border-t border-[#D9DDE2]">
          <input
            type="number"
            step="50"
            placeholder="Custom volume in ml (e.g. 350)"
            value={customMl}
            onChange={e => setCustomMl(e.target.value)}
            className="input-field text-xs font-mono"
          />
          <button type="submit" className="btn btn-primary text-xs px-5">
            Add Water
          </button>
        </form>
      </div>

      {/* Wellness Habits Checklist */}
      <div className="ui-card p-6 bg-[#FFFFFF] space-y-4">
        <div className="flex items-center justify-between border-b border-[#D9DDE2] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#15171A] uppercase tracking-wide">
              Daily Wellness Protocol Checklist
            </h3>
            <span className="text-[11px] text-[#555B63]">
              Non-negotiable foundational habits for performance & biological recovery
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-[#15171A]">
            {completedHabits.length} / {DEFAULT_HABIT_DEFINITIONS.length} ({habitsPct}%)
          </span>
        </div>

        <div className="space-y-2">
          {DEFAULT_HABIT_DEFINITIONS.map(habit => {
            const isCompleted = completedHabits.includes(habit.id);
            const Icon = iconMap[habit.icon] || Sparkles;

            return (
              <div
                key={habit.id}
                onClick={() => handleToggleHabit(habit.id)}
                className={`p-3.5 rounded-[8px] border cursor-pointer flex items-center justify-between transition-all active:scale-[0.98] ${
                  isCompleted
                    ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#15171A] shadow-xs'
                    : 'bg-[#FFFFFF] border-[#D9DDE2] text-[#15171A] hover:bg-[#F6F6F7]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-[6px] flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? 'bg-[#16A34A] text-white' : 'bg-[#F6F6F7] text-[#555B63]'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isCompleted ? 'line-through text-[#15171A]' : ''}`}>
                      {habit.title}
                    </div>
                    <div className="text-[11px] text-[#555B63]">{habit.desc}</div>
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-[6px] border flex items-center justify-center transition-colors ${
                  isCompleted ? 'bg-[#16A34A] border-[#16A34A] text-white' : 'border-[#D9DDE2] bg-white'
                }`}>
                  {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
